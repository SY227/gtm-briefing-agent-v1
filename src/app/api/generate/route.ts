import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { BriefInput, GTMBrief, GenerateResponse, SourceGovernance, SourceItem } from "@/lib/types";

export const runtime = "nodejs";
const model = "gemini-2.5-flash-lite";

const pathHints = ["", "/pricing", "/product", "/products", "/docs", "/blog", "/news", "/press", "/investor-relations", "/updates", "/announcements"];

const COMPANY_ALIASES: Record<string, { canonical: string; ticker?: string; domains?: string[] }> = {
  nvidia: { canonical: "NVIDIA", ticker: "NVDA", domains: ["nvidia.com", "investor.nvidia.com"] },
  nvda: { canonical: "NVIDIA", ticker: "NVDA", domains: ["nvidia.com", "investor.nvidia.com"] },
  walmart: { canonical: "Walmart", ticker: "WMT", domains: ["walmart.com", "corporate.walmart.com"] },
  costco: { canonical: "Costco", ticker: "COST", domains: ["costco.com", "investor.costco.com"] },
  target: { canonical: "Target", ticker: "TGT", domains: ["target.com", "corporate.target.com"] },
  amazon: { canonical: "Amazon", ticker: "AMZN", domains: ["amazon.com", "ir.aboutamazon.com"] },
  microsoft: { canonical: "Microsoft", ticker: "MSFT", domains: ["microsoft.com", "news.microsoft.com", "investor.microsoft.com"] },
  google: { canonical: "Alphabet", ticker: "GOOGL", domains: ["about.google", "abc.xyz"] },
  alphabet: { canonical: "Alphabet", ticker: "GOOGL", domains: ["abc.xyz", "about.google"] },
  meta: { canonical: "Meta", ticker: "META", domains: ["about.meta.com", "investor.atmeta.com"] },
};

type ProbeTarget = {
  url: string;
  type: SourceItem["type"];
  title?: string;
  snippet?: string;
  detectedDate?: string;
  class: "official" | "news" | "analyst" | "filing" | "forums-blogs" | "general";
  weight: number;
  query?: string;
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

function canonicalizeUrl(raw: string) {
  try {
    const u = new URL(normalizeUrl(raw));
    u.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ocid", "cmpid", "ref"].forEach((k) => u.searchParams.delete(k));
    return u.toString();
  } catch {
    return normalizeUrl(raw);
  }
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
  const token = name.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim().split(/\s+/).slice(0, 2).join("");
  if (!token) return [];
  return [`https://www.${token}.com`, `https://${token}.com`, `https://corporate.${token}.com`];
}

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value;
}

function cleanToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function levenshtein(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

function guessCompanyFromUrl(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const root = host.split(".")[0];
    if (!root) return undefined;
    return titleCase(root);
  } catch {
    return undefined;
  }
}

function bestTypoCorrection(inputName: string, candidates: string[]) {
  const cleanInput = cleanToken(inputName);
  if (!cleanInput || cleanInput.length < 4) return undefined;
  let best: { value: string; dist: number } | undefined;
  for (const c of candidates) {
    const cleaned = cleanToken(c);
    if (!cleaned || cleaned.length < 4) continue;
    const dist = levenshtein(cleanInput, cleaned);
    const normalizedDist = dist / Math.max(cleanInput.length, cleaned.length);
    if (normalizedDist <= 0.3) {
      if (!best || dist < best.dist) best = { value: c, dist };
    }
  }
  if (!best || cleanToken(best.value) === cleanInput) return undefined;
  return best.value;
}

function normalizeCompanyAlias(name: string) {
  const key = cleanToken(name);
  return COMPANY_ALIASES[key]?.canonical;
}

function lookupTicker(name: string) {
  const key = cleanToken(name);
  return COMPANY_ALIASES[key]?.ticker;
}

function knownDomains(name: string) {
  const key = cleanToken(name);
  return (COMPANY_ALIASES[key]?.domains || []).map((d) => `https://${d}`);
}

function classifyUrl(url: string): ProbeTarget["class"] {
  const u = url.toLowerCase();
  if (u.includes("sec.gov") || u.includes("investor") || u.includes("annual-report") || u.includes("10-k") || u.includes("10q") || u.includes("8-k")) return "filing";
  if (u.includes("reuters.com") || u.includes("bloomberg.com") || u.includes("ft.com") || u.includes("wsj.com") || u.includes("apnews") || u.includes("cnbc") || u.includes("news")) return "news";
  if (u.includes("gartner") || u.includes("forrester") || u.includes("idc.com") || u.includes("cbinsights") || u.includes("pitchbook")) return "analyst";
  if (u.includes("reddit.com") || u.includes("medium.com") || u.includes("substack") || u.includes("blog") || u.includes("forum")) return "forums-blogs";
  if (u.includes(".com") || u.includes(".io") || u.includes(".co")) return "official";
  return "general";
}

function tierFromClass(sourceClass: ProbeTarget["class"]): SourceItem["tier"] {
  if (sourceClass === "official" || sourceClass === "filing") return "Tier 1";
  if (sourceClass === "news" || sourceClass === "analyst") return "Tier 2";
  return "Tier 3";
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
  const meta = text.match(/(article:published_time|article:modified_time|og:updated_time|publish-date|datePublished|dateModified)["'\s:=]+([0-9T:\-+Z\.]{8,})/i);
  if (meta?.[2]) return meta[2];
  const timeTag = text.match(/<time[^>]*datetime=["']([^"']+)["']/i);
  if (timeTag?.[1]) return timeTag[1];
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
    .slice(0, 7000);
}

async function fetchWithTimeout(url: string, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 GTMBriefingAgent/3.0" },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function parseRssItems(xml: string) {
  const items = [...xml.matchAll(/<item>[\s\S]*?<\/item>/g)].map((m) => m[0]);
  return items.map((item) => {
    const link = item.match(/<link>(https?:\/\/[^<]+)<\/link>/)?.[1];
    const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1];
    const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || item.match(/<updated>(.*?)<\/updated>/)?.[1];
    const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/)?.[1] || item.match(/<description>(.*?)<\/description>/)?.[1];
    const sourceUrl = item.match(/<source[^>]*url=["']([^"']+)["']/)?.[1];
    const chosenLink = sourceUrl || link;
    if (!chosenLink) return null;
    return {
      url: canonicalizeUrl(chosenLink),
      title: title?.trim(),
      snippet: description?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      detectedDate: pubDate,
    };
  }).filter(Boolean) as { url: string; title?: string; snippet?: string; detectedDate?: string }[];
}

async function searchRss(rssUrl: string, query?: string) {
  try {
    const res = await fetchWithTimeout(rssUrl, 7000);
    if (!res.ok) return [] as ProbeTarget[];
    const xml = await res.text();
    return parseRssItems(xml).map((item) => ({
      url: item.url,
      type: "public-page" as const,
      title: item.title,
      snippet: item.snippet,
      detectedDate: item.detectedDate,
      class: classifyUrl(item.url),
      weight: 0.5,
      query,
    }));
  } catch {
    return [] as ProbeTarget[];
  }
}

function relevanceScore(target: ProbeTarget, company: string, competitors: string[]) {
  const hay = `${target.title || ""} ${target.snippet || ""} ${target.url}`.toLowerCase();
  let score = 0;
  const keywords = [company, ...competitors, "earnings", "guidance", "launch", "pricing", "partnership", "revenue", "forecast", "announcement"].filter(Boolean);
  for (const k of keywords) {
    if (k && hay.includes(k.toLowerCase())) score += 0.08;
  }
  return Math.min(0.5, score);
}

function recencyScore(date?: string) {
  if (!date) return 0;
  const t = new Date(date).getTime();
  if (!Number.isFinite(t)) return 0;
  const days = (Date.now() - t) / (1000 * 60 * 60 * 24);
  if (days <= 7) return 0.5;
  if (days <= 30) return 0.35;
  if (days <= 90) return 0.2;
  if (days <= 180) return 0.1;
  return 0;
}

async function webSearchTargets(input: BriefInput) {
  const company = input.primaryCompany.trim();
  const competitors = input.competitors.join(" OR ");
  const ticker = lookupTicker(company) || cleanToken(company).toUpperCase();

  const queries = [
    `${company} latest news`,
    `${company} earnings guidance`,
    `${company} product announcement`,
    `${company} pricing update`,
    `${company} investor relations press release`,
    competitors ? `${company} vs (${competitors}) competitive update` : `${company} competitors update`,
  ];

  const providers = queries.flatMap((q) => [
    `https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=rss`,
    `https://www.bing.com/search?q=${encodeURIComponent(q)}&format=rss`,
    `https://news.google.com/rss/search?q=${encodeURIComponent(q)}`,
  ]);

  const yahoo = [
    `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(ticker)}&region=US&lang=en-US`,
  ];

  const resultSets = await Promise.all([...providers.map((p, i) => searchRss(p, queries[Math.floor(i / 3)])), ...yahoo.map((p) => searchRss(p, `${company} finance`))]);
  const flat = resultSets.flat();

  const dedup = new Map<string, ProbeTarget>();
  for (const t of flat) {
    const key = canonicalizeUrl(t.url);
    if (!dedup.has(key)) dedup.set(key, { ...t, url: key });
  }

  const ranked = [...dedup.values()].map((t) => {
    const rel = relevanceScore(t, company, input.competitors);
    const rec = recencyScore(t.detectedDate);
    return { ...t, weight: t.weight + rel + rec };
  });

  return ranked.sort((a, b) => b.weight - a.weight).slice(0, 80);
}

async function normalizeInputTypos(input: BriefInput) {
  const candidateSet = new Set<string>();
  const namesToCheck = [input.primaryCompany, ...input.competitors].filter(Boolean);

  for (const name of namesToCheck) {
    const alias = normalizeCompanyAlias(name);
    if (alias) candidateSet.add(alias);

    const queryFeeds = [
      `https://www.bing.com/search?q=${encodeURIComponent(`${name} company`)}&format=rss`,
      `https://news.google.com/rss/search?q=${encodeURIComponent(`${name} company`)}`,
    ];
    const searchResults = (await Promise.all(queryFeeds.map((u) => searchRss(u)))).flat();
    searchResults.forEach((r) => {
      if (r.title) {
        r.title.split(/[^A-Za-z0-9]+/).filter((x) => x.length >= 4).forEach((x) => candidateSet.add(titleCase(x)));
      }
      const fromUrl = guessCompanyFromUrl(r.url);
      if (fromUrl) candidateSet.add(fromUrl);
    });
  }

  const candidates = Array.from(candidateSet);
  const primaryCorrection = normalizeCompanyAlias(input.primaryCompany) || bestTypoCorrection(input.primaryCompany, candidates);
  const competitorCorrections = input.competitors.map((c) => normalizeCompanyAlias(c) || bestTypoCorrection(c, candidates) || c);

  return {
    normalizedInput: {
      ...input,
      primaryCompany: primaryCorrection || input.primaryCompany,
      competitors: competitorCorrections,
    },
    corrections: [
      ...(primaryCorrection && primaryCorrection !== input.primaryCompany ? [`Interpreted company '${input.primaryCompany}' as '${primaryCorrection}'.`] : []),
      ...input.competitors.map((c, i) => (competitorCorrections[i] !== c ? `Interpreted competitor '${c}' as '${competitorCorrections[i]}'.` : null)).filter(Boolean) as string[],
    ],
  };
}

async function fetchEvidence(target: ProbeTarget) {
  try {
    const res = await fetchWithTimeout(target.url, 7000);
    if (!res.ok) {
      if (target.title || target.snippet) {
        return {
          source: {
            title: target.title || `News signal: ${new URL(target.url).hostname}`,
            url: target.url,
            type: target.type,
            tier: tierFromClass(target.class),
            fetchedAt: new Date().toISOString(),
            detectedDate: target.detectedDate,
            note: `metadata-only; class=${target.class}; weight=${target.weight.toFixed(2)}`,
          } as SourceItem,
          text: `${target.title || ""}. ${target.snippet || ""}`.trim(),
        };
      }
      return null;
    }

    const html = await res.text();
    const text = safeTextFromHtml(html);
    const detectedDate = extractDate(html) || extractDate(text) || target.detectedDate;
    const titleFromHtml = html.match(/<title>(.*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ")?.trim();

    return {
      source: {
        title: target.title || titleFromHtml || `Public page: ${new URL(target.url).hostname}`,
        url: target.url,
        type: target.type,
        tier: tierFromClass(target.class),
        fetchedAt: new Date().toISOString(),
        detectedDate,
        note: `class=${target.class}; weight=${target.weight.toFixed(2)}`,
      } as SourceItem,
      text: `${target.title || ""}. ${target.snippet || ""}. ${text}`.trim().slice(0, 9000),
    };
  } catch {
    if (target.title || target.snippet) {
      return {
        source: {
          title: target.title || `News signal: ${new URL(target.url).hostname}`,
          url: target.url,
          type: target.type,
          tier: tierFromClass(target.class),
          fetchedAt: new Date().toISOString(),
          detectedDate: target.detectedDate,
          note: `metadata-only-fallback; class=${target.class}; weight=${target.weight.toFixed(2)}`,
        } as SourceItem,
        text: `${target.title || ""}. ${target.snippet || ""}`.trim(),
      };
    }
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
  const dated = sources
    .map((s) => ({ source: s, epoch: parseDateToEpoch(s.detectedDate) }))
    .filter((x): x is { source: SourceItem; epoch: number } => Boolean(x.epoch));

  if (dated.length === 0) {
    return {
      freshestEvidenceDate: undefined,
      daysSinceFreshest: undefined,
      status: "stale" as const,
      summary: "No explicit dated evidence detected across fetched sources. Recency-sensitive claims are constrained.",
    };
  }

  const freshest = Math.max(...dated.map((d) => d.epoch));
  const days = Math.floor((now - freshest) / (1000 * 60 * 60 * 24));

  if (days <= 90) {
    return { freshestEvidenceDate: new Date(freshest).toISOString(), daysSinceFreshest: days, status: "current" as const, summary: `Freshest dated evidence is ${days} days old.` };
  }
  if (days <= 180) {
    return { freshestEvidenceDate: new Date(freshest).toISOString(), daysSinceFreshest: days, status: "mixed" as const, summary: `Freshest dated evidence is ${days} days old; recency confidence is moderate.` };
  }
  return { freshestEvidenceDate: new Date(freshest).toISOString(), daysSinceFreshest: days, status: "stale" as const, summary: `Freshest dated evidence is ${days} days old; avoid confident recent-change claims.` };
}

function summarizeSourceTiers(sources: SourceItem[]) {
  return {
    tier1: sources.filter((s) => s.tier === "Tier 1").length,
    tier2: sources.filter((s) => s.tier === "Tier 2").length,
    tier3: sources.filter((s) => s.tier === "Tier 3").length,
  };
}

function toBand(score: number): "Low" | "Medium" | "High" {
  if (score >= 0.7) return "High";
  if (score >= 0.4) return "Medium";
  return "Low";
}

function confidenceBreakdownFromEvidence(sources: SourceItem[], freshness: { status: "current" | "mixed" | "stale" }) {
  const tier = summarizeSourceTiers(sources);
  const total = Math.max(1, sources.length);
  const coverageScore = Math.min(1, total / 20);
  const recencyScore = freshness.status === "current" ? 1 : freshness.status === "mixed" ? 0.55 : 0.2;
  const qualityScore = Math.min(1, (tier.tier1 * 1 + tier.tier2 * 0.7 + tier.tier3 * 0.25) / Math.max(1, total));

  return {
    sourceTierSummary: tier,
    confidenceBreakdown: {
      coverage: toBand(coverageScore),
      recency: toBand(recencyScore),
      sourceQuality: toBand(qualityScore),
    },
  };
}

function buildFallbackSignalsFromSources(sources: SourceItem[]) {
  const ranked = [...sources]
    .filter((s) => s.detectedDate)
    .sort((a, b) => (parseDateToEpoch(b.detectedDate) || 0) - (parseDateToEpoch(a.detectedDate) || 0))
    .slice(0, 6);

  return ranked.map((s) => ({
    claim: `${s.title} is a recent verified public signal from ${new URL(s.url).hostname}.`,
    sourceId: s.sourceId,
    sourceUrl: s.url,
    observedDate: s.detectedDate || "date not confirmed",
    dateConfidence: s.detectedDate ? "medium" as const : "low" as const,
  }));
}

async function buildProbeUrls(input: BriefInput, governance: SourceGovernance) {
  const urls: ProbeTarget[] = [];
  const seen = new Set<string>();
  const pushUnique = (target: ProbeTarget) => {
    const normalized = canonicalizeUrl(target.url);
    if (!normalized) return;
    if (!isAllowedByGovernance(target.class, target.type, governance)) return;
    const weight = classWeight(target.class, governance);
    if (weight <= 0) return;
    if (seen.has(normalized)) return;
    seen.add(normalized);
    urls.push({ ...target, url: normalized, weight: target.weight + weight });
  };

  (input.trustedUrls || []).slice(0, 12).forEach((url) => pushUnique({ url, type: "user-provided", title: "Trusted URL", class: classifyUrl(url), weight: governance.weights.official }));

  const companyOrigins = [input.companyWebsite, ...knownDomains(input.primaryCompany), ...inferDomainsFromName(input.primaryCompany)]
    .filter(Boolean)
    .map((u) => baseOrigin(u as string))
    .filter(Boolean);
  companyOrigins.forEach((origin) => pathHints.forEach((p) => pushUnique({ url: `${origin}${p}`, type: "company-site", class: "official", weight: governance.weights.official + 0.2 })));

  const competitorSites = [...(input.competitorWebsites || []), ...input.competitors.flatMap(knownDomains), ...input.competitors.flatMap(inferDomainsFromName)];
  competitorSites.slice(0, 16).forEach((site) => {
    const origin = baseOrigin(site);
    if (origin) pathHints.forEach((p) => pushUnique({ url: `${origin}${p}`, type: "competitor-site", class: "official", weight: governance.weights.official }));
  });

  const searchTargets = await webSearchTargets(input);
  searchTargets.forEach((t) => pushUnique(t));

  return urls.sort((a, b) => b.weight - a.weight).slice(0, Math.max(20, Math.min(120, governance.maxSearchResults + 20)));
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
    freshness: { status: "stale", summary: "No usable evidence due to pipeline failure." },
    confidenceCoverage: { confidence: "Low", evidenceQuality: "Generation failure; no reliable synthesis produced.", knownGaps: [reason] },
    confidenceBreakdown: { coverage: "Low", recency: "Low", sourceQuality: "Low" },
    sourceTierSummary: { tier1: 0, tier2: 0, tier3: 0 },
    companyProfile: { canonicalName: input.primaryCompany || "Unknown company" },
    sources: [],
    observedVsInferred: { observed: [], inferred: [] },
    generationNotes: [reason],
    systemRun: [{ step: "Synthesis", status: "failed", detail: reason }],
  };
}

export async function POST(req: Request) {
  const rawInput = (await req.json()) as BriefInput;
  const systemRun: GTMBrief["systemRun"] = [];

  if (!process.env.GEMINI_API_KEY) {
    const reason = "Live mode unavailable: GEMINI_API_KEY is not configured.";
    return NextResponse.json({ brief: makeErrorBrief(rawInput, reason), notices: [reason], generationError: reason } satisfies GenerateResponse);
  }

  const { normalizedInput: input, corrections } = await normalizeInputTypos(rawInput);
  systemRun.push({ step: "Input normalization", status: "done", detail: corrections.length ? corrections.join(" ") : "No typo corrections applied." });

  const governance = { ...defaultGovernance, ...(input.governance || {}) };
  governance.sourceClassFilters = { ...defaultGovernance.sourceClassFilters, ...(input.governance?.sourceClassFilters || {}) };
  governance.weights = { ...defaultGovernance.weights, ...(input.governance?.weights || {}) };

  const probePlan = await buildProbeUrls(input, governance);
  systemRun.push({ step: "Source discovery", status: "done", detail: `Planned ${probePlan.length} candidate sources.` });

  const fetchedRaw = (await Promise.all(probePlan.map((t) => fetchEvidence(t)))).filter(Boolean) as { source: SourceItem; text: string }[];
  const dedupByUrl = new Map<string, { source: SourceItem; text: string }>();
  for (const item of fetchedRaw) {
    const key = canonicalizeUrl(item.source.url);
    if (!dedupByUrl.has(key)) dedupByUrl.set(key, item);
  }
  const fetched = [...dedupByUrl.values()].map((f, i) => ({ ...f, source: { ...f.source, sourceId: `S${i + 1}` } }));
  const sources = fetched.map((f) => f.source);

  const freshness = freshnessFromSources(sources);
  const notices: string[] = [...corrections];

  if (sources.length === 0) notices.push("No evidence pages were reachable from public search and provided inputs. Add official company/competitor URLs.");
  if (freshness.status !== "current") notices.push(`Freshness status is ${freshness.status}. ${freshness.summary}`);

  systemRun.push({ step: "Evidence collection", status: sources.length > 0 ? "done" : "warning", detail: `${sources.length} sources fetched successfully.` });
  systemRun.push({ step: "Freshness audit", status: freshness.status === "current" ? "done" : "warning", detail: freshness.summary });

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
    systemRun.push({ step: "Planning", status: "done", detail: "Planner stage completed." });
  } catch {
    notices.push("Planner stage failed; synthesis continued.");
    systemRun.push({ step: "Planning", status: "warning", detail: "Planner stage failed; proceeded with synthesis." });
  }

  const recentSignals = sources
    .filter((s) => s.detectedDate)
    .sort((a, b) => (parseDateToEpoch(b.detectedDate) || 0) - (parseDateToEpoch(a.detectedDate) || 0))
    .slice(0, 12)
    .map((s) => ({ sourceId: s.sourceId, title: s.title, url: s.url, date: s.detectedDate, tier: s.tier }));

  const evidencePayload = fetched.map((f) => ({ source: f.source, excerpt: f.text.slice(0, 2200) }));

  const synthesisPrompt = `Create strict JSON only with schema:
{
"executiveSummary": string,
"latestVerifiedSignals": [{"claim": string, "sourceId": string, "sourceUrl": string, "observedDate": string, "dateConfidence": "high"|"medium"|"low"}],
"whatChanged": [{"claim": string, "sourceId": string, "sourceUrl": string, "observedDate": string, "dateConfidence": "high"|"medium"|"low"}],
"productPricingSignals": [{"claim": string, "sourceId": string, "sourceUrl": string, "observedDate": string, "dateConfidence": "high"|"medium"|"low"}],
"likelyICP": string[],
"messagingPositioning": string[],
"risks": string[],
"opportunities": string[],
"battlecard": {"strengths": string[],"weaknesses": string[],"likelyObjections": string[],"responseAngles": string[],"say": string[],"avoid": string[]},
"recommendedActions": {"sales": string[],"strategy": string[],"leadership": string[]},
"observedVsInferred": {"observed": string[], "inferred": string[]},
"confidenceCoverage": {"confidence": "Low"|"Medium"|"High", "evidenceQuality": string, "knownGaps": string[]},
"companyProfile": {"canonicalName": string, "ticker": string, "sector": string, "region": string}
}
Rules:
- Never fabricate events.
- LatestVerifiedSignals must prioritize recent, dated, trustworthy signals from provided evidence.
- Executive summary must reflect current public narrative when recent evidence exists.
- WhatChanged, ProductPricingSignals, Risks, Opportunities, and RecommendedActions must be informed by recent signals when available.
- Use valid sourceId values from provided evidence where possible (e.g., S1, S2).
- If date is unknown, use "date not confirmed".
Context:
Input=${JSON.stringify(input)}
Planner=${plannerText}
Freshness=${JSON.stringify(freshness)}
RecentSignals=${JSON.stringify(recentSignals)}
SourceIds=${sources.map((s) => s.sourceId).join(",")}
Evidence=${JSON.stringify(evidencePayload).slice(0, 32000)}
`;

  try {
    const result = await ai.models.generateContent({
      model,
      contents: synthesisPrompt,
      config: { temperature: 0.2, responseMimeType: "application/json" },
    });

    const parsed = JSON.parse(result.text || "{}");
    const fallbackSignals = buildFallbackSignalsFromSources(sources);
    const nonEmptyEvidence = (value: unknown, fallback: { claim: string; observedDate: string; dateConfidence: "low" | "medium"; sourceUrl?: string; sourceId?: string }[]) =>
      (Array.isArray(value) && value.length > 0 ? value : fallback);

    const { sourceTierSummary, confidenceBreakdown } = confidenceBreakdownFromEvidence(sources, freshness);

    const brief: GTMBrief = {
      id: `live-${Date.now()}`,
      createdAt: new Date().toISOString(),
      asOf: new Date().toISOString(),
      mode: "live",
      company: input.primaryCompany,
      competitors: input.competitors || [],
      objective: input.objective,
      audience: input.audience,
      executiveSummary: parsed.executiveSummary || "Evidence gathered successfully; current verified signals are summarized below.",
      latestVerifiedSignals: nonEmptyEvidence(parsed.latestVerifiedSignals, fallbackSignals.length > 0 ? fallbackSignals : [{ claim: "No strongly verifiable signal extracted from current evidence set.", observedDate: "date not confirmed", dateConfidence: "low" }]),
      whatChanged: nonEmptyEvidence(parsed.whatChanged, fallbackSignals.slice(0, 4).map((s) => ({ ...s, claim: `Recent signal change: ${s.claim}` }))),
      productPricingSignals: nonEmptyEvidence(parsed.productPricingSignals, [{ claim: "Insufficient evidence for verified product/pricing shifts.", observedDate: "date not confirmed", dateConfidence: "low" }]),
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
      confidenceBreakdown,
      sourceTierSummary,
      companyProfile: parsed.companyProfile || { canonicalName: input.primaryCompany, ticker: lookupTicker(input.primaryCompany) },
      sources,
      generationNotes: notices,
      systemRun: [...systemRun, { step: "Synthesis", status: "done", detail: "Generated analyst memo from weighted evidence." }],
    };

    if (freshness.status !== "current") {
      brief.confidenceCoverage.knownGaps = [...brief.confidenceCoverage.knownGaps, `Freshness is ${freshness.status}; recency-sensitive claims are constrained.`];
    }

    return NextResponse.json({ brief, notices } satisfies GenerateResponse);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown synthesis error";
    const reason = `Live generation failed: ${msg}`;
    const brief = makeErrorBrief(input, reason);
    brief.systemRun = [...systemRun, { step: "Synthesis", status: "failed", detail: reason }];
    return NextResponse.json({ brief, notices: [reason], generationError: reason } satisfies GenerateResponse);
  }
}
