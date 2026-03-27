import type { BusinessRecord } from "../../types/business";

export type DuplicateCandidate = {
  id: string;
  left: BusinessRecord;
  right: BusinessRecord;
  score: number;
  reasons: string[];
};

function normalize(value?: string): string {
  return (value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

function samePhone(left?: string, right?: string) {
  const a = (left ?? "").replace(/[^\d]/g, "");
  const b = (right ?? "").replace(/[^\d]/g, "");
  return a.length > 0 && a === b;
}

function sameWebsite(left?: string, right?: string) {
  const normalizeHost = (url?: string) =>
    (url ?? "")
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .trim();

  const a = normalizeHost(left);
  const b = normalizeHost(right);
  return a.length > 0 && a === b;
}

function overlap(left: string[] = [], right: string[] = []) {
  const a = new Set(left);
  return right.some((item) => a.has(item));
}

export function findDuplicateCandidates(
  businesses: BusinessRecord[],
  minScore = 60
): DuplicateCandidate[] {
  const results: DuplicateCandidate[] = [];

  for (let i = 0; i < businesses.length; i += 1) {
    for (let j = i + 1; j < businesses.length; j += 1) {
      const left = businesses[i];
      const right = businesses[j];

      if (left.id === right.id) continue;
      if (left.island !== right.island) continue;

      let score = 0;
      const reasons: string[] = [];

      const leftName = normalize(left.nameNormalized ?? left.name);
      const rightName = normalize(right.nameNormalized ?? right.name);

      if (leftName && rightName && leftName === rightName) {
        score += 45;
        reasons.push("same normalized name");
      }

      if (samePhone(left.phone, right.phone)) {
        score += 30;
        reasons.push("same phone");
      }

      if (sameWebsite(left.website, right.website)) {
        score += 30;
        reasons.push("same website");
      }

      const leftCity = normalize(left.address?.city);
      const rightCity = normalize(right.address?.city);
      if (leftCity && rightCity && leftCity === rightCity) {
        score += 8;
        reasons.push("same city");
      }

      if (overlap(left.mergeKeys, right.mergeKeys)) {
        score += 25;
        reasons.push("overlapping merge keys");
      }

      if (score >= minScore) {
        results.push({
          id: `${left.id}__${right.id}`,
          left,
          right,
          score,
          reasons,
        });
      }
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
