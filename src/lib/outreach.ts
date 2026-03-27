import type { BusinessRecord } from "../../types/business";

function pretty(value?: string) {
  if (!value) return "your business";

  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getOffer(business: BusinessRecord): string {
  if (business.audit?.recommendedOffer) return business.audit.recommendedOffer;

  if (
    (business.category === "tourism_hospitality" ||
      business.category === "health_beauty" ||
      business.category === "real_estate" ||
      business.category === "transport") &&
    !business.digitalPresence?.hasOnlineBooking
  ) {
    return "booking flow automation";
  }

  if (
    business.category === "restaurant" &&
    !business.digitalPresence?.hasOnlineMenu
  ) {
    return "online menu and local search upgrade";
  }

  if (!business.digitalPresence?.hasWebsite) {
    return "website and local SEO setup";
  }

  if (!business.digitalPresence?.hasGoogleBusinessProfile) {
    return "Google Business Profile optimization";
  }

  return "digital growth sprint";
}

export type OutreachDraft = {
  subject: string;
  email: string;
  sms: string;
};

export function generateOutreachDraft(business: BusinessRecord): OutreachDraft {
  const offer = getOffer(business);
  const name = business.name;
  const category = pretty(business.category);
  const island = pretty(business.island);

  const subject = `${name}: quick idea to improve ${category.toLowerCase()} growth`;

  const email = `Hi ${business.ownerName ?? name} —

I took a quick look at ${name} and saw a few opportunities to improve how customers discover and convert with the business online.

Because you’re in ${category.toLowerCase()} on ${island}, I think there’s a strong opportunity around ${offer}. This usually helps with visibility, lead capture, and faster customer response.

If helpful, I can put together a short audit with the highest-impact fixes and a simple implementation path.

Would you be open to a quick conversation this week?

Best,
[Your Name]`;

  const sms = `Hi, I took a quick look at ${name}. I think there’s a strong opportunity to improve results with ${offer}. Happy to share a short audit if useful.`;

  return { subject, email, sms };
}
