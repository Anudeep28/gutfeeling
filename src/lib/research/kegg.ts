import type { EvidenceSource } from "./types";

const KEGG_DELAY_MS = 350; // KEGG recommends ~3 requests per second per client

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: { Accept: "text/plain" }, signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`KEGG returned status ${response.status}.`);
  return response.text();
}

function parseField(text: string, prefix: string): string | undefined {
  const lines = text.split("\n");
  const values: string[] = [];
  for (const line of lines) {
    if (line.startsWith(prefix)) {
      values.push(line.replace(new RegExp(`^${prefix}\\s*`), "").trim());
    } else if (values.length > 0 && line.startsWith(" ")) {
      values[values.length - 1] += " " + line.trim();
    } else if (values.length > 0) {
      break;
    }
  }
  return values.length > 0 ? values.join(" ") : undefined;
}

async function resolveKeggCompoundId(cid: number): Promise<string | null> {
  const text = await fetchText(`https://rest.kegg.jp/conv/compound/pubchem:${cid}`);
  const match = text.trim().match(/\tcpd:(C\d+)$/m);
  return match?.[1] || null;
}

async function fetchReactionIds(compoundId: string): Promise<string[]> {
  await sleep(KEGG_DELAY_MS);
  const text = await fetchText(`https://rest.kegg.jp/link/reaction/${compoundId}`);
  return text.trim().split("\n").filter(Boolean).map((line) => line.split("\t")[1]?.replace("rn:", "")).filter(Boolean);
}

async function fetchReactionDetail(reactionId: string): Promise<{ title: string; definition?: string; equation?: string; enzymes?: string[] } | null> {
  await sleep(KEGG_DELAY_MS);
  const text = await fetchText(`https://rest.kegg.jp/get/rn:${reactionId}`);
  const title = parseField(text, "NAME");
  const definition = parseField(text, "DEFINITION");
  const equation = parseField(text, "EQUATION");
  const enzymeLine = parseField(text, "ENZYME");

  if (!definition && !equation) return null;

  return {
    title: title || reactionId,
    definition,
    equation,
    enzymes: enzymeLine ? enzymeLine.split(/\s+/).filter(Boolean) : undefined,
  };
}

function formatExcerpt(detail: { title: string; definition?: string; equation?: string; enzymes?: string[] }): string {
  const parts = [`KEGG reaction: ${detail.title}`];
  if (detail.definition) parts.push(`Definition: ${detail.definition}`);
  if (detail.equation) parts.push(`Equation: ${detail.equation}`);
  if (detail.enzymes) parts.push(`Enzymes: ${detail.enzymes.join(", ")}`);
  return parts.join(" ").slice(0, 1800);
}

const MAX_REACTIONS = 4;

export async function getKeggReactionSources(cid: number): Promise<EvidenceSource[]> {
  try {
    const compoundId = await resolveKeggCompoundId(cid);
    if (!compoundId) return [];

    const reactionIds = await fetchReactionIds(compoundId);
    if (reactionIds.length === 0) return [];

    const sources: EvidenceSource[] = [];
    for (const reactionId of reactionIds.slice(0, MAX_REACTIONS)) {
      const detail = await fetchReactionDetail(reactionId);
      if (!detail) continue;
      sources.push({
        id: `KEGG-${sources.length + 1}`,
        provider: "KEGG",
        title: detail.title,
        url: `https://www.genome.jp/entry/rn:${reactionId}`,
        excerpt: formatExcerpt(detail),
      });
    }
    return sources;
  } catch {
    return [];
  }
}
