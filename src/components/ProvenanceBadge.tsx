import React from "react";

type Props = {
  source?: string;
  sourceUrl?: string;
  confidence?: "high" | "medium" | "low";
};

function label(value?: string) {
  if (!value) return "Unknown source";

  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function confidenceClasses(confidence?: "high" | "medium" | "low") {
  switch (confidence) {
    case "high":
      return "border-emerald-700 bg-emerald-500/10 text-emerald-300";
    case "medium":
      return "border-amber-700 bg-amber-500/10 text-amber-300";
    case "low":
      return "border-rose-700 bg-rose-500/10 text-rose-300";
    default:
      return "border-slate-700 bg-slate-800/50 text-slate-300";
  }
}

export function ProvenanceBadge({ source, sourceUrl, confidence }: Props) {
  const content = (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${confidenceClasses(
        confidence
      )}`}
    >
      {label(source)}
      {confidence ? ` • ${label(confidence)}` : ""}
    </span>
  );

  if (sourceUrl) {
    return (
      <a
        href={sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-block"
      >
        {content}
      </a>
    );
  }

  return content;
}
