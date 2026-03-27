import React from "react";
import { Link } from "react-router-dom";
import type { BusinessRecord } from "../../types/business";
import { buildVerificationQueue } from "../lib/verification-queue";

type VerificationReason =
  | "all"
  | "missing_provenance"
  | "low_confidence_phone"
  | "low_confidence_website"
  | "missing_legal_name"
  | "missing_address"
  | "never_verified";

function label(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function VerificationCenter({
  businesses,
}: {
  businesses: BusinessRecord[];
}) {
  const [filter, setFilter] = React.useState<VerificationReason>("all");
  const items = React.useMemo(
    () => buildVerificationQueue(businesses, 200),
    [businesses]
  );

  const filtered = React.useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.reason === filter);
  }, [items, filter]);

  const filters: VerificationReason[] = [
    "all",
    "never_verified",
    "missing_provenance",
    "low_confidence_phone",
    "low_confidence_website",
    "missing_legal_name",
    "missing_address",
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Verification Center</h2>
            <p className="mt-1 text-sm text-slate-400">
              Review records that need stronger provenance, verification, and
              trust.
            </p>
          </div>
          <div className="rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-300">
            {filtered.length} records
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                filter === value
                  ? "border-sky-500 bg-sky-500/10 text-sky-300"
                  : "border-slate-700 text-slate-200 hover:bg-slate-800"
              }`}
            >
              {label(value)}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        {filtered.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link
                  to={`/businesses/${item.businessId}`}
                  className="text-base font-medium text-sky-300 hover:text-sky-200"
                >
                  {item.title}
                </Link>
                <p className="mt-1 text-sm text-slate-300">{item.detail}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-700 bg-slate-800/50 px-2 py-1 text-xs text-slate-300">
                    {label(item.reason)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full border border-slate-700 bg-slate-800/50 px-2 py-1 text-xs text-slate-200">
                  {item.score}
                </span>
                <Link
                  to={`/businesses/${item.businessId}`}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
                >
                  Open Record
                </Link>
              </div>
            </div>
          </article>
        ))}

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-500">
            No records match this verification filter.
          </div>
        ) : null}
      </section>
    </div>
  );
}
