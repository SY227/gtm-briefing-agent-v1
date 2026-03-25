import { GTMBrief } from "./types";

export const sampleBriefs: GTMBrief[] = [
  {
    id: "sample-microsoft-slack",
    createdAt: new Date().toISOString(),
    asOf: new Date().toISOString(),
    mode: "demo",
    company: "Microsoft Teams",
    competitors: ["Slack"],
    objective: "Executive market snapshot",
    audience: "Executive",
    executiveSummary:
      "Observed public signals suggest continued packaging emphasis around Teams as part of Microsoft 365 value, while Slack messaging remains centered on cross-tool workflow productivity. Freshness is mixed: current high-level positioning is recent, but detailed pricing deltas are not consistently timestamped across pages.",
    latestVerifiedSignals: [
      {
        claim: "Teams remains prominently positioned as a collaboration layer within Microsoft 365 packaging.",
        sourceUrl: "https://www.microsoft.com/en/microsoft-teams/group-chat-software",
        observedDate: "date not confirmed",
        dateConfidence: "low",
      },
      {
        claim: "Slack continues to lead with productivity and channel-based workflow language on primary marketing pages.",
        sourceUrl: "https://slack.com",
        observedDate: "date not confirmed",
        dateConfidence: "low",
      },
    ],
    whatChanged: [
      {
        claim: "Potential changes in feature emphasis are visible in product messaging, but exact recency is not always explicitly dated.",
        observedDate: "date not confirmed",
        dateConfidence: "low",
      },
    ],
    productPricingSignals: [
      {
        claim: "Bundle positioning appears stronger than standalone pricing communication in top-level pages.",
        observedDate: "date not confirmed",
        dateConfidence: "low",
      },
    ],
    likelyICP: [
      "Mid-market and enterprise organizations standardizing collaboration under existing productivity suites.",
      "IT-led buyers balancing governance, integration, and cost consolidation.",
    ],
    messagingPositioning: [
      "Platform consolidation and enterprise compatibility.",
      "Workflow productivity and cross-functional collaboration outcomes.",
    ],
    risks: [
      "Recency ambiguity on detailed product/pricing updates can reduce confidence in short-window claims.",
      "Positioning convergence across major collaboration vendors increases differentiation pressure.",
    ],
    opportunities: [
      "Lead with dated proof points where available to improve credibility in executive narratives.",
      "Use role-specific ROI framing for finance, IT, and frontline managers.",
    ],
    battlecard: {
      strengths: ["Broad ecosystem alignment", "Enterprise distribution scale"],
      weaknesses: ["Potential complexity in mixed-tool environments"],
      likelyObjections: ["How quickly can teams migrate with minimal disruption?"],
      responseAngles: ["Show phased rollout and measurable adoption milestones."],
      say: ["Prioritize outcomes and governance clarity over feature checklist debates."],
      avoid: ["Do not overstate dated or unverified release claims."],
    },
    recommendedActions: {
      sales: ["Use a dated evidence slide in first-call prep materials."],
      strategy: ["Track top 10 recurring competitor claims with source timestamps."],
      leadership: ["Review stale-signal risk monthly and refresh positioning assets."],
    },
    freshness: {
      status: "mixed",
      summary: "Some usable public signals are visible, but many pages do not expose explicit update dates.",
    },
    confidenceCoverage: {
      confidence: "Medium",
      evidenceQuality: "Public web evidence with partial recency metadata.",
      knownGaps: ["No private roadmap or contract data.", "Some sections have date-not-confirmed evidence."],
    },
    observedVsInferred: {
      observed: ["Current headline positioning language on company websites."],
      inferred: ["Likely deal-motion implications for GTM teams."],
    },
    sources: [
      {
        title: "Microsoft Teams landing page",
        url: "https://www.microsoft.com/en/microsoft-teams/group-chat-software",
        type: "company-site",
        fetchedAt: new Date().toISOString(),
      },
      {
        title: "Slack homepage",
        url: "https://slack.com",
        type: "competitor-site",
        fetchedAt: new Date().toISOString(),
      },
    ],
    generationNotes: ["Sample demo report."],
  },
  {
    id: "sample-shopify-bigcommerce",
    createdAt: new Date().toISOString(),
    asOf: new Date().toISOString(),
    mode: "demo",
    company: "Shopify",
    competitors: ["BigCommerce"],
    objective: "Sales prep",
    audience: "Sales team",
    executiveSummary:
      "Public signals show Shopify continuing to position around merchant scale and ecosystem leverage. For this sample, the strongest evidence is evergreen positioning language; date-specific product shift claims should be treated as limited unless directly timestamped in source pages.",
    latestVerifiedSignals: [
      { claim: "Shopify messaging emphasizes commerce platform breadth and merchant growth outcomes.", sourceUrl: "https://www.shopify.com", observedDate: "date not confirmed", dateConfidence: "low" },
      { claim: "BigCommerce messaging highlights open SaaS and B2B/B2C flexibility.", sourceUrl: "https://www.bigcommerce.com", observedDate: "date not confirmed", dateConfidence: "low" },
    ],
    whatChanged: [
      { claim: "Insufficient dated evidence to assert specific recent product or pricing changes with high confidence.", observedDate: "date not confirmed", dateConfidence: "low" },
    ],
    productPricingSignals: [
      { claim: "Both vendors emphasize platform value outcomes over highly granular dated pricing deltas in top-level messaging.", observedDate: "date not confirmed", dateConfidence: "low" },
    ],
    likelyICP: ["Digital brands scaling multi-channel commerce.", "Teams balancing speed-to-market with extensibility."],
    messagingPositioning: ["Platform scale narrative", "Ecosystem and flexibility narrative"],
    risks: ["Low date precision in available pages for short-window claims."],
    opportunities: ["Use cautious, evidence-first talk tracks in customer-facing comparisons."],
    battlecard: {
      strengths: ["Strong ecosystem recognition"],
      weaknesses: ["Potential migration sensitivity"],
      likelyObjections: ["How hard is platform switching at our scale?"],
      responseAngles: ["Quantify phased migration and operational risk controls."],
      say: ["Anchor arguments in verifiable source-backed differences."],
      avoid: ["Avoid overconfident claims without timestamps."],
    },
    recommendedActions: {
      sales: ["Use confidence labels in every competitive slide."],
      strategy: ["Increase coverage with dated release-note and newsroom URLs."],
      leadership: ["Require evidence freshness checks before quarterly narrative updates."],
    },
    freshness: { status: "stale", summary: "No strong sub-90-day evidence identified in this sample." },
    confidenceCoverage: {
      confidence: "Low",
      evidenceQuality: "Limited dated evidence in sample source set.",
      knownGaps: ["No dated press/release pages included."],
    },
    observedVsInferred: {
      observed: ["Current high-level website positioning."],
      inferred: ["Sales implications derived from positioning patterns."],
    },
    sources: [
      { title: "Shopify homepage", url: "https://www.shopify.com", type: "company-site", fetchedAt: new Date().toISOString() },
      { title: "BigCommerce homepage", url: "https://www.bigcommerce.com", type: "competitor-site", fetchedAt: new Date().toISOString() },
    ],
    generationNotes: ["Sample demo report."],
  },
];
