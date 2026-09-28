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

function readableKey(key: string) {
  return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").toLowerCase();
}

function summarize(records: JsonRecord[], limit = 3) {
  return records.slice(0, limit).map((record) => {
    const entries = Object.entries(record)
      .filter(([, value]) => value !== null && value !== undefined && value !== "" && typeof value !== "object")
      .filter(([key]) => key !== "toxvalNumeric" && key !== "toxvalUnits")
      .slice(0, 8)
      .map(([key, value]) => `${readableKey(key)}: ${String(value)}`);
    if (record.toxvalNumeric !== undefined) entries.push(`toxicity value: ${String(record.toxvalNumeric)}${record.toxvalUnits ? ` ${String(record.toxvalUnits)}` : ""}`);
    return entries.join("; ");
  }).filter(Boolean).join(" | ");
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
    const toxicitySummary = summarize(toxicity);
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
