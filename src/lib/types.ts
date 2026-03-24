export type QuickMode =
  | "Sales Battlecard"
  | "Founder Brief"
  | "Product Marketing Comparison"
  | "Executive Market Snapshot"
  | "Investor-style Competitive Memo";

export interface BriefInput {
  primaryCompany: string;
  competitors: string[];
  companyWebsite?: string;
  competitorWebsites?: string[];
  objective: string;
  audience: string;
  notes?: string;
  trustedUrls?: string[];
  quickMode?: QuickMode;
}

export interface SourceItem {
  title: string;
  url: string;
  type: "user-provided" | "public-page" | "model-inference";
  note?: string;
}

export interface Battlecard {
  strengths: string[];
  weaknesses: string[];
  likelyObjections: string[];
  responseAngles: string[];
  say: string[];
  avoid: string[];
}

export interface GTMBrief {
  id: string;
  createdAt: string;
  company: string;
  competitors: string[];
  objective: string;
  audience: string;
  executiveSummary: string;
  whatChanged: string[];
  productPricingSignals: string[];
  likelyICP: string[];
  messagingPositioning: string[];
  risks: string[];
  opportunities: string[];
  battlecard: Battlecard;
  recommendedActions: {
    sales: string[];
    strategy: string[];
    leadership: string[];
  };
  confidenceCoverage: {
    confidence: "Low" | "Medium" | "High";
    evidenceQuality: string;
    knownGaps: string[];
  };
  sources: SourceItem[];
  demoMode?: boolean;
}
