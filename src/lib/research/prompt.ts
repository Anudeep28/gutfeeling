import type { EvidenceBundle } from "./types";

export function buildResearchPrompt(evidence: EvidenceBundle) {
  const sourceText = evidence.sources.map((source) =>
    `[${source.id}] ${source.provider}: ${source.title}\nURL: ${source.url}\nEvidence: ${source.excerpt}`,
  ).join("\n\n");

  const hasUsda = evidence.sources.some((source) => source.provider === "USDA");
  const hasKegg = evidence.sources.some((source) => source.provider === "KEGG");
  const hasReactome = evidence.sources.some((source) => source.provider === "Reactome");
  const hasDri = evidence.sources.some((source) => source.provider === "WHO/EU DRI");
  const hasExamine = evidence.sources.some((source) => source.provider === "Examine.com");
  const hasCompTox = evidence.sources.some((source) => source.provider === "EPA CompTox");

  const foodResolutionNote = evidence.resolvedFromFood
    ? `The user entered "${evidence.resolvedFromFood}". This was resolved to the food-exposure chemical ${evidence.identity.title} (${evidence.chemical}) for analysis; interpret exposure context in light of that food.`
    : "";

  return `Analyze ${evidence.identity.title} (${evidence.chemical}) as a food-exposure chemical using only the evidence below.
${foodResolutionNote}

Build a causal chain rather than a list of claims:
1. Chemical identity and structure-related properties
2. Exposure route and realistic food context
3. Absorption, distribution, metabolism, and excretion (ADME)
4. Molecular targets and chemical/biochemical reactions
5. Cellular and organ-level effects
6. Whole-body outcomes, separating potential benefit from harm
7. Dose-response, timing, vulnerable groups, and interactions
8. Evidence quality and unanswered questions

${hasUsda ? "USDA sources describe real foods and nutrient profiles; use them to ground exposure context (typical food sources and amounts) and distinguish nutrients from additives or contaminants." : "No USDA food-occurrence records were retrieved; state that exposure context is limited to the retrieved literature."}

${hasKegg ? "KEGG sources contain curated reaction equations, substrates, products, and enzyme annotations. Use them as the primary basis for the reactions field." : "No KEGG reaction records were retrieved; rely on the literature (Europe PMC / EFSA / PubChem / Reactome) for any reaction claims and clearly mark uncertainty."}

${hasReactome ? "Reactome sources contain curated human biological pathways and reactions. Use them to ground pathway and reaction claims, especially for human metabolism." : "No Reactome records were retrieved; rely on the literature and KEGG for pathway and reaction claims."}

${hasDri ? "WHO/EU DRI sources provide adult reference intake values and upper limits. Use them to contextualize typical dietary amounts, but do not present them as personalized recommendations." : "No daily intake reference values were retrieved; do not state recommended daily amounts unless the retrieved literature provides them."}

${hasExamine ? "An Examine.com search link is included as a human-readable reference. It is not a retrieved evidence record; do not cite it for specific factual claims." : "No Examine.com reference link is available."}

${hasCompTox ? "EPA CompTox sources provide toxicity values and exposure indicators. Use them to ground hazard, dose-response, product-use, and production-volume context; distinguish screening or animal values from demonstrated human effects." : "No EPA CompTox toxicity or exposure records were retrieved; do not infer that this means the chemical has no hazard or exposure."}

Return a structured research report as JSON only with this exact shape:
{
  "title": "string",
  "plainLanguageSummary": "string",
  "evidenceVerdict": "well-established|moderate|limited|conflicting",
  "intakeTimeline": [
    {"heading": "Absorption", "summary": "string", "details": ["string"], "citations": ["SOURCE-ID"]},
    {"heading": "Distribution", "summary": "string", "details": ["string"], "citations": ["SOURCE-ID"]},
    {"heading": "Metabolism", "summary": "string", "details": ["string"], "citations": ["SOURCE-ID"]},
    {"heading": "Excretion", "summary": "string", "details": ["string"], "citations": ["SOURCE-ID"]}
  ],
  "shortTermEffects": {"heading": "Short-term effects", "summary": "string", "details": ["string"], "citations": ["SOURCE-ID"]},
  "longTermEffects": {"heading": "Long-term effects", "summary": "string", "details": ["string"], "citations": ["SOURCE-ID"]},
  "reactions": [
    {"summary": "string", "reactants": ["string"], "products": ["string"], "enzymes": ["string"], "citations": ["SOURCE-ID"]}
  ],
  "sections": [
    {"heading": "string", "summary": "string", "details": ["string"], "citations": ["SOURCE-ID"]}
  ],
  "keyUncertainties": ["string"],
  "practicalContext": ["string"],
  "disclaimer": "string"
}

Instructions for each field:
- intakeTimeline: explain step-by-step what happens after human intake, from entry into the body through elimination. State timing where the evidence allows (e.g., minutes, hours, days).
- shortTermEffects: effects within minutes to a few days of typical exposure, including acute physiological responses.
- longTermEffects: effects of repeated or chronic exposure over weeks to years.
- reactions: describe concrete biochemical reactions this compound participates in, listing reactants, products, and any enzymes or co-factors mentioned in the evidence. When KEGG reaction equations are supplied, preserve the substrate and product names from those equations. When Reactome records describe reactions, use the Reactome summation and species context. Otherwise derive them from the literature and flag any inference.
- sections: use for any additional important context not captured above, such as dose-response or vulnerable groups.

Every factual claim must cite one or more supplied source IDs exactly, such as [PUBCHEM-1]. Distinguish human evidence from animal, in-vitro, and mechanistic inference. Do not invent facts, source IDs, thresholds, safe doses, or medical recommendations. Say when the supplied evidence cannot answer a question. Avoid declaring a chemical simply good or bad: dose, route, duration, and individual susceptibility matter.

Evidence:
${sourceText}`;
}
