import type { BusinessRecord } from "../../types/business";

export type AttentionItem = {
  id: string;
  businessId: string;
  title: string;
  detail: string;
  priority: number;
  type:
    | "missing_website"
    | "missing_google_profile"
    | "missing_contact"
    | "missing_audit"
    | "not_contacted";
};

function pretty(value?: string) {
  if (!value) return "Unknown";

  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildAttentionQueue(
  businesses: BusinessRecord[],
  limit = 8
): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const business of businesses) {
    const priority = business.scores?.priorityScore ?? 0;

    if (!business.digitalPresence?.hasWebsite) {
      items.push({
        id: `${business.id}-missing-website`,
        businessId: business.id,
        title: `${business.name} is missing a website`,
        detail: `${pretty(business.category)} on ${pretty(
          business.island
        )} has no meaningful web presence.`,
        priority: priority + 10,
        type: "missing_website",
      });
    }

    if (!business.digitalPresence?.hasGoogleBusinessProfile) {
      items.push({
        id: `${business.id}-missing-google`,
        businessId: business.id,
        title: `${business.name} is missing a Google profile`,
        detail: `This business may be hard to discover in local search.`,
        priority: priority + 7,
        type: "missing_google_profile",
      });
    }

    if (!business.phone && !business.email) {
      items.push({
        id: `${business.id}-missing-contact`,
        businessId: business.id,
        title: `${business.name} is missing contact info`,
        detail: `No phone or email is currently stored for this record.`,
        priority: priority + 6,
        type: "missing_contact",
      });
    }

    if (!business.audit?.summary) {
      items.push({
        id: `${business.id}-missing-audit`,
        businessId: business.id,
        title: `${business.name} needs an audit`,
        detail: `No audit has been generated for this business yet.`,
        priority: priority + 5,
        type: "missing_audit",
      });
    }

    if (!business.lastContactedAt && business.pipelineStage !== "won") {
      items.push({
        id: `${business.id}-not-contacted`,
        businessId: business.id,
        title: `${business.name} has not been contacted`,
        detail: `This lead has no recorded outreach timestamp.`,
        priority: priority + 4,
        type: "not_contacted",
      });
    }
  }

  return items.sort((a, b) => b.priority - a.priority).slice(0, limit);
}
