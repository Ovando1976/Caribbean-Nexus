import React from "react";
import { Link } from "react-router-dom";
import { generateDeterministicAudit } from "../../lib/audit";
import {
  setPipelineStage,
  updateBusiness,
} from "../../lib/firebase/usvi-businesses";
import {
  PIPELINE_STAGES,
  type BusinessRecord,
  type PipelineStage,
} from "../../types/business";

type Props = {
  businesses: BusinessRecord[];
  onRefresh?: () => Promise<void> | void;
};

function label(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getRecommendedOffer(business: BusinessRecord) {
  if (business.audit?.recommendedOffer) return business.audit.recommendedOffer;

  if (
    business.category === "tourism_hospitality" ||
    business.category === "health_beauty" ||
    business.category === "real_estate" ||
    business.category === "transport"
  ) {
    if (!business.digitalPresence?.hasOnlineBooking) {
      return "Booking Flow Automation";
    }
  }

  if (
    business.category === "restaurant" &&
    !business.digitalPresence?.hasOnlineMenu
  ) {
    return "Menu + Google Profile Upgrade";
  }

  if (!business.digitalPresence?.hasWebsite) {
    return "Website + Local SEO";
  }

  if (!business.digitalPresence?.hasGoogleBusinessProfile) {
    return "Google Business Optimization";
  }

  return "Digital Growth Sprint";
}

export function PipelineBoard({ businesses, onRefresh }: Props) {
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const grouped = React.useMemo(() => {
    const next: Record<PipelineStage, BusinessRecord[]> = Object.fromEntries(
      PIPELINE_STAGES.map((stage) => [stage, []])
    ) as unknown as Record<PipelineStage, BusinessRecord[]>;

    for (const business of businesses) {
      const stage = business.pipelineStage ?? "discovered";
      next[stage].push(business);
    }

    for (const stage of PIPELINE_STAGES) {
      next[stage].sort(
        (a, b) =>
          (b.scores?.priorityScore ?? 0) - (a.scores?.priorityScore ?? 0)
      );
    }

    return next;
  }, [businesses]);

  async function moveStage(business: BusinessRecord, direction: -1 | 1) {
    const currentIndex = PIPELINE_STAGES.indexOf(
      business.pipelineStage ?? "discovered"
    );
    const nextIndex = currentIndex + direction;

    if (nextIndex < 0 || nextIndex >= PIPELINE_STAGES.length) return;

    try {
      setBusyId(business.id);
      await setPipelineStage(business.id, PIPELINE_STAGES[nextIndex]);
      await onRefresh?.();
    } finally {
      setBusyId(null);
    }
  }

  async function generateAudit(business: BusinessRecord) {
    try {
      setBusyId(business.id);
      const audit = generateDeterministicAudit(business);
      await updateBusiness(business.id, { audit });
      await onRefresh?.();
    } finally {
      setBusyId(null);
    }
  }

  async function markContacted(business: BusinessRecord) {
    try {
      setBusyId(business.id);
      await updateBusiness(business.id, {
        pipelineStage: "contacted",
        lastContactedAt: new Date().toISOString(),
      });
      await onRefresh?.();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max gap-4">
        {PIPELINE_STAGES.map((stage) => {
          const items = grouped[stage];

          return (
            <section
              key={stage}
              className="w-[320px] flex-shrink-0 rounded-2xl border border-slate-800 bg-slate-900/60"
            >
              <header className="border-b border-slate-800 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">{label(stage)}</h3>
                  <span className="rounded-full border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-xs text-slate-300">
                    {items.length}
                  </span>
                </div>
              </header>

              <div className="space-y-3 p-3">
                {items.map((business) => {
                  const priority = business.scores?.priorityScore ?? 0;
                  const completeness = business.scores?.completenessScore ?? 0;
                  const disabled = busyId === business.id;

                  return (
                    <article
                      key={business.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link
                            to={`/businesses/${business.id}`}
                            className="font-medium text-sky-300 hover:text-sky-200"
                          >
                            {business.name}
                          </Link>
                          <p className="mt-1 text-xs text-slate-400">
                            {label(business.island)} •{" "}
                            {label(business.category)}
                          </p>
                        </div>

                        <div className="text-right text-xs">
                          <div className="rounded-full border border-slate-700 bg-slate-800/60 px-2 py-1 text-slate-200">
                            P{priority}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                        <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-2 py-1.5">
                          Complete {completeness}
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-2 py-1.5">
                          ${Math.round((priority ?? 0) * 125).toLocaleString()}
                        </div>
                      </div>

                      <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/40 p-2">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">
                          Recommended Offer
                        </p>
                        <p className="mt-1 text-sm text-slate-200">
                          {getRecommendedOffer(business)}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => void moveStage(business, -1)}
                          className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 disabled:opacity-40"
                        >
                          Back
                        </button>

                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => void moveStage(business, 1)}
                          className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 disabled:opacity-40"
                        >
                          Forward
                        </button>

                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => void markContacted(business)}
                          className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 disabled:opacity-40"
                        >
                          Contacted
                        </button>

                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => void generateAudit(business)}
                          className="rounded-lg bg-sky-400 px-2.5 py-1.5 text-xs font-semibold text-slate-900 disabled:opacity-40"
                        >
                          Audit
                        </button>
                      </div>
                    </article>
                  );
                })}

                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">
                    No businesses in this stage.
                  </div>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
