import type { BusinessInput } from "../types/business";
import { scoreBusiness } from "./scoring";
import {
  buildBusinessMergeKeys,
  normalizeBusinessName,
} from "./business-normalize";

export type EnrichedBusinessRecord = BusinessInput & {
  id: string;
  nameNormalized: string;
  mergeKeys: string[];
  scores: ReturnType<typeof scoreBusiness>;
  source: {
    source?: string;
    sourceUrl?: string;
  };
  verification?: Record<string, unknown>;
  lastEnrichedAt: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export function enrichBusinessInput(
  business: BusinessInput
): EnrichedBusinessRecord {
  const id = slugify(`${business.island}-${business.name}`);
  const nameNormalized = normalizeBusinessName(business.name);

  const base = {
    id,
    ...business,
    nameNormalized,
  };

  const mergeKeys = buildBusinessMergeKeys(base as any);
  const scores = scoreBusiness({
    ...base,
    mergeKeys,
  } as any);

  const verification = {
    ...(business.phone
      ? {
          phone: {
            value: business.phone,
            provenance: {
              source: business.source?.source || "manual_dataset",
              sourceUrl: business.source?.sourceUrl,
              confidence: "low" as const,
            },
          },
        }
      : {}),
    ...(business.website
      ? {
          website: {
            value: business.website,
            provenance: {
              source: business.source?.source || "manual_dataset",
              sourceUrl: business.source?.sourceUrl,
              confidence: "low" as const,
            },
          },
        }
      : {}),
    ...(business.legalName
      ? {
          legalName: {
            value: business.legalName,
            provenance: {
              source: business.source?.source || "manual_dataset",
              sourceUrl: business.source?.sourceUrl,
              confidence: "low" as const,
            },
          },
        }
      : {}),
  };

  return {
    ...business,
    id,
    nameNormalized,
    mergeKeys,
    scores,
    source: business.source ?? {
      source: "manual_dataset",
      sourceUrl: "local-build-pipeline",
    },
    verification,
    lastEnrichedAt: new Date().toISOString(),
  };
}
