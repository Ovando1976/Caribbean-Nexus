import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';

import { db } from '@/src/firebase';
import { scoreBusiness } from '@/lib/scoring';
import type {
  BusinessCategory,
  BusinessRecord,
  Island,
  PipelineStage,
} from '@/types/business';

const COLLECTION = 'usviBusinesses';

export type BusinessFilters = {
  island?: Island;
  category?: BusinessCategory;
  minPriorityScore?: number;
  pipelineStage?: PipelineStage;
  limitCount?: number;
};

function toIsoString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return undefined;
}

function fromFirestore(snapshotId: string, data: DocumentData): BusinessRecord {
  return {
    id: snapshotId,
    ...data,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
    lastContactedAt: toIsoString(data.lastContactedAt),
    nextFollowUpAt: toIsoString(data.nextFollowUpAt),
  } as BusinessRecord;
}

function withScoring(record: Omit<BusinessRecord, 'id'> & { id?: string }): Omit<BusinessRecord, 'id'> {
  const scored = scoreBusiness({
    id: record.id ?? '',
    ...record,
    pipelineStage: record.pipelineStage ?? 'discovered',
    status: record.status ?? 'lead',
    category: record.category ?? 'other',
    island: record.island ?? 'st_thomas',
    name: record.name ?? 'Unknown Business',
  });

  return {
    ...record,
    digitalMaturityScore: scored.digitalMaturityScore,
    painPointScore: scored.painPointScore,
    valuePotentialScore: scored.valuePotentialScore,
    closeLikelihoodScore: scored.closeLikelihoodScore,
    priorityScore: scored.priorityScore,
    estimatedDealValueUsd: scored.estimatedDealValueUsd,
  };
}

export async function createBusiness(
  business: Omit<BusinessRecord, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const payload = withScoring(business);
  const ref = await addDoc(collection(db, COLLECTION), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function seedBusinesses(businesses: Array<Omit<BusinessRecord, 'id'>>): Promise<void> {
  const batch = writeBatch(db);

  businesses.forEach((business) => {
    const ref = doc(collection(db, COLLECTION));
    const payload = withScoring(business);

    batch.set(ref, {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

export async function getBusinessById(id: string): Promise<BusinessRecord | null> {
  const snapshot = await getDoc(doc(db, COLLECTION, id));
  if (!snapshot.exists()) return null;
  return fromFirestore(snapshot.id, snapshot.data());
}

export async function listBusinesses(filters: BusinessFilters = {}): Promise<BusinessRecord[]> {
  const constraints: QueryConstraint[] = [];

  if (filters.island) constraints.push(where('island', '==', filters.island));
  if (filters.category) constraints.push(where('category', '==', filters.category));
  if (filters.pipelineStage) constraints.push(where('pipelineStage', '==', filters.pipelineStage));
  if (typeof filters.minPriorityScore === 'number') {
    constraints.push(where('priorityScore', '>=', filters.minPriorityScore));
    constraints.push(orderBy('priorityScore', 'desc'));
  } else {
    constraints.push(orderBy('updatedAt', 'desc'));
  }

  constraints.push(limit(filters.limitCount ?? 100));

  const q = query(collection(db, COLLECTION), ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnapshot) => fromFirestore(docSnapshot.id, docSnapshot.data()));
}

export async function updateBusiness(
  id: string,
  patch: Partial<Omit<BusinessRecord, 'id' | 'createdAt'>>,
): Promise<void> {
  const current = await getBusinessById(id);
  if (!current) throw new Error(`Business ${id} not found`);

  const merged = withScoring({
    ...current,
    ...patch,
    id,
  });

  await updateDoc(doc(db, COLLECTION, id), {
    ...merged,
    updatedAt: serverTimestamp(),
  });
}

export async function updatePipelineStage(id: string, stage: PipelineStage): Promise<void> {
  await updateBusiness(id, { pipelineStage: stage });
}

export async function addBusinessNote(id: string, note: string): Promise<void> {
  const current = await getBusinessById(id);
  if (!current) throw new Error(`Business ${id} not found`);

  const existing = current.notes?.trim();
  const stampedNote = `[${new Date().toISOString()}] ${note.trim()}`;
  const notes = existing ? `${existing}\n${stampedNote}` : stampedNote;

  await updateBusiness(id, { notes });
}

export async function deleteBusiness(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
