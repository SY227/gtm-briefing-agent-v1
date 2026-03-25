"use client";

import { useMemo, useState } from "react";
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
};

export default function Page() {
  const [input, setInput] = useState<BriefInput>(initialInput);
  const [competitorDraft, setCompetitorDraft] = useState("");
  const [urlDraft, setUrlDraft] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [notices, setNotices] = useState<string[]>([]);
  const [brief, setBrief] = useState<GTMBrief | null>(null);

  const canGenerate = useMemo(() => input.primaryCompany.trim().length > 1, [input.primaryCompany]);

  async function runGenerate() {
    setLoading(true);
    setNotices([]);
    setProgress([
      "Normalizing request",
      "Searching latest public sources",
      "Collecting evidence from company, competitor, and news pages",
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
      setNotices(data.notices || []);
      if (data.generationError) setNotices((n) => [...n, `Generation issue: ${data.generationError}`]);
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
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Source-backed strategy memo generation for operators and GTM leaders.</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">Generate an executive-ready competitive briefing using broad public web search + official sources, with explicit freshness checks and confidence notes.</p>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium">Primary company</span>
              <input value={input.primaryCompany} onChange={(e) => setInput((s) => ({ ...s, primaryCompany: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Walmart" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Objective / use case</span>
              <input value={input.objective} onChange={(e) => setInput((s) => ({ ...s, objective: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Sales prep / strategy review / investor memo" />
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium">Audience</span>
              <select value={input.audience} onChange={(e) => setInput((s) => ({ ...s, audience: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2">
                {["Sales team", "Founder", "Product marketing", "Executive", "Investor"].map((a) => <option key={a}>{a}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Brief type</span>
              <select value={input.quickMode || modes[3]} onChange={(e) => setInput((s) => ({ ...s, quickMode: e.target.value as QuickMode }))} className="w-full rounded-lg border border-slate-300 px-3 py-2">
                {modes.map((m) => <option key={m}>{m}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-4">
            <p className="mb-1 text-sm font-medium">Competitors (optional)</p>
            <div className="flex gap-2">
              <input value={competitorDraft} onChange={(e) => setCompetitorDraft(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Target, Costco" />
              <button onClick={() => {
                if (!competitorDraft.trim() || input.competitors.length >= 5) return;
                setInput((s) => ({ ...s, competitors: [...s.competitors, competitorDraft.trim()] }));
                setCompetitorDraft("");
              }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Add</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">{input.competitors.map((c) => <button key={c} onClick={() => setInput((s) => ({ ...s, competitors: s.competitors.filter((x) => x !== c) }))} className="rounded-full border border-slate-300 px-3 py-1 text-xs">{c} ×</button>)}</div>
          </div>

          <button onClick={() => setAdvanced((s) => !s)} className="mt-4 text-sm font-medium text-blue-700 hover:underline">{advanced ? "Hide advanced inputs" : "Show advanced inputs"}</button>

          {advanced && (
            <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Company website (optional)</span>
                <input value={input.companyWebsite || ""} onChange={(e) => setInput((s) => ({ ...s, companyWebsite: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="https://corporate.walmart.com" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Competitor websites (comma-separated)</span>
                <input value={(input.competitorWebsites || []).join(", ")} onChange={(e) => setInput((s) => ({ ...s, competitorWebsites: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="https://www.target.com, https://www.costco.com" />
              </label>
              <div>
                <p className="mb-1 text-sm font-medium">Trusted URLs</p>
                <div className="flex gap-2">
                  <input value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="https://..." />
                  <button onClick={() => {
                    if (!urlDraft.trim()) return;
                    setInput((s) => ({ ...s, trustedUrls: [...(s.trustedUrls || []), urlDraft.trim()] }));
                    setUrlDraft("");
                  }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Add</button>
                </div>
                <div className="mt-2 space-y-1">{(input.trustedUrls || []).map((u) => <button key={u} onClick={() => setInput((s) => ({ ...s, trustedUrls: (s.trustedUrls || []).filter((x) => x !== u) }))} className="block w-full rounded border border-slate-200 px-2 py-1 text-left text-xs text-slate-700">{u} ×</button>)}</div>
              </div>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Notes / hypotheses</span>
                <textarea value={input.notes || ""} onChange={(e) => setInput((s) => ({ ...s, notes: e.target.value }))} rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              </label>
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

      <section className="mx-auto max-w-5xl px-4 pb-12 sm:px-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-800">Methodology (compact)</p>
          <p className="mt-1">The agent searches broad public web/news sources, prioritizes trusted URLs, probes official company/competitor pages, audits evidence freshness, and separates observed evidence from inferred conclusions.</p>
        </div>
      </section>
    </main>
  );
}
