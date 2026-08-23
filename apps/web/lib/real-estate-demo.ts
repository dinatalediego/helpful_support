export type LeadStage = "nuevo" | "contacto" | "visita";

export type DemoLead = {
  id: string;
  alias: string;
  budgetPen: number;
  district: string;
  bedrooms: number;
  daysSinceActivity: number;
  intentSignals: number;
  financingConfirmed: boolean;
  stage: LeadStage;
};

export type DemoUnit = {
  code: string;
  projectSlug: string;
  projectName: string;
  district: string;
  bedrooms: number;
  areaM2: number;
  pricePen: number;
  status: "disponible";
};

export type DemoProject = {
  slug: string;
  name: string;
  district: string;
  stage: string;
  delivery: string;
  differentiators: string[];
  commercialRule: string;
};

export type DemoSnapshot = {
  asOf: string;
  disclaimer: string;
  leads: DemoLead[];
  units: DemoUnit[];
  projects: DemoProject[];
};

export type RankedLead = DemoLead & {
  score: number;
  factors: string[];
};

export type RankedUnit = DemoUnit & {
  score: number;
  factors: string[];
};

export type PrioritizeResult = {
  rule: string;
  ranked: RankedLead[];
  selectedLead: RankedLead;
  decision: string;
};

export type RecommendResult = {
  rule: string;
  ranked: RankedUnit[];
  selectedUnit: RankedUnit;
  decision: string;
};

export type ConsultResult = {
  rule: string;
  project: DemoProject;
  answer: string;
  sources: Array<{ label: string; value: string }>;
  decision: string;
};

export type AssignmentResult = {
  rule: string;
  assignment: {
    eventId: string;
    leadId: string;
    leadAlias: string;
    unitCode: string;
    projectName: string;
    advisor: string;
    loadBefore: number;
    loadAfter: number;
    decidedAt: string;
  };
  decision: string;
};

const leads: DemoLead[] = [
  {
    id: "lead-a184",
    alias: "Lead A-184",
    budgetPen: 420_000,
    district: "Jesús María",
    bedrooms: 2,
    daysSinceActivity: 0,
    intentSignals: 4,
    financingConfirmed: true,
    stage: "visita",
  },
  {
    id: "lead-b209",
    alias: "Lead B-209",
    budgetPen: 455_000,
    district: "Lince",
    bedrooms: 2,
    daysSinceActivity: 1,
    intentSignals: 3,
    financingConfirmed: true,
    stage: "contacto",
  },
  {
    id: "lead-c317",
    alias: "Lead C-317",
    budgetPen: 335_000,
    district: "Magdalena",
    bedrooms: 1,
    daysSinceActivity: 2,
    intentSignals: 2,
    financingConfirmed: false,
    stage: "nuevo",
  },
];

const units: DemoUnit[] = [
  {
    code: "FJM-0804",
    projectSlug: "faro-jesus-maria",
    projectName: "Faro Jesús María",
    district: "Jesús María",
    bedrooms: 2,
    areaM2: 61,
    pricePen: 410_000,
    status: "disponible",
  },
  {
    code: "FJM-1202",
    projectSlug: "faro-jesus-maria",
    projectName: "Faro Jesús María",
    district: "Jesús María",
    bedrooms: 2,
    areaM2: 68,
    pricePen: 455_000,
    status: "disponible",
  },
  {
    code: "LLI-0704",
    projectSlug: "lumen-lince",
    projectName: "Lumen Lince",
    district: "Lince",
    bedrooms: 2,
    areaM2: 58,
    pricePen: 395_000,
    status: "disponible",
  },
  {
    code: "PMG-0503",
    projectSlug: "parque-magdalena",
    projectName: "Parque Magdalena",
    district: "Magdalena",
    bedrooms: 1,
    areaM2: 43,
    pricePen: 330_000,
    status: "disponible",
  },
];

const projects: DemoProject[] = [
  {
    slug: "faro-jesus-maria",
    name: "Faro Jesús María",
    district: "Jesús María",
    stage: "En construcción",
    delivery: "Cuarto trimestre de 2027",
    differentiators: [
      "A seis cuadras del Campo de Marte",
      "Coworking y terraza común",
      "Tipologías de uno a tres dormitorios",
    ],
    commercialRule: "La separación demostrativa tiene vigencia de 48 horas.",
  },
  {
    slug: "lumen-lince",
    name: "Lumen Lince",
    district: "Lince",
    stage: "Preventa",
    delivery: "Segundo trimestre de 2028",
    differentiators: ["Cercanía al eje Javier Prado", "Bike parking"],
    commercialRule: "Precios sujetos a disponibilidad del inventario.",
  },
  {
    slug: "parque-magdalena",
    name: "Parque Magdalena",
    district: "Magdalena",
    stage: "Entrega inmediata",
    delivery: "Disponible",
    differentiators: ["Unidades compactas", "Lobby y zona de parrillas"],
    commercialRule: "La unidad se confirma después de validar el abono.",
  },
];

export const DEMO_SNAPSHOT: DemoSnapshot = {
  asOf: "2026-08-23",
  disclaimer:
    "Datos completamente ficticios. No representan personas, precios ni proyectos reales.",
  leads,
  units,
  projects,
};

const stagePoints: Record<LeadStage, number> = {
  nuevo: 5,
  contacto: 12,
  visita: 20,
};

export function prioritizeLeads(): PrioritizeResult {
  const ranked = leads
    .map((lead): RankedLead => {
      const intent = lead.intentSignals * 10;
      const recency = Math.max(0, 20 - lead.daysSinceActivity * 5);
      const stage = stagePoints[lead.stage];
      const financing = lead.financingConfirmed ? 15 : 5;
      const score = Math.min(100, intent + recency + stage + financing);

      return {
        ...lead,
        score,
        factors: [
          `intención ${intent} pts`,
          `recencia ${recency} pts`,
          `etapa ${stage} pts`,
          `financiamiento ${financing} pts`,
        ],
      };
    })
    .toSorted((a, b) => b.score - a.score);

  const selectedLead = ranked[0];
  return {
    rule:
      "score = intención (40) + recencia (20) + etapa (20) + financiamiento (15); máximo 100",
    ranked,
    selectedLead,
    decision: `${selectedLead.alias} queda primero con ${selectedLead.score}/100.`,
  };
}

export function recommendUnit(leadId: string): RecommendResult | null {
  const lead = leads.find((candidate) => candidate.id === leadId);
  if (!lead) return null;

  const ranked = units
    .map((unit): RankedUnit => {
      const district = unit.district === lead.district ? 30 : 0;
      const bedroomDifference = Math.abs(unit.bedrooms - lead.bedrooms);
      const bedrooms = bedroomDifference === 0 ? 25 : bedroomDifference === 1 ? 12 : 0;
      const budgetRatio = unit.pricePen / lead.budgetPen;
      const budget = budgetRatio <= 1 ? 35 : budgetRatio <= 1.1 ? 20 : 0;
      const availability = unit.status === "disponible" ? 10 : 0;

      return {
        ...unit,
        score: district + bedrooms + budget + availability,
        factors: [
          `distrito ${district} pts`,
          `dormitorios ${bedrooms} pts`,
          `presupuesto ${budget} pts`,
          `disponibilidad ${availability} pts`,
        ],
      };
    })
    .toSorted((a, b) => b.score - a.score || a.pricePen - b.pricePen);

  const selectedUnit = ranked[0];
  return {
    rule:
      "match = distrito (30) + dormitorios (25) + presupuesto (35) + disponibilidad (10)",
    ranked,
    selectedUnit,
    decision: `${selectedUnit.code} es la mejor coincidencia con ${selectedUnit.score}/100.`,
  };
}

export function consultProject(
  projectSlug: string,
  question: string,
): ConsultResult | null {
  const project = projects.find((candidate) => candidate.slug === projectSlug);
  if (!project) return null;

  const normalizedQuestion = question.trim().slice(0, 180);
  const answer = `${project.name} está ${project.stage.toLowerCase()} y su entrega está prevista para ${project.delivery.toLowerCase()}. Sus atributos recuperados son ${project.differentiators.join(
    ", ",
  )}. ${project.commercialRule}`;

  return {
    rule:
      "recuperación determinística sobre la ficha ficticia del proyecto; no usa un modelo generativo",
    project,
    answer,
    sources: [
      { label: "Consulta", value: normalizedQuestion || "Resumen comercial" },
      { label: "Ficha", value: `${project.stage} · entrega ${project.delivery}` },
      { label: "Regla comercial", value: project.commercialRule },
    ],
    decision: "La respuesta queda sustentada por tres campos visibles de la ficha.",
  };
}

const advisors = [
  { name: "Asesora Centro", districts: ["Jesús María", "Lince"], openLeads: 3 },
  { name: "Asesor Norte", districts: ["Jesús María", "Magdalena"], openLeads: 6 },
  { name: "Asesora Costa", districts: ["Magdalena", "Lince"], openLeads: 5 },
];

export function assignLead(leadId: string, unitCode: string): AssignmentResult | null {
  const lead = leads.find((candidate) => candidate.id === leadId);
  const unit = units.find((candidate) => candidate.code === unitCode);
  if (!lead || !unit) return null;

  const advisor = advisors
    .filter((candidate) => candidate.districts.includes(unit.district))
    .toSorted((a, b) => a.openLeads - b.openLeads)[0];

  if (!advisor) return null;

  const assignment = {
    eventId: crypto.randomUUID(),
    leadId: lead.id,
    leadAlias: lead.alias,
    unitCode: unit.code,
    projectName: unit.projectName,
    advisor: advisor.name,
    loadBefore: advisor.openLeads,
    loadAfter: advisor.openLeads + 1,
    decidedAt: new Date().toISOString(),
  };

  return {
    rule: "asesor habilitado para el distrito con menor carga abierta",
    assignment,
    decision: `${lead.alias} se asigna a ${advisor.name}; carga ${advisor.openLeads} → ${advisor.openLeads + 1}.`,
  };
}
