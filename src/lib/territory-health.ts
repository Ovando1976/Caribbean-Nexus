import type { BusinessRecord } from "../../types/business";

export type TerritoryHealth = {
  total: number;
  missingWebsite: number;
  missingContact: number;
  missingGoogleProfile: number;
  lowCompleteness: number;
  highPriority: number;
};

export function calculateTerritoryHealth(
  businesses: BusinessRecord[]
): TerritoryHealth {
  return businesses.reduce<TerritoryHealth>(
    (acc, business) => {
      acc.total += 1;

      if (!business.digitalPresence?.hasWebsite) {
        acc.missingWebsite += 1;
      }

      if (!business.phone && !business.email) {
        acc.missingContact += 1;
      }

      if (!business.digitalPresence?.hasGoogleBusinessProfile) {
        acc.missingGoogleProfile += 1;
      }

      if ((business.scores?.completenessScore ?? 0) < 60) {
        acc.lowCompleteness += 1;
      }

      if ((business.scores?.priorityScore ?? 0) >= 70) {
        acc.highPriority += 1;
      }

      return acc;
    },
    {
      total: 0,
      missingWebsite: 0,
      missingContact: 0,
      missingGoogleProfile: 0,
      lowCompleteness: 0,
      highPriority: 0,
    }
  );
}
