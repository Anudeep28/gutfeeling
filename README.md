# Molecular Table

An evidence-led food chemical research app. It resolves a compound through PubChem, retrieves relevant literature from Europe PMC and EFSA Journal metadata through Crossref, includes pathway and reaction data from Reactome, includes WHO/EU daily intake reference values, includes a human-readable Examine.com search reference, then asks DeepSeek to build a citation-linked causal report.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Add your PostgreSQL connection string to `DATABASE_URL`.
3. Set a strong random `JWT_SECRET` (at least 32 characters).
4. Add your DeepSeek API key to `DEEPSEEK_API_KEY` and your USDA key to `USDA_API_KEY`.
5. Optionally set `ADMIN_EMAIL` and `ADMIN_PASSWORD` to create an admin account on first request.
6. Run `npm run dev` and open `http://localhost:3000`.

## Authentication & usage limits

- Users must register or sign in to search.
- Each user is limited to 15 successful searches per UTC day.
- Searches that fail because evidence cannot be found (e.g., unknown chemical) are logged but do not count toward the limit.
- Admins can view registered users and their search history at `/admin`.

## Commands

- `npm run dev` — local development
- `npm test` — unit tests
- `npm run test:coverage` — coverage report
- `npm run lint` — ESLint
- `npm run build` — production build

## Evidence model

- **PubChem:** identity, formula, molecular weight, structure, synonyms, and compound descriptions.
- **Europe PMC:** abstracts for metabolism, toxicology, pharmacokinetics, and nutrition research.
- **EFSA Journal:** discoverable publication metadata returned by Crossref.
- **USDA FoodData Central:** real food occurrence, portion context, and nutrient profiles for nutrients and common food chemicals; gracefully skipped when no food match exists.
- **KEGG:** curated biochemical reactions, substrates, products, and enzyme annotations mapped from the PubChem CID; gracefully skipped when no pathway/reaction match exists.
- **Reactome:** curated human biological pathways and reactions via the Content Service search API; gracefully skipped when no match exists; no API key required.
- **WHO/EU DRI:** adult daily intake reference values (RDA/AI and upper limits) for common vitamins, minerals, and macronutrients; skipped when the queried chemical is not a covered nutrient.
- **Examine.com:** human-readable search reference for supplement evidence, dosage, and safety. No structured data is fetched because Examine.com does not offer a public API.
- **DeepSeek:** synthesis only. The prompt requires claims to cite retrieved source IDs and to distinguish established evidence from mechanistic inference.

This is a research and education tool, not a diagnostic system or a substitute for professional medical advice. Source availability and abstract-only retrieval limit what the report can establish.

Our sources of data
| Source                                | Data                                      | Cost                  |
| ---------------------------------------| -------------------------------------------| -----------------------|
| PubChem (already used)                | Identity, formula, synonyms, descriptions | Free                  |
| Europe PMC (already used)             | Literature abstracts                      | Free                  |
| Crossref/EFSA (already used)          | EFSA assessments                          | Free                  |
| USDA FDC (key ready)                  | Food occurrence, portions, nutrients      | Free with key         |
| KEGG                                  | Pathways, reactions, enzymes              | Free for academic use |
| Examine.com                           | Supplement reference link (search)        | Free (no public API)  |
| HMDB                                  | Human metabolite data                     | Free                  |
| Comptox / EPA DSSTox                  | Toxicity, exposure                        | Free                  |
| Food additives DBs (FDA EAFUS, JECFA) | Regulatory status                         | Free                  |
| Reactome                              | Human biological pathways and reactions   | Free                  |
| WHO/EU DRI                            | Adult daily intake references             | Free                  |


| Source               | Programmatic access                    | Account / API key needed?                                                                   | Notes                                                                                      |
| ----------------------| ----------------------------------------| ---------------------------------------------------------------------------------------------| --------------------------------------------------------------------------------------------|
| KEGG                 | REST API (rest.kegg.jp)                | No key, but academic/non-commercial terms                                                   | Already implemented in the app                                                             |
| Reactome             | Content Service REST API               | No — free, no authentication, OpenAPI docs                                                  | Implemented in the app                                                                     |
| FDA EAFUS            | openFDA API or downloadable data files | Recommended — free API key from openFDA; technically works without one at lower rate limits | Food-additive regulatory listings                                                          |
| EPA CompTox / DSSTox | CTX REST API                           | Yes — free, but you must email ccte_api@epa.gov to request a key                            | Toxicity/exposure data                                                                     |
| HMDB                 | XML endpoints / API                    | Yes — must email the HMDB team to request API access; also behind Cloudflare                | Human metabolite data                                                                      |
| JECFA                | No public API                          | N/A                                                                                         | Portal only; would require scraping or relying on third-party scraped data (not advisable) |