"use client";

import { useRef, useState } from "react";

import { useLab } from "@/components/lab-provider";
import { redactToken } from "@/lib/project-config";

type LearningRun = {
  id: string;
  objective: string;
  status: string;
  response_status: number | null;
  latency_ms: number | null;
  succeeded: boolean | null;
  created_at: string;
};

type LabLog = {
  id: number;
  tone: "info" | "success" | "protected" | "error";
  title: string;
  detail: string;
};

const foreignRunId = "00000000-0000-4000-8000-000000000000";

export function AuthRlsChallenge() {
  const { client, session, signIn } = useLab();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [runs, setRuns] = useState<LearningRun[]>([]);
  const [logs, setLogs] = useState<LabLog[]>([]);
  const runStartedAt = useRef<number | null>(null);

  function addLog(
    tone: LabLog["tone"],
    title: string,
    detail: string,
  ) {
    setLogs((current) => [
      { id: Date.now(), tone, title, detail },
      ...current,
    ].slice(0, 8));
  }

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const result = await signIn(email.trim(), password);
    setPassword("");
    if (result.error) {
      addLog("error", "Auth rechazó la sesión", result.error);
    } else {
      addLog(
        "success",
        "Auth confirmó la identidad",
        "El navegador recibió un JWT temporal; la contraseña fue eliminada.",
      );
    }
    setBusy(false);
  }

  async function createRun() {
    setBusy(true);
    const started = performance.now();
    const { data, error } = await client
      .from("hs_learning_runs")
      .insert({
        family_slug: "identity-security",
        objective: "API Experience Lab v0.4 · demostrar Auth + RLS",
        request_method: "POST",
        status: "running",
        evidence: { source: "webapp", challenge: "auth-rls" },
      })
      .select("id,objective,status,response_status,latency_ms,succeeded,created_at")
      .single();

    if (error) {
      addLog("error", "INSERT no completado", error.message);
    } else {
      runStartedAt.current = performance.now();
      setRunId(data.id);
      addLog(
        "success",
        "RLS permitió INSERT",
        `Run ${data.id.slice(0, 8)}… creado en ${Math.round(performance.now() - started)} ms.`,
      );
    }
    setBusy(false);
  }

  async function readOwnRuns() {
    setBusy(true);
    const { data, error } = await client
      .from("hs_learning_runs")
      .select("id,objective,status,response_status,latency_ms,succeeded,created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      addLog("error", "SELECT no completado", error.message);
    } else {
      setRuns((data ?? []) as LearningRun[]);
      addLog(
        "success",
        "RLS permitió SELECT",
        `Solo regresaron ${data?.length ?? 0} filas visibles para este JWT.`,
      );
    }
    setBusy(false);
  }

  async function attemptForeignUpdate() {
    setBusy(true);
    const { data, error } = await client
      .from("hs_learning_runs")
      .update({
        status: "failed",
        notes: "Este cambio nunca debe alcanzar una fila no autorizada.",
      })
      .eq("id", foreignRunId)
      .select("id");

    if (error) {
      addLog("protected", "Escritura bloqueada", error.message);
    } else if ((data ?? []).length === 0) {
      addLog(
        "protected",
        "RLS protegió la fila",
        "PATCH devolvió 0 filas: el usuario no puede ver ni modificar ese recurso.",
      );
    } else {
      addLog(
        "error",
        "Resultado inesperado",
        "La fila sintética fue visible; revisa inmediatamente las políticas.",
      );
    }
    setBusy(false);
  }

  async function completeRun() {
    if (!runId) {
      addLog("info", "Primero crea un run", "El cierre necesita un ID propio.");
      return;
    }
    setBusy(true);
    const challengeLatencyMs = Math.round(
      runStartedAt.current === null
        ? 0
        : performance.now() - runStartedAt.current,
    );
    const evidence = {
      source: "webapp",
      challenge: "auth-rls",
      user_id: session?.user.id,
      protected_probe: foreignRunId,
      completed_at: new Date().toISOString(),
    };
    const { data, error } = await client
      .from("hs_learning_runs")
      .update({
        status: "succeeded",
        response_status: 200,
        latency_ms: challengeLatencyMs,
        succeeded: true,
        notes: "Cerrado desde Helpful Support API Experience Lab v0.4.",
        evidence,
      })
      .eq("id", runId)
      .select("id,status")
      .single();

    if (error) {
      addLog("error", "UPDATE no completado", error.message);
    } else {
      const { error: feedbackError } = await client
        .from("hs_search_feedback")
        .insert({
        query: "auth rls ownership",
        result_slugs: ["identity-security"],
        useful: true,
        comment: "Evidencia generada por el desafío Auth/RLS v0.4.",
      });
      if (feedbackError) {
        addLog("error", "Feedback no insertado", feedbackError.message);
      }
      addLog(
        "success",
        "Ciclo cerrado con evidencia",
        `Run ${data.id.slice(0, 8)}… cambió a ${data.status} y generó feedback.`,
      );
      await readOwnRuns();
    }
    setBusy(false);
  }

  return (
    <article className="experience">
      <div className="experience-heading">
        <div>
          <span className="section-kicker">EXPERIENCIA 02</span>
          <h2>Auth / RLS Challenge</h2>
          <p>
            Comprueba que una identidad válida no equivale a acceso ilimitado:
            PostgreSQL sigue decidiendo qué filas pertenecen al usuario.
          </p>
        </div>
        <span className="concept-chip">Identidad → Permiso</span>
      </div>

      {!session ? (
        <section className="auth-card">
          <div>
            <span className="mini-label">PASO 1 · AUTHENTICATION</span>
            <h3>Entra como usuario del laboratorio</h3>
            <p>
              La sesión vive solo en memoria. No se persiste el JWT ni la
              contraseña.
            </p>
          </div>
          <form onSubmit={handleSignIn}>
            <label className="field">
              Email
              <input
                type="email"
                value={email}
                autoComplete="username"
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="field">
              Contraseña
              <input
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <button className="primary-button" type="submit" disabled={busy}>
              {busy ? "Autenticando…" : "Iniciar sesión segura"}
            </button>
          </form>
        </section>
      ) : (
        <>
          <section className="identity-strip">
            <div>
              <span className="mini-label">AUTHENTICATION · QUIÉN</span>
              <strong>{session.user.email}</strong>
              <small>{session.user.id}</small>
            </div>
            <div>
              <span className="mini-label">APPLICATION · QUÉ</span>
              <strong>Publishable key</strong>
              <small>Cliente público identificado</small>
            </div>
            <div>
              <span className="mini-label">JWT TEMPORAL</span>
              <strong>{redactToken(session.access_token)}</strong>
              <small>No persistido</small>
            </div>
          </section>

          <section className="challenge-grid">
            <div className="mission-stack">
              <button type="button" onClick={createRun} disabled={busy}>
                <span>01</span>
                <div><strong>Crear mi run</strong><small>INSERT con user_id automático</small></div>
              </button>
              <button type="button" onClick={readOwnRuns} disabled={busy}>
                <span>02</span>
                <div><strong>Leer mis filas</strong><small>SELECT filtrado por RLS</small></div>
              </button>
              <button type="button" onClick={attemptForeignUpdate} disabled={busy}>
                <span>03</span>
                <div><strong>Intentar fila ajena</strong><small>Prueba segura con UUID sintético</small></div>
              </button>
              <button type="button" onClick={completeRun} disabled={busy}>
                <span>04</span>
                <div><strong>Cerrar el ciclo</strong><small>UPDATE + evidencia + feedback</small></div>
              </button>
            </div>

            <div className="policy-visual">
              <span className="mini-label">POLÍTICA QUE DECIDE</span>
              <code>auth.uid() = user_id</code>
              <div className="policy-flow">
                <span>JWT</span><i>→</i><span>auth.uid()</span><i>→</i><span>RLS</span><i>→</i><span>fila</span>
              </div>
              <p>
                El frontend propone una operación. La base de datos conserva la
                última palabra.
              </p>
            </div>
          </section>
        </>
      )}

      <section className="evidence-grid">
        <div>
          <div className="panel-heading">
            <h3>Evidencia del desafío</h3>
            <span>{logs.length} eventos</span>
          </div>
          <div className="event-log">
            {logs.length === 0 ? (
              <p className="empty-state">Completa una acción para producir evidencia.</p>
            ) : (
              logs.map((log) => (
                <div className="log-entry" data-tone={log.tone} key={log.id}>
                  <span className="log-dot" />
                  <div><strong>{log.title}</strong><small>{log.detail}</small></div>
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <div className="panel-heading">
            <h3>Últimos runs visibles</h3>
            <span>{runs.length} filas</span>
          </div>
          <div className="run-list">
            {runs.length === 0 ? (
              <p className="empty-state">Pulsa “Leer mis filas”.</p>
            ) : (
              runs.map((run) => (
                <div className="run-row" key={run.id}>
                  <span data-run-status={run.status}>{run.status}</span>
                  <div><strong>{run.objective}</strong><small>{run.id}</small></div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </article>
  );
}
