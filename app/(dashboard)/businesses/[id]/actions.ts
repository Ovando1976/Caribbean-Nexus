"use server";

// Revalidation hooks can be added here when running inside a Next.js runtime.
import { generateDeterministicAudit } from "@/lib/audit";
import {
  getBusinessById,
  setPipelineStage,
  updateBusiness,
} from "@/lib/firebase/usvi-businesses";
import { PIPELINE_STAGES, type PipelineStage } from "@/types/business";

function isPipelineStage(value: string): value is PipelineStage {
  return PIPELINE_STAGES.includes(value as PipelineStage);
}

async function revalidateBusinessPages(_id: string) {
  // no-op in this environment
}

export async function updatePipelineStageAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const pipelineStage = String(formData.get("pipelineStage") ?? "").trim();

  if (!id) {
    throw new Error("Missing businessId.");
  }

  if (!isPipelineStage(pipelineStage)) {
    throw new Error("Invalid pipeline stage.");
  }

  await setPipelineStage(id, pipelineStage);
  await revalidateBusinessPages(id);
}

export async function updateBusinessNotesAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!id) {
    throw new Error("Missing businessId.");
  }

  await updateBusiness(id, {
    notes,
  });
  await revalidateBusinessPages(id);
}

export async function generateAuditAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    throw new Error("Missing business id.");
  }

  const business = await getBusinessById(id);

  if (!business) {
    throw new Error("Business not found.");
  }

  const audit = generateDeterministicAudit(business);

  await updateBusiness(id, { audit });
  await revalidateBusinessPages(id);
}
