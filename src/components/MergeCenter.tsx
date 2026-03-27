import React from "react";
import { Link } from "react-router-dom";
import type { BusinessRecord } from "../../types/business";
import { findDuplicateCandidates } from "../lib/duplicates";
import { mergeBusinessRecords } from "../lib/merge-businesses";
import {
  deleteBusiness,
  updateBusiness,
} from "../../lib/firebase/usvi-businesses";
import { FieldCompareRow } from "./FieldCompareRow";

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

function joinItems(values?: string[]) {
  return values && values.length ? values.join(", ") : "—";
}

function socialSummary(business: BusinessRecord) {
  const social = business.social;
  if (!social) return "—";

  return [
    social.facebook ? "Facebook" : null,
    social.instagram ? "Instagram" : null,
    social.googleBusinessProfile ? "Google Profile" : null,
    social.tiktok ? "TikTok" : null,
    social.linkedin ? "LinkedIn" : null,
  ]
    .filter(Boolean)
    .join(", ") || "—";
}

export function MergeCenter({ businesses, onRefresh }: Props) {
  const duplicates = React.useMemo(
    () => findDuplicateCandidates(businesses, 60),
    [businesses]
  );
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [suppressed, setSuppressed] = React.useState<Record<string, true>>({});

  const visible = duplicates.filter((item) => !suppressed[item.id]);

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

  function markNotDuplicate(id: string) {
    setSuppressed((current) => ({ ...current, [id]: true }));
  }

  return (
    <div className="space-y-5">
      {visible.map((item) => {
        const opId = `${item.left.id}__${item.right.id}`;
        const disabled = busyId === opId;

        return (
          <section
            key={item.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {item.left.name} vs {item.right.name}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Potential duplicate • score {item.score}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.reasons.map((reason) => (
                    <span
                      key={reason}
                      className="rounded-full border border-slate-700 bg-slate-800/50 px-2 py-1 text-xs text-slate-300"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => void mergePair(item.left, item.right)}
                  className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
                >
                  Merge into left
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => void mergePair(item.right, item.left)}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 disabled:opacity-50"
                >
                  Merge into right
                </button>
                <button
                  type="button"
                  onClick={() => markNotDuplicate(item.id)}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
                >
                  Not duplicate
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-2 lg:grid-cols-2">
              <Link
                to={`/businesses/${item.left.id}`}
                className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-sky-300 hover:text-sky-200"
              >
                Open left record
              </Link>
              <Link
                to={`/businesses/${item.right.id}`}
                className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-sky-300 hover:text-sky-200"
              >
                Open right record
              </Link>
            </div>

            <div className="mt-4">
              <FieldCompareRow label="Name" left={item.left.name} right={item.right.name} />
              <FieldCompareRow label="Island" left={label(item.left.island)} right={label(item.right.island)} />
              <FieldCompareRow label="Category" left={label(item.left.category)} right={label(item.right.category)} />
              <FieldCompareRow label="Status" left={label(item.left.status)} right={label(item.right.status)} />
              <FieldCompareRow label="Phone" left={item.left.phone} right={item.right.phone} />
              <FieldCompareRow label="Email" left={item.left.email} right={item.right.email} />
              <FieldCompareRow label="Website" left={item.left.website} right={item.right.website} />
              <FieldCompareRow
                label="Address"
                left={
                  item.left.address?.addressLine1 ||
                  item.left.address?.city ||
                  item.left.address?.district
                }
                right={
                  item.right.address?.addressLine1 ||
                  item.right.address?.city ||
                  item.right.address?.district
                }
              />
              <FieldCompareRow
                label="Social"
                left={socialSummary(item.left)}
                right={socialSummary(item.right)}
              />
              <FieldCompareRow
                label="Tags"
                left={joinItems(item.left.tags)}
                right={joinItems(item.right.tags)}
              />
              <FieldCompareRow
                label="Priority"
                left={String(item.left.scores?.priorityScore ?? 0)}
                right={String(item.right.scores?.priorityScore ?? 0)}
              />
              <FieldCompareRow
                label="Completeness"
                left={String(item.left.scores?.completenessScore ?? 0)}
                right={String(item.right.scores?.completenessScore ?? 0)}
              />
              <FieldCompareRow
                label="Audit"
                left={item.left.audit?.summary ? "Present" : "Missing"}
                right={item.right.audit?.summary ? "Present" : "Missing"}
              />
              <FieldCompareRow
                label="Source"
                left={item.left.source?.source}
                right={item.right.source?.source}
              />
              <FieldCompareRow
                label="Merge Keys"
                left={joinItems((item.left as any).mergeKeys)}
                right={joinItems((item.right as any).mergeKeys)}
              />
            </div>
          </section>
        );
      })}

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-500">
          No duplicate candidates need review.
        </div>
      ) : null}
    </div>
  );
}