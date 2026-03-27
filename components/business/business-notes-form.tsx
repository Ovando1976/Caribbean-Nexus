"use client";

import { useFormStatus } from "react-dom";
import { FileText, Save } from "lucide-react";

type Props = {
  businessId: string;
  initialNotes?: string;
  action: (formData: FormData) => Promise<void>;
};

export function BusinessNotesForm({ businessId, initialNotes = "", action }: Props) {
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={businessId} />

      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          <FileText className="h-4 w-4" />
          <span>Notes</span>
        </div>

        <textarea
          name="notes"
          defaultValue={initialNotes}
          rows={8}
          placeholder="Add sales notes, call outcomes, offer ideas, objections, next steps..."
          className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
        />
      </div>

      <SubmitButton label="Save notes" />
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Save className="h-4 w-4" />
      {pending ? "Saving..." : label}
    </button>
  );
}
