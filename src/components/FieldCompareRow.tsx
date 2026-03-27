import React from "react";

type Props = {
  label: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
};

export function FieldCompareRow({ label, left, right }: Props) {
  return (
    <div className="grid gap-3 border-b border-slate-800 py-3 lg:grid-cols-[180px_1fr_1fr]">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200">
        {left ?? "—"}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200">
        {right ?? "—"}
      </div>
    </div>
  );
}