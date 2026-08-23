"use client";

import { useMemo, useState } from "react";

import { useLab } from "@/components/lab-provider";
import {
  PROJECT_CONFIG,
  redactKey,
  redactToken,
} from "@/lib/project-config";

type EndpointKind = "rest" | "rpc" | "edge";
type Experiment = "success" | "invalid-method" | "without-jwt";

type Trace = {
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: Record<string, unknown>;
  };
  response: {
    status: number;
    statusText: string;
    latencyMs: number;
    requestId: string | null;
    body: unknown;
  };
};

const endpointLabels: Record<EndpointKind, string> = {
  rest: "REST · catálogo",
  rpc: "RPC · búsqueda",
  edge: "Edge · pipeline",
};

const stepDefinitions: Record<
  EndpointKind,
  Array<{ title: string; detail: string }>
> = {
  rest: [
    { title: "Browser", detail: "Construye GET + headers" },
    { title: "Data API", detail: "Traduce HTTP a Postgres" },
    { title: "RLS", detail: "Aplica lectura pública" },
    { title: "PostgreSQL", detail: "Selecciona familias" },
    { title: "JSON", detail: "Devuelve filas al cliente" },
  ],
  rpc: [
    { title: "Browser", detail: "Envía POST JSON" },
    { title: "Data API", detail: "Resuelve /rpc" },
    { title: "Security invoker", detail: "Conserva permisos" },
    { title: "PostgreSQL FTS", detail: "Ordena coincidencias" },
    { title: "JSON", detail: "Retorna ranking" },
  ],
  edge: [
    { title: "Browser", detail: "Adjunta JWT de usuario" },
    { title: "Edge Function", detail: "Valida contrato HTTP" },
    { title: "RPC", detail: "Ejecuta hs_search_library" },
    { title: "PostgreSQL FTS", detail: "Recupera conceptos" },
    { title: "JSON + meta", detail: "Entrega latencia interna" },
  ],
};

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function ApiXRay() {
  const { session } = useLab();
  const [endpoint, setEndpoint] = useState<EndpointKind>("rpc");
  const [experiment, setExperiment] = useState<Experiment>("success");
  const [query, setQuery] = useState("webhook idempotencia");
  const [trace, setTrace] = useState<Trace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const steps = useMemo(() => stepDefinitions[endpoint], [endpoint]);

  async function execute() {
    setRunning(true);
    setError(null);
    setTrace(null);

    const baseUrl = PROJECT_CONFIG.supabaseUrl;
    const authToken =
      experiment === "without-jwt" ? undefined : session?.access_token;
    const headers: Record<string, string> = {
      apikey: PROJECT_CONFIG.supabasePublishableKey,
      Accept: "application/json",
    };
    let method = "POST";
    let url = `${baseUrl}/rest/v1/rpc/hs_search_library`;
    let body: Record<string, unknown> | undefined = {
      search_query: query,
      result_limit: 5,
    };

    if (endpoint === "rest") {
      method = "GET";
      url =
        `${baseUrl}/rest/v1/hs_api_families` +
        "?select=slug,name,summary,maturity&order=name.asc&limit=5";
      body = undefined;
    }

    if (endpoint === "edge") {
      url = `${baseUrl}/functions/v1/hs-api-lab`;
      body = { query, limit: 5 };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
    }

    if (experiment === "invalid-method") {
      method = endpoint === "rest" ? "POST" : "GET";
    }
    if (body && method !== "GET") headers["Content-Type"] = "application/json";

    const visibleHeaders: Record<string, string> = {
      ...headers,
      apikey: redactKey(PROJECT_CONFIG.supabasePublishableKey),
    };
    if ("Authorization" in visibleHeaders) {
      visibleHeaders.Authorization = redactToken(authToken);
    }

    const started = performance.now();
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body && method !== "GET" ? JSON.stringify(body) : undefined,
      });
      const responseBody = await readBody(response);
      setTrace({
        request: {
          method,
          url,
          headers: visibleHeaders,
          ...(body && method !== "GET" ? { body } : {}),
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          latencyMs: Math.round(performance.now() - started),
          requestId: response.headers.get("sb-request-id"),
          body: responseBody,
        },
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "La solicitud no pudo completarse.",
      );
    } finally {
      setRunning(false);
    }
  }

  const needsAuth = endpoint === "edge" && experiment === "success" && !session;

  return (
    <article className="experience">
      <div className="experience-heading">
        <div>
          <span className="section-kicker">EXPERIENCIA 01</span>
          <h2>API X-Ray</h2>
          <p>
            Ejecuta una llamada real y observa el contrato HTTP, el camino
            interno y la respuesta sin ocultar la complejidad útil.
          </p>
        </div>
        <span className="concept-chip">Request → Response</span>
      </div>

      <div className="workbench">
        <section className="control-panel">
          <h3>Configura el experimento</h3>
          <fieldset className="segmented-control">
            <legend>Endpoint</legend>
            {(Object.keys(endpointLabels) as EndpointKind[]).map((kind) => (
              <button
                type="button"
                key={kind}
                data-selected={endpoint === kind}
                onClick={() => {
                  setEndpoint(kind);
                  setTrace(null);
                }}
              >
                {endpointLabels[kind]}
              </button>
            ))}
          </fieldset>

          <label className="field">
            Consulta
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={endpoint === "rest"}
            />
          </label>

          <fieldset className="experiment-options">
            <legend>Comportamiento</legend>
            <label>
              <input
                type="radio"
                name="experiment"
                checked={experiment === "success"}
                onChange={() => setExperiment("success")}
              />
              Flujo correcto
            </label>
            <label>
              <input
                type="radio"
                name="experiment"
                checked={experiment === "invalid-method"}
                onChange={() => setExperiment("invalid-method")}
              />
              Método incorrecto
            </label>
            <label>
              <input
                type="radio"
                name="experiment"
                checked={experiment === "without-jwt"}
                onChange={() => setExperiment("without-jwt")}
                disabled={endpoint !== "edge"}
              />
              Edge sin JWT
            </label>
          </fieldset>

          <button
            className="primary-button"
            type="button"
            onClick={execute}
            disabled={running || needsAuth}
          >
            {running ? "Atravesando capas…" : "Ejecutar API"}
          </button>
          {needsAuth ? (
            <p className="inline-notice">
              Inicia sesión en Auth/RLS para probar el flujo Edge correcto.
            </p>
          ) : null}
          {error ? <p className="error-message">{error}</p> : null}
        </section>

        <section className="pipeline-panel">
          <div className="panel-heading">
            <h3>Trayectoria</h3>
            <span>{trace ? `${trace.response.latencyMs} ms` : "en espera"}</span>
          </div>
          <ol className="pipeline">
            {steps.map((step, index) => (
              <li key={step.title} data-complete={Boolean(trace)}>
                <span className="step-index">{index + 1}</span>
                <div>
                  <strong>{step.title}</strong>
                  <small>{step.detail}</small>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="inspector-grid">
        <div className="inspector">
          <div className="inspector-title">
            <span>REQUEST</span>
            <strong>{trace?.request.method ?? "—"}</strong>
          </div>
          <pre>{trace ? JSON.stringify(trace.request, null, 2) : "Ejecuta una llamada para inspeccionarla."}</pre>
        </div>
        <div className="inspector">
          <div className="inspector-title">
            <span>RESPONSE</span>
            <strong data-status={trace?.response.status ?? 0}>
              {trace?.response.status ?? "—"}
            </strong>
          </div>
          <pre>{trace ? JSON.stringify(trace.response, null, 2) : "La respuesta aparecerá aquí."}</pre>
        </div>
      </section>
    </article>
  );
}
