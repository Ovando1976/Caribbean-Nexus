import type { BusinessRecord } from "@/types/business";
import { BusinessScoreBadge } from "./business-score-badge";

type BusinessTableProps = {
  businesses: BusinessRecord[];
  onMoveToQualified?: (id: string) => Promise<void> | void;
};

export function BusinessTable({ businesses, onMoveToQualified }: BusinessTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Business</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Island</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Pipeline</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {businesses.map((business) => (
            <tr key={business.id}>
              <td className="px-4 py-3 text-sm text-slate-900">
                <div className="font-medium">{business.name}</div>
                <div className="text-xs text-slate-500">{business.email ?? business.phone ?? "No direct contact"}</div>
              </td>
              <td className="px-4 py-3 text-sm text-slate-700">{business.island.replace("_", " ")}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{business.category.replace("_", " ")}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{business.pipelineStage ?? "discovered"}</td>
              <td className="px-4 py-3 text-sm text-slate-700">
                <BusinessScoreBadge score={business.scores?.priorityScore ?? 0} />
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  onClick={() => onMoveToQualified?.(business.id)}
                >
                  Qualify
                </button>
              </td>
            </tr>
          ))}

          {businesses.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                No businesses found with current filters.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
