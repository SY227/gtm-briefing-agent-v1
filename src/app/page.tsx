"use client";

import { useEffect, useMemo, useState } from "react";
import { MemoView } from "@/components/memo-view";
import { BriefInput, GTMBrief, GenerateResponse, QuickMode } from "@/lib/types";

const modes: QuickMode[] = [
  "Sales Battlecard",
  "Founder Brief",
  "Product Marketing Comparison",
  "Executive Market Snapshot",
  "Investor-style Competitive Memo",
];

const initialInput: BriefInput = {
  primaryCompany: "",
  competitors: [],
  objective: "Executive market snapshot",
  audience: "Executive",
  trustedUrls: [],
  governance: {
    sourceClassFilters: {
      officialCompany: true,
      officialCompetitor: true,
      news: true,
      analystResearch: true,
      regulatoryFilings: true,
      forumsBlogs: false,
    },
    excludeForumsBlogs: true,
    maxSearchResults: 40,
    weights: {
      official: 1,
      news: 0.9,
      analyst: 0.75,
      filings: 0.85,
    },
  },
};

export default function Page() {
  const [input, setInput] = useState<BriefInput>(initialInput);
  const [competitorDraft, setCompetitorDraft] = useState("");
  const [urlDraft, setUrlDraft] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [governanceOpen, setGovernanceOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [notices, setNotices] = useState<string[]>([]);
  const [brief, setBrief] = useState<GTMBrief | null>(null);
  const [history, setHistory] = useState<GTMBrief[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("ci-brief-history-v2");
    if (raw) setHistory(JSON.parse(raw));
  }, []);

  const canGenerate = useMemo(() => input.primaryCompany.trim().length > 1, [input.primaryCompany]);

  async function runGenerate() {
    setLoading(true);
    setNotices([]);
    setProgress([
      "Normalizing request",
      "Searching latest public sources",
      "Applying source governance",
      "Collecting weighted evidence",
      "Auditing freshness",
      "Synthesizing memo",
    ]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json()) as GenerateResponse;
      setBrief(data.brief);

      const previous = history.find((h) => h.company.toLowerCase() === data.brief.company.toLowerCase());
      const deltaNotice = previous
        ? `Since last run (${new Date(previous.asOf).toLocaleDateString()}): what-changed signals ${previous.whatChanged.length} → ${data.brief.whatChanged.length}.`
        : undefined;

      const nextNotices = [...(data.notices || []), ...(deltaNotice ? [deltaNotice] : [])];
      setNotices(nextNotices);
      if (data.generationError) setNotices((n) => [...n, `Generation issue: ${data.generationError}`]);

      const nextHistory = [data.brief, ...history.filter((h) => h.id !== data.brief.id)].slice(0, 20);
      setHistory(nextHistory);
      localStorage.setItem("ci-brief-history-v2", JSON.stringify(nextHistory));

      setProgress(["Memo ready"]);
    } catch {
      setNotices(["Request failed before server processing. Please retry."]);
      setProgress(["Request failed"]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-5xl px-4 pb-6 pt-10 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Competitive Intelligence / GTM Briefing Agent</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Institutional-grade source governance for competitive intelligence memos.</h1>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm"><span className="mb-1 block font-medium">Primary company</span><input value={input.primaryCompany} onChange={(e) => setInput((s) => ({ ...s, primaryCompany: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Walmart" /></label>
            <label className="text-sm"><span className="mb-1 block font-medium">Objective / use case</span><input value={input.objective} onChange={(e) => setInput((s) => ({ ...s, objective: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Sales prep / strategy review / investor memo" /></label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm"><span className="mb-1 block font-medium">Audience</span><select value={input.audience} onChange={(e) => setInput((s) => ({ ...s, audience: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2">{["Sales team", "Founder", "Product marketing", "Executive", "Investor"].map((a) => <option key={a}>{a}</option>)}</select></label>
            <label className="text-sm"><span className="mb-1 block font-medium">Brief type</span><select value={input.quickMode || modes[3]} onChange={(e) => setInput((s) => ({ ...s, quickMode: e.target.value as QuickMode }))} className="w-full rounded-lg border border-slate-300 px-3 py-2">{modes.map((m) => <option key={m}>{m}</option>)}</select></label>
          </div>

          <div className="mt-4">
            <p className="mb-1 text-sm font-medium">Competitors (optional)</p>
            <div className="flex gap-2">
              <input value={competitorDraft} onChange={(e) => setCompetitorDraft(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Target, Costco" />
              <button onClick={() => { if (!competitorDraft.trim() || input.competitors.length >= 5) return; setInput((s) => ({ ...s, competitors: [...s.competitors, competitorDraft.trim()] })); setCompetitorDraft(""); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Add</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">{input.competitors.map((c) => <button key={c} onClick={() => setInput((s) => ({ ...s, competitors: s.competitors.filter((x) => x !== c) }))} className="rounded-full border border-slate-300 px-3 py-1 text-xs">{c} ×</button>)}</div>
          </div>

          <button onClick={() => setAdvanced((s) => !s)} className="mt-4 text-sm font-medium text-blue-700 hover:underline">{advanced ? "Hide advanced inputs" : "Show advanced inputs"}</button>
          {advanced && (
            <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
              <label className="block text-sm"><span className="mb-1 block font-medium">Company website (optional)</span><input value={input.companyWebsite || ""} onChange={(e) => setInput((s) => ({ ...s, companyWebsite: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="https://corporate.walmart.com" /></label>
              <label className="block text-sm"><span className="mb-1 block font-medium">Competitor websites (comma-separated)</span><input value={(input.competitorWebsites || []).join(", ")} onChange={(e) => setInput((s) => ({ ...s, competitorWebsites: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="https://www.target.com, https://www.costco.com" /></label>
              <div>
                <p className="mb-1 text-sm font-medium">Trusted URLs</p>
                <div className="flex gap-2">
                  <input value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="https://..." />
                  <button onClick={() => { if (!urlDraft.trim()) return; setInput((s) => ({ ...s, trustedUrls: [...(s.trustedUrls || []), urlDraft.trim()] })); setUrlDraft(""); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Add</button>
                </div>
                <div className="mt-2 space-y-1">{(input.trustedUrls || []).map((u) => <button key={u} onClick={() => setInput((s) => ({ ...s, trustedUrls: (s.trustedUrls || []).filter((x) => x !== u) }))} className="block w-full rounded border border-slate-200 px-2 py-1 text-left text-xs text-slate-700">{u} ×</button>)}</div>
              </div>
              <label className="block text-sm"><span className="mb-1 block font-medium">Notes / hypotheses</span><textarea value={input.notes || ""} onChange={(e) => setInput((s) => ({ ...s, notes: e.target.value }))} rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            </div>
          )}

          <button onClick={() => setGovernanceOpen((s) => !s)} className="mt-4 text-sm font-medium text-blue-700 hover:underline">{governanceOpen ? "Hide source governance panel" : "Show source governance panel"}</button>
          {governanceOpen && input.governance && (
            <div className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Source governance</p>
              <div className="grid gap-2 sm:grid-cols-2 text-sm">
                {[
                  ["officialCompany", "Official company pages"],
                  ["officialCompetitor", "Official competitor pages"],
                  ["news", "News sources"],
                  ["analystResearch", "Analyst/research sources"],
                  ["regulatoryFilings", "Regulatory filings"],
                  ["forumsBlogs", "Forums/blogs"],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={input.governance!.sourceClassFilters[key as keyof typeof input.governance.sourceClassFilters]}
                      onChange={(e) => setInput((s) => ({ ...s, governance: { ...s.governance!, sourceClassFilters: { ...s.governance!.sourceClassFilters, [key]: e.target.checked } } }))}
                    />
                    {label}
                  </label>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={input.governance.excludeForumsBlogs} onChange={(e) => setInput((s) => ({ ...s, governance: { ...s.governance!, excludeForumsBlogs: e.target.checked } }))} />
                Exclude forums/blogs even if discovered via search
              </label>
              <label className="block text-sm">
                <span className="mb-1 block">Max search results: {input.governance.maxSearchResults}</span>
                <input type="range" min={10} max={80} step={5} value={input.governance.maxSearchResults} onChange={(e) => setInput((s) => ({ ...s, governance: { ...s.governance!, maxSearchResults: Number(e.target.value) } }))} className="w-full" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <label>Official weight: {input.governance.weights.official.toFixed(2)}<input type="range" min={0} max={1.5} step={0.05} value={input.governance.weights.official} onChange={(e) => setInput((s) => ({ ...s, governance: { ...s.governance!, weights: { ...s.governance!.weights, official: Number(e.target.value) } } }))} className="w-full" /></label>
                <label>News weight: {input.governance.weights.news.toFixed(2)}<input type="range" min={0} max={1.5} step={0.05} value={input.governance.weights.news} onChange={(e) => setInput((s) => ({ ...s, governance: { ...s.governance!, weights: { ...s.governance!.weights, news: Number(e.target.value) } } }))} className="w-full" /></label>
                <label>Analyst weight: {input.governance.weights.analyst.toFixed(2)}<input type="range" min={0} max={1.5} step={0.05} value={input.governance.weights.analyst} onChange={(e) => setInput((s) => ({ ...s, governance: { ...s.governance!, weights: { ...s.governance!.weights, analyst: Number(e.target.value) } } }))} className="w-full" /></label>
                <label>Filings weight: {input.governance.weights.filings.toFixed(2)}<input type="range" min={0} max={1.5} step={0.05} value={input.governance.weights.filings} onChange={(e) => setInput((s) => ({ ...s, governance: { ...s.governance!, weights: { ...s.governance!.weights, filings: Number(e.target.value) } } }))} className="w-full" /></label>
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button disabled={loading || !canGenerate} onClick={runGenerate} className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{loading ? "Generating memo..." : "Generate briefing memo"}</button>
          </div>

          {(progress.length > 0 || notices.length > 0) && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              {progress.map((p, i) => <div key={i}>• {p}</div>)}
              {notices.map((n, i) => <div key={`n-${i}`} className="mt-1 text-amber-800">Note: {n}</div>)}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {brief ? <MemoView brief={brief} /> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">Run a company query to generate a live memo from current public sources.</div>}
      </section>
    </main>
  );
}
