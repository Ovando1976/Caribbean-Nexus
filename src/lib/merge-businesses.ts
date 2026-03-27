import type { BusinessInput, BusinessRecord } from "../types/business";

function pickString(...values: Array<string | undefined>) {
  return values.find((value) => typeof value === "string" && value.trim().length > 0);
}

function pickArray<T>(...values: Array<T[] | undefined>) {
  const merged = values.flatMap((value) => value ?? []);
  return Array.from(new Set(merged));
}

function pickObject<T extends Record<string, unknown>>(
  ...values: Array<T | undefined>
): T | undefined {
  const merged = Object.assign({}, ...values.filter(Boolean));
  return Object.keys(merged).length > 0 ? (merged as T) : undefined;
}

function pickHigherNumber(...values: Array<number | undefined>) {
  const nums = values.filter((value): value is number => typeof value === "number");
  return nums.length ? Math.max(...nums) : undefined;
}

export function mergeBusinessRecords(
  winner: BusinessRecord,
  loser: BusinessRecord
): BusinessInput {
  return {
    name: pickString(winner.name, loser.name) ?? winner.name,
    legalName: pickString(winner.legalName, loser.legalName),
    nameNormalized: pickString(
      (winner as any).nameNormalized,
      (loser as any).nameNormalized
    ) as any,
    island: winner.island,
    category: winner.category,
    subcategory: pickString(winner.subcategory, loser.subcategory),
    status:
      winner.status !== "unspecified" ? winner.status : loser.status ?? "unspecified",
    description: pickString(winner.description, loser.description),
    phone: pickString(winner.phone, loser.phone),
    email: pickString(winner.email, loser.email),
    website: pickString(winner.website, loser.website),
    ownerName: pickString(winner.ownerName, loser.ownerName),
    address: pickObject(winner.address, loser.address),
    geo: pickObject(winner.geo, loser.geo),
    social: pickObject(winner.social, loser.social),
    tags: pickArray(winner.tags, loser.tags),
    pipelineStage: winner.pipelineStage ?? loser.pipelineStage,
    notes: pickString(winner.notes, loser.notes),
    lastContactedAt: pickString(winner.lastContactedAt, loser.lastContactedAt),
    reviewMetrics: {
      reviewCount: pickHigherNumber(
        winner.reviewMetrics?.reviewCount,
        loser.reviewMetrics?.reviewCount
      ),
      rating: pickHigherNumber(
        winner.reviewMetrics?.rating,
        loser.reviewMetrics?.rating
      ),
    },
    digitalPresence: pickObject(winner.digitalPresence, loser.digitalPresence),
    scores: pickObject(winner.scores, loser.scores),
    audit: winner.audit?.summary ? winner.audit : loser.audit,
    source: winner.source ?? loser.source,
    verification: pickObject(
      (winner as any).verification,
      (loser as any).verification
    ) as any,
    mergeKeys: pickArray(
      (winner as any).mergeKeys,
      (loser as any).mergeKeys
    ) as any,
    duplicateOf: (winner as any).duplicateOf ?? null,
    lastVerifiedAt: pickString(
      (winner as any).lastVerifiedAt,
      (loser as any).lastVerifiedAt
    ) as any,
    lastEnrichedAt: pickString(
      (winner as any).lastEnrichedAt,
      (loser as any).lastEnrichedAt
    ) as any,
    rawSourceIds: pickArray(
      (winner as any).rawSourceIds,
      (loser as any).rawSourceIds
    ) as any,
    activities: pickArray(
      (winner as any).activities,
      (loser as any).activities
    ) as any,
  } as BusinessInput;
}