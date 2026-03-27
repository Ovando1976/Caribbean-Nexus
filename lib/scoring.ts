import type {
  BusinessCategory,
  BusinessRecord,
  BusinessScores,
  DigitalPresenceFlags,
} from "@/types/business";

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeText(value?: string): string {
  return (value ?? "").trim().toLowerCase();
}

function hasMeaningfulWebsite(url?: string): boolean {
  if (!url) return false;
  const value = normalizeText(url);
  return value.length > 6 && (value.includes(".com") || value.startsWith("http"));
}

function hasContactInfo(business: BusinessRecord): boolean {
  return Boolean(
    normalizeText(business.phone) ||
      normalizeText(business.email) ||
      hasMeaningfulWebsite(business.website),
  );
}

function getPresenceFlags(business: BusinessRecord): Required<DigitalPresenceFlags> {
  const raw = business.digitalPresence ?? {};

  return {
    hasWebsite: raw.hasWebsite ?? hasMeaningfulWebsite(business.website),
    hasOnlineMenu: raw.hasOnlineMenu ?? false,
    hasOnlineBooking: raw.hasOnlineBooking ?? false,
    hasOnlineOrdering: raw.hasOnlineOrdering ?? false,
    hasSocialPresence:
      raw.hasSocialPresence ??
      Boolean(
        business.social?.facebook ||
          business.social?.instagram ||
          business.social?.tiktok ||
          business.social?.linkedin,
      ),
    hasRecentSocialActivity: raw.hasRecentSocialActivity ?? false,
    hasGoogleBusinessProfile:
      raw.hasGoogleBusinessProfile ?? Boolean(business.social?.googleBusinessProfile),
  };
}

function getCategoryValueWeight(category: BusinessCategory): number {
  switch (category) {
    case "tourism_hospitality":
      return 95;
    case "restaurant":
      return 90;
    case "real_estate":
      return 88;
    case "transport":
      return 84;
    case "health_beauty":
      return 82;
    case "professional_services":
      return 80;
    case "retail":
      return 72;
    case "construction":
      return 70;
    case "grocery":
      return 62;
    case "automotive":
      return 60;
    case "education":
      return 58;
    case "other":
    default:
      return 55;
  }
}

export function calculateDigitalMaturityScore(business: BusinessRecord): number {
  const flags = getPresenceFlags(business);

  let score = 0;

  if (flags.hasWebsite) score += 30;
  if (flags.hasSocialPresence) score += 15;
  if (flags.hasRecentSocialActivity) score += 10;
  if (flags.hasGoogleBusinessProfile) score += 10;
  if (flags.hasOnlineMenu) score += 10;
  if (flags.hasOnlineBooking) score += 12;
  if (flags.hasOnlineOrdering) score += 13;

  if (business.reviewMetrics?.reviewCount && business.reviewMetrics.reviewCount > 20) {
    score += 5;
  }

  if (business.reviewMetrics?.rating && business.reviewMetrics.rating >= 4.2) {
    score += 5;
  }

  return clamp(score);
}

export function calculatePainPointScore(business: BusinessRecord): number {
  const flags = getPresenceFlags(business);

  let score = 0;

  if (!flags.hasWebsite) score += 25;
  if (!flags.hasSocialPresence) score += 15;
  if (!flags.hasGoogleBusinessProfile) score += 12;
  if (!hasContactInfo(business)) score += 18;

  if (business.category === "restaurant" && !flags.hasOnlineMenu) score += 12;
  if (business.category === "restaurant" && !flags.hasOnlineOrdering) score += 8;
  if (
    (business.category === "tourism_hospitality" ||
      business.category === "health_beauty" ||
      business.category === "real_estate") &&
    !flags.hasOnlineBooking
  ) {
    score += 14;
  }

  if (flags.hasSocialPresence && !flags.hasRecentSocialActivity) {
    score += 8;
  }

  return clamp(score);
}

export function calculateValuePotentialScore(business: BusinessRecord): number {
  const categoryBase = getCategoryValueWeight(business.category);
  let score = categoryBase;

  const reviews = business.reviewMetrics?.reviewCount ?? 0;
  const rating = business.reviewMetrics?.rating ?? 0;

  if (reviews >= 100) score += 8;
  else if (reviews >= 30) score += 5;
  else if (reviews >= 10) score += 2;

  if (rating >= 4.5) score += 3;

  if (business.category === "tourism_hospitality" || business.category === "restaurant") {
    score += 4;
  }

  return clamp(score);
}

export function calculateCloseLikelihoodScore(business: BusinessRecord): number {
  const flags = getPresenceFlags(business);

  let score = 35;

  if (hasContactInfo(business)) score += 20;
  if (flags.hasWebsite) score += 10;
  if (flags.hasSocialPresence) score += 8;
  if (flags.hasGoogleBusinessProfile) score += 8;
  if (flags.hasRecentSocialActivity) score += 6;

  if (business.status === "inactive") score -= 35;
  if (business.status === "lead") score += 5;

  if (business.pipelineStage === "contacted") score += 5;
  if (business.pipelineStage === "responded") score += 12;
  if (business.pipelineStage === "meeting_booked") score += 18;
  if (business.pipelineStage === "proposal_sent") score += 22;
  if (business.pipelineStage === "lost") score = 0;
  if (business.pipelineStage === "won") score = 100;

  return clamp(score);
}

export function calculatePriorityScore(scores: Required<BusinessScores>): number {
  const weighted =
    scores.digitalMaturityScore * 0.15 +
    scores.painPointScore * 0.3 +
    scores.valuePotentialScore * 0.35 +
    scores.closeLikelihoodScore * 0.2;

  return clamp(Math.round(weighted));
}

export function scoreBusiness(business: BusinessRecord): Required<BusinessScores> {
  const digitalMaturityScore = calculateDigitalMaturityScore(business);
  const painPointScore = calculatePainPointScore(business);
  const valuePotentialScore = calculateValuePotentialScore(business);
  const closeLikelihoodScore = calculateCloseLikelihoodScore(business);

  const priorityScore = calculatePriorityScore({
    digitalMaturityScore,
    painPointScore,
    valuePotentialScore,
    closeLikelihoodScore,
    priorityScore: 0,
  });

  return {
    digitalMaturityScore,
    painPointScore,
    valuePotentialScore,
    closeLikelihoodScore,
    priorityScore,
  };
}

export function estimatePipelineValue(business: BusinessRecord): number {
  const scores = business.scores ?? scoreBusiness(business);
  const base = scores.priorityScore * 125;

  if (business.pipelineStage === "won") return base * 1.2;
  if (business.pipelineStage === "lost") return 0;

  return base;
}
