export type QuickMode =
  | "Sales Battlecard"
  | "Founder Brief"
  | "Product Marketing Comparison"
  | "Executive Market Snapshot"
  | "Investor-style Competitive Memo";

export interface SourceGovernance {
  sourceClassFilters: {
    officialCompany: boolean;
    officialCompetitor: boolean;
    news: boolean;
    analystResearch: boolean;
    regulatoryFilings: boolean;
    forumsBlogs: boolean;
  };
  excludeForumsBlogs: boolean;
  maxSearchResults: number;
  weights: {
    official: number;
    news: number;
    analyst: number;
    filings: number;
  };
}

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
  governance?: SourceGovernance;
}

export type SourceType = "user-provided" | "company-site" | "competitor-site" | "public-page";

export interface SourceItem {
  title: string;
  url: string;
  type: SourceType;
  fetchedAt: string;
  detectedDate?: string;
  note?: string;
}

export interface EvidenceLine {
  claim: string;
  sourceUrl?: string;
  observedDate?: string;
  dateConfidence: "high" | "medium" | "low";
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
  asOf: string;
  mode: "live" | "demo" | "error-fallback";
  company: string;
  competitors: string[];
  objective: string;
  audience: string;
  executiveSummary: string;
  latestVerifiedSignals: EvidenceLine[];
  whatChanged: EvidenceLine[];
  productPricingSignals: EvidenceLine[];
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
  freshness: {
    freshestEvidenceDate?: string;
    daysSinceFreshest?: number;
    status: "current" | "mixed" | "stale";
    summary: string;
  };
  confidenceCoverage: {
    confidence: "Low" | "Medium" | "High";
    evidenceQuality: string;
    knownGaps: string[];
  };
  sources: SourceItem[];
  observedVsInferred: {
    observed: string[];
    inferred: string[];
  };
  generationNotes?: string[];
}

export interface GenerateResponse {
  brief: GTMBrief;
  notices: string[];
  generationError?: string;
}
