import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { getReactomeSources } from "./reactome";

describe("getReactomeSources", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns formatted Reactome sources for search results", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            entries: [
              {
                dbId: "76426",
                stId: "R-HSA-76426",
                name: "N-atom dealkylation of caffeine",
                type: "Reaction",
                species: ["Homo sapiens"],
                summation: "Caffeine is extensively metabolized in humans.",
                isDisease: false,
              },
              {
                dbId: "9996313",
                stId: "R-MMU-76426",
                name: "N-atom dealkylation of caffeine",
                type: "Reaction",
                species: ["Mus musculus"],
                isDisease: false,
              },
            ],
          },
        ],
      }),
    } as Response);

    const sources = await getReactomeSources("caffeine");

    expect(sources).toHaveLength(2);
    expect(sources[0].id).toBe("REACTOME-1");
    expect(sources[0].provider).toBe("Reactome");
    expect(sources[0].title).toBe("N-atom dealkylation of caffeine");
    expect(sources[0].url).toBe("https://reactome.org/content/detail/R-HSA-76426");
    expect(sources[0].excerpt).toContain("Homo sapiens");
    expect(sources[0].excerpt).toContain("Caffeine is extensively metabolized in humans.");
    expect(sources[1].url).toBe("https://reactome.org/content/detail/R-MMU-76426");
  });

  it("prioritizes human entries over other species", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            entries: [
              {
                dbId: "9996313",
                stId: "R-MMU-76426",
                name: "Mouse caffeine reaction",
                type: "Reaction",
                species: ["Mus musculus"],
                isDisease: false,
              },
              {
                dbId: "76426",
                stId: "R-HSA-76426",
                name: "Human caffeine reaction",
                type: "Reaction",
                species: ["Homo sapiens"],
                isDisease: false,
              },
            ],
          },
        ],
      }),
    } as Response);

    const sources = await getReactomeSources("caffeine");

    expect(sources[0].title).toBe("Human caffeine reaction");
    expect(sources[1].title).toBe("Mouse caffeine reaction");
  });

  it("filters out disease entries", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            entries: [
              {
                dbId: "76426",
                stId: "R-HSA-76426",
                name: "N-atom dealkylation of caffeine",
                type: "Reaction",
                species: ["Homo sapiens"],
                isDisease: false,
              },
              {
                dbId: "12345",
                stId: "R-HSA-12345",
                name: "Disease reaction",
                type: "Reaction",
                species: ["Homo sapiens"],
                isDisease: true,
              },
            ],
          },
        ],
      }),
    } as Response);

    const sources = await getReactomeSources("caffeine");

    expect(sources).toHaveLength(1);
    expect(sources[0].title).toBe("N-atom dealkylation of caffeine");
  });

  it("limits results to five sources", async () => {
    const entries = Array.from({ length: 8 }, (_, i) => ({
      dbId: String(i),
      stId: `R-HSA-${i}`,
      name: `Reaction ${i}`,
      type: "Reaction",
      species: ["Homo sapiens"],
      isDisease: false,
    }));
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [{ entries }] }),
    } as Response);

    const sources = await getReactomeSources("caffeine");

    expect(sources).toHaveLength(5);
    expect(sources[4].id).toBe("REACTOME-5");
  });

  it("gracefully returns empty array on fetch error", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));
    const sources = await getReactomeSources("caffeine");
    expect(sources).toEqual([]);
  });

  it("gracefully returns empty array on non-ok response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 503 } as Response);
    const sources = await getReactomeSources("caffeine");
    expect(sources).toEqual([]);
  });

  it("returns empty array when no results are found", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    } as Response);
    const sources = await getReactomeSources("unknown synthetic chemical");
    expect(sources).toEqual([]);
  });
});
