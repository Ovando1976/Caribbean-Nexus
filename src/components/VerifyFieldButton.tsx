import React from "react";
import { updateBusiness } from "../../lib/firebase/usvi-businesses";

type Props = {
  businessId: string;
  field: "phone" | "website" | "legalName" | "address";
  value: unknown;
  source?: string;
  sourceUrl?: string;
  onDone?: () => Promise<void> | void;
};

export function VerifyFieldButton({
  businessId,
  field,
  value,
  source = "manual_review",
  sourceUrl,
  onDone,
}: Props) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleVerify() {
    try {
      setBusy(true);
      setError(null);

      await updateBusiness(businessId, {
        verification: {
          [field]: {
            value,
            provenance: {
              source,
              sourceUrl,
              confidence: "medium",
            },
          },
        },
        lastVerifiedAt: new Date().toISOString(),
      } as any);

      await onDone?.();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Verification failed."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void handleVerify()}
        disabled={busy || value == null || value === ""}
        className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-50"
      >
        {busy ? "Verifying..." : "Mark verified"}
      </button>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
