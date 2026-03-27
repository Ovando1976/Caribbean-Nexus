import type { BusinessAuditSummary, BusinessRecord } from "@/types/business";

function hasWebsite(business: BusinessRecord) {
  return business.digitalPresence?.hasWebsite ?? Boolean(business.website);
}

function hasSocialPresence(business: BusinessRecord) {
  return (
    business.digitalPresence?.hasSocialPresence ??
    Boolean(
      business.social?.facebook ||
        business.social?.instagram ||
        business.social?.tiktok ||
        business.social?.linkedin,
    )
  );
}

function hasGoogleBusinessProfile(business: BusinessRecord) {
  return (
    business.digitalPresence?.hasGoogleBusinessProfile ??
    Boolean(business.social?.googleBusinessProfile)
  );
}

function hasOnlineBooking(business: BusinessRecord) {
  return business.digitalPresence?.hasOnlineBooking ?? false;
}

function hasOnlineOrdering(business: BusinessRecord) {
  return business.digitalPresence?.hasOnlineOrdering ?? false;
}

function hasOnlineMenu(business: BusinessRecord) {
  return business.digitalPresence?.hasOnlineMenu ?? false;
}

function hasRecentSocialActivity(business: BusinessRecord) {
  return business.digitalPresence?.hasRecentSocialActivity ?? false;
}

function hasContactInfo(business: BusinessRecord) {
  return Boolean(business.phone || business.email || business.website);
}

function prettyLabel(value?: string) {
  if (!value) return "business";

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function dedupe(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function getRecommendedOffer(business: BusinessRecord): {
  recommendedOffer: string;
  recommendedMonthlyValue: number;
} {
  const category = business.category;

  if (category === "restaurant") {
    if (!hasWebsite(business) || !hasOnlineMenu(business)) {
      return {
        recommendedOffer:
          "Restaurant digital upgrade: fast mobile website, menu publishing, Google Business optimization, and local search improvements.",
        recommendedMonthlyValue: 650,
      };
    }

    if (!hasOnlineOrdering(business)) {
      return {
        recommendedOffer:
          "Restaurant conversion package: online ordering setup, menu management, and promotional campaign support.",
        recommendedMonthlyValue: 800,
      };
    }

    return {
      recommendedOffer:
        "Restaurant growth retainer: seasonal promotions, reputation management, analytics, and customer re-engagement flows.",
      recommendedMonthlyValue: 550,
    };
  }

  if (category === "tourism_hospitality") {
    if (!hasOnlineBooking(business)) {
      return {
        recommendedOffer:
          "Hospitality booking package: conversion-focused landing pages, booking flow setup, inquiry automation, and review capture.",
        recommendedMonthlyValue: 950,
      };
    }

    return {
      recommendedOffer:
        "Hospitality growth system: booking optimization, campaign support, review management, and visitor conversion analytics.",
      recommendedMonthlyValue: 850,
    };
  }

  if (category === "real_estate") {
    return {
      recommendedOffer:
        "Real estate lead engine: listing presentation improvements, lead capture funnels, automated follow-up, and analytics dashboards.",
      recommendedMonthlyValue: 1200,
    };
  }

  if (category === "transport") {
    return {
      recommendedOffer:
        "Transport booking and dispatch package: mobile booking flow, WhatsApp/web inquiry handling, and customer follow-up automation.",
      recommendedMonthlyValue: 900,
    };
  }

  if (category === "health_beauty") {
    return {
      recommendedOffer:
        "Appointment growth package: service page upgrades, booking flow setup, retention messaging, and local visibility improvements.",
      recommendedMonthlyValue: 750,
    };
  }

  if (category === "professional_services") {
    return {
      recommendedOffer:
        "Professional services lead system: credibility website, consultation capture, follow-up automation, and search presence improvements.",
      recommendedMonthlyValue: 850,
    };
  }

  return {
    recommendedOffer:
      "Digital presence and lead generation package: website improvements, local visibility, inquiry capture, and reporting.",
    recommendedMonthlyValue: 600,
  };
}

export function generateDeterministicAudit(business: BusinessRecord): BusinessAuditSummary {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];

  if (hasWebsite(business)) {
    strengths.push("The business has an existing website presence.");
  } else {
    weaknesses.push(
      "The business appears to lack a website, reducing credibility and discoverability.",
    );
    opportunities.push("Launch a modern mobile-friendly website tailored to local search and conversion.");
  }

  if (hasSocialPresence(business)) {
    strengths.push("The business has at least some social media presence.");
  } else {
    weaknesses.push("The business appears to have limited or no visible social media presence.");
    opportunities.push(
      "Create a focused social presence to support trust, awareness, and repeat visibility.",
    );
  }

  if (hasRecentSocialActivity(business)) {
    strengths.push("Recent social activity suggests the business is active and reachable.");
  } else if (hasSocialPresence(business)) {
    weaknesses.push("Social accounts may not be actively maintained.");
    opportunities.push("Introduce a lightweight content workflow to keep the brand active and visible.");
  }

  if (hasGoogleBusinessProfile(business)) {
    strengths.push("The business has a Google Business presence or equivalent listing signal.");
  } else {
    weaknesses.push("The business may be missing a strong Google Business presence.");
    opportunities.push(
      "Set up or optimize Google Business Profile to improve local discovery and map visibility.",
    );
  }

  if (!hasContactInfo(business)) {
    weaknesses.push("Direct contact information is incomplete or weak.");
    opportunities.push("Add clear contact channels and inquiry capture so leads do not drop off.");
  }

  if (business.category === "restaurant") {
    if (hasOnlineMenu(business)) {
      strengths.push("The restaurant has a visible online menu signal.");
    } else {
      weaknesses.push("The restaurant does not appear to have a clear online menu.");
      opportunities.push("Publish a mobile-friendly menu to increase customer confidence and reduce friction.");
    }

    if (!hasOnlineOrdering(business)) {
      opportunities.push("Add online ordering or direct order intent capture to improve conversion.");
    }
  }

  if (
    business.category === "tourism_hospitality" ||
    business.category === "health_beauty" ||
    business.category === "real_estate"
  ) {
    if (hasOnlineBooking(business)) {
      strengths.push("The business appears to support booking or appointment intent.");
    } else {
      weaknesses.push("The business lacks a visible online booking flow.");
      opportunities.push(
        "Implement booking or inquiry automation to capture customer intent more efficiently.",
      );
    }
  }

  const { recommendedOffer, recommendedMonthlyValue } = getRecommendedOffer(business);

  const summaryParts: string[] = [];

  if (!hasWebsite(business)) {
    summaryParts.push("The business has a clear website gap");
  } else {
    summaryParts.push("The business has a baseline digital presence");
  }

  if (!hasGoogleBusinessProfile(business)) {
    summaryParts.push("local discovery likely needs work");
  }

  if (!hasSocialPresence(business)) {
    summaryParts.push("social visibility is limited");
  }

  if ((business.scores?.priorityScore ?? 0) >= 70 || (business.scores?.valuePotentialScore ?? 0) >= 80) {
    summaryParts.push("commercial upside appears strong");
  }

  const summary =
    summaryParts.length > 0
      ? `${business.name} is a ${prettyLabel(business.category).toLowerCase()} with ${summaryParts.join(", ")}.`
      : `${business.name} has a moderate digital footprint with room for optimization.`;

  return {
    summary,
    strengths: dedupe(strengths),
    weaknesses: dedupe(weaknesses),
    opportunities: dedupe(opportunities),
    recommendedOffer,
    recommendedMonthlyValue,
  };
}
