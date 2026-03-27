import React from "react";
import { Link } from "react-router-dom";
import type { BusinessRecord } from "../../types/business";
import { findDuplicateCandidates } from "../lib/duplicates";
import { mergeBusinessRecords } from "../lib/merge-businesses";
import {
  deleteBusiness,
  updateBusiness,
} from "../../lib/firebase/usvi-businesses";

type Props = {
  businesses: BusinessRecord[];
  onRefresh?: () => Promise<void> | void;
};

function label(value?: string) {
  if (!value) return "—";

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function DuplicateReviewPanel({ businesses, onRefresh }: Props) {
  const duplicates = React.useMemo(
    () => findDuplicateCandidates(businesses, 60).slice(0, 8),
    [businesses]
  );
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function mergePair(winner: BusinessRecord, loser: BusinessRecord) {
    const opId = `${winner.id}__${loser.id}`;
    try {
      setBusyId(opId);
      const merged = mergeBusinessRecords(winner, loser);
      await updateBusiness(winner.id, merged);
      await deleteBusiness(loser.id);
      await onRefresh?.();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Duplicate Review Queue</h3>
          <p className="mt-1 text-sm text-slate-400">
            Potential duplicate business records based on name, phone, website,
            and merge-key overlap.
          </p>
        </div>
        <div className="rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-300">
          {duplicates.length} flagged
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {duplicates.map((item) => {
          const opId = `${item.left.id}__${item.right.id}`;
          const disabled = busyId === opId;

          return (
            <article
              key={item.id}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="text-sm text-slate-300">
                    <Link
                      to={`/businesses/${item.left.id}`}
                      className="font-medium text-sky-300 hover:text-sky-200"
                    >
                      {item.left.name}
                    </Link>
                    <span className="mx-2 text-slate-500">vs</span>
                    <Link
                      to={`/businesses/${item.right.id}`}
                      className="font-medium text-sky-300 hover:text-sky-200"
                    >
                      {item.right.name}
                    </Link>
                  </div>

                  <div className="text-xs text-slate-400">
                    {label(item.left.island)} • {label(item.left.category)} • score{" "}
                    {item.score}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {item.reasons.map((reason) => (
                      <span
                        key={reason}
                        className="rounded-full border border-slate-700 bg-slate-800/50 px-2 py-0.5 text-[11px] text-slate-300"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => void mergePair(item.left, item.right)}
                      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 disabled:opacity-50"
                    >
                      Merge into first
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => void mergePair(item.right, item.left)}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 disabled:opacity-50"
                    >
                      Merge into second
                    </button>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400">
                  <div>{item.left.phone ?? "—"}</div>
                  <div>{item.right.phone ?? "—"}</div>
                </div>
              </div>
            </article>
          );
        })}

        {duplicates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">
            No obvious duplicates detected.
          </div>
        ) : null}
      </div>
    </section>
  );
}