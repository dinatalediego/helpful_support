import {
  assignLead,
  consultProject,
  DEMO_SNAPSHOT,
  prioritizeLeads,
  recommendUnit,
} from "@/lib/real-estate-demo";

type DemoRequest = {
  action?: unknown;
  leadId?: unknown;
  unitCode?: unknown;
  projectSlug?: unknown;
  question?: unknown;
};

const headers = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

export async function GET() {
  return Response.json(
    {
      snapshot: DEMO_SNAPSHOT,
      contract: {
        endpoint: "/api/real-estate-demo",
        actions: ["prioritize", "recommend", "consult", "assign"],
        persistence: "none",
      },
    },
    { headers },
  );
}

export async function POST(request: Request) {
  const startedAt = performance.now();
  let body: DemoRequest;

  try {
    body = (await request.json()) as DemoRequest;
  } catch {
    return Response.json(
      { error: "El cuerpo debe ser JSON válido." },
      { status: 400, headers },
    );
  }

  const traceId = crypto.randomUUID();
  let result: unknown;

  if (body.action === "prioritize") {
    result = prioritizeLeads();
  } else if (body.action === "recommend" && typeof body.leadId === "string") {
    result = recommendUnit(body.leadId);
  } else if (
    body.action === "consult" &&
    typeof body.projectSlug === "string" &&
    typeof body.question === "string"
  ) {
    result = consultProject(body.projectSlug, body.question);
  } else if (
    body.action === "assign" &&
    typeof body.leadId === "string" &&
    typeof body.unitCode === "string"
  ) {
    result = assignLead(body.leadId, body.unitCode);
  } else {
    return Response.json(
      { error: "Acción o parámetros no válidos." },
      { status: 400, headers },
    );
  }

  if (!result) {
    return Response.json(
      { error: "No se encontró una combinación válida en el dataset demo." },
      { status: 404, headers },
    );
  }

  return Response.json(
    {
      traceId,
      action: body.action,
      latencyMs: Math.round(performance.now() - startedAt),
      result,
    },
    { headers },
  );
}
