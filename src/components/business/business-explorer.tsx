import React, { useMemo, useState } from "react";
import type {
  BusinessCategory,
  BusinessRecord,
  BusinessStatus,
  IslandCode,
  PipelineStage,
} from "@/types/business";
import {
  BUSINESS_CATEGORIES,
  BUSINESS_STATUS,
  ISLANDS,
  PIPELINE_STAGES,
} from "@/types/business";

type Props = {
  businesses: BusinessRecord[];
};

type Filters = {
  search: string;
  island: "all" | IslandCode;
  category: "all" | BusinessCategory;
  status: "all" | BusinessStatus;
  pipelineStage: "all" | PipelineStage;
};

type SortKey = "name" | "priority" | "completeness" | "island" | "category";

function prettyLabel(value?: string) {
  if (!value) return "—";

  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function matchesSearch(business: BusinessRecord, search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  const haystack = [
    business.name,
    business.legalName,
    business.description,
    business.phone,
    business.email,
    business.website,
    business.ownerName,
    business.address?.city,
    business.address?.district,
    business.address?.neighborhood,
    business.category,
    business.subcategory,
    ...(business.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export function BusinessExplorer({ businesses }: Props) {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    island: "all",
    category: "all",
    status: "all",
    pipelineStage: "all",
  });

  const [sortKey, setSortKey] = useState<SortKey>("priority");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    return businesses
      .filter((business) => matchesSearch(business, filters.search))
      .filter((business) =>
        filters.island === "all" ? true : business.island === filters.island
      )
      .filter((business) =>
        filters.category === "all"
          ? true
          : business.category === filters.category
      )
      .filter((business) =>
        filters.status === "all" ? true : business.status === filters.status
      )
      .filter((business) =>
        filters.pipelineStage === "all"
          ? true
          : business.pipelineStage === filters.pipelineStage
      );
  }, [businesses, filters]);

  const sorted = useMemo(() => {
    const items = [...filtered];

    items.sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;

      if (sortKey === "name") {
        return a.name.localeCompare(b.name) * direction;
      }

      if (sortKey === "island") {
        return a.island.localeCompare(b.island) * direction;
      }

      if (sortKey === "category") {
        return a.category.localeCompare(b.category) * direction;
      }

      if (sortKey === "priority") {
        return (
          ((a.scores?.priorityScore ?? 0) - (b.scores?.priorityScore ?? 0)) *
          direction
        );
      }

      return (
        ((a.scores?.completenessScore ?? 0) -
          (b.scores?.completenessScore ?? 0)) *
        direction
      );
    });

    return items;
  }, [filtered, sortDirection, sortKey]);

  function setSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "name" ? "asc" : "desc");
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-5">
        <label className="lg:col-span-2">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Search
          </span>
          <input
            value={filters.search}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                search: event.target.value,
              }))
            }
            placeholder="Search businesses, contacts, tags, neighborhoods..."
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
          />
        </label>

        <SelectField
          label="Island"
          value={filters.island}
          onChange={(value) =>
            setFilters((current) => ({
              ...current,
              island: value as Filters["island"],
            }))
          }
          options={[
            { label: "All islands", value: "all" },
            ...ISLANDS.map((value) => ({
              label: prettyLabel(value),
              value,
            })),
          ]}
        />

        <SelectField
          label="Category"
          value={filters.category}
          onChange={(value) =>
            setFilters((current) => ({
              ...current,
              category: value as Filters["category"],
            }))
          }
          options={[
            { label: "All categories", value: "all" },
            ...BUSINESS_CATEGORIES.map((value) => ({
              label: prettyLabel(value),
              value,
            })),
          ]}
        />

        <SelectField
          label="Stage"
          value={filters.pipelineStage}
          onChange={(value) =>
            setFilters((current) => ({
              ...current,
              pipelineStage: value as Filters["pipelineStage"],
            }))
          }
          options={[
            { label: "All stages", value: "all" },
            ...PIPELINE_STAGES.map((value) => ({
              label: prettyLabel(value),
              value,
            })),
          ]}
        />
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="text-sm text-slate-600">
          Showing <strong>{sorted.length}</strong> of{" "}
          <strong>{businesses.length}</strong> businesses
        </div>

        <div className="flex flex-wrap gap-3">
          <SelectField
            label="Status"
            value={filters.status}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                status: value as Filters["status"],
              }))
            }
            options={[
              { label: "All status", value: "all" },
              ...BUSINESS_STATUS.map((value) => ({
                label: prettyLabel(value),
                value,
              })),
            ]}
            compact
          />

          <SelectField
            label="Sort"
            value={sortKey}
            onChange={(value) => setSort(value as SortKey)}
            options={[
              { label: "Priority", value: "priority" },
              { label: "Completeness", value: "completeness" },
              { label: "Name", value: "name" },
              { label: "Island", value: "island" },
              { label: "Category", value: "category" },
            ]}
            compact
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <HeaderCell label="Business" onClick={() => setSort("name")} />
                <HeaderCell label="Island" onClick={() => setSort("island")} />
                <HeaderCell
                  label="Category"
                  onClick={() => setSort("category")}
                />
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Pipeline</th>
                <HeaderCell
                  label="Priority"
                  onClick={() => setSort("priority")}
                />
                <HeaderCell
                  label="Completeness"
                  onClick={() => setSort("completeness")}
                />
                <th className="px-4 py-3">Contact</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {sorted.map((business) => (
                <tr key={business.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 align-top">
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-900">
                        {business.name}
                      </div>
                      {business.description ? (
                        <p className="max-w-md text-sm text-slate-500">
                          {business.description}
                        </p>
                      ) : null}
                      <div className="text-xs text-slate-400">
                        {business.address?.city ||
                          business.address?.district ||
                          "—"}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-700">
                    {prettyLabel(business.island)}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-700">
                    <div>{prettyLabel(business.category)}</div>
                    {business.subcategory ? (
                      <div className="text-xs text-slate-400">
                        {prettyLabel(business.subcategory)}
                      </div>
                    ) : null}
                  </td>

                  <td className="px-4 py-4">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      {prettyLabel(business.status)}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
                      {prettyLabel(business.pipelineStage ?? "discovered")}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                    {business.scores?.priorityScore ?? 0}
                  </td>

                  <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                    {business.scores?.completenessScore ?? 0}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600">
                    <div>{business.phone ?? "—"}</div>
                    <div className="text-xs text-slate-400">
                      {business.email ??
                        business.website ??
                        "No email or website"}
                    </div>
                  </td>
                </tr>
              ))}

              {sorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    No businesses match the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function HeaderCell({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <th className="px-4 py-3">
      <button
        type="button"
        onClick={onClick}
        className="font-semibold text-slate-500 hover:text-slate-900"
      >
        {label}
      </button>
    </th>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  compact = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  compact?: boolean;
}) {
  return (
    <label className={compact ? "min-w-[180px]" : ""}>
      {!compact ? (
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
      ) : null}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
      >
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
