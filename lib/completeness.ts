import type { BusinessRecord } from "@/types/business";

export function calculateCompletenessScore(business: BusinessRecord): number {
  let score = 0;

  if (business.name) score += 10;
  if (business.legalName) score += 8;
  if (business.island) score += 8;
  if (business.category) score += 8;

  if (business.address?.addressLine1) score += 10;
  if (business.address?.city || business.address?.district) score += 8;
  if (business.geo?.latitude != null && business.geo?.longitude != null)
    score += 8;

  if (business.phone) score += 8;
  if (business.email) score += 6;
  if (business.website) score += 8;

  if (
    business.social?.facebook ||
    business.social?.instagram ||
    business.social?.googleBusinessProfile ||
    business.social?.tiktok ||
    business.social?.linkedin
  ) {
    score += 6;
  }

  if (business.reviewMetrics?.reviewCount != null) score += 5;
  if (business.reviewMetrics?.rating != null) score += 5;

  if (business.verification?.entityStatus?.value) score += 6;
  if (business.lastVerifiedAt) score += 4;

  return Math.min(100, score);
}
