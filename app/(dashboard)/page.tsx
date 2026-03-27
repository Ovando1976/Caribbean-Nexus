import React, { useEffect, useState } from "react";
import {
  getAllBusinesses,
  getTopPriorityBusinesses,
} from "@/lib/firebase/usvi-businesses";
import { estimatePipelineValue } from "@/lib/scoring";
import type { BusinessRecord } from "@/types/business";
import { ensureFirebaseAuth } from "@/lib/firebase-auth";
import { seedUsviBusinesses } from "@/lib/firebase/seed-usvi-businesses";

export default function DashboardPage() {
  const [allBusinesses, setAllBusinesses] = useState<BusinessRecord[]>([]);
  const [topLeads, setTopLeads] = useState<BusinessRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [seeding, setSeeding] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const user = await ensureFirebaseAuth();
        console.log("auth uid", user?.uid ?? "no-user");

        const [all, top] = await Promise.all([
          getAllBusinesses(),
          getTopPriorityBusinesses(5),
        ]);

        if (!isMounted) return;

        setAllBusinesses(all);
        setTopLeads(top);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        if (!isMounted) return;
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard"
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalBusinesses = allBusinesses.length;

  const byIsland = allBusinesses.reduce<Record<string, number>>(
    (acc, business) => {
      acc[business.island] = (acc[business.island] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const byCategory = allBusinesses.reduce<Record<string, number>>(
    (acc, business) => {
      acc[business.category] = (acc[business.category] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const pipelineValue = Math.round(
    allBusinesses.reduce(
      (sum, business) => sum + estimatePipelineValue(business),
      0
    )
  );

  async function handleSeed() {
    try {
      setSeeding(true);
      setError(null);
      await ensureFirebaseAuth();
      await seedUsviBusinesses();

      const [all, top] = await Promise.all([
        getAllBusinesses(),
        getTopPriorityBusinesses(5),
      ]);

      setAllBusinesses(all);
      setTopLeads(top);
    } catch (err) {
      console.error("Seed failed:", err);
      setError(err instanceof Error ? err.message : "Seed failed");
    } finally {
      setSeeding(false);
    }
  }

  if (loading) {
    return (
      <main className="space-y-8 p-6">
        <section>
          <h1 className="text-2xl font-semibold text-slate-900">
            USVI Territory Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">Loading dashboard...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-8 p-6">
      <section>
        <h1 className="text-2xl font-semibold text-slate-900">
          USVI Territory Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Track where the best revenue opportunities are today.
        </p>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {seeding ? "Seeding..." : "Seed USVI Businesses"}
          </button>
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Businesses" value={String(totalBusinesses)} />
        <KpiCard
          label="High Opportunity (70+)"
          value={String(
            allBusinesses.filter(
              (business) => (business.scores?.priorityScore ?? 0) >= 70
            ).length
          )}
        />
        <KpiCard
          label="Active Pipeline Value"
          value={`$${pipelineValue.toLocaleString()}`}
        />
        <KpiCard
          label="Responded+"
          value={String(
            allBusinesses.filter((business) =>
              ["responded", "meeting_booked", "proposal_sent", "won"].includes(
                business.pipelineStage ?? ""
              )
            ).length
          )}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <StatsCard title="Businesses by Island" items={byIsland} />
        <StatsCard title="Businesses by Category" items={byCategory} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Top Priority Leads
        </h2>
        <ul className="space-y-2">
          {topLeads.map((lead) => (
            <li
              key={lead.id}
              className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {lead.name}
                </p>
                <p className="text-xs text-slate-500">
                  {lead.island.replace(/_/g, " ")} •{" "}
                  {lead.category.replace(/_/g, " ")}
                </p>
              </div>
              <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-800">
                {lead.scores?.priorityScore ?? 0}
              </span>
            </li>
          ))}
          {topLeads.length === 0 ? (
            <li className="text-sm text-slate-500">No leads yet.</li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </article>
  );
}

function StatsCard({
  title,
  items,
}: {
  title: string;
  items: Record<string, number>;
}) {
  const entries = Object.entries(items).sort((a, b) => b[1] - a[1]);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">{title}</h2>
      <ul className="space-y-2 text-sm text-slate-700">
        {entries.map(([name, count]) => (
          <li key={name} className="flex items-center justify-between">
            <span>{name.replace(/_/g, " ")}</span>
            <strong>{count}</strong>
          </li>
        ))}
        {entries.length === 0 ? (
          <li className="text-slate-500">No data available.</li>
        ) : null}
      </ul>
    </article>
  );
}
