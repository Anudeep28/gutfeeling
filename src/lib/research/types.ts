export type EvidenceSource = {
  id: string;
  provider: "PubChem" | "Europe PMC" | "EFSA Journal" | "USDA" | "KEGG" | "Examine.com" | "Reactome" | "WHO/EU DRI" | "EPA CompTox";
  title: string;
  url: string;
  excerpt: string;
  authors?: string;
  year?: string;
};

export type UsdaNutrient = {
  id: number;
  name: string;
  amount: number;
  unit: string;
};

export type UsdaFoodDiscovery = {
  fdcId: number;
  description: string;
  dataType: string;
  nutrients: UsdaNutrient[];
};

export type ChemicalIdentity = {
  cid: number;
  title: string;
  molecularFormula?: string;
  molecularWeight?: string;
  canonicalSmiles?: string;
  synonyms: string[];
};

export type EvidenceBundle = {
  chemical: string;
  identity: ChemicalIdentity;
  sources: EvidenceSource[];
  resolvedFromFood?: string;
};

export type ReportSection = {
  heading: string;
  summary: string;
  details: string[];
  citations: string[];
};

export type ReactionEntry = {
  summary: string;
  reactants: string[];
  products: string[];
  enzymes?: string[];
  citations: string[];
};

export type ChemicalReport = {
  title: string;
  plainLanguageSummary: string;
  evidenceVerdict: "well-established" | "moderate" | "limited" | "conflicting";
  intakeTimeline: ReportSection[];
  shortTermEffects: ReportSection;
  longTermEffects: ReportSection;
  reactions: ReactionEntry[];
  sections: ReportSection[];
  keyUncertainties: string[];
  practicalContext: string[];
  disclaimer: string;
};

export type ReportResponse = {
  evidence: EvidenceBundle;
  report: ChemicalReport;
};

export type ResearchResponse = ReportResponse | {
  selection: UsdaFoodDiscovery;
};
