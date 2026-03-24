import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { sampleBriefs } from "@/lib/sample-data";
import { BriefInput, GTMBrief } from "@/lib/types";

export const runtime = "nodejs";

const model = "gemini-2.5-flash-lite";

function safeTextFromHtml(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4500);
}

async function fetchEvidence(url: string) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 GTMBriefingAgent/1.0" } });
    if (!res.ok) return null;
    const html = await res.text();
    return { url, text: safeTextFromHtml(html) };
  } catch {
    return null;
  }
}

function demoResponse(input: BriefInput): GTMBrief {
  const base = sampleBriefs[0];
  return {
    ...base,
    id: `demo-${Date.now()}`,
    createdAt: new Date().toISOString(),
    company: input.primaryCompany || base.company,
    competitors: input.competitors.length ? input.competitors : base.competitors,
    objective: input.objective || base.objective,
    audience: input.audience || base.audience,
    confidenceCoverage: {
      ...base.confidenceCoverage,
      knownGaps: [
        "Running in demo mode because GEMINI_API_KEY is missing.",
        ...base.confidenceCoverage.knownGaps,
      ],
    },
    demoMode: true,
  };
}

export async function POST(req: Request) {
  const input = (await req.json()) as BriefInput;

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ brief: demoResponse(input) });
  }

  const trustedUrls = (input.trustedUrls || []).slice(0, 8);
  const evidence = (await Promise.all(trustedUrls.map(fetchEvidence))).filter(Boolean) as { url: string; text: string }[];

  const plannerPrompt = `You are an analyst planner. Return compact JSON only with keys researchFocus (string[]), evidenceGaps (string[]), caveats (string[]).
Company: ${input.primaryCompany}
Competitors: ${input.competitors.join(", ")}
Objective: ${input.objective}
Audience: ${input.audience}
Notes: ${input.notes || "none"}`;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const planResponse = await ai.models.generateContent({
    model,
    contents: plannerPrompt,
    config: { temperature: 0.2 },
  });

  const synthesisPrompt = `Create a strict JSON object for a GTM briefing with this exact schema:
{
  "executiveSummary": string,
  "whatChanged": string[],
  "productPricingSignals": string[],
  "likelyICP": string[],
  "messagingPositioning": string[],
  "risks": string[],
  "opportunities": string[],
  "battlecard": {"strengths": string[],"weaknesses": string[],"likelyObjections": string[],"responseAngles": string[],"say": string[],"avoid": string[]},
  "recommendedActions": {"sales": string[],"strategy": string[],"leadership": string[]},
  "confidenceCoverage": {"confidence": "Low"|"Medium"|"High","evidenceQuality": string,"knownGaps": string[]}
}
Rules:
- Separate observed facts from inference and avoid fabricated specifics.
- If evidence is weak, explicitly state insufficient evidence.
- Keep concise and executive-friendly.
Context:
Input=${JSON.stringify(input)}
Planner=${planResponse.text}
Evidence snippets=${JSON.stringify(evidence).slice(0, 14000)}
`;

  try {
    const result = await ai.models.generateContent({
      model,
      contents: synthesisPrompt,
      config: { temperature: 0.25, responseMimeType: "application/json" },
    });

    const parsed = JSON.parse(result.text || "{}");
    const brief: GTMBrief = {
      id: `live-${Date.now()}`,
      createdAt: new Date().toISOString(),
      company: input.primaryCompany,
      competitors: input.competitors,
      objective: input.objective,
      audience: input.audience,
      executiveSummary: parsed.executiveSummary || "Insufficient evidence for a confident summary.",
      whatChanged: parsed.whatChanged || [],
      productPricingSignals: parsed.productPricingSignals || [],
      likelyICP: parsed.likelyICP || [],
      messagingPositioning: parsed.messagingPositioning || [],
      risks: parsed.risks || [],
      opportunities: parsed.opportunities || [],
      battlecard: parsed.battlecard || { strengths: [], weaknesses: [], likelyObjections: [], responseAngles: [], say: [], avoid: [] },
      recommendedActions: parsed.recommendedActions || { sales: [], strategy: [], leadership: [] },
      confidenceCoverage: parsed.confidenceCoverage || {
        confidence: "Low",
        evidenceQuality: "Model response parse fallback.",
        knownGaps: ["Model did not return full confidence metadata."],
      },
      sources: [
        ...(trustedUrls.map((url) => ({ title: "User provided URL", url, type: "user-provided" as const }))),
        ...evidence.map((e) => ({ title: "Fetched public page", url: e.url, type: "public-page" as const })),
      ],
      demoMode: false,
    };

    return NextResponse.json({ brief });
  } catch {
    return NextResponse.json({ brief: demoResponse(input) });
  }
}
