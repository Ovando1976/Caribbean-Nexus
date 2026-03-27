"use client";

import { useFormStatus } from "react-dom";
import { GitBranch, Save } from "lucide-react";

import { PIPELINE_STAGES, type PipelineStage } from "@/types/business";

type Props = {
  businessId: string;
  currentStage?: PipelineStage;
  action: (formData: FormData) => Promise<void>;
};

function prettyLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function UpdatePipelineForm({ businessId, currentStage = "discovered", action }: Props) {
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={businessId} />

      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          <GitBranch className="h-4 w-4" />
          <span>Pipeline stage</span>
        </div>

        <select
          name="pipelineStage"
          defaultValue={currentStage}
          className="h-12 w-full rounded-2xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 outline-none"
        >
          {PIPELINE_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {prettyLabel(stage)}
            </option>
          ))}
        </select>
      </div>

      <SubmitButton label="Save stage" />
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Save className="h-4 w-4" />
      {pending ? "Saving..." : label}
    </button>
  );
}
