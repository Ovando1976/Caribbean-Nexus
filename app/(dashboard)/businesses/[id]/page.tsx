import type { ReactNode } from "react";
import {
  ArrowLeft,
  AtSign,
  Building2,
  Globe,
  MapPin,
  MessageSquare,
  Phone,
  Sparkles,
  Star,
  Target,
} from "lucide-react";

import { BusinessNotesForm } from "@/components/business/business-notes-form";
import { GenerateAuditButton } from "@/components/business/generate-audit-button";
import { BusinessScoreBadge } from "@/components/business/business-score-badge";
import { UpdatePipelineForm } from "@/components/business/update-pipeline-form";
import { getBusinessById } from "@/lib/firebase/usvi-businesses";
import { estimatePipelineValue } from "@/lib/scoring";
import {
  generateAuditAction,
  updateBusinessNotesAction,
  updatePipelineStageAction,
} from "./actions";

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const business = await getBusinessById(id);

  if (!business) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/50 p-8 text-center">
          <h1 className="text-2xl font-semibold">Business not found</h1>
          <p className="mt-2 text-sm text-slate-400">
            The business record might have been removed or the URL is incorrect.
          </p>
          <a
            href="/businesses"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to explorer
          </a>
        </div>
      </main>
    );
  }

  const digital = business.digitalPresence ?? {};
  const score = business.scores ?? {};
  const reviewMetrics = business.reviewMetrics ?? {};
  const pipelineValue = estimatePipelineValue(business);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <a
            href="/businesses"
            className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to explorer
          </a>

          <div className="flex flex-wrap items-center gap-2">
            <Pill>{prettyLabel(business.island)}</Pill>
            <Pill>{prettyLabel(business.category)}</Pill>
            <Pill>{prettyLabel(business.pipelineStage ?? "discovered")}</Pill>
            <GenerateAuditButton businessId={business.id} action={generateAuditAction} />
          </div>
        </div>

        <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-300 ring-1 ring-sky-500/20">
                <Sparkles className="h-3.5 w-3.5" />
                Business Profile
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight">{business.name}</h1>
                <p className="mt-1 text-sm text-slate-400">
                  {prettyLabel(business.category)} • {prettyLabel(business.island)} • {prettyLabel(business.pipelineStage ?? "discovered")}
                </p>
              </div>

              {business.description ? (
                <p className="max-w-3xl text-sm leading-6 text-slate-300">{business.description}</p>
              ) : null}
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[340px]">
              <MetricCard
                icon={<Target className="h-5 w-5" />}
                label="Priority score"
                value={String(score.priorityScore ?? 0)}
              />
              <MetricCard
                icon={<Building2 className="h-5 w-5" />}
                label="Est. pipeline value"
                value={formatCurrency(pipelineValue)}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Card title="Contact & Profile">
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={business.phone ?? "Not available"} />
              <InfoRow icon={<AtSign className="h-4 w-4" />} label="Email" value={business.email ?? "Not available"} />
              <InfoRow icon={<Globe className="h-4 w-4" />} label="Website" value={business.website ?? "Not available"} />
              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label="Location"
                value={[business.address?.district, business.address?.city, business.address?.neighborhood]
                  .filter(Boolean)
                  .join(", ") || "Not available"}
              />
            </Card>

            <Card title="Digital Presence Audit">
              <FlagGrid
                items={[
                  { label: "Website", enabled: digital.hasWebsite },
                  { label: "Online menu", enabled: digital.hasOnlineMenu },
                  { label: "Online booking", enabled: digital.hasOnlineBooking },
                  { label: "Online ordering", enabled: digital.hasOnlineOrdering },
                  { label: "Social presence", enabled: digital.hasSocialPresence },
                  { label: "Recent social activity", enabled: digital.hasRecentSocialActivity },
                  { label: "Google Business Profile", enabled: digital.hasGoogleBusinessProfile },
                ]}
              />
            </Card>

            <Card title="Audit Summary">
              {business.audit?.summary ? (
                <p className="text-sm leading-6 text-slate-300">{business.audit.summary}</p>
              ) : (
                <p className="text-sm text-slate-500">No audit summary yet.</p>
              )}

              <BulletSection label="Strengths" values={business.audit?.strengths} />
              <BulletSection label="Weaknesses" values={business.audit?.weaknesses} />
              <BulletSection label="Opportunities" values={business.audit?.opportunities} />

              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Recommended offer</p>
                <p className="mt-1 text-sm text-slate-200">{business.audit?.recommendedOffer ?? "Not generated yet."}</p>
                {business.audit?.recommendedMonthlyValue ? (
                  <p className="mt-2 text-sm text-emerald-300">
                    Estimated monthly value: {formatCurrency(business.audit.recommendedMonthlyValue)}
                  </p>
                ) : null}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Score Breakdown">
              <div className="space-y-3">
                <ScoreRow label="Digital maturity" value={score.digitalMaturityScore ?? 0} />
                <ScoreRow label="Pain points" value={score.painPointScore ?? 0} />
                <ScoreRow label="Value potential" value={score.valuePotentialScore ?? 0} />
                <ScoreRow label="Close likelihood" value={score.closeLikelihoodScore ?? 0} />
                <ScoreRow label="Priority" value={score.priorityScore ?? 0} emphasize />
              </div>
            </Card>

            <Card title="Reputation & Pipeline">
              <InfoRow
                icon={<Star className="h-4 w-4" />}
                label="Rating"
                value={reviewMetrics.rating ? `${reviewMetrics.rating.toFixed(1)} / 5` : "N/A"}
              />
              <InfoRow
                icon={<MessageSquare className="h-4 w-4" />}
                label="Review count"
                value={String(reviewMetrics.reviewCount ?? 0)}
              />
              <InfoRow label="Status" value={prettyLabel(business.status)} />
              <InfoRow label="Pipeline stage" value={prettyLabel(business.pipelineStage ?? "discovered")} />
              <InfoRow label="Last contacted" value={business.lastContactedAt ?? "Not set"} />
            </Card>

            <Card title="Notes">
              {business.notes ? (
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{business.notes}</p>
              ) : (
                <p className="text-sm text-slate-500">No notes yet.</p>
              )}

              <div className="mt-4">
                <BusinessNotesForm
                  businessId={business.id}
                  initialNotes={business.notes}
                  action={updateBusinessNotesAction}
                />
              </div>
            </Card>

            <Card title="Activity / Controls">
              <p className="text-sm text-slate-400">
                Update pipeline stage directly from this panel. Notes can be updated in the notes section.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <BusinessScoreBadge score={score.priorityScore} label="Priority" />
                <span className="inline-flex rounded-full bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-500/20">
                  {prettyLabel(business.pipelineStage ?? "discovered")}
                </span>
              </div>

              <div className="mt-4">
                <UpdatePipelineForm
                  businessId={business.id}
                  currentStage={business.pipelineStage}
                  action={updatePipelineStageAction}
                />
              </div>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="mb-4 text-lg font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

function MetricCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/65 p-4">
      <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-slate-300 ring-1 ring-slate-800">
        {icon}
      </div>
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-300">
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon?: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-800/70 py-2 text-sm last:border-0 last:pb-0">
      <div className="inline-flex items-center gap-2 text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className="max-w-[65%] text-right text-slate-200">{value}</div>
    </div>
  );
}

function FlagGrid({ items }: { items: Array<{ label: string; enabled?: boolean }> }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-xl border px-3 py-2 text-sm ${
            item.enabled
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-slate-800 bg-slate-950/50 text-slate-500"
          }`}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}

function ScoreRow({ label, value, emphasize = false }: { label: string; value: number; emphasize?: boolean }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className={emphasize ? "font-semibold text-white" : "text-slate-300"}>{label}</span>
        <span className={emphasize ? "font-semibold text-white" : "text-slate-400"}>{safe}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800">
        <div
          className={`h-2 rounded-full ${emphasize ? "bg-gradient-to-r from-sky-400 to-indigo-400" : "bg-slate-500"}`}
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
}

function BulletSection({ label, values }: { label: string; values?: string[] }) {
  return (
    <div className="mt-4">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      {values && values.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
          {values.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">None yet.</p>
      )}
    </div>
  );
}

function prettyLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
