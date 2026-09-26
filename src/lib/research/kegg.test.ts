import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { getKeggReactionSources } from "./kegg";

describe("getKeggReactionSources", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns KEGG reaction sources when a compound and reactions are found", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "pubchem:2519\tcpd:C07481",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "cpd:C07481\trn:R07930",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => [
          "NAME        Caffeine degradation",
          "DEFINITION  Caffeine + H2O <=> 3,7-Dimethylxanthine + Methanol",
          "EQUATION    C07481 + C00001 <=> C16353 + C00132",
          "ENZYME      3.2.1.18",
        ].join("\n"),
      } as Response);

    const sources = await getKeggReactionSources(2519);

    expect(sources).toHaveLength(1);
    expect(sources[0].id).toBe("KEGG-1");
    expect(sources[0].provider).toBe("KEGG");
    expect(sources[0].title).toContain("Caffeine degradation");
    expect(sources[0].excerpt).toContain("Caffeine + H2O");
    expect(sources[0].excerpt).toContain("Enzymes: 3.2.1.18");
  });

  it("returns empty array when no KEGG compound mapping exists", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      text: async () => "",
    } as Response);

    const sources = await getKeggReactionSources(999999);
    expect(sources).toEqual([]);
  });

  it("returns empty array when KEGG returns no linked reactions", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "pubchem:2519\tcpd:C07481",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      } as Response);

    const sources = await getKeggReactionSources(2519);
    expect(sources).toEqual([]);
  });

  it("gracefully returns empty array on fetch error", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));
    const sources = await getKeggReactionSources(2519);
    expect(sources).toEqual([]);
  });

  it("limits reactions to the configured maximum", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "pubchem:2519\tcpd:C07481",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => [
          "cpd:C07481\trn:R07930",
          "cpd:C07481\trn:R07931",
          "cpd:C07481\trn:R07932",
          "cpd:C07481\trn:R07933",
          "cpd:C07481\trn:R07934",
        ].join("\n"),
      } as Response);

    for (let i = 0; i < 5; i++) {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        text: async () => `NAME Reaction ${i}\nEQUATION C00001 <=> C00002`,
      } as Response);
    }

    const sources = await getKeggReactionSources(2519);
    expect(sources.length).toBeLessThanOrEqual(4);
  });
});
