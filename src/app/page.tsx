import { HomeSections } from "@/components/home-sections";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <HomeSections />
      <footer className="border-t border-slate-200 bg-white py-8 text-sm text-slate-500">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p>BriefingAgent — AI strategy tooling for modern GTM teams.</p>
          <p>Demo product. Sample feedback is fictional.</p>
        </div>
      </footer>
    </>
  );
}
