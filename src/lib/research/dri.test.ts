import { describe, expect, it } from "vitest";
import { getDriSources } from "./dri";

describe("getDriSources", () => {
  it("returns zinc reference intake and upper limit", () => {
    const sources = getDriSources("Zinc");
    expect(sources).toHaveLength(1);
    expect(sources[0].id).toBe("DRI-1");
    expect(sources[0].provider).toBe("WHO/EU DRI");
    expect(sources[0].title).toBe("Daily intake reference for Zinc");
    expect(sources[0].excerpt).toContain("WHO RDA: 9.4 mg/day");
    expect(sources[0].excerpt).toContain("EU PRI (adult male): 16.3 mg/day");
    expect(sources[0].excerpt).toContain("EU UL: 25 mg/day");
  });

  it("matches synonyms like ascorbic acid to vitamin C", () => {
    const sources = getDriSources("Ascorbic acid");
    expect(sources).toHaveLength(1);
    expect(sources[0].title).toBe("Daily intake reference for Vitamin C");
    expect(sources[0].excerpt).toContain("WHO RDA: 75 mg/day");
  });

  it("returns empty array for chemicals with no intake data", () => {
    const sources = getDriSources("caffeine");
    expect(sources).toEqual([]);
  });

  it("uses US values as fallback when WHO/EU values are absent", () => {
    const sources = getDriSources("Fiber");
    expect(sources[0].excerpt).toContain("US RDA (adult male): 38 g/day");
    expect(sources[0].excerpt).toContain("US RDA (adult female): 25 g/day");
  });
});
