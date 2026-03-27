import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import type {
  BusinessInput,
  BusinessRecord,
  BusinessUpdate,
  PipelineStage,
} from "@/types/business";
import { scoreBusiness } from "@/lib/scoring";

const COLLECTION_NAME = "usviBusinesses";

function businessesCollection() {
  return collection(db, COLLECTION_NAME);
}

function toIsoString(value: unknown): string | undefined {
  if (!value) return undefined;

  if (typeof value === "string") return value;

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  return undefined;
}

function mapBusinessDoc(
  snapshot: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
): BusinessRecord {
  const data = snapshot.data();
  if (!data) {
    throw new Error("Business document does not exist.");
  }

  return {
    id: snapshot.id,
    name: data.name ?? "",
    legalName: data.legalName,
    island: data.island,
    category: data.category,
    subcategory: data.subcategory,
    status: data.status ?? "unspecified",
    description: data.description,
    phone: data.phone,
    email: data.email,
    website: data.website,
    ownerName: data.ownerName,
    address: data.address ?? {},
    geo: data.geo ?? {},
    social: data.social ?? {},
    tags: Array.isArray(data.tags) ? data.tags : [],
    pipelineStage: data.pipelineStage,
    notes: data.notes,
    lastContactedAt: data.lastContactedAt,
    reviewMetrics: data.reviewMetrics ?? {},
    digitalPresence: data.digitalPresence ?? {},
    scores: data.scores ?? {},
    audit: data.audit ?? {},
    source: data.source ?? {},
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}

function removeUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((item) => removeUndefinedDeep(item))
      .filter((item) => item !== undefined) as T;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, removeUndefinedDeep(v)]);

    return Object.fromEntries(entries) as T;
  }

  return value;
}

function nullableString(value?: string) {
  return value && value.trim().length > 0 ? value : null;
}

function buildBusinessPayload(input: BusinessInput | BusinessRecord | BusinessUpdate) {
  const partialRecord = {
    id: "temp",
    name: input.name ?? "",
    island: (input as BusinessInput).island ?? "st_thomas",
    category: (input as BusinessInput).category ?? "other",
    status: (input as BusinessInput).status ?? "unspecified",
    legalName: input.legalName,
    subcategory: input.subcategory,
    description: input.description,
    phone: input.phone,
    email: input.email,
    website: input.website,
    ownerName: input.ownerName,
    address: input.address ?? {},
    geo: input.geo ?? {},
    social: input.social ?? {},
    tags: input.tags ?? [],
    pipelineStage: (input as BusinessInput).pipelineStage ?? "discovered",
    notes: input.notes,
    lastContactedAt: input.lastContactedAt,
    reviewMetrics: input.reviewMetrics ?? {},
    digitalPresence: input.digitalPresence ?? {},
    audit: input.audit ?? {},
    source: input.source ?? {},
  } as BusinessRecord;

  const scores = scoreBusiness(partialRecord);

  return removeUndefinedDeep({
    name: partialRecord.name,
    legalName: nullableString(partialRecord.legalName),
    island: partialRecord.island,
    category: partialRecord.category,
    subcategory: nullableString(partialRecord.subcategory),
    status: partialRecord.status,
    description: nullableString(partialRecord.description),
    phone: nullableString(partialRecord.phone),
    email: nullableString(partialRecord.email),
    website: nullableString(partialRecord.website),
    ownerName: nullableString(partialRecord.ownerName),
    address: {
      addressLine1: nullableString(partialRecord.address?.addressLine1),
      addressLine2: nullableString(partialRecord.address?.addressLine2),
      city: nullableString(partialRecord.address?.city),
      district: nullableString(partialRecord.address?.district),
      neighborhood: nullableString(partialRecord.address?.neighborhood),
      postalCode: nullableString(partialRecord.address?.postalCode),
      country: nullableString(partialRecord.address?.country),
    },
    geo: {
      latitude: partialRecord.geo?.latitude ?? null,
      longitude: partialRecord.geo?.longitude ?? null,
    },
    social: {
      facebook: nullableString(partialRecord.social?.facebook),
      instagram: nullableString(partialRecord.social?.instagram),
      googleBusinessProfile: nullableString(partialRecord.social?.googleBusinessProfile),
      tiktok: nullableString(partialRecord.social?.tiktok),
      linkedin: nullableString(partialRecord.social?.linkedin),
    },
    tags: partialRecord.tags ?? [],
    pipelineStage: partialRecord.pipelineStage ?? "discovered",
    notes: partialRecord.notes ?? "",
    lastContactedAt: nullableString(partialRecord.lastContactedAt),
    reviewMetrics: {
      reviewCount: partialRecord.reviewMetrics?.reviewCount ?? null,
      rating: partialRecord.reviewMetrics?.rating ?? null,
    },
    digitalPresence: {
      hasWebsite: partialRecord.digitalPresence?.hasWebsite ?? null,
      hasOnlineMenu: partialRecord.digitalPresence?.hasOnlineMenu ?? null,
      hasOnlineBooking: partialRecord.digitalPresence?.hasOnlineBooking ?? null,
      hasOnlineOrdering: partialRecord.digitalPresence?.hasOnlineOrdering ?? null,
      hasSocialPresence: partialRecord.digitalPresence?.hasSocialPresence ?? null,
      hasRecentSocialActivity: partialRecord.digitalPresence?.hasRecentSocialActivity ?? null,
      hasGoogleBusinessProfile: partialRecord.digitalPresence?.hasGoogleBusinessProfile ?? null,
    },
    audit: {
      summary: nullableString(partialRecord.audit?.summary),
      strengths: partialRecord.audit?.strengths ?? [],
      weaknesses: partialRecord.audit?.weaknesses ?? [],
      opportunities: partialRecord.audit?.opportunities ?? [],
      recommendedOffer: nullableString(partialRecord.audit?.recommendedOffer),
      recommendedMonthlyValue: partialRecord.audit?.recommendedMonthlyValue ?? null,
    },
    source: {
      source: nullableString(partialRecord.source?.source),
      sourceUrl: nullableString(partialRecord.source?.sourceUrl),
    },
    scores,
  });
}

export async function getAllBusinesses(): Promise<BusinessRecord[]> {
  const q = query(businessesCollection(), orderBy("scores.priorityScore", "desc"), limit(500));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapBusinessDoc);
}

export async function getBusinessById(id: string): Promise<BusinessRecord | null> {
  const ref = doc(db, COLLECTION_NAME, id);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return null;
  }

  return mapBusinessDoc(snapshot);
}

export async function createBusiness(input: BusinessInput): Promise<string> {
  const payload = buildBusinessPayload(input);

  const ref = await addDoc(businessesCollection(), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function updateBusiness(id: string, updates: BusinessUpdate): Promise<void> {
  const existing = await getBusinessById(id);

  if (!existing) {
    throw new Error(`Business with id "${id}" not found.`);
  }

  const merged: BusinessRecord = {
    ...existing,
    ...updates,
    address: {
      ...existing.address,
      ...(updates.address ?? {}),
    },
    geo: {
      ...existing.geo,
      ...(updates.geo ?? {}),
    },
    social: {
      ...existing.social,
      ...(updates.social ?? {}),
    },
    reviewMetrics: {
      ...existing.reviewMetrics,
      ...(updates.reviewMetrics ?? {}),
    },
    digitalPresence: {
      ...existing.digitalPresence,
      ...(updates.digitalPresence ?? {}),
    },
    audit: {
      ...existing.audit,
      ...(updates.audit ?? {}),
    },
    source: {
      ...existing.source,
      ...(updates.source ?? {}),
    },
  };

  const payload = buildBusinessPayload(merged);

  await updateDoc(doc(db, COLLECTION_NAME, id), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function setPipelineStage(id: string, pipelineStage: PipelineStage): Promise<void> {
  await updateBusiness(id, { pipelineStage });
}

export async function bulkUpsertBusinesses(
  businesses: Array<BusinessInput & { id?: string }>,
): Promise<void> {
  const batch = writeBatch(db);

  for (const business of businesses) {
    const payload = buildBusinessPayload(business);

    if (business.id) {
      const ref = doc(db, COLLECTION_NAME, business.id);
      batch.set(
        ref,
        {
          ...payload,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } else {
      const ref = doc(businessesCollection());
      batch.set(ref, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }

  await batch.commit();
}

export async function getTopPriorityBusinesses(count = 20): Promise<BusinessRecord[]> {
  const q = query(businessesCollection(), orderBy("scores.priorityScore", "desc"), limit(count));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapBusinessDoc);
}
