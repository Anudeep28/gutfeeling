import { describe, expect, it } from "vitest";
import { chemicalReportSchema, parseChemicalQuery } from "./schema";

describe("parseChemicalQuery", () => {
  it("trims a valid chemical name", () => {
    expect(parseChemicalQuery({ chemical: "  caffeine  " })).toEqual({ chemical: "caffeine" });
  });

  it("accepts an optional selected USDA nutrient", () => {
    expect(parseChemicalQuery({ chemical: "orange", nutrient: "  Vitamin C  " })).toEqual({
      chemical: "orange",
      nutrient: "Vitamin C",
    });
  });

  it("accepts an explicit direct compound request", () => {
    expect(parseChemicalQuery({ chemical: "creatine", direct: true })).toEqual({
      chemical: "creatine",
      direct: true,
    });
  });

  it("rejects empty and oversized chemical names", () => {
    expect(() => parseChemicalQuery({ chemical: "   " })).toThrow();
    expect(() => parseChemicalQuery({ chemical: "x".repeat(121) })).toThrow();
  });
});

describe("chemicalReportSchema", () => {
  const baseReport = {
    title: "Caffeine",
    plainLanguageSummary: "A stimulant.",
    evidenceVerdict: "well-established",
    intakeTimeline: [
      { heading: "Absorption", summary: "Rapid.", details: ["GI tract"], citations: ["PUBCHEM-1"] },
      { heading: "Distribution", summary: "Widespread.", details: ["Crosses BBB"], citations: ["PUBCHEM-1"] },
      { heading: "Metabolism", summary: "Liver.", details: ["CYP1A2"], citations: ["EPMC-1"] },
      { heading: "Excretion", summary: "Urine.", details: ["Metabolites"], citations: ["EPMC-1"] },
    ],
    shortTermEffects: { heading: "Short-term effects", summary: "Alertness.", details: ["Reduced fatigue"], citations: ["EPMC-1"] },
    longTermEffects: { heading: "Long-term effects", summary: "Tolerance.", details: ["Habituation"], citations: ["EPMC-1"] },
    reactions: [{ summary: "Demethylation", reactants: ["caffeine"], products: ["paraxanthine"], enzymes: ["CYP1A2"], citations: ["EPMC-1"] }],
    sections: [],
    keyUncertainties: [],
    practicalContext: [],
    disclaimer: "Not medical advice.",
  };

  it("accepts a complete structured report", () => {
    expect(() => chemicalReportSchema.parse(baseReport)).not.toThrow();
  });

  it("rejects a report missing structured timeline fields", () => {
    const { intakeTimeline, ...missingTimeline } = baseReport;
    expect(intakeTimeline).toBeDefined();
    expect(() => chemicalReportSchema.parse(missingTimeline)).toThrow();
  });

  it("rejects a report missing effects fields", () => {
    const { shortTermEffects, ...missingShort } = baseReport;
    expect(shortTermEffects).toBeDefined();
    expect(() => chemicalReportSchema.parse(missingShort)).toThrow();
  });
});
