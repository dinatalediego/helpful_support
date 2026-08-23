"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";

import { useLab } from "@/components/lab-provider";

type RealtimeEvent = {
  id: number;
  eventType: string;
  rowId: string;
  status: string;
  receivedAt: string;
  payload: unknown;
};

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export function RealtimeMonitor() {
  const { client, session } = useLab();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [connection, setConnection] = useState("DISCONNECTED");
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (channelRef.current) void client.removeChannel(channelRef.current);
    };
  }, [client]);

  async function disconnect() {
    if (channelRef.current) await client.removeChannel(channelRef.current);
    channelRef.current = null;
    setConnection("DISCONNECTED");
  }

  async function connect() {
    if (!session) return;
    if (channelRef.current) await disconnect();
    setMessage(null);
    setConnection("CONNECTING");

    const channel = client
      .channel(`hs-learning-runs-${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hs_learning_runs",
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old ?? {}) as Record<
            string,
            unknown
          >;
          setEvents((current) => [
            {
              id: Date.now() + Math.random(),
              eventType: payload.eventType,
              rowId: String(row.id ?? "sin-id"),
              status: String(row.status ?? "deleted"),
              receivedAt: new Date().toLocaleTimeString(),
              payload,
            },
            ...current,
          ].slice(0, 12));
        },
      )
      .subscribe((status, error) => {
        setConnection(status);
        if (error) setMessage(error.message);
      });

    channelRef.current = channel;
  }

  async function generateEvent() {
    if (!session || connection !== "SUBSCRIBED") return;
    setBusy(true);
    setMessage(null);

    const { data: created, error: insertError } = await client
      .from("hs_learning_runs")
      .insert({
        family_slug: "automation-events",
        objective: "API Experience Lab v0.4 · evento Realtime visible",
        request_method: "EVENT",
        status: "running",
        evidence: { source: "webapp", challenge: "realtime" },
      })
      .select("id")
      .single();

    if (insertError) {
      setMessage(insertError.message);
      setBusy(false);
      return;
    }

    await wait(650);
    const { error: updateError } = await client
      .from("hs_learning_runs")
      .update({
        status: "succeeded",
        response_status: 200,
        latency_ms: 650,
        succeeded: true,
        notes: "INSERT y UPDATE observados por Realtime.",
        evidence: {
          source: "webapp",
          challenge: "realtime",
          event_types: ["INSERT", "UPDATE"],
        },
      })
      .eq("id", created.id);

    if (updateError) setMessage(updateError.message);
    else setMessage("Evento generado. Busca INSERT y UPDATE en el stream.");
    setBusy(false);
  }

  return (
    <article className="experience">
      <div className="experience-heading">
        <div>
          <span className="section-kicker">EXPERIENCIA 03</span>
          <h2>Realtime Monitor</h2>
          <p>
            Abre un WebSocket autenticado, provoca cambios propios y observa
            cómo la base deja de ser una fotografía para convertirse en flujo.
          </p>
        </div>
        <span className="concept-chip">Cambio → Evento</span>
      </div>

      <section className="realtime-console">
        <div className="realtime-toolbar">
          <div className="socket-state" data-state={connection}>
            <span className="status-dot" />
            <div>
              <small>WEBSOCKET</small>
              <strong>{connection}</strong>
            </div>
          </div>
          <div className="toolbar-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={connect}
              disabled={!session || connection === "CONNECTING"}
            >
              Conectar stream
            </button>
            <button
              className="primary-button"
              type="button"
              onClick={generateEvent}
              disabled={!session || connection !== "SUBSCRIBED" || busy}
            >
              {busy ? "Generando…" : "Generar evento visible"}
            </button>
            <button
              className="text-button"
              type="button"
              onClick={disconnect}
              disabled={connection === "DISCONNECTED"}
            >
              Desconectar
            </button>
          </div>
        </div>

        {!session ? (
          <div className="locked-panel">
            <span>🔒</span>
            <div>
              <strong>El stream necesita identidad</strong>
              <p>Inicia sesión en Auth/RLS y vuelve a esta experiencia.</p>
            </div>
          </div>
        ) : null}

        {message ? <p className="inline-notice">{message}</p> : null}

        <div className="stream-layout">
          <div className="stream-rail" aria-label="Eventos Realtime">
            {events.length === 0 ? (
              <div className="stream-empty">
                <span className="pulse-ring" />
                <strong>Esperando cambios de PostgreSQL</strong>
                <small>Conecta y genera un evento para ver el stream.</small>
              </div>
            ) : (
              events.map((event) => (
                <button
                  type="button"
                  className="stream-event"
                  data-event={event.eventType}
                  key={event.id}
                  onClick={() => {
                    const element = document.querySelector(
                      `[data-payload-id="${event.id}"]`,
                    );
                    element?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <span>{event.eventType}</span>
                  <div><strong>{event.status}</strong><small>{event.rowId}</small></div>
                  <time>{event.receivedAt}</time>
                </button>
              ))
            )}
          </div>
          <div className="payload-stack">
            <div className="inspector-title">
              <span>EVENT PAYLOADS</span>
              <strong>{events.length}</strong>
            </div>
            {events.length === 0 ? (
              <pre>Los mensajes recibidos por WebSocket aparecerán aquí.</pre>
            ) : (
              events.map((event) => (
                <pre data-payload-id={event.id} key={`payload-${event.id}`}>
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="learning-note">
        <span>POR QUÉ IMPORTA</span>
        <p>
          Polling pregunta repetidamente “¿cambió algo?”. Realtime mantiene una
          conexión y empuja el cambio. RLS sigue filtrando qué eventos puede
          recibir cada JWT.
        </p>
      </section>
    </article>
  );
}
