"use client";

import { GTMBrief } from "@/lib/types";

const sectionClass = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

function CopyButton({ text }: { text: string }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text)}
      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
    >
      Copy
    </button>
  );
}

function ListSection({ title, items, id }: { title: string; items: string[]; id: string }) {
  return (
    <section id={id} className={sectionClass}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <CopyButton text={items.join("\n")} />
      </div>
      <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
        {items.map((item, idx) => (
          <li key={`${id}-${idx}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function BriefView({ brief }: { brief: GTMBrief }) {
  const nav = [
    ["summary", "Executive Summary"],
    ["changed", "What Changed Recently"],
    ["pricing", "Product / Pricing Signals"],
    ["icp", "Likely ICP"],
    ["positioning", "Messaging / Positioning"],
    ["risks", "Risks"],
    ["opps", "Opportunities"],
    ["battlecard", "Battlecard"],
    ["actions", "Recommended Actions"],
    ["sources", "Sources"],
    ["confidence", "Confidence Notes"],
  ] as const;

  return (
    <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
      <aside className="top-24 hidden h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:block">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Sections</p>
        <ul className="space-y-1 text-sm">
          {nav.map(([id, label]) => (
            <li key={id}>
              <a className="block rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900" href={`#${id}`}>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </aside>

      <div className="space-y-5">
        <section id="summary" className={sectionClass}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Executive Summary</h2>
            <CopyButton text={brief.executiveSummary} />
          </div>
          <p className="text-sm leading-relaxed text-slate-700">{brief.executiveSummary}</p>
        </section>

        <ListSection id="changed" title="What Changed Recently" items={brief.whatChanged} />
        <ListSection id="pricing" title="Product / Pricing Signals" items={brief.productPricingSignals} />
        <ListSection id="icp" title="Likely Target Customer / ICP" items={brief.likelyICP} />
        <ListSection id="positioning" title="Messaging / Positioning Summary" items={brief.messagingPositioning} />
        <ListSection id="risks" title="Risks" items={brief.risks} />
        <ListSection id="opps" title="Opportunities" items={brief.opportunities} />

        <section id="battlecard" className={sectionClass}>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Objection-Handling Battlecard</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <ListSection id="b1" title="Competitor Strengths" items={brief.battlecard.strengths} />
            <ListSection id="b2" title="Weaknesses / Gaps" items={brief.battlecard.weaknesses} />
            <ListSection id="b3" title="Likely Objections" items={brief.battlecard.likelyObjections} />
            <ListSection id="b4" title="Suggested Response Angles" items={brief.battlecard.responseAngles} />
            <ListSection id="b5" title="What We Should Say" items={brief.battlecard.say} />
            <ListSection id="b6" title="What We Should Not Say" items={brief.battlecard.avoid} />
          </div>
        </section>

        <section id="actions" className={sectionClass}>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Recommended Actions</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <ListSection id="a1" title="Sales" items={brief.recommendedActions.sales} />
            <ListSection id="a2" title="Strategy" items={brief.recommendedActions.strategy} />
            <ListSection id="a3" title="Leadership" items={brief.recommendedActions.leadership} />
          </div>
        </section>

        <section id="sources" className={sectionClass}>
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Sources / Evidence</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            {brief.sources.map((s, idx) => (
              <li key={`${s.url}-${idx}`} className="rounded-lg border border-slate-200 p-3">
                <div className="font-medium text-slate-900">{s.title}</div>
                <a className="break-all text-blue-600 hover:underline" href={s.url} target="_blank" rel="noreferrer">{s.url}</a>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{s.type}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="confidence" className={sectionClass}>
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Confidence / Coverage Notes</h3>
          <p className="text-sm text-slate-700"><strong>Confidence:</strong> {brief.confidenceCoverage.confidence}</p>
          <p className="mt-2 text-sm text-slate-700">{brief.confidenceCoverage.evidenceQuality}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {brief.confidenceCoverage.knownGaps.map((g, i) => <li key={i}>{g}</li>)}
          </ul>
        </section>
      </div>
    </div>
  );
}
