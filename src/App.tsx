import React from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";

import { generateDeterministicAudit } from "../lib/audit";
import {
  getAllBusinesses,
  getBusinessById,
  setPipelineStage,
  updateBusiness,
} from "../lib/firebase/usvi-businesses";
import { estimatePipelineValue } from "../lib/scoring";
import { PIPELINE_STAGES, type BusinessRecord, type PipelineStage } from "../types/business";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-white">
        <header className="border-b border-slate-800 bg-slate-900/70">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-lg font-semibold">USVI Business Intelligence Hub</h1>
            <nav className="flex items-center gap-3 text-sm">
              <Link className="rounded-lg px-3 py-1.5 hover:bg-slate-800" to="/">Dashboard</Link>
              <Link className="rounded-lg px-3 py-1.5 hover:bg-slate-800" to="/businesses">Businesses</Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<DashboardRoute />} />
            <Route path="/businesses" element={<BusinessesRoute />} />
            <Route path="/businesses/:id" element={<BusinessDetailRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function DashboardRoute() {
  const { businesses, loading, error } = useBusinesses();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const byIsland = countBy(businesses, (item: BusinessRecord) => item.island);
  const byCategory = countBy(businesses, (item: BusinessRecord) => item.category);
  const totalValue = Math.round(businesses.reduce((sum, b) => sum + estimatePipelineValue(b), 0));

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Businesses" value={String(businesses.length)} />
        <MetricCard label="High Priority" value={String(businesses.filter((b) => (b.scores?.priorityScore ?? 0) >= 70).length)} />
        <MetricCard label="Pipeline Value" value={`$${totalValue.toLocaleString()}`} />
        <MetricCard label="Responded+" value={String(businesses.filter((b) => ["responded", "meeting_booked", "proposal_sent", "won"].includes(b.pipelineStage ?? "")).length)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ListCard title="By Island" entries={Object.entries(byIsland)} />
        <ListCard title="Top Categories" entries={Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 6)} />
      </section>
    </div>
  );
}

function BusinessesRoute() {
  const { businesses, loading, error } = useBusinesses();
  const [search, setSearch] = React.useState("");

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const filtered = businesses.filter((business) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;

    const haystack = [
      business.name,
      business.category,
      business.island,
      business.description,
      business.ownerName,
      business.notes,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          placeholder="Search businesses, categories, notes..."
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/80 text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Business</th>
              <th className="px-4 py-3 text-left">Island</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Stage</th>
              <th className="px-4 py-3 text-left">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map((business) => (
              <tr key={business.id} className="hover:bg-slate-800/40">
                <td className="px-4 py-3">
                  <Link className="font-medium text-sky-300 hover:text-sky-200" to={`/businesses/${business.id}`}>
                    {business.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{label(business.island)}</td>
                <td className="px-4 py-3">{label(business.category)}</td>
                <td className="px-4 py-3">{label(business.pipelineStage ?? "discovered")}</td>
                <td className="px-4 py-3">{business.scores?.priorityScore ?? 0}</td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No businesses found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BusinessDetailRoute() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [business, setBusiness] = React.useState<BusinessRecord | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [noteDraft, setNoteDraft] = React.useState("");
  const [stage, setStage] = React.useState<PipelineStage>("discovered");
  const [busy, setBusy] = React.useState(false);

  const businessId = params.id;

  const refresh = React.useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);

    try {
      const next = await getBusinessById(businessId);
      if (!next) {
        setError("Business not found.");
        setBusiness(null);
        return;
      }
      setBusiness(next);
      setNoteDraft(next.notes ?? "");
      setStage(next.pipelineStage ?? "discovered");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load business.");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!businessId) return <ErrorState message="Missing business ID." />;
  if (loading) return <LoadingState />;
  if (error || !business) return <ErrorState message={error ?? "Business not found."} />;

  async function saveNotes() {
    setBusy(true);
    try {
      await updateBusiness(business.id, { notes: noteDraft });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function saveStage() {
    setBusy(true);
    try {
      await setPipelineStage(business.id, stage);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function generateAudit() {
    setBusy(true);
    try {
      const audit = generateDeterministicAudit(business);
      await updateBusiness(business.id, { audit });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <button className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800" onClick={() => navigate("/businesses")}>Back to businesses</button>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-2xl font-semibold">{business.name}</h2>
        <p className="mt-1 text-sm text-slate-400">{label(business.category)} • {label(business.island)}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Tag>{label(business.pipelineStage ?? "discovered")}</Tag>
          <Tag>Priority {business.scores?.priorityScore ?? 0}</Tag>
          <Tag>Value ${Math.round(estimatePipelineValue(business)).toLocaleString()}</Tag>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <h3 className="font-semibold">Operator Controls</h3>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Pipeline stage</label>
            <select value={stage} onChange={(e) => setStage(e.target.value as PipelineStage)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
              {PIPELINE_STAGES.map((item) => <option key={item} value={item}>{label(item)}</option>)}
            </select>
            <button disabled={busy} onClick={() => void saveStage()} className="mt-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-900 disabled:opacity-50">Save stage</button>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Notes</label>
            <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} rows={5} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
            <button disabled={busy} onClick={() => void saveNotes()} className="mt-2 rounded-lg border border-slate-700 px-3 py-2 text-sm disabled:opacity-50">Save notes</button>
          </div>

          <button disabled={busy} onClick={() => void generateAudit()} className="rounded-lg bg-sky-400 px-3 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50">
            Generate deterministic audit
          </button>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <h3 className="font-semibold">Audit</h3>
          <p className="text-sm text-slate-300">{business.audit?.summary ?? "No audit yet."}</p>
          <AuditList title="Strengths" values={business.audit?.strengths} />
          <AuditList title="Weaknesses" values={business.audit?.weaknesses} />
          <AuditList title="Opportunities" values={business.audit?.opportunities} />
          <p className="text-sm text-slate-300"><strong>Offer:</strong> {business.audit?.recommendedOffer ?? "—"}</p>
        </div>
      </section>
    </div>
  );
}

function useBusinesses() {
  const [businesses, setBusinesses] = React.useState<BusinessRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await getAllBusinesses();
        if (active) setBusinesses(data);
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Failed to load businesses.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return { businesses, loading, error };
}

function countBy<T>(values: T[], keyFn: (value: T) => string) {
  return values.reduce<Record<string, number>>((acc, value) => {
    const key = keyFn(value);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function label(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </article>
  );
}

function ListCard({ title, entries }: { title: string; entries: Array<[string, number]> }) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {entries.map(([name, count]) => (
          <li key={name} className="flex items-center justify-between text-slate-300">
            <span>{label(name)}</span>
            <strong>{count}</strong>
          </li>
        ))}
      </ul>
    </article>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-slate-700 bg-slate-800/50 px-2.5 py-1">{children}</span>;
}

function AuditList({ title, values }: { title: string; values?: string[] }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-300">
        {(values && values.length > 0 ? values : ["—"]).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function LoadingState() {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">Loading...</div>;
}

function ErrorState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-rose-800 bg-rose-900/20 p-8 text-center text-rose-200">{message}</div>;
}
