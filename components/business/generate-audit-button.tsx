"use client";

import { useFormStatus } from "react-dom";
import { Sparkles } from "lucide-react";

type Props = {
  businessId: string;
  action: (formData: FormData) => Promise<void>;
};

export function GenerateAuditButton({ businessId, action }: Props) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={businessId} />
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Sparkles className="h-4 w-4" />
      {pending ? "Generating..." : "Generate audit"}
    </button>
  );
}
