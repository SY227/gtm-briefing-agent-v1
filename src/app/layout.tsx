import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BriefingAgent | Competitive Intelligence / GTM Briefing Agent",
  description: "Source-backed company briefings and battlecards for GTM teams.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
