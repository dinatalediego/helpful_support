"use client";

import { useState } from "react";

import { ApiXRay } from "@/components/api-xray";
import { AuthRlsChallenge } from "@/components/auth-rls-challenge";
import { RealtimeMonitor } from "@/components/realtime-monitor";
import { useLab } from "@/components/lab-provider";

type LabTab = "xray" | "rls" | "realtime";

const tabs: Array<{
  id: LabTab;
  number: string;
  label: string;
  concept: string;
}> = [
  { id: "xray", number: "01", label: "API X-Ray", concept: "Request → Response" },
  { id: "rls", number: "02", label: "Auth / RLS", concept: "Identidad → Permiso" },
  { id: "realtime", number: "03", label: "Realtime", concept: "Cambio → Evento" },
];

export function ApiExperienceLab() {
  const [activeTab, setActiveTab] = useState<LabTab>("xray");
  const { session, signOut } = useLab();

  return (
    <main className="lab-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Helpful Support, inicio">
          <span className="brand-mark">HS</span>
          <span>
            <strong>Helpful Support</strong>
            <small>API Experience Lab · v0.4</small>
          </span>
        </a>
        <div className="session-pill" data-authenticated={Boolean(session)}>
          <span className="status-dot" />
          {session ? (
            <>
              <span title={session.user.email}>{session.user.email}</span>
              <button className="text-button" type="button" onClick={signOut}>
                Salir
              </button>
            </>
          ) : (
            <span>Modo público</span>
          )}
        </div>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow">
          <span>LABORATORIO CONECTADO</span>
          <span className="live-indicator">Supabase live</span>
        </div>
        <h1>
          Mira una API por dentro.
          <span> Rómpela. Protégela. Escúchala.</span>
        </h1>
        <p>
          Tres experiencias guiadas convierten conceptos abstractos en
          solicitudes, decisiones de seguridad y eventos que puedes observar.
        </p>
        <div className="hero-metrics" aria-label="Cobertura del laboratorio">
          <div><strong>3</strong><span>experiencias</span></div>
          <div><strong>6</strong><span>capas visibles</span></div>
          <div><strong>0</strong><span>secret keys</span></div>
        </div>
      </section>

      <nav className="lab-tabs" aria-label="Experiencias del laboratorio">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className="lab-tab"
            data-active={activeTab === tab.id}
            aria-pressed={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-number">{tab.number}</span>
            <span>
              <strong>{tab.label}</strong>
              <small>{tab.concept}</small>
            </span>
          </button>
        ))}
      </nav>

      <section className="experience-stage" aria-live="polite">
        {activeTab === "xray" ? <ApiXRay /> : null}
        {activeTab === "rls" ? <AuthRlsChallenge /> : null}
        {activeTab === "realtime" ? <RealtimeMonitor /> : null}
      </section>

      <footer className="site-footer">
        <span>Helpful Support v0.4</span>
        <span>REST · RPC · Auth · RLS · Edge · Realtime</span>
        <a
          href="https://github.com/dinatalediego/helpful_support"
          target="_blank"
          rel="noreferrer"
        >
          Ver repositorio ↗
        </a>
      </footer>
    </main>
  );
}
