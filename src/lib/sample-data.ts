import { GTMBrief } from "./types";

export const sampleBriefs: GTMBrief[] = [
  {
    id: "sample-notion-clickup",
    createdAt: new Date().toISOString(),
    company: "Notion",
    competitors: ["ClickUp", "Asana"],
    objective: "Product comparison",
    audience: "Product marketing",
    executiveSummary:
      "Notion continues to position as an all-in-one workspace while competitors emphasize execution velocity and AI-assisted workflows. GTM opportunity is to frame Notion as the flexible system of record for cross-functional teams with stronger narrative around enterprise governance.",
    whatChanged: [
      "Higher visibility of AI assistant features in core navigation and marketing pages.",
      "Broader team plan messaging with collaboration and admin controls highlighted.",
      "Competitors increasingly claim faster setup and clearer out-of-the-box project workflows.",
    ],
    productPricingSignals: [
      "Freemium entry remains central; monetization focus appears to be team adoption and admin capabilities.",
      "AI capabilities are used as value expansion signals rather than standalone positioning.",
      "Competitors frame packaged templates and automations as immediate ROI.",
    ],
    likelyICP: [
      "Cross-functional startups scaling from 20 to 500 employees.",
      "Product and ops leaders needing docs + project orchestration in one place.",
      "Teams seeking a customizable operating layer over rigid task tools.",
    ],
    messagingPositioning: [
      "Core narrative: flexible connected workspace, not just task tracking.",
      "Enterprise reassurance through security, controls, and knowledge centralization.",
      "Emphasis on reducing tool sprawl and context switching.",
    ],
    risks: [
      "Perception that flexibility requires more setup than competitor templates.",
      "AI differentiation could blur as category claims converge.",
      "Task-execution buyers may still default to execution-first incumbents.",
    ],
    opportunities: [
      "Lead with time-to-value playbooks for common operational motions.",
      "Bundle governance + AI + search as enterprise productivity outcome.",
      "Create sharper replacement messaging for fragmented doc/task stacks.",
    ],
    battlecard: {
      strengths: [
        "Strong brand affinity across product and startup communities.",
        "High flexibility across docs, wikis, and lightweight project workflows.",
        "Large ecosystem of templates and integrations.",
      ],
      weaknesses: [
        "Can appear open-ended for teams that need strict process controls.",
        "Execution and reporting depth may feel lighter than PM-specialized tools.",
      ],
      likelyObjections: [
        "Will this be too customizable and hard to standardize?",
        "Can leadership get reliable portfolio reporting?",
      ],
      responseAngles: [
        "Show guided workspace blueprints with opinionated operating cadences.",
        "Demonstrate rollups and dashboards tied to leadership KPIs.",
      ],
      say: [
        "Use Notion when your team needs one system for knowledge + execution.",
        "Standardize quickly with prebuilt workflows, then adapt safely as you scale.",
      ],
      avoid: [
        "Avoid claiming Notion replaces deep specialized PM systems in every scenario.",
        "Avoid dismissing governance concerns—address them directly.",
      ],
    },
    recommendedActions: {
      sales: [
        "Open discovery with tool sprawl pain and handoff breakdowns.",
        "Use a 14-day migration plan artifact during late-stage deals.",
      ],
      strategy: [
        "Prioritize packaging around operating-system narrative by segment.",
        "Strengthen migration proof points for enterprise buyers.",
      ],
      leadership: [
        "Track win/loss against execution-first PM tools by deal size.",
        "Invest in ICP-specific onboarding templates with measurable outcomes.",
      ],
    },
    confidenceCoverage: {
      confidence: "Medium",
      evidenceQuality:
        "Based on publicly visible product/pricing narratives and category-level patterns.",
      knownGaps: [
        "No private usage telemetry or pipeline conversion data included.",
        "Limited to publicly available messaging at time of brief.",
      ],
    },
    sources: [
      { title: "Notion homepage", url: "https://www.notion.so", type: "public-page" },
      { title: "ClickUp homepage", url: "https://clickup.com", type: "public-page" },
      { title: "Asana homepage", url: "https://asana.com", type: "public-page" },
    ],
    demoMode: true,
  },
  {
    id: "sample-stripe-adyen",
    createdAt: new Date().toISOString(),
    company: "Stripe",
    competitors: ["Adyen", "Braintree"],
    objective: "Executive market snapshot",
    audience: "Executive",
    executiveSummary:
      "Stripe maintains strong developer-led distribution while enterprise buyers increasingly evaluate total payment performance and global complexity handling. Strategic positioning opportunity is to pair developer speed with concrete enterprise economics and reliability outcomes.",
    whatChanged: [
      "Continued expansion of financial infrastructure narrative beyond basic payments.",
      "Competitors emphasize enterprise-grade optimization and international scale depth.",
      "Category messaging increasingly tied to AI fraud prevention and conversion lift.",
    ],
    productPricingSignals: [
      "Pricing narratives remain usage-centric with emphasis on platform breadth.",
      "Enterprise buyers likely negotiate around optimization and regional capabilities.",
      "Differentiation pressure rising around measurable authorization gains.",
    ],
    likelyICP: [
      "Digital-first companies needing rapid integration and global expansion.",
      "Scale-ups maturing from startup simplicity to multi-region operations.",
      "Platforms and marketplaces with complex payout and compliance needs.",
    ],
    messagingPositioning: [
      "Developer-first, infrastructure-level reliability and speed.",
      "Unified stack messaging to reduce vendor fragmentation.",
      "Strong ecosystem and extensibility narrative.",
    ],
    risks: [
      "Enterprise economic story may be less explicit than optimization-first rivals.",
      "Commodity perception risk in core payments layer.",
      "Regional depth comparisons can create uncertainty in late-stage enterprise deals.",
    ],
    opportunities: [
      "Quantify business impact beyond integration speed.",
      "Segment go-to-market by transaction complexity and geography.",
      "Promote bundled capabilities as strategic margin lever.",
    ],
    battlecard: {
      strengths: ["Developer experience", "Platform breadth", "Global brand trust"],
      weaknesses: ["Potential commodity framing", "Enterprise ROI articulation gaps"],
      likelyObjections: [
        "Can you beat specialist performance in our key markets?",
        "What is the quantified margin impact at our scale?",
      ],
      responseAngles: [
        "Lead with measured conversion, uptime, and launch-speed outcomes.",
        "Map architecture flexibility to future expansion plans.",
      ],
      say: ["Use Stripe to scale faster without rebuilding payment infrastructure."],
      avoid: ["Avoid generic 'all-in-one' claims without economic proof points."],
    },
    recommendedActions: {
      sales: ["Package ROI templates by vertical and region."],
      strategy: ["Deepen enterprise proof-point library."],
      leadership: ["Align product roadmap storytelling to CFO-level outcomes."],
    },
    confidenceCoverage: {
      confidence: "Medium",
      evidenceQuality: "Public pages + category dynamics, no private contract data.",
      knownGaps: ["No customer-level pricing agreements included."],
    },
    sources: [
      { title: "Stripe website", url: "https://stripe.com", type: "public-page" },
      { title: "Adyen website", url: "https://www.adyen.com", type: "public-page" },
    ],
    demoMode: true,
  },
];

export const featuredSampleBrief = sampleBriefs[0];
