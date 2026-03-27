export type Island = 'st_thomas' | 'st_john' | 'st_croix';

export type PipelineStage =
  | 'discovered'
  | 'enriched'
  | 'audited'
  | 'qualified'
  | 'contacted'
  | 'responded'
  | 'meeting_booked'
  | 'proposal_sent'
  | 'won'
  | 'lost'
  | 'nurture';

export type BusinessCategory =
  | 'restaurant'
  | 'retail'
  | 'tourism_hospitality'
  | 'transport'
  | 'health_beauty'
  | 'professional_services'
  | 'construction'
  | 'real_estate'
  | 'automotive'
  | 'grocery'
  | 'education'
  | 'other';

export type BusinessStatus = 'active' | 'inactive' | 'lead' | 'unspecified';

export type BusinessRecord = {
  id: string;
  name: string;
  legalName?: string;
  island: Island;
  district?: string;
  city?: string;
  neighborhood?: string;

  category: BusinessCategory;
  subcategory?: string;
  status: BusinessStatus;

  description?: string;
  phone?: string;
  email?: string;
  website?: string;

  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  country?: string;

  latitude?: number;
  longitude?: number;

  ownerName?: string;

  facebook?: string;
  instagram?: string;
  googleBusinessProfile?: string;

  reviewCount?: number;
  rating?: number;
  tags?: string[];

  hasWebsite?: boolean;
  hasOnlineMenu?: boolean;
  hasOnlineBooking?: boolean;
  hasOnlineOrdering?: boolean;
  hasSocialPresence?: boolean;
  hasRecentSocialActivity?: boolean;

  digitalMaturityScore?: number;
  painPointScore?: number;
  valuePotentialScore?: number;
  closeLikelihoodScore?: number;
  priorityScore?: number;

  estimatedDealValueUsd?: number;
  recommendedOffer?: string;

  pipelineStage?: PipelineStage;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  notes?: string;

  source?: string;
  sourceUrl?: string;

  createdAt?: string;
  updatedAt?: string;
};

export type BusinessAudit = {
  businessId: string;
  generatedAt: string;
  digitalPresenceAudit: string;
  likelyPainPoints: string[];
  recommendedServiceOffer: string;
  outreachDraft: string;
  confidenceScore: number;
};

export const PIPELINE_STAGES: PipelineStage[] = [
  'discovered',
  'enriched',
  'audited',
  'qualified',
  'contacted',
  'responded',
  'meeting_booked',
  'proposal_sent',
  'won',
  'lost',
  'nurture',
];

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  'restaurant',
  'retail',
  'tourism_hospitality',
  'transport',
  'health_beauty',
  'professional_services',
  'construction',
  'real_estate',
  'automotive',
  'grocery',
  'education',
  'other',
];

export const ISLANDS: Island[] = ['st_thomas', 'st_john', 'st_croix'];
