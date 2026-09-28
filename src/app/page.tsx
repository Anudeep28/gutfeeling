"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import type { EvidenceSource, ReportResponse, ResearchResponse, ReactionEntry, ReportSection, UsdaFoodDiscovery } from "@/lib/research/types";

const examples = ["Caffeine", "Orange fruit", "Acrylamide", "Curcumin"];
const DAILY_SEARCH_LIMIT = 15;

export default function Home() {
  const [chemical, setChemical] = useState("");
  const [result, setResult] = useState<ReportResponse | null>(null);
  const [selection, setSelection] = useState<UsdaFoodDiscovery | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [remaining, setRemaining] = useState(DAILY_SEARCH_LIMIT);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          window.location.href = "/login";
          return;
        }
        const payload = await response.json();
        setUser(payload.data.user);
        setRemaining(payload.data.remaining);
      } catch {
        window.location.href = "/login";
      } finally {
        setAuthLoading(false);
      }
    }
    void fetchSession();
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  async function requestResearch(nutrient?: string, direct = false) {
    if (!chemical.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chemical, nutrient, direct }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Research failed.");
      const data = payload.data as ResearchResponse;
      if ("selection" in data) {
        setSelection(data.selection);
      } else {
        setSelection(null);
        setResult(data);
        setRemaining((r) => Math.max(0, r - 1));
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Research failed.");
    } finally {
      setLoading(false);
    }
  }

  function research(event: FormEvent) {
    event.preventDefault();
    setSelection(null);
    void requestResearch();
  }

  if (authLoading) {
    return <main><p className="loading-auth">Loading…</p></main>;
  }

  return (
    <main>
      <header className="nav">
        <a className="brand" href="#top">MOLECULAR TABLE <span>β</span></a>
        <div className="nav-actions">
          <a href="#method">Method</a>
          <span className="user-pill">{user?.email}</span>
          <span className="limit-pill">{remaining} / {DAILY_SEARCH_LIMIT} searches today</span>
          {user?.role === "admin" && <Link href="/admin">Admin</Link>}
          <button className="logout" onClick={() => void logout()}>Logout</button>
        </div>
      </header>
      <section className="hero" id="top">
        <p className="eyebrow">Evidence-led food chemistry</p>
        <h1>From molecule<br />to <em>meaning.</em></h1>
        <p className="intro">Enter a food, nutrient, or chemical. Foods are matched in USDA first so you can choose a measured nutrient; individual compounds continue through the scientific evidence sources even when USDA has no match.</p>
        <form onSubmit={research}>
          <label htmlFor="chemical">Food, nutrient, or chemical name</label>
          <div className="search"><input id="chemical" value={chemical} onChange={(event) => setChemical(event.target.value)} placeholder="e.g. caffeine, orange fruit, sodium benzoate" maxLength={120} /><button disabled={loading}>{loading ? "Researching…" : "Build report →"}</button></div>
        </form>
        <div className="examples"><span>Try</span>{examples.map((example) => <button key={example} onClick={() => setChemical(example)}>{example}</button>)}</div>
        {error && <p className="error" role="alert">{error}</p>}
      </section>

      {selection && !loading && <section className="nutrient-picker">
        <p className="eyebrow">USDA FoodData Central match</p>
        <h2>What would you like to research?</h2>
        <div className="food-match"><span>You searched for</span><b>“{chemical}”</b><span>USDA matched</span><b>{selection.description}</b></div>
        <div className="research-choice">
          <h3>Research your original input</h3>
          <p>Build an evidence report about the food, nutrient, or chemical you entered.</p>
          <button className="direct-research" onClick={() => void requestResearch(undefined, true)}>Build a report about “{chemical}” →</button>
        </div>
        <div className="choice-divider"><span>or</span></div>
        <div className="research-choice">
          <h3>Research a nutrient in this food</h3>
          <p>Choose any measured nutrient below to build its detailed evidence report. Amounts are shown per 100 g.</p>
        </div>
        <div className="nutrient-grid">{selection.nutrients.map((nutrient) => <button key={nutrient.id} onClick={() => void requestResearch(nutrient.name)}><b>{nutrient.name}</b><span>{nutrient.amount} {nutrient.unit} per 100 g</span><strong>Build {nutrient.name} report →</strong></button>)}</div>
      </section>}

      {!result && !selection && !loading && <section className="framework" id="method"><p className="eyebrow">The reasoning chain</p><h2>A chemical is not simply<br />“good” or “bad.”</h2><div className="steps">{["Identity", "Exposure", "ADME", "Reactions", "Short-term", "Long-term"].map((step, index) => <div key={step}><b>0{index + 1}</b><span>{step}</span></div>)}</div><p className="method-copy">Impact emerges from structure × dose × route × duration × susceptibility. The report follows that chain and marks where evidence ends and inference begins.</p></section>}

      {loading && <section className="loading" aria-live="polite"><div /><p>Collecting records, reading abstracts, and building the causal chain…</p></section>}

      {result && <ReportView data={result} />}
      <footer>
        <div>Built by Eneru · Powered by PubChem, Europe PMC, EFSA, USDA FoodData Central, KEGG, Reactome, WHO/EU DRI, Examine.com, and DeepSeek</div>
        <div>Research aid only · Not medical advice · Verify decisions with qualified professionals</div>
      </footer>
    </main>
  );
}

function ReportView({ data }: { data: ReportResponse }) {
  const { identity, sources, resolvedFromFood } = data.evidence;
  const { report } = data;
  const foodSources = sources.filter((source) => source.provider === "USDA");

  return <section className="report">
    <div className="report-head"><div><p className="eyebrow">Research dossier</p><h2>{report.title}</h2>{resolvedFromFood && <p className="resolved-from">Resolved from {resolvedFromFood} to {identity.title}</p>}<p className="lede">{report.plainLanguageSummary}</p></div><div className="formula"><span>{identity.molecularFormula || "Formula unavailable"}</span><small>{identity.molecularWeight ? `${identity.molecularWeight} g/mol` : `PubChem CID ${identity.cid}`}</small></div></div>
    <div className="verdict"><span>Evidence signal</span><b>{report.evidenceVerdict}</b><p>Based on {sources.length} retrieved records. This rating describes the supplied evidence, not safety.</p></div>

    <div className="section-list">
      <p className="eyebrow">From intake to elimination</p>
      {report.intakeTimeline.map((stage, index) => <StageArticle key={`${stage.heading}-${index}`} stage={stage} index={index} />)}
    </div>

    <div className="split">
      <EffectPanel title="Short-term effects" section={report.shortTermEffects} />
      <EffectPanel title="Long-term effects" section={report.longTermEffects} />
    </div>

    {report.reactions.length > 0 && <div className="section-list">
      <p className="eyebrow">Biochemical reactions</p>
      {report.reactions.map((reaction, index) => <ReactionArticle key={index} reaction={reaction} index={index} />)}
    </div>}

    <div className="section-list">{report.sections.map((section, index) => <article key={`${section.heading}-${index}`}><div className="number">{String(index + 1).padStart(2, "0")}</div><div><h3>{section.heading}</h3><p>{section.summary}</p><ul>{section.details.map((detail) => <li key={detail}>{detail}</li>)}</ul><div className="citations">{section.citations.map((citation) => <span key={citation}>[{citation}]</span>)}</div></div></article>)}</div>

    <div className="split"><div><p className="eyebrow">Practical context</p><ul>{report.practicalContext.map((item) => <li key={item}>{item}</li>)}</ul></div><div><p className="eyebrow">Uncertainty</p><ul>{report.keyUncertainties.map((item) => <li key={item}>{item}</li>)}</ul></div></div>

    {foodSources.length > 0 && <div className="sources"><p className="eyebrow">Food occurrence (USDA)</p>{foodSources.map((source) => <EvidenceLink key={source.id} source={source} />)}</div>}

    <div className="sources"><p className="eyebrow">Evidence ledger</p>{sources.filter((source) => source.provider !== "USDA").map((source) => <EvidenceLink key={source.id} source={source} />)}</div>
    <p className="disclaimer">{report.disclaimer}</p>
  </section>;
}

function StageArticle({ stage, index }: { stage: ReportSection; index: number }) {
  return <article><div className="number">{String(index + 1).padStart(2, "0")}</div><div><h3>{stage.heading}</h3><p>{stage.summary}</p><ul>{stage.details.map((detail) => <li key={detail}>{detail}</li>)}</ul><div className="citations">{stage.citations.map((citation) => <span key={citation}>[{citation}]</span>)}</div></div></article>;
}

function EffectPanel({ title, section }: { title: string; section: ReportSection }) {
  return <div><p className="eyebrow">{title}</p><h3>{section.heading}</h3><p>{section.summary}</p><ul>{section.details.map((detail) => <li key={detail}>{detail}</li>)}</ul><div className="citations">{section.citations.map((citation) => <span key={citation}>[{citation}]</span>)}</div></div>;
}

function ReactionArticle({ reaction, index }: { reaction: ReactionEntry; index: number }) {
  return <article><div className="number">{String(index + 1).padStart(2, "0")}</div><div><h3>{reaction.summary}</h3><p><b>Reactants:</b> {reaction.reactants.join(", ") || "Not specified"}</p><p><b>Products:</b> {reaction.products.join(", ") || "Not specified"}</p>{reaction.enzymes && reaction.enzymes.length > 0 && <p><b>Enzymes / catalysts:</b> {reaction.enzymes.join(", ")}</p>}<div className="citations">{reaction.citations.map((citation) => <span key={citation}>[{citation}]</span>)}</div></div></article>;
}

function EvidenceLink({ source }: { source: EvidenceSource }) {
  return <a href={source.url} target="_blank" rel="noreferrer"><b>[{source.id}] {source.title}</b><span>{source.provider}{source.year ? ` · ${source.year}` : ""}</span></a>;
}
