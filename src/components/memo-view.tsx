"use client";

import { GTMBrief } from "@/lib/types";

function Copy({ text }: { text: string }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text)}
      className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
    >
      Copy
    </button>
  );
}

function EvidenceList({ items }: { items: { claim: string; sourceId?: string; sourceUrl?: string; observedDate?: string; dateConfidence: string }[] }) {
  return (
    <ul className="space-y-3 text-[15px] leading-7 text-slate-700">
      {items.map((item, idx) => (
        <li key={idx} className="rounded-lg border border-slate-200 p-3">
          <p>{item.claim}{item.sourceId ? ` [${item.sourceId}]` : ""}</p>
          <p className="mt-1 text-xs text-slate-500">
            {item.observedDate ? `Date: ${item.observedDate}` : "Date: not confirmed"} · Confidence: {item.dateConfidence}
            {item.sourceUrl ? (
              <>
                {" "}· <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">Source</a>
              </>
            ) : null}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function MemoView({ brief }: { brief: GTMBrief }) {
  const fullMemo = JSON.stringify(brief, null, 2);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-7 border-b border-slate-200 pb-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-slate-300 px-2 py-1 uppercase tracking-wide text-slate-600">{brief.mode === "live" ? "Live generated" : "Generation fallback"}</span>
          <span className="rounded-full border border-slate-300 px-2 py-1 text-slate-600">As of {new Date(brief.asOf).toLocaleString()}</span>
          <span className={`rounded-full px-2 py-1 ${brief.freshness.status === "current" ? "bg-emerald-100 text-emerald-700" : brief.freshness.status === "mixed" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-700"}`}>
            Freshness: {brief.freshness.status}
          </span>
          <button onClick={() => window.print()} className="ml-auto rounded-md border border-slate-300 px-2 py-1 text-slate-700">Print</button>
          <Copy text={fullMemo} />
        </div>

        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{brief.company} Intelligence Memo</h2>
        <p className="mt-1 text-sm text-slate-600">Objective: {brief.objective} · Audience: {brief.audience}</p>
        {brief.competitors.length > 0 && <p className="mt-1 text-sm text-slate-600">Competitors: {brief.competitors.join(", ")}</p>}
        {brief.companyProfile && (
          <p className="mt-1 text-sm text-slate-600">
            Canonical: {brief.companyProfile.canonicalName}
            {brief.companyProfile.ticker ? ` · Ticker: ${brief.companyProfile.ticker}` : ""}
            {brief.companyProfile.sector ? ` · Sector: ${brief.companyProfile.sector}` : ""}
            {brief.companyProfile.region ? ` · Region: ${brief.companyProfile.region}` : ""}
          </p>
        )}
      </div>

      <section className="space-y-8">
        <div>
          <div className="mb-2 flex items-center justify-between"><h3 className="text-lg font-semibold">Executive Summary</h3><Copy text={brief.executiveSummary} /></div>
          <p className="text-[15px] leading-7 text-slate-700">{brief.executiveSummary}</p>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Latest Verified Signals</h3>
          <EvidenceList items={brief.latestVerifiedSignals} />
        </div>

        {[
          ["Likely ICP / Target Customer", brief.likelyICP],
          ["Messaging / Positioning Summary", brief.messagingPositioning],
          ["Risks", brief.risks],
          ["Opportunities", brief.opportunities],
        ].map(([title, items]) => (
          <div key={title as string}>
            <h3 className="mb-2 text-lg font-semibold">{title as string}</h3>
            <ul className="list-disc space-y-1 pl-5 text-[15px] leading-7 text-slate-700">
              {(items as string[]).map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="mb-2 text-lg font-semibold">Objection-Handling Battlecard</h3>
          <div className="space-y-3 text-[15px] leading-7 text-slate-700">
            <p><strong>Strengths:</strong> {brief.battlecard.strengths.join("; ") || "Not enough evidence."}</p>
            <p><strong>Weaknesses / gaps:</strong> {brief.battlecard.weaknesses.join("; ") || "Not enough evidence."}</p>
            <p><strong>Likely objections:</strong> {brief.battlecard.likelyObjections.join("; ") || "Not enough evidence."}</p>
            <p><strong>Response angles:</strong> {brief.battlecard.responseAngles.join("; ") || "Not enough evidence."}</p>
            <p><strong>What we should say:</strong> {brief.battlecard.say.join("; ") || "Not enough evidence."}</p>
            <p><strong>What we should not say:</strong> {brief.battlecard.avoid.join("; ") || "Not enough evidence."}</p>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Recommended Actions</h3>
          <p className="text-sm font-medium text-slate-800">Sales</p>
          <ul className="mb-3 list-disc pl-5 text-[15px] leading-7 text-slate-700">{brief.recommendedActions.sales.map((x, i) => <li key={i}>{x}</li>)}</ul>
          <p className="text-sm font-medium text-slate-800">Strategy</p>
          <ul className="mb-3 list-disc pl-5 text-[15px] leading-7 text-slate-700">{brief.recommendedActions.strategy.map((x, i) => <li key={i}>{x}</li>)}</ul>
          <p className="text-sm font-medium text-slate-800">Leadership</p>
          <ul className="list-disc pl-5 text-[15px] leading-7 text-slate-700">{brief.recommendedActions.leadership.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Sources</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            {brief.sources.map((source, idx) => (
              <li key={`${source.url}-${idx}`} className="rounded-lg border border-slate-200 px-3 py-2">
                <div className="font-medium text-slate-900">{source.sourceId ? `[${source.sourceId}] ` : ""}{source.title}</div>
                <a href={source.url} target="_blank" rel="noreferrer" className="break-all text-blue-700 hover:underline">{source.url}</a>
                <p className="text-xs text-slate-500">{source.type}{source.tier ? ` · ${source.tier}` : ""} · fetched {new Date(source.fetchedAt).toLocaleString()} · {source.detectedDate ? `detected date ${source.detectedDate}` : "date not confirmed"}</p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Coverage / Confidence Notes</h3>
          <p className="text-[15px] leading-7 text-slate-700"><strong>Confidence:</strong> {brief.confidenceCoverage.confidence}</p>
          <p className="text-[15px] leading-7 text-slate-700">{brief.confidenceCoverage.evidenceQuality}</p>
          <p className="mt-2 text-[15px] leading-7 text-slate-700"><strong>Freshness summary:</strong> {brief.freshness.summary}</p>
          {brief.confidenceBreakdown && (
            <p className="text-[15px] leading-7 text-slate-700">
              <strong>Confidence breakdown:</strong> Coverage {brief.confidenceBreakdown.coverage} · Recency {brief.confidenceBreakdown.recency} · Source quality {brief.confidenceBreakdown.sourceQuality}
            </p>
          )}
          {brief.sourceTierSummary && (
            <p className="text-[15px] leading-7 text-slate-700">
              <strong>Source tiers:</strong> Tier 1: {brief.sourceTierSummary.tier1}, Tier 2: {brief.sourceTierSummary.tier2}, Tier 3: {brief.sourceTierSummary.tier3}
            </p>
          )}
          <ul className="mt-2 list-disc pl-5 text-[15px] leading-7 text-slate-700">{brief.confidenceCoverage.knownGaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
          <p className="mt-2 text-[15px] leading-7 text-slate-700"><strong>Observed:</strong> {brief.observedVsInferred.observed.join("; ") || "n/a"}</p>
          <p className="text-[15px] leading-7 text-slate-700"><strong>Inferred:</strong> {brief.observedVsInferred.inferred.join("; ") || "n/a"}</p>
        </div>
      </section>
    </article>
  );
}
