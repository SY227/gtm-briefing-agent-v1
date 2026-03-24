import Link from "next/link";
import { BarChart3, SearchCheck, ShieldCheck, Sparkles } from "lucide-react";

const cards = [
  { title: "Executive Summary", desc: "One-screen strategic readout" },
  { title: "What Changed", desc: "Recent product, pricing, and market signals" },
  { title: "Battlecard", desc: "Objections, response angles, and talk tracks" },
  { title: "Recommended Actions", desc: "Sales, strategy, and leadership next steps" },
];

export function HomeSections() {
  return (
    <main className="bg-white text-slate-900">
      <section className="bg-gradient-to-b from-blue-50 to-white pb-20 pt-16">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <p className="mb-3 inline-flex rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              Built for GTM teams, founders, and operators
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Turn public company signals into GTM-ready briefings.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              Competitive Intelligence / GTM Briefing Agent gives you source-backed market briefs with clear risks, opportunities, and objection-handling playbooks in minutes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/app" className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow hover:bg-blue-700">Try the Agent</Link>
              <Link href="/sample-brief" className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">View Sample Brief</Link>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-blue-100">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Sample Output Preview</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {cards.map((card) => (
                <div key={card.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-semibold">{card.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="border-y border-slate-100 bg-white">
        <div className="mx-auto grid max-w-6xl gap-3 px-4 py-6 text-sm sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {[
            { Icon: SearchCheck, text: "Multi-step company research" },
            { Icon: ShieldCheck, text: "Source-backed analysis" },
            { Icon: BarChart3, text: "GTM-ready outputs" },
            { Icon: Sparkles, text: "Battlecards in minutes" },
          ].map(({ Icon, text }, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
              <Icon className="h-4 w-4 text-blue-600" /> {text}
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {["Input company", "Research public signals", "Synthesize insights", "Deliver GTM brief"].map((step, i) => (
            <div key={step} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-semibold text-blue-600">Step {i + 1}</p>
              <p className="mt-2 font-medium">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="use-cases" className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight">Use cases</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {["Founders", "Sales leaders", "Product marketers", "Strategy / Ops", "Investors", "Analysts"].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-700 shadow-sm">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-3xl font-bold tracking-tight">Sample brief</h2>
          <p className="mt-3 text-slate-600">Open a fully formatted, demo-safe briefing you can use instantly in portfolio walkthroughs.</p>
          <Link href="/sample-brief" className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">Open sample report</Link>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight">Sample feedback</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              '"This is the fastest pre-call prep I have seen." — Fictional sample, Sales Director',
              '"The confidence notes are excellent for executive reviews." — Fictional sample, Strategy Lead',
              '"Battlecard section is immediately useful." — Fictional sample, Product Marketing',
            ].map((q) => (
              <blockquote key={q} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">{q}</blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20 pt-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-blue-600 p-8 text-white shadow-lg">
            <h2 className="text-3xl font-bold tracking-tight">Generate your first GTM briefing now.</h2>
            <p className="mt-3 text-blue-100">Built for practical strategy work, not AI theater.</p>
            <Link href="/app" className="mt-5 inline-block rounded-lg bg-white px-4 py-2 font-semibold text-blue-700 hover:bg-blue-50">Try the Agent</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
