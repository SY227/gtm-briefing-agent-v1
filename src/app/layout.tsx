import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GTM Briefing Agent | Executive Memo Generator",
  description: "Single-page competitive intelligence memo tool with source-aware freshness checks.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
