import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { BriefInput, GTMBrief, GenerateResponse, SourceGovernance, SourceItem } from "@/lib/types";

export const runtime = "nodejs";
const model = "gemini-2.5-flash-lite";

const pathHints = ["", "/pricing", "/product", "/products", "/docs", "/blog", "/news", "/press", "/investor-relations", "/updates", "/announcements"];

type ProbeTarget = {
  url: string;
  type: SourceItem["type"];
  title?: string;
  detectedDate?: string;
  class: "official" | "news" | "analyst" | "filing" | "forums-blogs" | "general";
  weight: number;
};

const defaultGovernance: SourceGovernance = {
  sourceClassFilters: {
    officialCompany: true,
    officialCompetitor: true,
    news: true,
    analystResearch: true,
    regulatoryFilings: true,
    forumsBlogs: false,
  },
  excludeForumsBlogs: true,
  maxSearchResults: 40,
  weights: {
    official: 1,
    news: 0.9,
    analyst: 0.75,
    filings: 0.85,
  },
};

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

function inferDomainsFromName(name: string) {
  const token = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join("");

  if (!token) return [];
  return [`https://www.${token}.com`, `https://${token}.com`, `https://corporate.${token}.com`];
}

function classifyUrl(url: string): ProbeTarget["class"] {
  const u = url.toLowerCase();
  if (u.includes("sec.gov") || u.includes("investor") || u.includes("annual-report") || u.includes("10-k") || u.includes("10q")) return "filing";
  if (u.includes("reuters.com") || u.includes("bloomberg.com") || u.includes("ft.com") || u.includes("wsj.com") || u.includes("news") || u.includes("press")) return "news";
  if (u.includes("gartner") || u.includes("forrester") || u.includes("idc.com") || u.includes("cbinsights") || u.includes("pitchbook")) return "analyst";
  if (u.includes("reddit.com") || u.includes("medium.com") || u.includes("substack") || u.includes("blog") || u.includes("forum")) return "forums-blogs";
  if (u.includes(".com") || u.includes(".io") || u.includes(".co")) return "official";
  return "general";
}

function classWeight(sourceClass: ProbeTarget["class"], governance: SourceGovernance) {
  if (sourceClass === "official") return governance.weights.official;
  if (sourceClass === "news") return governance.weights.news;
  if (sourceClass === "analyst") return governance.weights.analyst;
  if (sourceClass === "filing") return governance.weights.filings;
  if (sourceClass === "forums-blogs") return governance.excludeForumsBlogs ? 0 : 0.35;
  return 0.5;
}

function isAllowedByGovernance(sourceClass: ProbeTarget["class"], type: SourceItem["type"], governance: SourceGovernance) {
  if (sourceClass === "forums-blogs" && governance.excludeForumsBlogs) return false;
  if (type === "company-site" && !governance.sourceClassFilters.officialCompany) return false;
  if (type === "competitor-site" && !governance.sourceClassFilters.officialCompetitor) return false;
  if (sourceClass === "news" && !governance.sourceClassFilters.news) return false;
  if (sourceClass === "analyst" && !governance.sourceClassFilters.analystResearch) return false;
  if (sourceClass === "filing" && !governance.sourceClassFilters.regulatoryFilings) return false;
  if (sourceClass === "forums-blogs" && !governance.sourceClassFilters.forumsBlogs) return false;
  return true;
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
    .slice(0, 5500);
}

async function fetchWithTimeout(url: string, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 GTMBriefingAgent/2.0" },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function searchRss(rssUrl: string) {
  try {
    const res = await fetchWithTimeout(rssUrl, 7000);
    if (!res.ok) return [] as ProbeTarget[];
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>[\s\S]*?<\/item>/g)].map((m) => m[0]);
    return items
      .map((item) => {
        const link = item.match(/<link>(https?:\/\/[^<]+)<\/link>/)?.[1];
        const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1];
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1];
        if (!link) return null;
        return {
          url: link,
          type: "public-page" as const,
          title: title?.trim(),
          detectedDate: pubDate,
          class: classifyUrl(link),
          weight: 0.5,
        };
      })
      .filter(Boolean) as ProbeTarget[];
  } catch {
    return [] as ProbeTarget[];
  }
}

async function webSearchTargets(input: BriefInput) {
  const company = input.primaryCompany.trim();
  const competitors = input.competitors.join(" OR ");

  const queries = [
    `${company} latest news`,
    `${company} pricing update`,
    `${company} product launch`,
    `${company} investor relations press release`,
    competitors ? `(${company}) (${competitors}) competitive analysis latest` : `${company} competitors latest`,
  ];

  const providers = queries.flatMap((q) => [
    `https://www.bing.com/search?q=${encodeURIComponent(q)}&format=rss`,
    `https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=rss`,
    `https://news.google.com/rss/search?q=${encodeURIComponent(q)}`,
  ]);

  const results = await Promise.all(providers.map(searchRss));
  return results.flat().slice(0, 40);
}

async function fetchEvidence(target: ProbeTarget) {
  try {
    const res = await fetchWithTimeout(target.url);
    if (!res.ok) return null;
    const html = await res.text();
    const text = safeTextFromHtml(html);
    const detectedDate = extractDate(`${html}\n${text}`) || target.detectedDate;
    return {
      source: {
        title: target.title || `Public page: ${new URL(target.url).hostname}`,
        url: target.url,
        type: target.type,
        fetchedAt: new Date().toISOString(),
        detectedDate,
        note: `class=${target.class}; weight=${target.weight.toFixed(2)}`,
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
  return Number.isNaN(d.getTime()) ? undefined : d.getTime();
}

function freshnessFromSources(sources: SourceItem[]) {
  const now = Date.now();
  const epochs = sources.map((s) => parseDateToEpoch(s.detectedDate)).filter((v): v is number => Boolean(v));
  if (epochs.length === 0) {
    return {
      freshestEvidenceDate: undefined,
      daysSinceFreshest: undefined,
      status: "stale" as const,
      summary: "No explicit dated evidence detected across fetched sources. Recency-sensitive claims are constrained.",
    };
  }
  const freshest = Math.max(...epochs);
  const days = Math.floor((now - freshest) / (1000 * 60 * 60 * 24));
  if (days <= 90) {
    return { freshestEvidenceDate: new Date(freshest).toISOString(), daysSinceFreshest: days, status: "current" as const, summary: `Freshest dated evidence is ${days} days old.` };
  }
  if (days <= 180) {
    return { freshestEvidenceDate: new Date(freshest).toISOString(), daysSinceFreshest: days, status: "mixed" as const, summary: `Freshest dated evidence is ${days} days old; recency confidence is moderate.` };
  }
  return { freshestEvidenceDate: new Date(freshest).toISOString(), daysSinceFreshest: days, status: "stale" as const, summary: `Freshest dated evidence is ${days} days old; avoid confident recent-change claims.` };
}

async function buildProbeUrls(input: BriefInput, governance: SourceGovernance) {
  const urls: ProbeTarget[] = [];
  const pushUnique = (target: ProbeTarget) => {
    const normalized = normalizeUrl(target.url);
    if (!normalized) return;
    if (!isAllowedByGovernance(target.class, target.type, governance)) return;
    const weight = classWeight(target.class, governance);
    if (weight <= 0) return;
    if (urls.find((u) => u.url === normalized)) return;
    urls.push({ ...target, url: normalized, weight });
  };

  (input.trustedUrls || []).slice(0, 12).forEach((url) => pushUnique({ url, type: "user-provided", title: "Trusted URL", class: classifyUrl(url), weight: governance.weights.official }));

  const companyOrigins = [input.companyWebsite, ...inferDomainsFromName(input.primaryCompany)]
    .filter(Boolean)
    .map((u) => baseOrigin(u as string))
    .filter(Boolean);
  companyOrigins.forEach((origin) => pathHints.forEach((p) => pushUnique({ url: `${origin}${p}`, type: "company-site", class: "official", weight: governance.weights.official })));

  const competitorSites = [...(input.competitorWebsites || []), ...input.competitors.flatMap(inferDomainsFromName)];
  competitorSites.slice(0, 10).forEach((site) => {
    const origin = baseOrigin(site);
    if (origin) pathHints.forEach((p) => pushUnique({ url: `${origin}${p}`, type: "competitor-site", class: "official", weight: governance.weights.official }));
  });

  const searchTargets = await webSearchTargets(input);
  searchTargets.forEach((t) => pushUnique(t));

  return urls
    .sort((a, b) => b.weight - a.weight)
    .slice(0, Math.max(10, Math.min(80, governance.maxSearchResults)));
}

function makeErrorBrief(input: BriefInput, reason: string): GTMBrief {
  return {
    id: `error-${Date.now()}`,
    createdAt: new Date().toISOString(),
    asOf: new Date().toISOString(),
    mode: "error-fallback",
    company: input.primaryCompany || "Unknown company",
    competitors: input.competitors || [],
    objective: input.objective || "Not provided",
    audience: input.audience || "Not provided",
    executiveSummary: "Live generation failed before a reliable memo could be produced.",
    latestVerifiedSignals: [{ claim: "No validated signal available due to generation failure.", observedDate: "date not confirmed", dateConfidence: "low" }],
    whatChanged: [{ claim: "Unable to verify recent changes.", observedDate: "date not confirmed", dateConfidence: "low" }],
    productPricingSignals: [{ claim: "Unable to verify product/pricing changes.", observedDate: "date not confirmed", dateConfidence: "low" }],
    likelyICP: [],
    messagingPositioning: [],
    risks: ["Generation pipeline failed."],
    opportunities: [],
    battlecard: { strengths: [], weaknesses: [], likelyObjections: [], responseAngles: [], say: [], avoid: [] },
    recommendedActions: {
      sales: ["Retry with company and competitor official URLs."],
      strategy: ["Retry with trusted press/news pages."],
      leadership: ["Treat this run as incomplete."],
    },
    freshness: {
      status: "stale",
      summary: "No usable evidence due to pipeline failure.",
    },
    confidenceCoverage: {
      confidence: "Low",
      evidenceQuality: "Generation failure; no reliable synthesis produced.",
      knownGaps: [reason],
    },
    sources: [],
    observedVsInferred: { observed: [], inferred: [] },
    generationNotes: [reason],
  };
}

export async function POST(req: Request) {
  const input = (await req.json()) as BriefInput;

  if (!process.env.GEMINI_API_KEY) {
    const reason = "Live mode unavailable: GEMINI_API_KEY is not configured.";
    return NextResponse.json({ brief: makeErrorBrief(input, reason), notices: [reason], generationError: reason } satisfies GenerateResponse);
  }

  const governance = { ...defaultGovernance, ...(input.governance || {}) };
  governance.sourceClassFilters = { ...defaultGovernance.sourceClassFilters, ...(input.governance?.sourceClassFilters || {}) };
  governance.weights = { ...defaultGovernance.weights, ...(input.governance?.weights || {}) };

  const probePlan = await buildProbeUrls(input, governance);
  const fetched = (await Promise.all(probePlan.map((t) => fetchEvidence(t)))).filter(Boolean) as { source: SourceItem; text: string }[];
  const sources = fetched.map((f) => f.source);
  const freshness = freshnessFromSources(sources);

  const notices: string[] = [];
  if (sources.length === 0) notices.push("No evidence pages were reachable from public search and provided inputs. Add official company/competitor URLs.");
  if (freshness.status !== "current") notices.push(`Freshness status is ${freshness.status}. ${freshness.summary}`);
  notices.push(`Governance active: maxResults=${governance.maxSearchResults}, excludeForumsBlogs=${governance.excludeForumsBlogs}.`);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const plannerPrompt = `Return JSON only with keys priorities (string[]), keyRisks (string[]), missingEvidence (string[]).
Input: ${JSON.stringify(input)}
Freshness: ${JSON.stringify(freshness)}
Governance: ${JSON.stringify(governance)}
SourceCount: ${sources.length}`;

  let plannerText = "{}";
  try {
    const plan = await ai.models.generateContent({ model, contents: plannerPrompt, config: { temperature: 0.1, responseMimeType: "application/json" } });
    plannerText = plan.text || "{}";
  } catch {
    notices.push("Planner stage failed; synthesis continued.");
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
- For recency-sensitive claims, include observedDate or "date not confirmed".
- If evidence is stale/mixed, be explicit.
- Keep analyst-grade tone and concise business language.
Context:
Input=${JSON.stringify(input)}
Planner=${plannerText}
Freshness=${JSON.stringify(freshness)}
Governance=${JSON.stringify(governance)}
Evidence=${JSON.stringify(evidencePayload).slice(0, 26000)}
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
        knownGaps: ["Model returned partial confidence metadata."],
      },
      sources,
      generationNotes: notices,
    };

    if (freshness.status !== "current") {
      brief.confidenceCoverage.knownGaps = [...brief.confidenceCoverage.knownGaps, `Freshness is ${freshness.status}; recency-sensitive claims are constrained.`];
    }

    return NextResponse.json({ brief, notices } satisfies GenerateResponse);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown synthesis error";
    const reason = `Live generation failed: ${msg}`;
    return NextResponse.json({ brief: makeErrorBrief(input, reason), notices: [reason], generationError: reason } satisfies GenerateResponse);
  }
}
