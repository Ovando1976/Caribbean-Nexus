import React from "react";
import type { BusinessInput } from "../../types/business";
import { bulkUpsertBusinesses } from "../../lib/firebase/usvi-businesses";
import { ensureFirebaseAuth } from "../../lib/firebase-auth";
import { getSampleBusinessCsv, parseBusinessesCsv } from "../lib/csv-import";
import {
  validateImportedBusinesses,
  type ImportValidationIssue,
} from "../lib/import-validate";

type Props = {
  onImported?: () => Promise<void> | void;
};

const IMPORT_PRESETS: Array<{
  label: string;
  value: Array<BusinessInput & { id?: string }>;
}> = [
  {
    label: "Restaurants",
    value: [
      {
        name: "Harbor View Bistro",
        island: "st_thomas",
        category: "restaurant",
        status: "active",
        description: "Waterfront casual dining in Charlotte Amalie.",
        phone: "+1-340-555-0101",
        website: "harborviewbistrovi.com",
      },
      {
        name: "Cruz Bay Kitchen",
        island: "st_john",
        category: "restaurant",
        status: "active",
        description: "Popular local restaurant in Cruz Bay.",
        phone: "+1-340-555-0114",
      },
    ],
  },
  {
    label: "Tourism",
    value: [
      {
        name: "Island Escape Villas",
        island: "st_thomas",
        category: "tourism_hospitality",
        status: "active",
        description: "Luxury villa bookings for short-stay visitors.",
        email: "bookings@islandescapevillas.com",
        website: "islandescapevillas.com",
      },
      {
        name: "Reef Sail Charters",
        island: "st_john",
        category: "tourism_hospitality",
        status: "lead",
        description: "Private charter and snorkeling trips.",
        phone: "+1-340-555-0115",
      },
    ],
  },
  {
    label: "Transport",
    value: [
      {
        name: "Red Hook Ride Co.",
        island: "st_thomas",
        category: "transport",
        status: "active",
        description: "Airport and ferry transfer operator.",
        phone: "+1-340-555-0116",
      },
      {
        name: "Crown Bay Shuttle",
        island: "st_thomas",
        category: "transport",
        status: "lead",
        description: "Cruise and hotel shuttle operator.",
        email: "dispatch@crownbayshuttle.com",
      },
    ],
  },
  {
    label: "Real Estate",
    value: [
      {
        name: "Blue Horizon Realty",
        island: "st_thomas",
        category: "real_estate",
        status: "active",
        description: "Brokerage focused on relocation and residential sales.",
        website: "bluehorizonrealtyvi.com",
      },
      {
        name: "Cruz Bay Property Group",
        island: "st_john",
        category: "real_estate",
        status: "active",
        description: "Real estate advisory and rental management.",
        email: "info@cruzbaypropertygroup.com",
      },
    ],
  },
];

export function ImportStudio({ onImported }: Props) {
  const [value, setValue] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<"json" | "csv">("json");
  const [previewRows, setPreviewRows] = React.useState<
    Array<BusinessInput & { id?: string }>
  >([]);
  const [issues, setIssues] = React.useState<ImportValidationIssue[]>([]);
  const [validatedRows, setValidatedRows] = React.useState<
    Array<BusinessInput & { id?: string }>
  >([]);

  function clearValidation() {
    setPreviewRows([]);
    setIssues([]);
    setValidatedRows([]);
  }

  function parseCurrentInput(): Array<BusinessInput & { id?: string }> {
    if (mode === "json") {
      const parsed = JSON.parse(value) as Array<BusinessInput & { id?: string }>;
      if (!Array.isArray(parsed)) {
        throw new Error("JSON must be an array of businesses.");
      }
      return parsed;
    }

    return parseBusinessesCsv(value);
  }

  function handlePreview() {
    try {
      setError(null);
      setMessage(null);

      const parsed = parseCurrentInput();
      const result = validateImportedBusinesses(parsed);

      setPreviewRows(parsed);
      setIssues(result.issues);
      setValidatedRows(result.valid);

      if (parsed.length === 0) {
        setError("No rows found to preview.");
      }
    } catch (caught) {
      clearValidation();
      setError(caught instanceof Error ? caught.message : "Preview failed.");
    }
  }

  async function handleImportValidated() {
    try {
      setBusy(true);
      setError(null);
      setMessage(null);

      const parsed = validatedRows.length > 0 ? validatedRows : parseCurrentInput();
      const result = validateImportedBusinesses(parsed);

      if (result.valid.length === 0) {
        throw new Error("No valid rows available to import.");
      }

      await ensureFirebaseAuth();
      await bulkUpsertBusinesses(result.valid);

      setMessage(`Imported ${result.valid.length} businesses.`);
      setValue("");
      clearValidation();
      await onImported?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  function applyPreset(preset: Array<BusinessInput & { id?: string }>) {
    setMode("json");
    setMessage(null);
    setError(null);
    clearValidation();
    setValue(JSON.stringify(preset, null, 2));
  }

  function applyCsvPreset() {
    setMode("csv");
    setMessage(null);
    setError(null);
    clearValidation();
    setValue(getSampleBusinessCsv());
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const nextMode = file.name.toLowerCase().endsWith(".csv") ? "csv" : "json";

    setMode(nextMode);
    setMessage(null);
    setError(null);
    clearValidation();
    setValue(text);
    event.target.value = "";
  }

  const errorCount = issues.filter((issue) => issue.level === "error").length;
  const warningCount = issues.filter((issue) => issue.level === "warning").length;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Import Studio</h3>
          <p className="mt-1 text-sm text-slate-400">
            Import businesses from JSON or CSV with preview validation.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePreview}
            disabled={!value.trim()}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 disabled:opacity-50"
          >
            Preview
          </button>

          <button
            type="button"
            onClick={() => void handleImportValidated()}
            disabled={busy || !value.trim()}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
          >
            {busy ? "Importing..." : "Import Valid Rows"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("json")}
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            mode === "json"
              ? "border-sky-500 bg-sky-500/10 text-sky-300"
              : "border-slate-700 text-slate-200 hover:bg-slate-800"
          }`}
        >
          JSON
        </button>
        <button
          type="button"
          onClick={() => setMode("csv")}
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            mode === "csv"
              ? "border-sky-500 bg-sky-500/10 text-sky-300"
              : "border-slate-700 text-slate-200 hover:bg-slate-800"
          }`}
        >
          CSV
        </button>

        {IMPORT_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => applyPreset(preset.value)}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
          >
            {preset.label}
          </button>
        ))}

        <button
          type="button"
          onClick={applyCsvPreset}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
        >
          CSV Sample
        </button>

        <label className="cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800">
          Upload file
          <input
            type="file"
            accept=".json,.csv,text/csv,application/json"
            className="hidden"
            onChange={(event) => void handleFileUpload(event)}
          />
        </label>
      </div>

      <textarea
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          clearValidation();
        }}
        rows={12}
        className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-200"
        placeholder={
          mode === "json"
            ? `[
  {
    "name": "Harbor View Bistro",
    "island": "st_thomas",
    "category": "restaurant",
    "status": "active"
  }
]`
            : `name,island,category,status,phone,email
Harbor View Bistro,st_thomas,restaurant,active,+1-340-555-0101,hello@example.com`
        }
      />

      {(previewRows.length > 0 || issues.length > 0) && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h4 className="font-semibold text-white">Preview Summary</h4>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Parsed Rows
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {previewRows.length}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Valid Rows
                </p>
                <p className="mt-2 text-2xl font-semibold text-emerald-300">
                  {validatedRows.length}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Errors
                </p>
                <p className="mt-2 text-2xl font-semibold text-rose-300">
                  {errorCount}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Warnings
                </p>
                <p className="mt-2 text-2xl font-semibold text-amber-300">
                  {warningCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h4 className="font-semibold text-white">Validation Issues</h4>
            <div className="mt-3 max-h-64 space-y-2 overflow-auto">
              {issues.length === 0 ? (
                <p className="text-sm text-emerald-300">
                  No issues detected. Ready to import.
                </p>
              ) : (
                issues.map((issue, index) => (
                  <div
                    key={`${issue.row}-${issue.field}-${index}`}
                    className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-200">
                        Row {issue.row} • {issue.field}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          issue.level === "error"
                            ? "bg-rose-500/15 text-rose-300"
                            : "bg-amber-500/15 text-amber-300"
                        }`}
                      >
                        {issue.level}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-400">{issue.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </section>
  );
}