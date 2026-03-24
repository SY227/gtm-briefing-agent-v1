import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold">How BriefingAgent Works</h1>
        <ol className="mt-6 list-decimal space-y-3 pl-5 text-slate-700">
          <li>Intake and planning: normalize request, audience, and objective.</li>
          <li>Evidence gathering: prioritize user URLs and public pages.</li>
          <li>Synthesis: separate observed evidence from inference.</li>
          <li>Output formatting: produce GTM-ready structured briefing.</li>
        </ol>
        <Link href="/app" className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-white">Try the agent</Link>
      </main>
    </>
  );
}
