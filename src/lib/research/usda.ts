import type { EvidenceSource, UsdaFoodDiscovery } from "./types";

const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";

type UsdaFoodNutrient = {
  nutrientId: number;
  nutrientName: string;
  value: number;
  unitName: string;
};

type UsdaFood = {
  fdcId: number;
  description: string;
  dataType: string;
  foodCategory?: string;
  foodNutrients?: UsdaFoodNutrient[];
};

type UsdaSearchResponse = {
  foods?: UsdaFood[];
};

const MAX_NUTRIENTS_PER_FOOD = 30;
const MAX_FOODS = 5;

async function searchUsda(query: string): Promise<UsdaFood[]> {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) return [];

  const url = new URL(`${USDA_BASE}/foods/search`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("pageSize", String(MAX_FOODS));
  url.searchParams.set("dataType", "Foundation,SR Legacy,Branded,Survey (FNDDS)");

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return [];
    const data = (await response.json()) as UsdaSearchResponse;
    return (data.foods || []).slice(0, MAX_FOODS);
  } catch {
    return [];
  }
}

function normalizeWords(value: string) {
  return value.toLowerCase().match(/[a-z0-9]+/g)?.map((word) => word.replace(/s$/, "")) || [];
}

function descriptionMatchesQuery(description: string, query: string) {
  const descriptionWords = new Set(normalizeWords(description));
  const queryWords = normalizeWords(query);
  return queryWords.length > 0 && queryWords.every((word) => descriptionWords.has(word));
}

export async function discoverUsdaFood(query: string): Promise<UsdaFoodDiscovery | null> {
  const foods = await searchUsda(query);
  const food = foods.find((candidate) =>
    !candidate.foodCategory?.toLowerCase().includes("dietary supplement")
    && descriptionMatchesQuery(candidate.description, query));
  if (!food) return null;

  const seen = new Set<number>();
  const nutrients = (food.foodNutrients || [])
    .filter((nutrient) => nutrient.nutrientName && Number.isFinite(nutrient.value) && nutrient.value > 0)
    .filter((nutrient) => {
      if (seen.has(nutrient.nutrientId)) return false;
      seen.add(nutrient.nutrientId);
      return true;
    })
    .slice(0, MAX_NUTRIENTS_PER_FOOD)
    .map((nutrient) => ({
      id: nutrient.nutrientId,
      name: nutrient.nutrientName,
      amount: nutrient.value,
      unit: nutrient.unitName,
    }));

  if (nutrients.length === 0) return null;
  return { fdcId: food.fdcId, description: food.description, dataType: food.dataType, nutrients };
}

export async function getUsdaFoodSources(query: string): Promise<EvidenceSource[]> {
  return (await searchUsda(query)).map((food, index) => formatUsdaSource(food, index));
}

export function getUsdaDiscoverySource(food: UsdaFoodDiscovery): EvidenceSource {
  return formatUsdaSource({
    ...food,
    foodNutrients: food.nutrients.map((nutrient) => ({
      nutrientId: nutrient.id,
      nutrientName: nutrient.name,
      value: nutrient.amount,
      unitName: nutrient.unit,
    })),
  }, 0);
}

function formatUsdaSource(food: UsdaFood, index: number): EvidenceSource {
  const nutrients = (food.foodNutrients || [])
    .slice(0, MAX_NUTRIENTS_PER_FOOD)
    .map((n) => `${n.nutrientName}: ${n.value}${n.unitName}`)
    .join(", ");

  return {
    id: `USDA-${index + 1}`,
    provider: "USDA",
    title: `${food.description} (${food.dataType})`,
    url: `https://fdc.nal.usda.gov/fdc_app.html#/food-details/${food.fdcId}`,
    excerpt: `FDC ID ${food.fdcId}. ${nutrients ? `Nutrients per 100g: ${nutrients}.` : "Nutrient details unavailable."}`,
  };
}
