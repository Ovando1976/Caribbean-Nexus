export const ISLANDS = ["st_thomas", "st_john", "st_croix"] as const;
export type IslandCode = (typeof ISLANDS)[number];

export const BUSINESS_CATEGORIES = [
  "restaurant",
  "retail",
  "tourism_hospitality",
  "transport",
  "health_beauty",
  "professional_services",
  "construction",
  "real_estate",
  "automotive",
  "grocery",
  "education",
  "other",
] as const;
export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];

export const BUSINESS_STATUS = ["active", "inactive", "lead", "unspecified"] as const;
export type BusinessStatus = (typeof BUSINESS_STATUS)[number];

export const PIPELINE_STAGES = [
  "discovered",
  "enriched",
  "audited",
  "qualified",
  "contacted",
  "responded",
  "meeting_booked",
  "proposal_sent",
  "won",
  "lost",
  "nurture",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export type SocialLinks = {
  facebook?: string;
  instagram?: string;
  googleBusinessProfile?: string;
  tiktok?: string;
  linkedin?: string;
};

export type AddressRecord = {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
  postalCode?: string;
  country?: string;
};

export type GeoRecord = {
  latitude?: number;
  longitude?: number;
};

export type DigitalPresenceFlags = {
  hasWebsite?: boolean;
  hasOnlineMenu?: boolean;
  hasOnlineBooking?: boolean;
  hasOnlineOrdering?: boolean;
  hasSocialPresence?: boolean;
  hasRecentSocialActivity?: boolean;
  hasGoogleBusinessProfile?: boolean;
};

export type BusinessScores = {
  digitalMaturityScore?: number;
  painPointScore?: number;
  valuePotentialScore?: number;
  closeLikelihoodScore?: number;
  priorityScore?: number;
};

export type ReviewMetrics = {
  reviewCount?: number;
  rating?: number;
};

export type BusinessSource = {
  source?: string;
  sourceUrl?: string;
};

export type BusinessAuditSummary = {
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  recommendedOffer?: string;
  recommendedMonthlyValue?: number;
};

export type BusinessActivity = {
  id: string;
  type:
    | "created"
    | "updated"
    | "enriched"
    | "audit_generated"
    | "outreach_generated"
    | "pipeline_changed"
    | "note_added"
    | "contacted";
  message: string;
  createdAt: string;
  actor?: string;
};

export type BusinessRecord = {
  id: string;
  name: string;
  legalName?: string;

  island: IslandCode;
  category: BusinessCategory;
  subcategory?: string;
  status: BusinessStatus;

  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  ownerName?: string;

  address?: AddressRecord;
  geo?: GeoRecord;
  social?: SocialLinks;

  tags?: string[];

  pipelineStage?: PipelineStage;
  notes?: string;
  lastContactedAt?: string;

  reviewMetrics?: ReviewMetrics;
  digitalPresence?: DigitalPresenceFlags;
  scores?: BusinessScores;
  audit?: BusinessAuditSummary;

  source?: BusinessSource;

  createdAt?: string;
  updatedAt?: string;
};

export type BusinessInput = Omit<BusinessRecord, "id" | "createdAt" | "updatedAt">;

export type BusinessUpdate = Partial<BusinessInput>;

export type BusinessFilters = {
  island?: IslandCode | "all";
  category?: BusinessCategory | "all";
  status?: BusinessStatus | "all";
  pipelineStage?: PipelineStage | "all";
  minPriorityScore?: number;
  search?: string;
};

export const DEFAULT_BUSINESS_SCORES: Required<BusinessScores> = {
  digitalMaturityScore: 0,
  painPointScore: 0,
  valuePotentialScore: 0,
  closeLikelihoodScore: 0,
  priorityScore: 0,
};

export function isIslandCode(value: string): value is IslandCode {
  return ISLANDS.includes(value as IslandCode);
}

export function isBusinessCategory(value: string): value is BusinessCategory {
  return BUSINESS_CATEGORIES.includes(value as BusinessCategory);
}

export function isBusinessStatus(value: string): value is BusinessStatus {
  return BUSINESS_STATUS.includes(value as BusinessStatus);
}

export function isPipelineStage(value: string): value is PipelineStage {
  return PIPELINE_STAGES.includes(value as PipelineStage);
}
