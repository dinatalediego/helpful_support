"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useId, useRef, useState } from "react";

import { useLab } from "@/components/lab-provider";
import type {
  AssignmentResult,
  ConsultResult,
  DemoSnapshot,
  PrioritizeResult,
  RecommendResult,
} from "@/lib/real-estate-demo";

type DemoAction = "prioritize" | "recommend" | "consult" | "assign";

type ApiEnvelope<T> = {
  traceId: string;
  action: DemoAction;
  latencyMs: number;
  result: T;
};

type ObservedAssignment = AssignmentResult["assignment"] & {
  traceId: string;
  receivedAt: string;
};

const currency = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 0,
});

const fixedQuestion =
  "¿Por qué esta unidad encaja y cuándo se entrega el proyecto?";

async function requestDecision<T>(body: Record<string, string>): Promise<ApiEnvelope<T>> {
  const response = await fetch("/api/real-estate-demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as ApiEnvelope<T> & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
  return payload;
}

function EvidenceLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="decision-evidence-line">
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  );
}

export function RealEstateDecisionLoop() {
  const { client } = useLab();
  const channelTopic = `hs-property-demo:${useId().replaceAll(":", "")}`;
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [snapshot, setSnapshot] = useState<DemoSnapshot | null>(null);
  const [activeAction, setActiveAction] = useState<DemoAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [priority, setPriority] = useState<ApiEnvelope<PrioritizeResult> | null>(null);
  const [recommendation, setRecommendation] = useState<ApiEnvelope<RecommendResult> | null>(null);
  const [consultation, setConsultation] = useState<ApiEnvelope<ConsultResult> | null>(null);
  const [assignment, setAssignment] = useState<ApiEnvelope<AssignmentResult> | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState("CONNECTING");
  const [broadcastAck, setBroadcastAck] = useState<string | null>(null);
  const [observedAssignment, setObservedAssignment] = useState<ObservedAssignment | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/real-estate-demo", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return (await response.json()) as { snapshot: DemoSnapshot };
      })
      .then(({ snapshot: nextSnapshot }) => setSnapshot(nextSnapshot))
      .catch((fetchError: unknown) => {
        if (!controller.signal.aborted) {
          setError(fetchError instanceof Error ? fetchError.message : "No se pudo cargar el dataset demo.");
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const channel = client.channel(channelTopic, {
      config: { broadcast: { self: true, ack: true } },
    });

    channel
      .on("broadcast", { event: "lead-assigned" }, ({ payload }) => {
        const event = payload as Omit<ObservedAssignment, "receivedAt">;
        setObservedAssignment({ ...event, receivedAt: new Date().toISOString() });
      })
      .subscribe((status) => setRealtimeStatus(status));

    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      void client.removeChannel(channel);
    };
  }, [channelTopic, client]);

  async function prioritizeLead() {
    setActiveAction("prioritize");
    setError(null);
    setRecommendation(null);
    setConsultation(null);
    setAssignment(null);
    setObservedAssignment(null);
    try {
      setPriority(await requestDecision<PrioritizeResult>({ action: "prioritize" }));
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Falló la priorización.");
    } finally {
      setActiveAction(null);
    }
  }

  async function recommendUnit() {
    if (!priority) return;
    setActiveAction("recommend");
    setError(null);
    setConsultation(null);
    setAssignment(null);
    setObservedAssignment(null);
    try {
      setRecommendation(
        await requestDecision<RecommendResult>({
          action: "recommend",
          leadId: priority.result.selectedLead.id,
        }),
      );
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Falló la recomendación.");
    } finally {
      setActiveAction(null);
    }
  }

  async function consultProject() {
    if (!recommendation) return;
    setActiveAction("consult");
    setError(null);
    setAssignment(null);
    setObservedAssignment(null);
    try {
      setConsultation(
        await requestDecision<ConsultResult>({
          action: "consult",
          projectSlug: recommendation.result.selectedUnit.projectSlug,
          question: fixedQuestion,
        }),
      );
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Falló la consulta.");
    } finally {
      setActiveAction(null);
    }
  }

  async function observeRealtimeAssignment() {
    if (!priority || !recommendation || !channelRef.current) return;
    setActiveAction("assign");
    setError(null);
    setObservedAssignment(null);
    setBroadcastAck(null);
    try {
      const nextAssignment = await requestDecision<AssignmentResult>({
        action: "assign",
        leadId: priority.result.selectedLead.id,
        unitCode: recommendation.result.selectedUnit.code,
      });
      setAssignment(nextAssignment);

      const ack = await channelRef.current.send({
        type: "broadcast",
        event: "lead-assigned",
        payload: {
          ...nextAssignment.result.assignment,
          traceId: nextAssignment.traceId,
        },
      });
      setBroadcastAck(ack);
      if (ack !== "ok") throw new Error(`Realtime no confirmó el evento: ${ack}`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Falló la asignación Realtime.");
    } finally {
      setActiveAction(null);
    }
  }

  const selectedLead = priority?.result.selectedLead;
  const selectedUnit = recommendation?.result.selectedUnit;
  const isRealtimeReady = realtimeStatus === "SUBSCRIBED";

  return (
    <article className="experience real-estate-loop">
      <div className="experience-heading">
        <div>
          <span className="section-kicker">DEMO INMOBILIARIA · CICLO MÍNIMO</span>
          <h2>De una señal comercial a una asignación observable</h2>
          <p>
            Cuatro acciones conectan un dataset ficticio, una API real, reglas explicables y
            un evento que debe regresar por Supabase Realtime antes de considerarse observado.
          </p>
        </div>
        <span className="concept-chip">Dato → Decisión → Evidencia</span>
      </div>

      <div className="demo-scope-note">
        <strong>Alcance demostrado</strong>
        <span>Datos sintéticos · sin escritura en CRM · sin modelo predictivo · sin persistencia</span>
      </div>

      <div className="decision-loop-layout">
        <aside className="demo-dataset" aria-label="Dataset ficticio de entrada">
          <div className="panel-heading">
            <h3>Snapshot de entrada</h3>
            <span>{snapshot ? snapshot.asOf : "cargando…"}</span>
          </div>
          {snapshot ? (
            <>
              <p>{snapshot.disclaimer}</p>
              <span className="mini-label">LEADS</span>
              <div className="dataset-list">
                {snapshot.leads.map((lead) => (
                  <div key={lead.id} data-selected={lead.id === selectedLead?.id}>
                    <strong>{lead.alias}</strong>
                    <small>
                      {lead.district} · {lead.bedrooms} dorm. · {currency.format(lead.budgetPen)}
                    </small>
                  </div>
                ))}
              </div>
              <span className="mini-label">INVENTARIO</span>
              <div className="dataset-summary">
                <strong>{snapshot.units.length}</strong>
                <span>unidades disponibles en {snapshot.projects.length} proyectos</span>
              </div>
            </>
          ) : (
            <p className="empty-state">Leyendo GET /api/real-estate-demo…</p>
          )}
        </aside>

        <section className="decision-path" aria-label="Camino de decisión">
          <article className="decision-step" data-complete={Boolean(priority)}>
            <div className="decision-step-heading">
              <span>01</span>
              <div><strong>Priorizar lead</strong><small>Señales → ranking</small></div>
              <em>{priority ? "DECIDIDO" : "PENDIENTE"}</em>
            </div>
            <button
              className="primary-button"
              type="button"
              disabled={!snapshot || activeAction !== null}
              onClick={prioritizeLead}
            >
              {activeAction === "prioritize" ? "Calculando…" : "Priorizar lead"}
            </button>
            {priority ? (
              <div className="decision-evidence-block">
                <EvidenceLine label="Regla">{priority.result.rule}</EvidenceLine>
                <EvidenceLine label="Decisión">{priority.result.decision}</EvidenceLine>
                <EvidenceLine label="Evidencia">trace {priority.traceId.slice(0, 8)} · {priority.latencyMs} ms</EvidenceLine>
              </div>
            ) : <p>Ordena tres leads sin usar datos personales ni una caja negra.</p>}
          </article>

          <article className="decision-step" data-complete={Boolean(recommendation)}>
            <div className="decision-step-heading">
              <span>02</span>
              <div><strong>Recomendar unidad</strong><small>Perfil → inventario</small></div>
              <em>{recommendation ? "DECIDIDO" : "PENDIENTE"}</em>
            </div>
            <button
              className="primary-button"
              type="button"
              disabled={!priority || activeAction !== null}
              onClick={recommendUnit}
            >
              {activeAction === "recommend" ? "Comparando…" : "Recomendar unidad"}
            </button>
            {recommendation ? (
              <div className="decision-evidence-block">
                <EvidenceLine label="Entrada">{selectedLead?.alias} · {currency.format(selectedLead?.budgetPen ?? 0)}</EvidenceLine>
                <EvidenceLine label="Regla">{recommendation.result.rule}</EvidenceLine>
                <EvidenceLine label="Decisión">{recommendation.result.decision}</EvidenceLine>
                <EvidenceLine label="Resultado">{selectedUnit?.projectName} · {selectedUnit?.areaM2} m²</EvidenceLine>
              </div>
            ) : <p>Compara distrito, dormitorios, presupuesto y disponibilidad.</p>}
          </article>

          <article className="decision-step" data-complete={Boolean(consultation)}>
            <div className="decision-step-heading">
              <span>03</span>
              <div><strong>Consultar proyecto</strong><small>Pregunta → fuentes</small></div>
              <em>{consultation ? "SUSTENTADO" : "PENDIENTE"}</em>
            </div>
            <button
              className="primary-button"
              type="button"
              disabled={!recommendation || activeAction !== null}
              onClick={consultProject}
            >
              {activeAction === "consult" ? "Consultando…" : "Consultar proyecto"}
            </button>
            {consultation ? (
              <div className="decision-evidence-block">
                <EvidenceLine label="Pregunta">{fixedQuestion}</EvidenceLine>
                <EvidenceLine label="Respuesta">{consultation.result.answer}</EvidenceLine>
                <EvidenceLine label="Método">{consultation.result.rule}</EvidenceLine>
              </div>
            ) : <p>Recupera hechos de la ficha; no inventa una respuesta generativa.</p>}
          </article>

          <article className="decision-step realtime-decision" data-complete={Boolean(observedAssignment)}>
            <div className="decision-step-heading">
              <span>04</span>
              <div><strong>Ver asignación Realtime</strong><small>Decisión → WebSocket → UI</small></div>
              <em>{observedAssignment ? "OBSERVADO" : isRealtimeReady ? "LISTO" : realtimeStatus}</em>
            </div>
            <button
              className="primary-button"
              type="button"
              disabled={!consultation || !isRealtimeReady || activeAction !== null}
              onClick={observeRealtimeAssignment}
            >
              {activeAction === "assign" ? "Transmitiendo…" : "Ver asignación Realtime"}
            </button>
            <div className="realtime-proof" data-state={realtimeStatus}>
              <span className="status-dot" />
              <div><strong>Supabase {realtimeStatus}</strong><small>{channelTopic}</small></div>
            </div>
            {assignment ? (
              <div className="decision-evidence-block">
                <EvidenceLine label="Regla">{assignment.result.rule}</EvidenceLine>
                <EvidenceLine label="Decisión">{assignment.result.decision}</EvidenceLine>
                <EvidenceLine label="ACK servidor">{broadcastAck ?? "esperando"}</EvidenceLine>
                <EvidenceLine label="Resultado observado">
                  {observedAssignment
                    ? `${observedAssignment.leadAlias} → ${observedAssignment.advisor} · evento ${observedAssignment.eventId.slice(0, 8)}`
                    : "esperando retorno por WebSocket"}
                </EvidenceLine>
              </div>
            ) : <p>Solo se completa cuando la UI recibe el evento que ella misma envió al servidor Realtime.</p>}
          </article>
        </section>
      </div>

      {error ? <p className="error-message demo-error" role="alert">{error}</p> : null}

      <div className="learning-note">
        <span>QUÉ ESTÁ PROBADO</span>
        <p>
          La priorización, el matching, la consulta documental y la asignación son reglas demo
          ejecutadas por una API desplegable. Realtime prueba transporte y recepción; no prueba
          todavía integración con Sperant, calidad de datos reales ni mejora de conversión.
        </p>
      </div>
    </article>
  );
}
