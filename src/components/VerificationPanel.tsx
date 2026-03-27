import React from "react";
import type { BusinessRecord } from "../../types/business";
import { ProvenanceBadge } from "./ProvenanceBadge";
import { VerifyFieldButton } from "./VerifyFieldButton";

function formatAddressValue(
  value?:
    | {
        addressLine1?: string;
        city?: string;
        district?: string;
        postalCode?: string;
      }
    | string
) {
  if (!value) return "—";
  if (typeof value === "string") return value;

  return [value.addressLine1, value.city, value.district, value.postalCode]
    .filter(Boolean)
    .join(", ");
}

function FieldRow({
  label,
  value,
  source,
  sourceUrl,
  confidence,
  action,
}: {
  label: string;
  value?: string | null;
  source?: string;
  sourceUrl?: string;
  confidence?: "high" | "medium" | "low";
  action?: React.ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <ProvenanceBadge
          source={source}
          sourceUrl={sourceUrl}
          confidence={confidence}
        />
      </div>

      <p className="text-sm text-slate-200">{value || "—"}</p>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function VerificationPanel({
  business,
  onRefresh,
}: {
  business: BusinessRecord;
  onRefresh?: () => Promise<void> | void;
}) {
  const verification = (business as any).verification ?? {};

  const legalNameValue =
    verification.legalName?.value ?? business.legalName ?? "—";
  const entityStatusValue = verification.entityStatus?.value ?? business.status;
  const phoneValue = verification.phone?.value ?? business.phone ?? "—";
  const websiteValue = verification.website?.value ?? business.website ?? "—";
  const addressValue = verification.address?.value
    ? formatAddressValue(verification.address.value)
    : formatAddressValue(business.address);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
      <div>
        <h3 className="font-semibold">Verification & Provenance</h3>
        <p className="mt-1 text-sm text-slate-400">
          Where this record came from and how trustworthy the key fields are.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <FieldRow
          label="Record Source"
          value={business.source?.source ?? "Unknown"}
          source={business.source?.source}
          sourceUrl={business.source?.sourceUrl}
        />

        <FieldRow
          label="Legal Name"
          value={legalNameValue}
          source={
            verification.legalName?.provenance?.source ??
            business.source?.source
          }
          sourceUrl={
            verification.legalName?.provenance?.sourceUrl ??
            business.source?.sourceUrl
          }
          confidence={verification.legalName?.provenance?.confidence}
          action={
            <VerifyFieldButton
              businessId={business.id}
              field="legalName"
              value={business.legalName}
              onDone={onRefresh}
            />
          }
        />

        <FieldRow
          label="Entity Status"
          value={entityStatusValue}
          source={verification.entityStatus?.provenance?.source}
          sourceUrl={verification.entityStatus?.provenance?.sourceUrl}
          confidence={verification.entityStatus?.provenance?.confidence}
        />

        <FieldRow
          label="Phone"
          value={phoneValue}
          source={
            verification.phone?.provenance?.source ?? business.source?.source
          }
          sourceUrl={
            verification.phone?.provenance?.sourceUrl ??
            business.source?.sourceUrl
          }
          confidence={verification.phone?.provenance?.confidence}
          action={
            <VerifyFieldButton
              businessId={business.id}
              field="phone"
              value={business.phone}
              onDone={onRefresh}
            />
          }
        />

        <FieldRow
          label="Website"
          value={websiteValue}
          source={
            verification.website?.provenance?.source ?? business.source?.source
          }
          sourceUrl={
            verification.website?.provenance?.sourceUrl ??
            business.source?.sourceUrl
          }
          confidence={verification.website?.provenance?.confidence}
          action={
            <VerifyFieldButton
              businessId={business.id}
              field="website"
              value={business.website}
              onDone={onRefresh}
            />
          }
        />

        <FieldRow
          label="Address"
          value={addressValue}
          source={
            verification.address?.provenance?.source ?? business.source?.source
          }
          sourceUrl={
            verification.address?.provenance?.sourceUrl ??
            business.source?.sourceUrl
          }
          confidence={verification.address?.provenance?.confidence}
          action={
            <VerifyFieldButton
              businessId={business.id}
              field="address"
              value={business.address}
              onDone={onRefresh}
            />
          }
        />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-sm text-slate-300">
        <strong>Last verified:</strong>{" "}
        {business.lastVerifiedAt ?? "Not yet verified"}
      </div>
    </section>
  );
}
