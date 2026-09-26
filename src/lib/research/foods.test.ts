import { describe, expect, it } from "vitest";
import { getFoodContext, resolveFoodToChemical } from "./foods";

describe("resolveFoodToChemical", () => {
  it("resolves common food names to their primary chemical", () => {
    expect(resolveFoodToChemical("Orange fruit")).toBe("Ascorbic acid");
    expect(resolveFoodToChemical("coffee")).toBe("Caffeine");
    expect(resolveFoodToChemical("green tea")).toBe("Epigallocatechin gallate");
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(resolveFoodToChemical("  Orange FRUIT  ")).toBe("Ascorbic acid");
    expect(resolveFoodToChemical("TURMERIC ")).toBe("Curcumin");
  });

  it("returns null for unknown foods", () => {
    expect(resolveFoodToChemical("rocket fuel")).toBeNull();
    expect(resolveFoodToChemical("")).toBeNull();
  });
});

describe("getFoodContext", () => {
  it("returns primary chemical and related chemicals for known foods", () => {
    const context = getFoodContext("orange fruit");
    expect(context).toEqual({
      primary: "Ascorbic acid",
      related: ["Limonene", "Naringenin"],
    });
  });

  it("returns null for unknown foods", () => {
    expect(getFoodContext("unknown food")).toBeNull();
  });
});
