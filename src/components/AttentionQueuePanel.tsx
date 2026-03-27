import React from "react";
import { Link } from "react-router-dom";
import type { BusinessRecord } from "../../types/business";
import { buildAttentionQueue } from "../lib/attention-queue";

export function AttentionQueuePanel({
  businesses,
}: {
  businesses: BusinessRecord[];
}) {
  const items = React.useMemo(
    () => buildAttentionQueue(businesses, 6),
    [businesses]
  );

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Attention Queue</h3>
          <p className="mt-1 text-sm text-slate-400">
            The highest-priority records that need action right now.
          </p>
        </div>
        <div className="rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-300">
          {items.length} items
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  to={`/businesses/${item.businessId}`}
                  className="font-medium text-sky-300 hover:text-sky-200"
                >
                  {item.title}
                </Link>
                <p className="mt-1 text-sm text-slate-300">{item.detail}</p>
              </div>

              <span className="rounded-full border border-slate-700 bg-slate-800/50 px-2 py-1 text-xs text-slate-200">
                {item.priority}
              </span>
            </div>
          </article>
        ))}

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">
            No urgent records right now.
          </div>
        ) : null}
      </div>
    </section>
  );
}
