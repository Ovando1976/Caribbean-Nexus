import type { BusinessRecord } from "../types/business";

export type OpportunityItem = {
  id: string;
  businessId: string;
  title: string;
  summary: string;
  priority: number;
  recommendation: string;
};

function pretty(value?: string) {
  if (!value) return "Unknown";

  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildOpportunityFeed(
  businesses: BusinessRecord[],
  limit = 6
): OpportunityItem[] {
  const items: OpportunityItem[] = [];

  for (const business of businesses) {
    const priority = business.scores?.priorityScore ?? 0;
    const category = pretty(business.category);

    if (!business.digitalPresence?.hasWebsite) {
      items.push({
        id: `${business.id}-no-website`,
        businessId: business.id,
        title: `${business.name} needs a website`,
        summary: `${category} on ${pretty(business.island)} has no meaningful website presence.`,
        priority: priority + 8,
        recommendation: "Sell a conversion-focused website and local SEO package.",
      });
    }

    if (
      (business.category === "tourism_hospitality" ||
        business.category === "health_beauty" ||
        business.category === "real_estate" ||
        business.category === "transport") &&
      !business.digitalPresence?.hasOnlineBooking
    ) {
      items.push({
        id: `${business.id}-booking-gap`,
        businessId: business.id,
        title: `${business.name} has a booking gap`,
        summary: `${category} appears to need a stronger booking or inquiry flow.`,
        priority: priority + 10,
        recommendation: "Sell booking flow automation and lead capture.",
      });
    }

    if (
      business.category === "restaurant" &&
      !business.digitalPresence?.hasOnlineMenu
    ) {
      items.push({
        id: `${business.id}-menu-gap`,
        businessId: business.id,
        title: `${business.name} needs an online menu`,
        summary: `Restaurant customers likely cannot browse menu options easily online.`,
        priority: priority + 7,
        recommendation: "Sell online menu, Google profile optimization, and ordering funnel.",
      });
    }

    if (
      business.digitalPresence?.hasSocialPresence &&
      !business.digitalPresence?.hasRecentSocialActivity
    ) {
      items.push({
        id: `${business.id}-social-stale`,
        businessId: business.id,
        title: `${business.name} has stale social activity`,
        summary: `${category} has social presence, but it looks inactive.`,
        priority: priority + 5,
        recommendation: "Sell content calendar, posting workflow, and reputation support.",
      });
    }

    if (!business.digitalPresence?.hasGoogleBusinessProfile) {
      items.push({
        id: `${business.id}-gbp-gap`,
        businessId: business.id,
        title: `${business.name} lacks a Google Business Profile`,
        summary: `${category} may be missing a major local discovery channel.`,
        priority: priority + 6,
        recommendation: "Sell Google Business Profile setup and optimization.",
      });
    }
  }

  return items
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}