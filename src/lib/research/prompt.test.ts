import { describe, expect, it } from "vitest";
import { buildResearchPrompt } from "./prompt";
import type { EvidenceBundle } from "./types";

const evidence: EvidenceBundle = {
  chemical: "caffeine",
  identity: { cid: 2519, title: "Caffeine", molecularFormula: "C8H10N4O2", molecularWeight: "194.19", canonicalSmiles: "CN1C=NC2=C1C(=O)N(C(=O)N2C)C", synonyms: ["caffeine"] },
  sources: [{ id: "PUBCHEM-1", provider: "PubChem", title: "Caffeine", url: "https://pubchem.ncbi.nlm.nih.gov/compound/2519", excerpt: "A methylxanthine." }],
};

const evidenceWithUsda: EvidenceBundle = {
  ...evidence,
  sources: [
    ...evidence.sources,
    { id: "USDA-1", provider: "USDA", title: "Coffee, brewed", url: "https://fdc.nal.usda.gov/fdc_app.html#/food-details/171921", excerpt: "Top nutrients per 100g: Caffeine: 40mg." },
  ],
};

describe("buildResearchPrompt", () => {
  it("requires source-bound claims and the requested framework", () => {
    const prompt = buildResearchPrompt(evidence);
    expect(prompt).toContain("[PUBCHEM-1]");
    expect(prompt).toContain("Absorption, distribution, metabolism, and excretion");
    expect(prompt).toContain("Do not invent");
  });

  it("asks for structured intake timeline, effects, and reactions", () => {
    const prompt = buildResearchPrompt(evidence);
    expect(prompt).toContain("intakeTimeline");
    expect(prompt).toContain("shortTermEffects");
    expect(prompt).toContain("longTermEffects");
    expect(prompt).toContain("reactants");
    expect(prompt).toContain("products");
  });

  it("notes when USDA food data is available", () => {
    const prompt = buildResearchPrompt(evidenceWithUsda);
    expect(prompt).toContain("USDA sources describe real foods");
    expect(prompt).toContain("[USDA-1]");
  });

  it("notes when USDA food data is absent", () => {
    const prompt = buildResearchPrompt(evidence);
    expect(prompt).toContain("No USDA food-occurrence records were retrieved");
  });

  it("notes when KEGG reaction data is available", () => {
    const evidenceWithKegg: EvidenceBundle = {
      ...evidence,
      sources: [
        ...evidence.sources,
        { id: "KEGG-1", provider: "KEGG", title: "Caffeine degradation", url: "https://www.genome.jp/entry/rn:R07930", excerpt: "Caffeine + H2O <=> Paraxanthine + Methanol" },
      ],
    };
    const prompt = buildResearchPrompt(evidenceWithKegg);
    expect(prompt).toContain("KEGG sources contain curated reaction equations");
    expect(prompt).toContain("[KEGG-1]");
  });

  it("notes when Examine.com reference link is available", () => {
    const evidenceWithExamine: EvidenceBundle = {
      ...evidence,
      sources: [
        ...evidence.sources,
        { id: "EXAMINE-1", provider: "Examine.com", title: "Examine.com search for caffeine", url: "https://examine.com/search/?q=caffeine", excerpt: "Examine.com provides independent, evidence-based supplement summaries." },
      ],
    };
    const prompt = buildResearchPrompt(evidenceWithExamine);
    expect(prompt).toContain("Examine.com search link is included");
    expect(prompt).toContain("[EXAMINE-1]");
  });

  it("notes when KEGG reaction data is absent", () => {
    const prompt = buildResearchPrompt(evidence);
    expect(prompt).toContain("No KEGG reaction records were retrieved");
  });

  it("notes when the query was resolved from a food name", () => {
    const resolvedEvidence: EvidenceBundle = { ...evidence, resolvedFromFood: "Orange fruit" };
    const prompt = buildResearchPrompt(resolvedEvidence);
    expect(prompt).toContain("Orange fruit");
    expect(prompt).toContain("resolved to the food-exposure chemical");
  });

  it("notes when Reactome data is available", () => {
    const evidenceWithReactome: EvidenceBundle = {
      ...evidence,
      sources: [
        ...evidence.sources,
        { id: "REACTOME-1", provider: "Reactome", title: "N-atom dealkylation of caffeine", url: "https://reactome.org/content/detail/R-HSA-76426", excerpt: "Type: Reaction | Species: Homo sapiens | Caffeine is extensively metabolized in humans." },
      ],
    };
    const prompt = buildResearchPrompt(evidenceWithReactome);
    expect(prompt).toContain("Reactome sources contain curated human biological pathways");
    expect(prompt).toContain("[REACTOME-1]");
  });

  it("notes when Reactome data is absent", () => {
    const prompt = buildResearchPrompt(evidence);
    expect(prompt).toContain("No Reactome records were retrieved");
  });

  it("notes when WHO/EU DRI data is available", () => {
    const evidenceWithDri: EvidenceBundle = {
      ...evidence,
      sources: [
        ...evidence.sources,
        { id: "DRI-1", provider: "WHO/EU DRI", title: "Daily intake reference for Zinc", url: "https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx", excerpt: "WHO RDA: 9.4 mg/day | EU PRI (adult male): 16.3 mg/day | EU UL: 25 mg/day" },
      ],
    };
    const prompt = buildResearchPrompt(evidenceWithDri);
    expect(prompt).toContain("WHO/EU DRI sources provide adult reference intake values");
    expect(prompt).toContain("[DRI-1]");
  });

  it("notes when WHO/EU DRI data is absent", () => {
    const prompt = buildResearchPrompt(evidence);
    expect(prompt).toContain("No daily intake reference values were retrieved");
  });
});
