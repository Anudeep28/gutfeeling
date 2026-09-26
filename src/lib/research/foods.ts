type FoodChemicalMapping = {
  readonly primaryChemical: string;
  readonly relatedChemicals?: readonly string[];
};

const FOOD_TO_CHEMICAL = new Map<string, FoodChemicalMapping>([
  ["orange fruit", { primaryChemical: "Ascorbic acid", relatedChemicals: ["Limonene", "Naringenin"] }],
  ["orange", { primaryChemical: "Ascorbic acid", relatedChemicals: ["Limonene", "Naringenin"] }],
  ["lemon", { primaryChemical: "Citric acid", relatedChemicals: ["Limonene"] }],
  ["apple", { primaryChemical: "Malic acid", relatedChemicals: ["Quercetin"] }],
  ["coffee", { primaryChemical: "Caffeine", relatedChemicals: ["Chlorogenic acid"] }],
  ["tea", { primaryChemical: "Caffeine", relatedChemicals: ["L-theanine"] }],
  ["green tea", { primaryChemical: "Epigallocatechin gallate", relatedChemicals: ["Caffeine", "L-theanine"] }],
  ["chocolate", { primaryChemical: "Theobromine", relatedChemicals: ["Caffeine"] }],
  ["cocoa", { primaryChemical: "Theobromine", relatedChemicals: ["Caffeine"] }],
  ["turmeric", { primaryChemical: "Curcumin", relatedChemicals: ["Demethoxycurcumin"] }],
  ["garlic", { primaryChemical: "Allicin", relatedChemicals: ["Diallyl disulfide"] }],
  ["ginger", { primaryChemical: "Gingerol", relatedChemicals: ["Shogaol"] }],
  ["grapefruit", { primaryChemical: "Naringenin", relatedChemicals: ["Hesperidin"] }],
  ["tomato", { primaryChemical: "Lycopene", relatedChemicals: ["Beta-carotene"] }],
  ["spinach", { primaryChemical: "Lutein", relatedChemicals: ["Beta-carotene", "Folate"] }],
  ["blueberry", { primaryChemical: "Cyanidin", relatedChemicals: ["Anthocyanin"] }],
  ["red wine", { primaryChemical: "Resveratrol", relatedChemicals: ["Quercetin"] }],
  ["grapes", { primaryChemical: "Resveratrol", relatedChemicals: ["Quercetin"] }],
  ["fish oil", { primaryChemical: "Docosahexaenoic acid", relatedChemicals: ["Eicosapentaenoic acid"] }],
  ["milk", { primaryChemical: "Lactose", relatedChemicals: ["Casein"] }],
  ["bread", { primaryChemical: "Acrylamide", relatedChemicals: ["Furfural"] }],
  ["toast", { primaryChemical: "Acrylamide", relatedChemicals: ["Furfural"] }],
  ["banana", { primaryChemical: "Dopamine", relatedChemicals: ["Serotonin"] }],
]);

export function resolveFoodToChemical(name: string): string | null {
  const normalized = name.trim().toLowerCase();
  return FOOD_TO_CHEMICAL.get(normalized)?.primaryChemical ?? null;
}

export function getFoodContext(name: string): { primary: string; related: string[] } | null {
  const mapping = FOOD_TO_CHEMICAL.get(name.trim().toLowerCase());
  if (!mapping) return null;
  return { primary: mapping.primaryChemical, related: mapping.relatedChemicals ? [...mapping.relatedChemicals] : [] };
}
