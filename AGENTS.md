# Project Notes

- Stack: Next.js App Router with TypeScript and npm.
- Run locally with `npm run dev`.
- Verify changes with `npm test`, `npm run lint`, and `npm run build`.
- `DEEPSEEK_API_KEY` must remain server-side and is configured in `.env.local`.
- PostgreSQL is used for users, sessions, and search history. `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` are required in `.env.local`. The schema is applied automatically on the first request.
- Search usage is limited to 15 successful searches per user per UTC day; failed searches are logged but not counted.
- Evidence integrations are PubChem PUG REST, Europe PMC REST, EFSA Journal metadata through Crossref, USDA FoodData Central, KEGG, Reactome, WHO/EU DRI reference values, and an Examine.com search reference link. The USDA API key is read from USDA_API_KEY in .env.local; when no food match exists, the source is gracefully skipped. EPA CompTox toxicity values and exposure indicators are queried through the CTX APIs using CTX_API_KEY and gracefully skipped when unavailable. KEGG is queried via PubChem CID mapping and returns curated reaction equations, substrates, products, and enzyme annotations; it is gracefully skipped when no mapping or reaction exists. Reactome is queried via the Content Service search API for human pathways and reactions; it is gracefully skipped when no match exists and requires no API key. WHO/EU DRI values are resolved from a static reference table for common vitamins, minerals, and macronutrients; the source is skipped when the queried chemical has no matching nutrient. Examine.com has no public API, so it is added as a human-readable citation link only; no data is fetched automatically.
- Reports are research aids, not medical advice; keep citations and uncertainty visible.
