import { getDriSources } from "./dri";
import { getExamineReference } from "./examine";
import { getKeggReactionSources } from "./kegg";
import { getReactomeSources } from "./reactome";
import { getUsdaFoodSources } from "./usda";
import type { ChemicalIdentity, EvidenceBundle, EvidenceSource } from "./types";

const PUBCHEM = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`Evidence source returned status ${response.status}.`);
  return response.json() as Promise<T>;
}

async function getPubChem(chemical: string) {
  const name = encodeURIComponent(chemical);
  const [properties, descriptions, synonyms] = await Promise.all([
    fetchJson<{ PropertyTable: { Properties: Array<{ CID: number; Title: string; MolecularFormula?: string; MolecularWeight?: string; ConnectivitySMILES?: string }> } }>(`${PUBCHEM}/compound/name/${name}/property/Title,MolecularFormula,MolecularWeight,ConnectivitySMILES/JSON`),
    fetchJson<{ InformationList: { Information: Array<{ Description?: string; Title?: string }> } }>(`${PUBCHEM}/compound/name/${name}/description/JSON`),
    fetchJson<{ InformationList: { Information: Array<{ Synonym?: string[] }> } }>(`${PUBCHEM}/compound/name/${name}/synonyms/JSON`),
  ]);
  const property = properties.PropertyTable.Properties[0];
  if (!property) throw new Error("Chemical not found in PubChem.");
  const identity: ChemicalIdentity = {
    cid: property.CID,
    title: property.Title || chemical,
    molecularFormula: property.MolecularFormula,
    molecularWeight: property.MolecularWeight,
    canonicalSmiles: property.ConnectivitySMILES,
    synonyms: synonyms.InformationList.Information[0]?.Synonym?.slice(0, 8) || [],
  };
  const sources: EvidenceSource[] = descriptions.InformationList.Information.slice(0, 3).map((item, index) => ({
    id: `PUBCHEM-${index + 1}`,
    provider: "PubChem",
    title: item.Title || identity.title,
    url: `https://pubchem.ncbi.nlm.nih.gov/compound/${property.CID}`,
    excerpt: item.Description || "PubChem compound record.",
  }));
  return { identity, sources };
}

async function getEuropePmc(chemical: string): Promise<EvidenceSource[]> {
  const url = new URL("https://www.ebi.ac.uk/europepmc/webservices/rest/search");
  url.search = new URLSearchParams({ query: `\"${chemical}\" AND (metabolism OR toxicology OR pharmacokinetics OR nutrition)`, format: "json", resultType: "core", pageSize: "6" }).toString();
  const data = await fetchJson<{ resultList?: { result?: Array<{ id?: string; source?: string; title?: string; abstractText?: string; authorString?: string; pubYear?: string; doi?: string }> } }>(url.toString());
  return (data.resultList?.result || []).filter((item) => item.abstractText).map((item, index) => ({
    id: `EPMC-${index + 1}`,
    provider: "Europe PMC",
    title: item.title || "Untitled publication",
    url: item.doi ? `https://doi.org/${item.doi}` : `https://europepmc.org/article/${item.source}/${item.id}`,
    excerpt: item.abstractText!,
    authors: item.authorString,
    year: item.pubYear,
  }));
}

async function getEfsa(chemical: string): Promise<EvidenceSource[]> {
  const url = new URL("https://api.crossref.org/works");
  url.search = new URLSearchParams({ "query.bibliographic": chemical, "query.publisher-name": "European Food Safety Authority", rows: "4", select: "DOI,title,abstract,published,publisher" }).toString();
  const data = await fetchJson<{ message?: { items?: Array<{ DOI?: string; title?: string[]; abstract?: string; publisher?: string; published?: { "date-parts"?: number[][] } }> } }>(url.toString());
  return (data.message?.items || []).filter((item) => item.publisher?.toLowerCase().includes("food safety")).map((item, index) => ({
    id: `EFSA-${index + 1}`,
    provider: "EFSA Journal",
    title: item.title?.[0] || "EFSA publication",
    url: item.DOI ? `https://doi.org/${item.DOI}` : "https://www.efsa.europa.eu/en/publications",
    excerpt: (item.abstract || "EFSA publication metadata; consult the linked assessment for conclusions.").replace(/<[^>]+>/g, " "),
    year: String(item.published?.["date-parts"]?.[0]?.[0] || ""),
  }));
}

export async function gatherEvidence(chemical: string, foodSource?: EvidenceSource, foodQuery?: string): Promise<EvidenceBundle> {
  const usdaPromise = foodSource ? Promise.resolve([foodSource]) : getUsdaFoodSources(chemical).catch(() => []);
  const pubchem = await getPubChem(chemical);
  const [literature, efsa, usda, kegg, reactome] = await Promise.all([
    getEuropePmc(pubchem.identity.title).catch(() => []),
    getEfsa(pubchem.identity.title).catch(() => []),
    usdaPromise,
    getKeggReactionSources(pubchem.identity.cid).catch(() => []),
    getReactomeSources(pubchem.identity.title).catch(() => []),
  ]);
  const dri = getDriSources(pubchem.identity.title);
  return {
    chemical,
    identity: pubchem.identity,
    sources: [...pubchem.sources, ...literature, ...efsa, ...usda, ...kegg, ...reactome, ...dri, getExamineReference(chemical)],
    resolvedFromFood: foodQuery,
  };
}
