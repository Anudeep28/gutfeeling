import type { EvidenceSource } from "./types";

const REACTOME_BASE = "https://reactome.org/ContentService";

type ReactomeEntry = {
  dbId: string;
  stId: string;
  name: string;
  type: string;
  species?: string[];
  summation?: string;
  isDisease?: boolean;
};

type ReactomeSearchResponse = {
  results?: Array<{ entries?: ReactomeEntry[]; typeName?: string }>;
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`Reactome returned status ${response.status}.`);
  return response.json() as Promise<T>;
}

function buildExcerpt(entry: ReactomeEntry): string {
  const parts = [`Type: ${entry.type}`];
  if (entry.species?.length) parts.push(`Species: ${entry.species.join(", ")}`);
  if (entry.summation) parts.push(entry.summation.replace(/\s+/g, " ").trim());
  return parts.join(" | ");
}

export async function getReactomeSources(chemical: string): Promise<EvidenceSource[]> {
  try {
    const url = new URL(`${REACTOME_BASE}/search/query`);
    url.search = new URLSearchParams({
      query: chemical,
      types: "SmallMolecule,Reaction,Pathway",
      rows: "10",
    }).toString();

    const data = await fetchJson<ReactomeSearchResponse>(url.toString());

    const entries = (data.results || [])
      .flatMap((group) => group.entries || [])
      .filter((entry) => entry.stId && !entry.isDisease);

    const humanFirst = entries.sort((a, b) => {
      const aHuman = a.species?.includes("Homo sapiens") ? 1 : 0;
      const bHuman = b.species?.includes("Homo sapiens") ? 1 : 0;
      return bHuman - aHuman;
    });

    return humanFirst.slice(0, 5).map((entry, index) => ({
      id: `REACTOME-${index + 1}`,
      provider: "Reactome",
      title: entry.name || "Reactome entry",
      url: `https://reactome.org/content/detail/${entry.stId}`,
      excerpt: buildExcerpt(entry),
    }));
  } catch {
    return [];
  }
}
