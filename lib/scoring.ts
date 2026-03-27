import type { BusinessCategory, BusinessRecord, PipelineStage } from '@/types/business';

const DEFAULT_WEIGHTS = {
  digitalMaturityGap: 0.3,
  painPoint: 0.25,
  valuePotential: 0.25,
  closeLikelihood: 0.2,
};

const CATEGORY_VALUE_MULTIPLIER: Record<BusinessCategory, number> = {
  restaurant: 1.15,
  retail: 1,
  tourism_hospitality: 1.2,
  transport: 1.05,
  health_beauty: 1.1,
  professional_services: 1.2,
  construction: 1.1,
  real_estate: 1.25,
  automotive: 1.05,
  grocery: 0.95,
  education: 1,
  other: 1,
};

const STAGE_CLOSE_MULTIPLIER: Record<PipelineStage, number> = {
  discovered: 0.2,
  enriched: 0.3,
  audited: 0.4,
  qualified: 0.5,
  contacted: 0.6,
  responded: 0.7,
  meeting_booked: 0.8,
  proposal_sent: 0.9,
  won: 1,
  lost: 0,
  nurture: 0.35,
};

export type ScoreBreakdown = {
  digitalMaturityScore: number;
  painPointScore: number;
  valuePotentialScore: number;
  closeLikelihoodScore: number;
  priorityScore: number;
  estimatedDealValueUsd: number;
  weightedPipelineValueUsd: number;
};

const clamp = (value: number, min = 0, max = 100): number =>
  Math.max(min, Math.min(max, Math.round(value)));

export function calculateDigitalMaturityScore(business: BusinessRecord): number {
  let score = 0;

  if (business.hasWebsite) score += 25;
  if (business.hasSocialPresence) score += 20;
  if (business.hasRecentSocialActivity) score += 15;
  if (business.hasOnlineBooking) score += 20;
  if (business.hasOnlineOrdering || business.hasOnlineMenu) score += 20;

  return clamp(score);
}

export function calculatePainPointScore(business: BusinessRecord): number {
  let score = 40;

  if (!business.hasWebsite) score += 20;
  if (!business.hasSocialPresence) score += 15;
  if (business.hasSocialPresence && !business.hasRecentSocialActivity) score += 10;
  if (business.category === 'restaurant' && !business.hasOnlineMenu) score += 10;
  if (business.category === 'tourism_hospitality' && !business.hasOnlineBooking) score += 10;

  if (typeof business.rating === 'number' && business.rating < 4) score += 5;
  if (typeof business.reviewCount === 'number' && business.reviewCount < 20) score += 5;

  return clamp(score);
}

export function calculateValuePotentialScore(business: BusinessRecord): number {
  const base = 55;
  const categoryBonus = CATEGORY_VALUE_MULTIPLIER[business.category] * 20;
  const digitalGapBonus = 100 - (business.digitalMaturityScore ?? calculateDigitalMaturityScore(business));
  return clamp(base + categoryBonus + digitalGapBonus * 0.2);
}

export function calculateCloseLikelihoodScore(business: BusinessRecord): number {
  let score = 35;

  if (business.phone || business.email) score += 20;
  if (business.website) score += 10;
  if (business.googleBusinessProfile) score += 10;

  if (business.pipelineStage) {
    score += STAGE_CLOSE_MULTIPLIER[business.pipelineStage] * 20;
  }

  return clamp(score);
}

export function calculatePriorityScore(business: BusinessRecord): number {
  const digitalMaturity = business.digitalMaturityScore ?? calculateDigitalMaturityScore(business);
  const painPoint = business.painPointScore ?? calculatePainPointScore(business);
  const valuePotential = business.valuePotentialScore ?? calculateValuePotentialScore({
    ...business,
    digitalMaturityScore: digitalMaturity,
  });
  const closeLikelihood = business.closeLikelihoodScore ?? calculateCloseLikelihoodScore(business);

  const digitalMaturityGap = 100 - digitalMaturity;

  const score =
    digitalMaturityGap * DEFAULT_WEIGHTS.digitalMaturityGap +
    painPoint * DEFAULT_WEIGHTS.painPoint +
    valuePotential * DEFAULT_WEIGHTS.valuePotential +
    closeLikelihood * DEFAULT_WEIGHTS.closeLikelihood;

  return clamp(score);
}

export function estimateDealValueUsd(business: BusinessRecord): number {
  const baseRetainer = 1200;
  const categoryMultiplier = CATEGORY_VALUE_MULTIPLIER[business.category];
  const painPoint = business.painPointScore ?? calculatePainPointScore(business);
  const valuePotential = business.valuePotentialScore ?? calculateValuePotentialScore(business);

  const painFactor = 0.6 + painPoint / 100;
  const valueFactor = 0.8 + valuePotential / 100;

  return Math.round(baseRetainer * categoryMultiplier * painFactor * valueFactor);
}

export function scoreBusiness(business: BusinessRecord): ScoreBreakdown {
  const digitalMaturityScore = calculateDigitalMaturityScore(business);
  const painPointScore = calculatePainPointScore({
    ...business,
    digitalMaturityScore,
  });
  const valuePotentialScore = calculateValuePotentialScore({
    ...business,
    digitalMaturityScore,
  });
  const closeLikelihoodScore = calculateCloseLikelihoodScore(business);
  const priorityScore = calculatePriorityScore({
    ...business,
    digitalMaturityScore,
    painPointScore,
    valuePotentialScore,
    closeLikelihoodScore,
  });

  const estimatedDealValueUsd = estimateDealValueUsd({
    ...business,
    painPointScore,
    valuePotentialScore,
  });

  const stageMultiplier = business.pipelineStage
    ? STAGE_CLOSE_MULTIPLIER[business.pipelineStage]
    : STAGE_CLOSE_MULTIPLIER.discovered;

  return {
    digitalMaturityScore,
    painPointScore,
    valuePotentialScore,
    closeLikelihoodScore,
    priorityScore,
    estimatedDealValueUsd,
    weightedPipelineValueUsd: Math.round(estimatedDealValueUsd * stageMultiplier),
  };
}
