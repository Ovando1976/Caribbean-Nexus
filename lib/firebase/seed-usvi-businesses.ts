import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { USVI_SEED_BUSINESSES } from "@/data/usvi-seed-businesses";
import { scoreBusiness } from "@/lib/scoring";
import {
  buildBusinessMergeKeys,
  normalizeBusinessName,
} from "@/lib/business-normalize";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function seedUsviBusinesses() {
  const colRef = collection(db, "usviBusinesses");

  for (const business of USVI_SEED_BUSINESSES) {
    const id = slugify(`${business.island}-${business.name}`);

    const enriched = {
      id,
      ...business,
      nameNormalized: normalizeBusinessName(business.name),
    };

    const mergeKeys = buildBusinessMergeKeys(enriched);

    const scores = scoreBusiness({
      ...enriched,
      mergeKeys,
    } as any);

    const verification = {
      ...(business.website
        ? {
            website: {
              value: business.website,
              provenance: {
                source: "seed_dataset",
                confidence: "medium" as const,
              },
            },
          }
        : {}),
      ...(business.phone
        ? {
            phone: {
              value: business.phone,
              provenance: {
                source: "seed_dataset",
                confidence: "medium" as const,
              },
            },
          }
        : {}),
    };

    await setDoc(
      doc(colRef, id),
      {
        ...business,
        nameNormalized: enriched.nameNormalized,
        mergeKeys,
        scores,
        source: {
          source: "seed_dataset",
          sourceUrl: "local-dev-seed",
        },
        verification,
        lastEnrichedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }
}
