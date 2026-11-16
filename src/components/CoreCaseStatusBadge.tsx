// Presentation only. A verified Core reader must supply available/unlinked states.
// Never pass inquiry.status, offer status, booking or administrative pause as Core status.
export type CoreCaseStatus = "active" | "on_hold" | "completed" | "closed" | "stopped";

export type CoreCaseStatusView =
  | { state: "available"; status: CoreCaseStatus }
  | { state: "unavailable" | "unlinked" | "unknown" };

const statuses: Record<CoreCaseStatus, { label: string; tone: string }> = {
  active: { label: "Aktiv", tone: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200" },
  on_hold: { label: "På vent", tone: "border-amber-400/30 bg-amber-400/10 text-amber-200" },
  completed: { label: "Fullført", tone: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" },
  closed: { label: "Lukket", tone: "border-slate-400/30 bg-slate-400/10 text-slate-200" },
  stopped: { label: "Stanset", tone: "border-rose-400/30 bg-rose-400/10 text-rose-200" },
};

const fallbacks = {
  unavailable: {
    label: "Utilgjengelig",
    description: "Hovedstatus fra Perun Core er foreløpig utilgjengelig.",
  },
  unlinked: {
    label: "Ikke koblet",
    description: "Saken har ingen bekreftet kobling til Perun Core.",
  },
  unknown: {
    label: "Ukjent",
    description: "Hovedstatusen fra Perun Core er ukjent.",
  },
};

export default function CoreCaseStatusBadge(view: CoreCaseStatusView) {
  const confirmed = view.state === "available" && Object.hasOwn(statuses, view.status)
    ? statuses[view.status]
    : null;
  const fallback = fallbacks[view.state === "available" ? "unknown" : view.state];
  const label = confirmed?.label ?? fallback.label;
  const description = confirmed
    ? "Hovedstatus bekreftet i Perun Core."
    : fallback.description;

  return (
    <span
      title={description}
      aria-label={`Hovedstatus (Core): ${label}. ${description}`}
      className={`inline-flex whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[10px] font-bold ${confirmed?.tone ?? "border-slate-400/25 bg-slate-400/10 text-slate-300"}`}
    >
      {label}
    </span>
  );
}
