import { BriefView } from "@/components/brief-view";
import { SiteHeader } from "@/components/site-header";
import { featuredSampleBrief } from "@/lib/sample-data";

export default function SampleBriefPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          This sample brief is demo content for portfolio presentation.
        </div>
        <BriefView brief={featuredSampleBrief} />
      </main>
    </>
  );
}
