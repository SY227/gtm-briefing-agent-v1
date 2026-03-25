import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { sampleBriefs } from "@/lib/sample-data";
import { BriefInput, GTMBrief, GenerateResponse, SourceItem } from "@/lib/types";

export const runtime = "nodejs";
const model = "gemini-2.5-flash-lite";

const pathHints = ["", "/pricing", "/product", "/products", "/docs", "/blog", "/news", "/press", "/investor-relations", "/updates"];

function normalizeUrl(raw: string) {
  const value = raw.trim();
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

function baseOrigin(url: string) {
  try {
    const u = new URL(normalizeUrl(url));
    return `${u.protocol}//${u.hostname}`;
  } catch {
    return "";
  }
}

function extractDate(text: string): string | undefined {
  const iso = text.match(/\b(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/);
  if (iso) return iso[0];
  const month = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d{2}\b/i);
  if (month) return month[0];
  return undefined;
}

function safeTextFromHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000);
}

async function fetchEvidence(url: string, type: SourceItem["type"]) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 GTMBriefingAgent/1.1" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const html = await res.text();
    const text = safeTextFromHtml(html);
    const detectedDate = extractDate(`${html}\n${text}`);
    return {
      source: {
        title: `Public page: ${new URL(url).hostname}`,
        url,
        type,
        fetchedAt: new Date().toISOString(),
        detectedDate,
      } as SourceItem,
      text,
    };
  } catch {
    return null;
  }
}

function parseDateToEpoch(value?: string): number | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.getTime();
}

function freshnessFromSources(sources: SourceItem[]) {
  const now = Date.now();
  const epochs = sources.map((s) => parseDateToEpoch(s.detectedDate)).filter((v): v is number => Boolean(v));
  if (epochs.length === 0) {
    return {
      freshestEvidenceDate: undefined,
      daysSinceFreshest: undefined,
      status: "stale" as const,
      summary: "No explicit dated evidence detected. Recency-sensitive claims should be treated as limited.",
    };
  }
  const freshest = Math.max(...epochs);
  const days = Math.floor((now - freshest) / (1000 * 60 * 60 * 24));
  if (days <= 90) {
    return {
      freshestEvidenceDate: new Date(freshest).toISOString(),
      daysSinceFreshest: days,
      status: "current" as const,
      summary: `Freshest dated evidence is ${days} days old.`,
    };
  }
  if (days <= 180) {
    return {
      freshestEvidenceDate: new Date(freshest).toISOString(),
      daysSinceFreshest: days,
      status: "mixed" as const,
      summary: `Freshest dated evidence is ${days} days old; recent-change claims should be conservative.`,
    };
  }
  return {
    freshestEvidenceDate: new Date(freshest).toISOString(),
    daysSinceFreshest: days,
    status: "stale" as const,
    summary: `Freshest dated evidence is ${days} days old; avoid confident recent-change claims.`,
  };
}

function inferDomainsFromName(name: string) {
  const token = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join("");

  if (!token) return [];

  return [
    `https://www.${token}.com`,
    `https://${token}.com`,
    `https://corporate.${token}.com`,
  ];
}

function buildProbeUrls(input: BriefInput) {
  const urls: { url: string; type: SourceItem["type"] }[] = [];
  const pushUnique = (url: string, type: SourceItem["type"]) => {
    if (!url) return;
    const normalized = normalizeUrl(url);
    if (!normalized) return;
    if (urls.find((u) => u.url === normalized)) return;
    urls.push({ url: normalized, type });
  };

  (input.trustedUrls || []).slice(0, 8).forEach((url) => pushUnique(url, "user-provided"));

  const explicitCompanyOrigins = [input.companyWebsite, ...inferDomainsFromName(input.primaryCompany)]
    .filter(Boolean)
    .map((u) => baseOrigin(u as string))
    .filter(Boolean);
  explicitCompanyOrigins.forEach((origin) => pathHints.forEach((p) => pushUnique(`${origin}${p}`, "company-site")));

  const explicitCompetitorSites = [
    ...(input.competitorWebsites || []),
    ...input.competitors.flatMap(inferDomainsFromName),
  ];
  explicitCompetitorSites.slice(0, 8).forEach((site) => {
    const origin = baseOrigin(site);
    if (origin) pathHints.forEach((p) => pushUnique(`${origin}${p}`, "competitor-site"));
  });

  return urls.slice(0, 36);
}

function demoResponse(input: BriefInput, mode: GTMBrief["mode"], note: string): GenerateResponse {
  const base = sampleBriefs[0];
  const brief: GTMBrief = {
    ...base,
    id: `${mode}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    asOf: new Date().toISOString(),
    mode,
    company: input.primaryCompany || base.company,
    competitors: input.competitors.length ? input.competitors : base.competitors,
    objective: input.objective || base.objective,
    audience: input.audience || base.audience,
    generationNotes: [...(base.generationNotes || []), note],
  };

  return {
    brief,
    notices: [note],
    generationError: mode === "error-fallback" ? note : undefined,
  };
}

export async function POST(req: Request) {
  const input = (await req.json()) as BriefInput;

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(demoResponse(input, "demo", "Live mode unavailable: GEMINI_API_KEY is not configured."));
  }

  const probePlan = buildProbeUrls(input);
  const fetched = (await Promise.all(probePlan.map((u) => fetchEvidence(u.url, u.type)))).filter(Boolean) as { source: SourceItem; text: string }[];
  const sources = fetched.map((f) => f.source);
  const freshness = freshnessFromSources(sources);

  const notices: string[] = [];
  if (sources.length === 0) notices.push("No evidence pages were reachable from provided or inferred domains. Add company/competitor websites or trusted URLs for stronger recency coverage.");
  if (freshness.status !== "current") notices.push(`Freshness status is ${freshness.status}. ${freshness.summary}`);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const plannerPrompt = `Return JSON only with keys priorities (string[]), keyRisks (string[]), missingEvidence (string[]).
Input: ${JSON.stringify(input)}
Freshness: ${JSON.stringify(freshness)}
SourceCount: ${sources.length}`;

  let plannerText = "{}";
  try {
    const plan = await ai.models.generateContent({ model, contents: plannerPrompt, config: { temperature: 0.1, responseMimeType: "application/json" } });
    plannerText = plan.text || "{}";
  } catch {
    notices.push("Planner stage partially failed; proceeding with synthesis.");
  }

  const evidencePayload = fetched.map((f) => ({ source: f.source, excerpt: f.text.slice(0, 1800) }));

  const synthesisPrompt = `Create strict JSON only with schema:
{
"executiveSummary": string,
"latestVerifiedSignals": [{"claim": string, "sourceUrl": string, "observedDate": string, "dateConfidence": "high"|"medium"|"low"}],
"whatChanged": [{"claim": string, "sourceUrl": string, "observedDate": string, "dateConfidence": "high"|"medium"|"low"}],
"productPricingSignals": [{"claim": string, "sourceUrl": string, "observedDate": string, "dateConfidence": "high"|"medium"|"low"}],
"likelyICP": string[],
"messagingPositioning": string[],
"risks": string[],
"opportunities": string[],
"battlecard": {"strengths": string[],"weaknesses": string[],"likelyObjections": string[],"responseAngles": string[],"say": string[],"avoid": string[]},
"recommendedActions": {"sales": string[],"strategy": string[],"leadership": string[]},
"observedVsInferred": {"observed": string[], "inferred": string[]},
"confidenceCoverage": {"confidence": "Low"|"Medium"|"High", "evidenceQuality": string, "knownGaps": string[]}
}
Rules:
- Never fabricate dated events.
- Recency-sensitive sections must include observedDate or "date not confirmed".
- If freshness is stale/mixed, state limits directly.
- Separate observed evidence from inferred conclusions.
Context:
Input=${JSON.stringify(input)}
Planner=${plannerText}
Freshness=${JSON.stringify(freshness)}
Evidence=${JSON.stringify(evidencePayload).slice(0, 18000)}
`;

  try {
    const result = await ai.models.generateContent({
      model,
      contents: synthesisPrompt,
      config: { temperature: 0.2, responseMimeType: "application/json" },
    });

    const parsed = JSON.parse(result.text || "{}");
    const nonEmptyEvidence = (
      value: unknown,
      fallback: { claim: string; observedDate: string; dateConfidence: "low"; sourceUrl?: string }[],
    ) => (Array.isArray(value) && value.length > 0 ? value : fallback);

    const brief: GTMBrief = {
      id: `live-${Date.now()}`,
      createdAt: new Date().toISOString(),
      asOf: new Date().toISOString(),
      mode: "live",
      company: input.primaryCompany,
      competitors: input.competitors || [],
      objective: input.objective,
      audience: input.audience,
      executiveSummary: parsed.executiveSummary || "Insufficient evidence for a confident summary.",
      latestVerifiedSignals: nonEmptyEvidence(parsed.latestVerifiedSignals, [
        { claim: "No strongly verifiable signal extracted from current evidence set.", observedDate: "date not confirmed", dateConfidence: "low" },
      ]),
      whatChanged: nonEmptyEvidence(parsed.whatChanged, [
        { claim: "Insufficient dated evidence to assert recent changes.", observedDate: "date not confirmed", dateConfidence: "low" },
      ]),
      productPricingSignals: nonEmptyEvidence(parsed.productPricingSignals, [
        { claim: "Insufficient evidence for verified pricing shifts.", observedDate: "date not confirmed", dateConfidence: "low" },
      ]),
      likelyICP: parsed.likelyICP || [],
      messagingPositioning: parsed.messagingPositioning || [],
      risks: parsed.risks || [],
      opportunities: parsed.opportunities || [],
      battlecard: parsed.battlecard || { strengths: [], weaknesses: [], likelyObjections: [], responseAngles: [], say: [], avoid: [] },
      recommendedActions: parsed.recommendedActions || { sales: [], strategy: [], leadership: [] },
      observedVsInferred: parsed.observedVsInferred || { observed: [], inferred: [] },
      freshness,
      confidenceCoverage: parsed.confidenceCoverage || {
        confidence: freshness.status === "current" ? "Medium" : "Low",
        evidenceQuality: freshness.summary,
        knownGaps: ["Model did not return full confidence metadata."],
      },
      sources,
      generationNotes: notices,
    };

    if (freshness.status !== "current") {
      brief.confidenceCoverage.knownGaps = [
        ...brief.confidenceCoverage.knownGaps,
        `Freshness is ${freshness.status}; recent-change claims should be treated as constrained.`,
      ];
    }

    return NextResponse.json({ brief, notices } satisfies GenerateResponse);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown synthesis error";
    return NextResponse.json(demoResponse(input, "error-fallback", `Live generation failed: ${msg}`));
  }
}
