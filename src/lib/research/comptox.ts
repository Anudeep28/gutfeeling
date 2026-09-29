import type { EvidenceSource } from "./types";

const CTX_BASE = "https://comptox.epa.gov/ctx-api";

type JsonRecord = Record<string, unknown>;

type ChemicalSearchResult = {
  dtxsid?: string;
  preferredName?: string;
};

async function fetchCtx<T>(url: string, apiKey: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "x-api-key": apiKey },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`EPA CompTox returned status ${response.status}.`);
  return response.json() as Promise<T>;
}

function stringify(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value || null;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);
  return null;
}

function summarizeToxicity(records: JsonRecord[], limit = 3): string {
  return records.slice(0, limit).map((record) => {
    const value = stringify(record.toxvalNumeric);
    const qualifier = stringify(record.qualifier);
    const units = stringify(record.toxvalUnits);
    const valuePhrase = value ? `${qualifier ?? ""}${value}${units ? ` ${units}` : ""}` : null;

    const pieces: string[] = [];

    const studyType = stringify(record.studyTypeOriginal ?? record.studyType);
    if (studyType) pieces.push(`Study type: ${studyType}.`);

    if (valuePhrase) pieces.push(`Toxicity value: ${valuePhrase}.`);

    const toxvalType = stringify(record.toxvalType);
    const toxvalDefinition = stringify(record.toxvalTypeDefinition);
    if (toxvalType) pieces.push(`Endpoint type: ${toxvalType}.${toxvalDefinition ? ` ${toxvalDefinition}` : ""}`);

    const species = stringify(record.speciesCommon ?? record.speciesOriginal);
    const strain = stringify(record.strain ?? record.strainOriginal);
    const sex = stringify(record.sex ?? record.sexOriginal);
    const generation = stringify(record.generation ?? record.generationOriginal);
    const lifestage = stringify(record.lifestage ?? record.lifestageOriginal);
    if (species) {
      const subjectDetails = [species, strain, sex, generation, lifestage].filter(Boolean).join("; ");
      pieces.push(`Subjects: ${subjectDetails}.`);
    }

    const route = stringify(record.exposureRoute ?? record.exposureRouteOriginal);
    const method = stringify(record.exposureMethod ?? record.exposureMethodOriginal);
    const exposureForm = stringify(record.exposureForm ?? record.exposureFormOriginal);
    if (route || method) {
      const exposureDetails = [route, method, exposureForm].filter(Boolean).join("; ");
      pieces.push(`Exposure: ${exposureDetails}.`);
    }

    const effect = stringify(record.toxicologicalEffectOriginal ?? record.toxicologicalEffect);
    if (effect && effect !== "-") pieces.push(`Effect: ${effect}.`);

    const year = stringify(record.year ?? record.originalYear);
    if (year) pieces.push(`Year: ${year}.`);

    const quality = stringify(record.quality);
    if (quality) pieces.push(`Quality: ${quality}.`);

    const source = stringify(record.source);
    if (source) pieces.push(`Source: ${source}.`);

    return pieces.join(" ");
  }).filter(Boolean).join(" | ");
}

function summarize(records: JsonRecord[], limit = 3) {
  return records.slice(0, limit).map((record) => Object.entries(record)
    .filter(([, value]) => value !== null && value !== undefined && value !== "" && typeof value !== "object")
    .slice(0, 8)
    .map(([key, value]) => `${key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").toLowerCase()}: ${String(value)}`)
    .join("; "))
    .filter(Boolean)
    .join(" | ");
}

export async function getCompToxSources(chemical: string): Promise<EvidenceSource[]> {
  const apiKey = process.env.CTX_API_KEY;
  if (!apiKey) return [];

  try {
    const matches = await fetchCtx<ChemicalSearchResult[]>(`${CTX_BASE}/chemical/search/equal/${encodeURIComponent(chemical)}`, apiKey);
    const match = matches[0];
    if (!match?.dtxsid) return [];

    const [toxicity, uses, volume] = await Promise.all([
      fetchCtx<JsonRecord[]>(`${CTX_BASE}/hazard/toxval/search/by-dtxsid/${match.dtxsid}`, apiKey).catch(() => []),
      fetchCtx<JsonRecord[]>(`${CTX_BASE}/exposure/ccd/puc/search/by-dtxsid/${match.dtxsid}`, apiKey).catch(() => []),
      fetchCtx<JsonRecord[]>(`${CTX_BASE}/exposure/ccd/production-volume/search/by-dtxsid/${match.dtxsid}`, apiKey).catch(() => []),
    ]);

    const name = match.preferredName || chemical;
    const url = `https://comptox.epa.gov/dashboard/chemical/details/${match.dtxsid}`;
    const sources: EvidenceSource[] = [];
    const toxicitySummary = summarizeToxicity(toxicity);
    const usesSummary = summarize(uses);
    const volumeSummary = summarize(volume);

    if (toxicitySummary) sources.push({ id: "COMPTOX-TOXICITY", provider: "EPA CompTox", title: `${name} toxicity values`, url, excerpt: toxicitySummary });
    if (usesSummary) sources.push({ id: "COMPTOX-EXPOSURE-USES", provider: "EPA CompTox", title: `${name} product-use exposure data`, url, excerpt: usesSummary });
    if (volumeSummary) sources.push({ id: "COMPTOX-EXPOSURE-VOLUME", provider: "EPA CompTox", title: `${name} production-volume exposure data`, url, excerpt: volumeSummary });
    return sources;
  } catch {
    return [];
  }
}
