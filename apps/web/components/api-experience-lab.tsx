"use client";

import { useState } from "react";

import { ApiXRay } from "@/components/api-xray";
import { AuthRlsChallenge } from "@/components/auth-rls-challenge";
import { RealEstateDecisionLoop } from "@/components/real-estate-decision-loop";
import { RealtimeMonitor } from "@/components/realtime-monitor";
import { useLab } from "@/components/lab-provider";

type LabTab = "decision" | "xray" | "rls" | "realtime";

const tabs: Array<{
  id: LabTab;
  number: string;
  label: string;
  concept: string;
}> = [
  { id: "decision", number: "01", label: "Demo inmobiliaria", concept: "Dato → Decisión" },
  { id: "xray", number: "02", label: "API X-Ray", concept: "Request → Response" },
  { id: "rls", number: "03", label: "Auth / RLS", concept: "Identidad → Permiso" },
  { id: "realtime", number: "04", label: "Realtime seguro", concept: "Cambio → Evento" },
];

export function ApiExperienceLab() {
  const [activeTab, setActiveTab] = useState<LabTab>("decision");
  const { session, signOut } = useLab();

  return (
    <main className="lab-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Helpful Support, inicio">
          <span className="brand-mark">HS</span>
          <span>
            <strong>Helpful Support</strong>
            <small>Decision Experience Lab · v0.5</small>
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
          <span>DECISION EXPERIENCE LAB</span>
          <span className="live-indicator">Supabase live</span>
        </div>
        <h1>
          Observa cómo un dato se convierte en decisión.
          <span> Y exige ver su resultado.</span>
        </h1>
        <p>
          Una demo inmobiliaria recorre el ciclo mínimo completo. Los laboratorios
          técnicos originales siguen disponibles para inspeccionar sus límites.
        </p>
        <div className="hero-metrics" aria-label="Cobertura del laboratorio">
          <div><strong>4</strong><span>acciones visibles</span></div>
          <div><strong>1</strong><span>ciclo observable</span></div>
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
        {activeTab === "decision" ? <RealEstateDecisionLoop /> : null}
        {activeTab === "xray" ? <ApiXRay /> : null}
        {activeTab === "rls" ? <AuthRlsChallenge /> : null}
        {activeTab === "realtime" ? <RealtimeMonitor /> : null}
      </section>

      <footer className="site-footer">
        <span>Helpful Support v0.5</span>
        <span>Decision API · REST · Auth · RLS · Edge · Realtime</span>
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
