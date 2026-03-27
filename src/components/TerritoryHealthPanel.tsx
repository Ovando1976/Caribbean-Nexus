import React from "react";
import type { BusinessRecord } from "../../types/business";
import { calculateTerritoryHealth } from "../lib/territory-health";

export function TerritoryHealthPanel({
  businesses,
}: {
  businesses: BusinessRecord[];
}) {
  const health = React.useMemo(
    () => calculateTerritoryHealth(businesses),
    [businesses]
  );

  const items = [
    { label: "Missing Website", value: health.missingWebsite },
    { label: "Missing Contact", value: health.missingContact },
    { label: "Missing Google Profile", value: health.missingGoogleProfile },
    { label: "Low Completeness", value: health.lowCompleteness },
    { label: "High Priority", value: health.highPriority },
    { label: "Total Businesses", value: health.total },
  ];

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 className="font-semibold">Territory Health</h3>
      <p className="mt-1 text-sm text-slate-400">
        A quick view of data quality and opportunity gaps across the territory.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
