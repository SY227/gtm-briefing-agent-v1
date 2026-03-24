"use client";

import { useEffect, useMemo, useState } from "react";
import { BriefView } from "@/components/brief-view";
import { SiteHeader } from "@/components/site-header";
import { sampleBriefs } from "@/lib/sample-data";
import { BriefInput, GTMBrief, QuickMode } from "@/lib/types";

const quickModes: QuickMode[] = [
  "Sales Battlecard",
  "Founder Brief",
  "Product Marketing Comparison",
  "Executive Market Snapshot",
  "Investor-style Competitive Memo",
];

const initialInput: BriefInput = {
  primaryCompany: "",
  competitors: [],
  objective: "Sales prep",
  audience: "Sales team",
  trustedUrls: [],
};

export default function AppPage() {
  const [input, setInput] = useState<BriefInput>(initialInput);
  const [competitorDraft, setCompetitorDraft] = useState("");
  const [urlDraft, setUrlDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [brief, setBrief] = useState<GTMBrief | null>(null);
  const [history, setHistory] = useState<GTMBrief[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("gtm-brief-history-v1");
    if (raw) setHistory(JSON.parse(raw));
  }, []);

  const saveToHistory = (item: GTMBrief) => {
    const next = [item, ...history.filter((h) => h.id !== item.id)].slice(0, 12);
    setHistory(next);
    localStorage.setItem("gtm-brief-history-v1", JSON.stringify(next));
  };

  const canGenerate = useMemo(() => input.primaryCompany.trim().length > 1, [input.primaryCompany]);

  async function generateReport() {
    setLoading(true);
    setProgress(["Planning analysis", "Gathering evidence", "Synthesizing GTM briefing"]);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error("Failed to generate brief");
      const data = (await response.json()) as { brief: GTMBrief };
      setBrief(data.brief);
      saveToHistory(data.brief);
      setProgress(["Completed"]);
    } catch {
      const fallback = sampleBriefs[0];
      setBrief({ ...fallback, id: `demo-${Date.now()}`, company: input.primaryCompany || fallback.company, competitors: input.competitors.length ? input.competitors : fallback.competitors });
      setProgress(["Gemini unavailable: loaded polished demo brief"]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[340px_1fr] lg:px-8">
        <aside className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:h-fit">
          <div>
            <h1 className="text-xl font-semibold">Build a briefing</h1>
            <p className="mt-1 text-sm text-slate-600">Generate a GTM-ready report using public signals and provided URLs.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Quick Mode</label>
            <div className="flex flex-wrap gap-2">
              {quickModes.map((mode) => (
                <button key={mode} onClick={() => setInput((s) => ({ ...s, quickMode: mode }))} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${input.quickMode === mode ? "bg-blue-600 text-white" : "border border-slate-300 text-slate-700"}`}>
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Primary company</span>
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={input.primaryCompany} onChange={(e) => setInput({ ...input, primaryCompany: e.target.value })} placeholder="Example: HubSpot" />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Company website (optional)</span>
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={input.companyWebsite || ""} onChange={(e) => setInput({ ...input, companyWebsite: e.target.value })} placeholder="https://..." />
          </label>

          <div className="space-y-2">
            <p className="text-sm font-medium">Competitors (up to 5)</p>
            <div className="flex gap-2">
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={competitorDraft} onChange={(e) => setCompetitorDraft(e.target.value)} placeholder="Add competitor" />
              <button onClick={() => {
                if (!competitorDraft.trim() || input.competitors.length >= 5) return;
                setInput((s) => ({ ...s, competitors: [...s.competitors, competitorDraft.trim()] }));
                setCompetitorDraft("");
              }} className="rounded-lg border border-slate-300 px-3 text-sm">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {input.competitors.map((c) => (
                <button key={c} onClick={() => setInput((s) => ({ ...s, competitors: s.competitors.filter((x) => x !== c) }))} className="rounded-full bg-slate-100 px-3 py-1 text-xs">{c} ×</button>
              ))}
            </div>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Objective</span>
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={input.objective} onChange={(e) => setInput({ ...input, objective: e.target.value })} />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Target audience</span>
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={input.audience} onChange={(e) => setInput({ ...input, audience: e.target.value })}>
              {[
                "Sales team",
                "Founder",
                "Product marketing",
                "Executive",
                "Investor",
              ].map((a) => <option key={a}>{a}</option>)}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Notes / hypotheses (optional)</span>
            <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2" rows={3} value={input.notes || ""} onChange={(e) => setInput({ ...input, notes: e.target.value })} />
          </label>

          <div className="space-y-2">
            <p className="text-sm font-medium">Trusted URLs (optional)</p>
            <div className="flex gap-2">
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} placeholder="https://..." />
              <button onClick={() => {
                if (!urlDraft.trim()) return;
                setInput((s) => ({ ...s, trustedUrls: [...(s.trustedUrls || []), urlDraft.trim()] }));
                setUrlDraft("");
              }} className="rounded-lg border border-slate-300 px-3 text-sm">Add</button>
            </div>
            <div className="space-y-1 text-xs text-slate-600">
              {(input.trustedUrls || []).map((u) => (
                <button key={u} onClick={() => setInput((s) => ({ ...s, trustedUrls: (s.trustedUrls || []).filter((x) => x !== u) }))} className="block w-full rounded bg-slate-100 px-2 py-1 text-left">{u} ×</button>
              ))}
            </div>
          </div>

          <button disabled={!canGenerate || loading} onClick={generateReport} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Generating..." : "Generate GTM Briefing"}
          </button>
          <button onClick={() => setBrief(sampleBriefs[Math.floor(Math.random() * sampleBriefs.length)])} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700">
            Load Demo Brief
          </button>

          {progress.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              {progress.map((p, i) => <div key={i}>• {p}</div>)}
            </div>
          )}

          {history.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Recent reports</p>
              <div className="space-y-2">
                {history.slice(0, 5).map((h) => (
                  <button key={h.id} onClick={() => setBrief(h)} className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-left text-xs hover:bg-slate-100">
                    <div className="font-medium text-slate-900">{h.company}</div>
                    <div className="text-slate-600">{new Date(h.createdAt).toLocaleString()}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        <section>
          {!brief ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">No briefing generated yet</h2>
              <p className="mt-2 text-sm text-slate-600">Use the form to generate a live briefing, or load a sample.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">{brief.demoMode ? "Demo mode" : "Generated"}</span>
                <span>Company: {brief.company}</span>
                <span>Audience: {brief.audience}</span>
                <button onClick={() => window.print()} className="ml-auto rounded border border-slate-300 px-2 py-1 text-slate-700">Print</button>
              </div>
              <BriefView brief={brief} />
            </div>
          )}
        </section>
      </main>
    </>
  );
}
