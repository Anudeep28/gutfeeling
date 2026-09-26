import type { EvidenceSource } from "./types";

export function getExamineReference(chemical: string): EvidenceSource {
  const query = encodeURIComponent(chemical);
  return {
    id: "EXAMINE-1",
    provider: "Examine.com",
    title: `Examine.com search for ${chemical}`,
    url: `https://examine.com/search/?q=${query}`,
    excerpt: `Examine.com provides independent, evidence-based supplement summaries. No structured data was retrieved for "${chemical}"; use the search link to find relevant human evidence, dosage, and safety information.`,
  };
}
