import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-semibold tracking-tight text-slate-900">
          Briefing<span className="text-blue-600">Agent</span>
        </Link>
        <nav className="hidden gap-6 text-sm text-slate-600 md:flex">
          <a href="#product" className="hover:text-slate-900">Product</a>
          <a href="#how" className="hover:text-slate-900">How It Works</a>
          <Link href="/sample-brief" className="hover:text-slate-900">Sample Brief</Link>
          <a href="#use-cases" className="hover:text-slate-900">Use Cases</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/sample-brief" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            View Sample Brief
          </Link>
          <Link href="/app" className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
            Try the Agent
          </Link>
        </div>
      </div>
    </header>
  );
}
