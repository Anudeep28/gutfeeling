import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCompToxSources } from "./comptox";

describe("getCompToxSources", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env.CTX_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.CTX_API_KEY;
  });

  it("returns no sources without CTX_API_KEY", async () => {
    delete process.env.CTX_API_KEY;

    expect(await getCompToxSources("caffeine")).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("authenticates with x-api-key and formats toxicity and exposure evidence", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ dtxsid: "DTXSID0020232", preferredName: "Caffeine" }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ studyType: "Acute oral", speciesCommon: "Rat", toxvalNumeric: 192, toxvalUnits: "mg/kg" }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ productUseCategory: "Food and beverage products", numberOfProducts: 12 }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ productionVolume: "1M-10M lb", year: 2020 }],
      } as Response);

    const sources = await getCompToxSources("caffeine");

    expect(fetch).toHaveBeenCalledTimes(4);
    for (const [, options] of vi.mocked(fetch).mock.calls) {
      expect(options?.headers).toMatchObject({ "x-api-key": "test-key" });
    }
    expect(sources).toHaveLength(3);
    expect(sources.map((source) => source.id)).toEqual(["COMPTOX-TOXICITY", "COMPTOX-EXPOSURE-USES", "COMPTOX-EXPOSURE-VOLUME"]);
    expect(sources[0].excerpt).toContain("Acute oral");
    expect(sources[0].excerpt).toContain("192 mg/kg");
    expect(sources[1].excerpt).toContain("Food and beverage products");
    expect(sources[2].excerpt).toContain("1M-10M lb");
  });

  it("gracefully returns no sources when the chemical cannot be resolved", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => [] } as Response);

    expect(await getCompToxSources("unknown chemical")).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("gracefully returns no sources on an API error", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    expect(await getCompToxSources("caffeine")).toEqual([]);
  });
});
