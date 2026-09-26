import type { EvidenceSource } from "./types";

type IntakeRow = {
  code: string;
  name: string;
  synonyms: string[];
  whorda?: number; // WHO RDA (g/day)
  usear?: number; // US EAR (g/day)
  usrdam?: number; // US RDA male (g/day)
  usrdaf?: number; // US RDA female (g/day)
  euprim?: number; // EU PRI male (g/day)
  euprif?: number; // EU PRI female (g/day)
  ulus?: number; // US UL (g/day)
  uleu?: number; // EU UL (g/day)
  uljapan?: number; // Japan UL (g/day)
};

// Values are in g/day, derived from international DRI tables compiled by
// ifct2017/intakes (WHO, US DRI, EU PRI, national ULs).
const INTAKES: readonly IntakeRow[] = [
  { code: "his", name: "Histidine", synonyms: ["histidine"], usrdam: -14e-3 },
  { code: "ile", name: "Isoleucine", synonyms: ["isoleucine"], usrdam: -19e-3 },
  { code: "leu", name: "Leucine", synonyms: ["leucine"], usrdam: -42e-3 },
  { code: "lys", name: "Lysine", synonyms: ["lysine"], usrdam: -38e-3 },
  { code: "met", name: "Methionine", synonyms: ["methionine"], usrdam: -19e-3 },
  { code: "phe", name: "Phenylalanine", synonyms: ["phenylalanine"], usrdam: -33e-3 },
  { code: "thr", name: "Threonine", synonyms: ["threonine"], usrdam: -20e-3 },
  { code: "trp", name: "Tryptophan", synonyms: ["tryptophan"], usrdam: -5e-3 },
  { code: "val", name: "Valine", synonyms: ["valine"], usrdam: -24e-3 },
  { code: "f18d3n3", name: "Alpha-linolenic acid (ALA)", synonyms: ["alpha-linolenic acid", "ala", "omega-3"], usrdam: 1.6e-3, usrdaf: 1.1e-3, euprim: 2e-3 },
  { code: "f18d2cn6", name: "Linoleic acid", synonyms: ["linoleic acid", "omega-6"], usrdam: 17e-3, usrdaf: 12e-3, euprim: 10e-3 },
  { code: "vita", name: "Vitamin A", synonyms: ["vitamin a", "retinol"], usear: 625e-6, usrdam: 900e-6, usrdaf: 700e-6, ulus: 3000e-6, uleu: 3000e-6, uljapan: 2700e-6 },
  { code: "thia", name: "Thiamin (Vitamin B1)", synonyms: ["thiamin", "vitamin b1", "thiamine"], usrdam: 1.2e-3, usrdaf: 1.1e-3 },
  { code: "ribf", name: "Riboflavin (Vitamin B2)", synonyms: ["riboflavin", "vitamin b2"], usrdam: 1.3e-3, usrdaf: 1.1e-3 },
  { code: "nia", name: "Niacin (Vitamin B3)", synonyms: ["niacin", "vitamin b3", "nicotinic acid", "nicotinamide"], usrdam: 16e-3, usrdaf: 14e-3, ulus: 35e-3, uleu: 10e-3, uljapan: 85e-3 },
  { code: "pantac", name: "Pantothenic acid (Vitamin B5)", synonyms: ["pantothenic acid", "vitamin b5"], usrdam: 5e-3, usrdaf: 5e-3 },
  { code: "vitb6c", name: "Vitamin B6", synonyms: ["vitamin b6", "pyridoxine", "pyridoxal"], usear: 1.1e-3, usrdam: 1.5e-3, usrdaf: 1.35e-3, ulus: 100e-3, uleu: 25e-3, uljapan: 60e-3 },
  { code: "biot", name: "Biotin (Vitamin B7)", synonyms: ["biotin", "vitamin b7", "vitamin h"], usrdam: 30e-6, usrdaf: 30e-6 },
  { code: "folsum", name: "Folate (Vitamin B9)", synonyms: ["folate", "folic acid", "vitamin b9"], usear: 320e-6, usrdam: 400e-6, usrdaf: 400e-6, ulus: 1000e-6, uleu: 1000e-6, uljapan: 1000e-6 },
  { code: "vitb12", name: "Vitamin B12", synonyms: ["vitamin b12", "cobalamin", "cyanocobalamin"], usear: 2.0e-6, usrdam: 2.4e-6, usrdaf: 2.4e-6 },
  { code: "vitc", name: "Vitamin C", synonyms: ["vitamin c", "ascorbic acid", "L-ascorbic acid"], whorda: 75e-3, usrdam: 90e-3, usrdaf: 75e-3, ulus: 2000e-3 },
  { code: "vitd", name: "Vitamin D", synonyms: ["vitamin d", "cholecalciferol", "ergocalciferol"], usear: 10e-6, usrdam: 15e-6, usrdaf: 15e-6, ulus: 100e-6, uleu: 100e-6, uljapan: 100e-6 },
  { code: "vite", name: "Vitamin E", synonyms: ["vitamin e", "tocopherol"], usear: 12e-3, usrdam: 15e-3, usrdaf: 15e-3, ulus: 1000e-3, uleu: 300e-3, uljapan: 900e-3 },
  { code: "vitk", name: "Vitamin K", synonyms: ["vitamin k", "phylloquinone", "menaquinone"], usrdam: 110e-6, usrdaf: 120e-6 },
  { code: "k", name: "Potassium", synonyms: ["potassium"], usrdam: 4700e-3, euprim: 4000e-3, uljapan: 3000e-3 },
  { code: "cl", name: "Chloride", synonyms: ["chloride"], usrdam: 2300e-3, ulus: 3600e-3 },
  { code: "na", name: "Sodium", synonyms: ["sodium"], usrdam: 1500e-3, ulus: 2300e-3, uljapan: 3600e-3 },
  { code: "ca", name: "Calcium", synonyms: ["calcium"], whorda: 800e-3, usear: 1200e-3, euprim: 1000e-3, ulus: 2500e-3, uleu: 2500e-3, uljapan: 2500e-3 },
  { code: "p", name: "Phosphorus", synonyms: ["phosphorus", "phosphate"], usear: 580e-3, usrdam: 700e-3, euprim: 640e-3, ulus: 4000e-3, uleu: 4000e-3, uljapan: 3000e-3 },
  { code: "mg", name: "Magnesium", synonyms: ["magnesium"], usear: 350e-3, usrdam: 420e-3, euprim: 350e-3, ulus: 350e-3, uleu: 250e-3, uljapan: 350e-3 },
  { code: "fe", name: "Iron", synonyms: ["iron"], usear: 6e-3, usrdam: 8e-3, usrdaf: 18e-3, euprim: 11e-3, euprif: 16e-3, ulus: 45e-3, uljapan: 45e-3 },
  { code: "zn", name: "Zinc", synonyms: ["zinc"], whorda: 9.4e-3, usear: 11e-3, euprim: 16.3e-3, ulus: 40e-3, uleu: 25e-3, uljapan: 45e-3 },
  { code: "mn", name: "Manganese", synonyms: ["manganese"], usrdam: 2.3e-3, euprim: 3.0e-3, ulus: 11e-3, uljapan: 11e-3 },
  { code: "cu", name: "Copper", synonyms: ["copper"], usear: 0.7e-3, usrdam: 0.9e-3, euprim: 1.6e-3, ulus: 10e-3, uleu: 5e-3, uljapan: 10e-3 },
  { code: "i", name: "Iodine", synonyms: ["iodine"], usear: 0.095e-3, usrdam: 0.150e-3, euprim: 0.200e-3, ulus: 1.1e-3, uleu: 0.6e-3, uljapan: 3e-3 },
  { code: "cr", name: "Chromium", synonyms: ["chromium"], usrdam: 0.035e-3 },
  { code: "mo", name: "Molybdenum", synonyms: ["molybdenum"], usear: 0.034e-3, usrdam: 0.045e-3, euprim: 0.065e-3, ulus: 2e-3, uleu: 0.6e-3, uljapan: 0.55e-3 },
  { code: "se", name: "Selenium", synonyms: ["selenium"], usear: 0.045e-3, usrdam: 0.055e-3, euprim: 0.070e-3, ulus: 0.4e-3, uleu: 0.3e-3, uljapan: 0.46e-3 },
  { code: "f", name: "Fluoride", synonyms: ["fluoride"], usrdam: 4e-3, euprim: 3.4e-3, ulus: 10e-3, uleu: 7e-3 },
  { code: "choline", name: "Choline", synonyms: ["choline"], usrdam: 550e-3, euprim: 520e-3, ulus: 3500e-3 },
  { code: "fibtg", name: "Total fiber", synonyms: ["fiber", "fibre", "dietary fiber"], usrdam: 38, usrdaf: 25 },
];

function formatNumber(value: number): string {
  return String(parseFloat(value.toFixed(1)));
}

function formatAmount(gPerDay: number): string {
  const absValue = Math.abs(gPerDay);
  if (absValue >= 1) return `${formatNumber(gPerDay)} g/day`;
  if (absValue >= 1e-3) return `${formatNumber(gPerDay * 1000)} mg/day`;
  return `${formatNumber(gPerDay * 1_000_000)} µg/day`;
}

function buildExcerpt(row: IntakeRow): string {
  const parts: string[] = [];
  if (row.whorda) parts.push(`WHO RDA: ${formatAmount(row.whorda)}`);
  if (row.euprim) parts.push(`EU PRI (adult male): ${formatAmount(row.euprim)}`);
  if (row.euprif) parts.push(`EU PRI (adult female): ${formatAmount(row.euprif)}`);
  if (parts.length === 0) {
    if (row.usrdam) parts.push(`US RDA (adult male): ${formatAmount(row.usrdam)}`);
    if (row.usrdaf) parts.push(`US RDA (adult female): ${formatAmount(row.usrdaf)}`);
  }
  if (row.uleu) parts.push(`EU UL: ${formatAmount(row.uleu)}`);
  else if (row.ulus) parts.push(`US UL: ${formatAmount(row.ulus)}`);
  return parts.join(" | ");
}

export function getDriSources(chemical: string): EvidenceSource[] {
  const normalized = chemical.trim().toLowerCase();
  const row = INTAKES.find((entry) =>
    entry.name.toLowerCase() === normalized ||
    entry.synonyms.some((synonym) => synonym === normalized || normalized.includes(synonym) || synonym.includes(normalized))
  );
  if (!row) return [];
  const excerpt = buildExcerpt(row);
  if (!excerpt) return [];
  return [{
    id: "DRI-1",
    provider: "WHO/EU DRI",
    title: `Daily intake reference for ${row.name}`,
    url: "https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx",
    excerpt,
  }];
}
