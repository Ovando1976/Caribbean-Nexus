import React from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";

import { generateDeterministicAudit } from "../lib/audit";
import { ensureFirebaseAuth } from "../lib/firebase-auth";
import { seedUsviBusinesses } from "../lib/firebase/seed-usvi-businesses";
import {
  getAllBusinesses,
  getBusinessById,
  setPipelineStage,
  updateBusiness,
} from "../lib/firebase/usvi-businesses";
import { estimatePipelineValue } from "../lib/scoring";
import {
  PIPELINE_STAGES,
  type BusinessRecord,
  type PipelineStage,
} from "../types/business";
import { ImportStudio } from "./components/ImportStudio";
import { buildOpportunityFeed } from "./lib/opportunity-feed";
import { PipelineBoard } from "./components/PipelineBoard";
import { generateOutreachDraft } from "./lib/outreach";
import { DuplicateReviewPanel } from "./components/DuplicateReviewPanel";
import { TerritoryHealthPanel } from "./components/TerritoryHealthPanel";
import { AttentionQueuePanel } from "./components/AttentionQueuePanel";
import { MergeCenter } from "./components/MergeCenter";
import { VerificationPanel } from "./components/VerificationPanel";
import { VerificationQueuePanel } from "./components/VerificationQueuePanel";
import { VerificationCenter } from "./components/VerificationCenter";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-white">
        <header className="border-b border-slate-800 bg-slate-900/70">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-lg font-semibold">
              USVI Business Intelligence Hub
            </h1>
            <nav className="flex items-center gap-3 text-sm">
              <Link
                className="rounded-lg px-3 py-1.5 hover:bg-slate-800"
                to="/"
              >
                Dashboard
              </Link>
              <Link
                className="rounded-lg px-3 py-1.5 hover:bg-slate-800"
                to="/businesses"
              >
                Businesses
              </Link>
              <Link
                className="rounded-lg px-3 py-1.5 hover:bg-slate-800"
                to="/pipeline"
              >
                Pipeline
              </Link>
              <Link
                className="rounded-lg px-3 py-1.5 hover:bg-slate-800"
                to="/merge-center"
              >
                Merge Center
              </Link>
              <Link
                className="rounded-lg px-3 py-1.5 hover:bg-slate-800"
                to="/verification-center"
              >
                Verification
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<DashboardRoute />} />
            <Route path="/businesses" element={<BusinessesRoute />} />
            <Route path="/businesses/:id" element={<BusinessDetailRoute />} />
            <Route path="/pipeline" element={<PipelineRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route path="/merge-center" element={<MergeCenterRoute />} />
            <Route
              path="/verification-center"
              element={<VerificationCenterRoute />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function VerificationCenterRoute() {
  const { businesses, loading, error } = useBusinesses();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return <VerificationCenter businesses={businesses} />;
}

function MergeCenterRoute() {
  const { businesses, loading, error, refresh } = useBusinesses();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-xl font-semibold">Merge Center</h2>
        <p className="mt-1 text-sm text-slate-400">
          Review duplicate candidates side by side and merge them safely.
        </p>
      </section>

      <MergeCenter businesses={businesses} onRefresh={refresh} />
    </div>
  );
}

function DashboardRoute() {
  const { businesses, loading, error, refresh } = useBusinesses();
  const [seeding, setSeeding] = React.useState(false);
  const [seedError, setSeedError] = React.useState<string | null>(null);

  async function handleSeed() {
    try {
      setSeeding(true);
      setSeedError(null);
      await ensureFirebaseAuth();
      await seedUsviBusinesses();
      await refresh();
    } catch (caught) {
      setSeedError(
        caught instanceof Error ? caught.message : "Failed to seed businesses."
      );
    } finally {
      setSeeding(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const byIsland = countBy(businesses, (item: BusinessRecord) => item.island);
  const byCategory = countBy(
    businesses,
    (item: BusinessRecord) => item.category
  );
  const totalValue = Math.round(
    businesses.reduce(
      (sum, business) => sum + estimatePipelineValue(business),
      0
    )
  );

  const opportunities = buildOpportunityFeed(businesses, 6);
  const highestPriority = businesses
    .slice()
    .sort(
      (a, b) => (b.scores?.priorityScore ?? 0) - (a.scores?.priorityScore ?? 0)
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Territory Overview</h2>
            <p className="mt-1 text-sm text-slate-400">
              Monitor business quality, pipeline value, and top opportunities.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleSeed()}
            disabled={seeding}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {seeding ? "Seeding..." : "Seed USVI Businesses"}
          </button>
        </div>

        {seedError ? (
          <p className="mt-3 text-sm text-rose-300">{seedError}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/pipeline"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
          >
            Open Pipeline Board
          </Link>

          <Link
            to="/businesses"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
          >
            Explore Businesses
          </Link>

          <Link
            to="/merge-center"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
          >
            Open Merge Center
          </Link>
          <Link
            to="/verification-center"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
          >
            Verification Targets
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Businesses" value={String(businesses.length)} />
        <MetricCard
          label="High Priority"
          value={String(
            businesses.filter((b) => (b.scores?.priorityScore ?? 0) >= 70)
              .length
          )}
        />
        <MetricCard
          label="Pipeline Value"
          value={`$${totalValue.toLocaleString()}`}
        />
        <MetricCard
          label="Responded+"
          value={String(
            businesses.filter((b) =>
              ["responded", "meeting_booked", "proposal_sent", "won"].includes(
                b.pipelineStage ?? ""
              )
            ).length
          )}
        />
      </section>
      <TerritoryHealthPanel businesses={businesses} />
      <AttentionQueuePanel businesses={businesses} />
      <VerificationQueuePanel businesses={businesses} />

      <section className="grid gap-4 lg:grid-cols-2">
        <ListCard title="By Island" entries={Object.entries(byIsland)} />
        <ListCard
          title="Top Categories"
          entries={Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)}
        />
      </section>

      <ImportStudio onImported={refresh} />

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <h3 className="font-semibold">Top Priority Leads</h3>
          <ul className="mt-3 space-y-2">
            {highestPriority.map((business) => (
              <li
                key={business.id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2"
              >
                <div>
                  <Link
                    to={`/businesses/${business.id}`}
                    className="font-medium text-sky-300 hover:text-sky-200"
                  >
                    {business.name}
                  </Link>
                  <div className="text-xs text-slate-400">
                    {label(business.island)} • {label(business.category)}
                  </div>
                </div>
                <Tag>Priority {business.scores?.priorityScore ?? 0}</Tag>
              </li>
            ))}
            {highestPriority.length === 0 ? (
              <li className="text-sm text-slate-400">No businesses yet.</li>
            ) : null}
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <h3 className="font-semibold">AI Opportunity Feed</h3>
          <ul className="mt-3 space-y-3">
            {opportunities.map((item) => (
              <li
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
                    <p className="mt-1 text-sm text-slate-300">
                      {item.summary}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      Recommendation: {item.recommendation}
                    </p>
                  </div>
                  <Tag>{item.priority}</Tag>
                </div>
              </li>
            ))}
            {opportunities.length === 0 ? (
              <li className="text-sm text-slate-400">No opportunities yet.</li>
            ) : null}
          </ul>
        </article>
      </section>
      <DuplicateReviewPanel businesses={businesses} onRefresh={refresh} />
    </div>
  );
}

function PipelineRoute() {
  const { businesses, loading, error, refresh } = useBusinesses();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-xl font-semibold">Pipeline Board</h2>
        <p className="mt-1 text-sm text-slate-400">
          Move businesses through the funnel, generate audits, and work the
          highest-value leads.
        </p>
      </section>

      <PipelineBoard businesses={businesses} onRefresh={refresh} />
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
      business.phone,
      business.email,
      business.website,
      business.address?.city,
      business.address?.district,
      ...(business.tags ?? []),
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
              <th className="px-4 py-3 text-left">Completeness</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map((business) => (
              <tr key={business.id} className="hover:bg-slate-800/40">
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <Link
                      className="font-medium text-sky-300 hover:text-sky-200"
                      to={`/businesses/${business.id}`}
                    >
                      {business.name}
                    </Link>
                    {business.description ? (
                      <p className="text-xs text-slate-400">
                        {business.description}
                      </p>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">{label(business.island)}</td>
                <td className="px-4 py-3">{label(business.category)}</td>
                <td className="px-4 py-3">
                  {label(business.pipelineStage ?? "discovered")}
                </td>
                <td className="px-4 py-3">
                  {business.scores?.priorityScore ?? 0}
                </td>
                <td className="px-4 py-3">
                  {business.scores?.completenessScore ?? 0}
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No businesses found.
                </td>
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
      await ensureFirebaseAuth();
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
      setError(
        caught instanceof Error ? caught.message : "Failed to load business."
      );
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!businessId) return <ErrorState message="Missing business ID." />;
  if (loading) return <LoadingState />;
  if (error || !business)
    return <ErrorState message={error ?? "Business not found."} />;

  const currentBusiness = business;
  const outreach = generateOutreachDraft(currentBusiness);

  async function saveNotes() {
    setBusy(true);
    try {
      await updateBusiness(currentBusiness.id, { notes: noteDraft });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function saveStage() {
    setBusy(true);
    try {
      await setPipelineStage(currentBusiness.id, stage);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function generateAudit() {
    setBusy(true);
    try {
      const audit = generateDeterministicAudit(currentBusiness);
      await updateBusiness(currentBusiness.id, { audit });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <button
        className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800"
        onClick={() => navigate("/businesses")}
      >
        Back to businesses
      </button>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-2xl font-semibold">{currentBusiness.name}</h2>
        <p className="mt-1 text-sm text-slate-400">
          {label(currentBusiness.category)} • {label(currentBusiness.island)}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Tag>{label(currentBusiness.pipelineStage ?? "discovered")}</Tag>
          <Tag>Priority {currentBusiness.scores?.priorityScore ?? 0}</Tag>
          <Tag>Complete {currentBusiness.scores?.completenessScore ?? 0}</Tag>
          <Tag>
            Value $
            {Math.round(
              estimatePipelineValue(currentBusiness)
            ).toLocaleString()}
          </Tag>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <h3 className="font-semibold">Business Profile</h3>

          <InfoRow label="Phone" value={currentBusiness.phone} />
          <InfoRow label="Email" value={currentBusiness.email} />
          <InfoRow label="Website" value={currentBusiness.website} />
          <InfoRow label="Owner" value={currentBusiness.ownerName} />
          <InfoRow
            label="Location"
            value={
              currentBusiness.address?.addressLine1 ||
              currentBusiness.address?.city ||
              currentBusiness.address?.district
            }
          />
          <InfoRow
            label="Merge Keys"
            value={
              currentBusiness.mergeKeys?.length
                ? currentBusiness.mergeKeys.join(", ")
                : "—"
            }
          />
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <h3 className="font-semibold">Operator Controls</h3>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
              Pipeline stage
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as PipelineStage)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            >
              {PIPELINE_STAGES.map((item) => (
                <option key={item} value={item}>
                  {label(item)}
                </option>
              ))}
            </select>
            <button
              disabled={busy}
              onClick={() => void saveStage()}
              className="mt-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-900 disabled:opacity-50"
            >
              Save stage
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
              Notes
            </label>
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <button
              disabled={busy}
              onClick={() => void saveNotes()}
              className="mt-2 rounded-lg border border-slate-700 px-3 py-2 text-sm disabled:opacity-50"
            >
              Save notes
            </button>
          </div>

          <button
            disabled={busy}
            onClick={() => void generateAudit()}
            className="rounded-lg bg-sky-400 px-3 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
          >
            Generate deterministic audit
          </button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <h3 className="font-semibold">Scoring</h3>
          <InfoRow
            label="Digital Maturity"
            value={String(currentBusiness.scores?.digitalMaturityScore ?? 0)}
          />
          <InfoRow
            label="Pain Point"
            value={String(currentBusiness.scores?.painPointScore ?? 0)}
          />
          <InfoRow
            label="Value Potential"
            value={String(currentBusiness.scores?.valuePotentialScore ?? 0)}
          />
          <InfoRow
            label="Close Likelihood"
            value={String(currentBusiness.scores?.closeLikelihoodScore ?? 0)}
          />
          <InfoRow
            label="Priority"
            value={String(currentBusiness.scores?.priorityScore ?? 0)}
          />
          <InfoRow
            label="Completeness"
            value={String(currentBusiness.scores?.completenessScore ?? 0)}
          />
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <h3 className="font-semibold">Audit</h3>
          <p className="text-sm text-slate-300">
            {currentBusiness.audit?.summary ?? "No audit yet."}
          </p>
          <AuditList
            title="Strengths"
            values={currentBusiness.audit?.strengths}
          />
          <AuditList
            title="Weaknesses"
            values={currentBusiness.audit?.weaknesses}
          />
          <AuditList
            title="Opportunities"
            values={currentBusiness.audit?.opportunities}
          />
          <p className="text-sm text-slate-300">
            <strong>Offer:</strong>{" "}
            {currentBusiness.audit?.recommendedOffer ?? "—"}
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <h3 className="font-semibold">Outreach Draft</h3>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Subject
            </p>
            <div className="mt-1 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200">
              {outreach.subject}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Email
            </p>
            <pre className="mt-1 whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200">
              {outreach.email}
            </pre>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <h3 className="font-semibold">SMS Draft</h3>
          <pre className="whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200">
            {outreach.sms}
          </pre>

          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Suggested next move
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Send outreach after reviewing the audit and confirming the
              strongest offer fit.
            </p>
          </div>
        </div>
      </section>
      <VerificationPanel business={currentBusiness} onRefresh={refresh} />
    </div>
  );
}

function useBusinesses() {
  const [businesses, setBusinesses] = React.useState<BusinessRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await ensureFirebaseAuth();
      const data = await getAllBusinesses();
      setBusinesses(data);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to load businesses."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return { businesses, loading, error, refresh };
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

function ListCard({
  title,
  entries,
}: {
  title: string;
  entries: Array<[string, number]>;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {entries.map(([name, count]) => (
          <li
            key={name}
            className="flex items-center justify-between text-slate-300"
          >
            <span>{label(name)}</span>
            <strong>{count}</strong>
          </li>
        ))}
        {entries.length === 0 ? (
          <li className="text-slate-400">No data available.</li>
        ) : null}
      </ul>
    </article>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-slate-700 bg-slate-800/50 px-2.5 py-1">
      {children}
    </span>
  );
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

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-2 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="max-w-[60%] text-right text-slate-200">
        {value || "—"}
      </span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
      Loading...
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-rose-800 bg-rose-900/20 p-8 text-center text-rose-200">
      {message}
    </div>
  );
}
