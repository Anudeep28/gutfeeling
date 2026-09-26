import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { discoverUsdaFood, getUsdaFoodSources } from "./usda";

describe("getUsdaFoodSources", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env.USDA_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.USDA_API_KEY;
  });

  it("returns empty array when USDA_API_KEY is missing", async () => {
    delete process.env.USDA_API_KEY;
    const sources = await getUsdaFoodSources("caffeine");
    expect(sources).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns formatted sources from USDA response", async () => {
    const mockResponse = {
      foods: [
        {
          fdcId: 171921,
          description: "Coffee, brewed",
          dataType: "SR Legacy",
          foodNutrients: [
            { nutrientId: 1051, nutrientName: "Caffeine", value: 40, unitName: "mg" },
            { nutrientId: 1008, nutrientName: "Energy", value: 2, unitName: "kcal" },
          ],
        },
      ],
    };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const sources = await getUsdaFoodSources("caffeine");

    expect(sources).toHaveLength(1);
    expect(sources[0].id).toBe("USDA-1");
    expect(sources[0].provider).toBe("USDA");
    expect(sources[0].title).toContain("Coffee, brewed");
    expect(sources[0].excerpt).toContain("Caffeine: 40mg");
  });

  it("discovers a matching food and exposes its nutrients for selection", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        foods: [{
          fdcId: 169097,
          description: "Oranges, raw, all commercial varieties",
          dataType: "Foundation",
          foodNutrients: [
            { nutrientId: 1162, nutrientName: "Vitamin C, total ascorbic acid", value: 53.2, unitName: "mg" },
            { nutrientId: 1008, nutrientName: "Energy", value: 47, unitName: "kcal" },
            { nutrientId: 1162, nutrientName: "Vitamin C, total ascorbic acid", value: 53.2, unitName: "mg" },
          ],
        }],
      }),
    } as Response);

    const food = await discoverUsdaFood("orange");

    expect(food?.description).toBe("Oranges, raw, all commercial varieties");
    expect(food?.nutrients).toEqual([
      { id: 1162, name: "Vitamin C, total ascorbic acid", amount: 53.2, unit: "mg" },
      { id: 1008, name: "Energy", amount: 47, unit: "kcal" },
    ]);
  });

  it("does not classify a dietary supplement record as a food", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        foods: [{
          fdcId: 2644284,
          description: "Creatine monohydrate powder",
          dataType: "Branded",
          foodCategory: "Dietary Supplements",
          foodNutrients: [{ nutrientId: 1008, nutrientName: "Energy", value: 5, unitName: "kcal" }],
        }],
      }),
    } as Response);

    expect(await discoverUsdaFood("creatine")).toBeNull();
  });

  it("does not classify a chemical as a food when USDA returns only unrelated food descriptions", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        foods: [{
          fdcId: 171890,
          description: "Coffee, brewed",
          dataType: "SR Legacy",
          foodNutrients: [{ nutrientId: 1051, nutrientName: "Caffeine", value: 40, unitName: "mg" }],
        }],
      }),
    } as Response);

    expect(await discoverUsdaFood("caffeine")).toBeNull();
  });

  it("gracefully returns empty array on fetch error", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));
    const sources = await getUsdaFoodSources("caffeine");
    expect(sources).toEqual([]);
  });

  it("gracefully returns empty array when no foods match", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ foods: [] }),
    } as Response);
    const sources = await getUsdaFoodSources("unknown synthetic additive");
    expect(sources).toEqual([]);
  });

  it("limits nutrients per food", async () => {
    const food = {
      fdcId: 1,
      description: "Test food",
      dataType: "Foundation",
      foodNutrients: Array.from({ length: 35 }, (_, i) => ({
        nutrientId: i,
        nutrientName: `Nutrient ${i}`,
        value: i,
        unitName: "mg",
      })),
    };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ foods: [food] }),
    } as Response);

    const sources = await getUsdaFoodSources("test");
    const nutrientCount = sources[0].excerpt.match(/Nutrient \d+:/g)?.length || 0;
    expect(nutrientCount).toBe(30);
  });
});
