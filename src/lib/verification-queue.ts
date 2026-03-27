import type { BusinessRecord } from "../../types/business";

export type VerificationQueueItem = {
  id: string;
  businessId: string;
  title: string;
  detail: string;
  score: number;
  reason:
    | "missing_provenance"
    | "low_confidence_phone"
    | "low_confidence_website"
    | "missing_legal_name"
    | "missing_address"
    | "never_verified";
};

function label(value?: string) {
  if (!value) return "Unknown";

  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildVerificationQueue(
  businesses: BusinessRecord[],
  limit = 12
): VerificationQueueItem[] {
  const items: VerificationQueueItem[] = [];

  for (const business of businesses) {
    const base = business.scores?.priorityScore ?? 0;
    const verification = (business as any).verification ?? {};

    const phoneConfidence = verification.phone?.provenance?.confidence;
    const websiteConfidence = verification.website?.provenance?.confidence;
    const legalNameValue = verification.legalName?.value ?? business.legalName;
    const addressValue =
      verification.address?.value ??
      business.address?.addressLine1 ??
      business.address?.city;

    if (!business.lastVerifiedAt) {
      items.push({
        id: `${business.id}-never-verified`,
        businessId: business.id,
        title: `${business.name} has never been verified`,
        detail: `${label(business.category)} on ${label(
          business.island
        )} has no verification timestamp.`,
        score: base + 12,
        reason: "never_verified",
      });
    }

    if (
      !verification.phone &&
      !verification.website &&
      !verification.legalName
    ) {
      items.push({
        id: `${business.id}-missing-provenance`,
        businessId: business.id,
        title: `${business.name} is missing provenance`,
        detail: `No field-level provenance has been recorded yet.`,
        score: base + 10,
        reason: "missing_provenance",
      });
    }

    if (business.phone && phoneConfidence === "low") {
      items.push({
        id: `${business.id}-low-phone`,
        businessId: business.id,
        title: `${business.name} has low-confidence phone data`,
        detail: `Phone number exists but should be verified against a stronger source.`,
        score: base + 8,
        reason: "low_confidence_phone",
      });
    }

    if (business.website && websiteConfidence === "low") {
      items.push({
        id: `${business.id}-low-website`,
        businessId: business.id,
        title: `${business.name} has low-confidence website data`,
        detail: `Website exists but provenance confidence is low.`,
        score: base + 8,
        reason: "low_confidence_website",
      });
    }

    if (!legalNameValue) {
      items.push({
        id: `${business.id}-missing-legal-name`,
        businessId: business.id,
        title: `${business.name} is missing legal name verification`,
        detail: `Legal entity naming is still incomplete.`,
        score: base + 7,
        reason: "missing_legal_name",
      });
    }

    if (!addressValue) {
      items.push({
        id: `${business.id}-missing-address`,
        businessId: business.id,
        title: `${business.name} is missing address verification`,
        detail: `Address data needs to be added or verified.`,
        score: base + 6,
        reason: "missing_address",
      });
    }
  }

  return items.sort((a, b) => b.score - a.score).slice(0, limit);
}
