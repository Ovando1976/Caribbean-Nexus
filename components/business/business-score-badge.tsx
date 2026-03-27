import type { ReactNode } from "react";

type BusinessScoreBadgeProps = {
  score: number | null | undefined;
  label?: string;
  icon?: ReactNode;
  compact?: boolean;
};

function getScoreTone(score: number) {
  if (score >= 80) {
    return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30";
  }

  if (score >= 60) {
    return "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30";
  }

  if (score >= 40) {
    return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30";
  }

  return "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30";
}

export function BusinessScoreBadge({
  score,
  label = "Priority",
  icon,
  compact = false,
}: BusinessScoreBadgeProps) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score ?? 0)));
  const tone = getScoreTone(safeScore);

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}
      >
        {icon}
        {safeScore}
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${tone}`}
    >
      {icon}
      <span>{label}</span>
      <span className="rounded-full bg-black/20 px-2 py-0.5 text-[11px]">{safeScore}</span>
    </div>
  );
}
