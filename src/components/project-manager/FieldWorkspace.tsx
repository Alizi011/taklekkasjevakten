import type { ReactNode } from "react";
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  MapPin,
  UserRound,
  Wrench,
} from "lucide-react";

export type FieldWorkspaceTab =
  | "oversikt"
  | "kontroll"
  | "oppsummering"
  | "dokumentasjon"
  | "rapport";

export interface FieldWorkspaceHistoryItem {
  id: string | number;
  title: string;
  subtitle?: string;
  meta?: string;
  completed?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

interface FieldWorkspaceProps {
  activeTab: FieldWorkspaceTab;
  onTabChange: (tab: FieldWorkspaceTab) => void;

  overview: ReactNode;
  checklist: ReactNode;
  summary: ReactNode;
  documentation: ReactNode;
  report: ReactNode;

  caseNumber?: number | string;
  serviceName?: string;
  address?: string;
  customerName?: string;

  projectManagerName?: string;
  technicianName?: string;

  statusLabel?: string;
  scheduledLabel?: string;
  assignmentNote?: string;

  checklistCount?: number;
  deviationCount?: number;
  reportStatus?: string;

  history?: FieldWorkspaceHistoryItem[];
  showTabs?: boolean;
}

const TABS: Array<{
  key: FieldWorkspaceTab;
  label: string;
  icon: ReactNode;
}> = [
  {
    key: "oversikt",
    label: "Oversikt",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    key: "kontroll",
    label: "Kontroll",
    icon: <ClipboardCheck className="h-4 w-4" />,
  },
  {
    key: "oppsummering",
    label: "Oppsummering",
    icon: <Wrench className="h-4 w-4" />,
  },
  {
    key: "dokumentasjon",
    label: "Dokumentasjon",
    icon: <Camera className="h-4 w-4" />,
  },
  {
    key: "rapport",
    label: "Rapport",
    icon: <FileText className="h-4 w-4" />,
  },
];

function StatBox({
  label,
  value,
  accent = "slate",
}: {
  label: string;
  value: ReactNode;
  accent?: "slate" | "blue" | "amber" | "emerald";
}) {
  const accentClass =
    accent === "blue"
      ? "text-blue-300"
      : accent === "amber"
      ? "text-amber-300"
      : accent === "emerald"
      ? "text-emerald-300"
      : "text-slate-200";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-3.5">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>
      <div className={`mt-1 text-xs font-black ${accentClass}`}>
        {value}
      </div>
    </div>
  );
}

export default function FieldWorkspace({
  activeTab,
  onTabChange,
  overview,
  checklist,
  summary,
  documentation,
  report,

  caseNumber,
  serviceName = "Lekkasjesøk",
  address,
  customerName,

  projectManagerName,
  technicianName,

  statusLabel = "Aktiv",
  scheduledLabel,
  assignmentNote,

  checklistCount,
  deviationCount,
  reportStatus,

  history = [],
  showTabs = true,
}: FieldWorkspaceProps) {
  const content: Record<FieldWorkspaceTab, ReactNode> = {
    oversikt: overview,
    kontroll: checklist,
    oppsummering: summary,
    dokumentasjon: documentation,
    rapport: report,
  };

  const hasCaseHeader =
    caseNumber ||
    address ||
    customerName ||
    projectManagerName ||
    technicianName ||
    scheduledLabel ||
    history.length > 0;

  return (
    <div className="space-y-5">
      {hasCaseHeader && (
        <>
          <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#0b0f17] p-5 shadow-xl md:p-7">
            <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-blue-500/[0.04] blur-3xl" />

            <div className="relative">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-blue-500/25 bg-blue-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-blue-300">
                      Aktiv oppfølging
                    </span>

                    {caseNumber !== undefined && caseNumber !== null && (
                      <span className="rounded-full border border-slate-800 bg-slate-950 px-2.5 py-1 text-[9px] font-black text-slate-500">
                        #{caseNumber}
                      </span>
                    )}
                  </div>

                  <h2 className="mt-3 text-2xl font-black text-white md:text-3xl">
                    {serviceName}
                  </h2>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400">
                    {address && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-blue-400" />
                        {address}
                      </span>
                    )}

                    {customerName && (
                      <span className="inline-flex items-center gap-1.5">
                        <UserRound className="h-4 w-4 text-slate-500" />
                        {customerName}
                      </span>
                    )}
                  </div>
                </div>

                {(projectManagerName || technicianName) && (
                  <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[430px]">
                    {projectManagerName && (
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3.5">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                          Prosjektansvarlig
                        </p>
                        <p className="mt-1 text-xs font-black text-white">
                          {projectManagerName}
                        </p>
                      </div>
                    )}

                    {technicianName && (
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3.5">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                          Tekniker
                        </p>
                        <p className="mt-1 text-xs font-black text-white">
                          {technicianName}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatBox
                  label="Status"
                  value={statusLabel}
                  accent="blue"
                />

                <StatBox
                  label="Kontroll"
                  value={
                    checklistCount !== undefined
                      ? `${checklistCount} registrert`
                      : "Ikke startet"
                  }
                />

                <StatBox
                  label="Avvik"
                  value={
                    deviationCount !== undefined
                      ? deviationCount
                      : "Ikke registrert"
                  }
                  accent={deviationCount ? "amber" : "slate"}
                />

                <StatBox
                  label="Rapport"
                  value={reportStatus || "Ikke startet"}
                  accent={
                    reportStatus?.toLowerCase().includes("publisert")
                      ? "emerald"
                      : "slate"
                  }
                />
              </div>
            </div>
          </section>

          {history.length > 0 && (
            <section className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-5 md:p-6">
              <div className="border-b border-slate-800 pb-4">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Gjennomført i saken
                </p>
                <h3 className="mt-1 text-base font-black text-white">
                  Tidligere arbeid og dokumentasjon
                </h3>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                          item.completed
                            ? "border-emerald-500/30 bg-emerald-500/10"
                            : "border-slate-700 bg-slate-900"
                        }`}
                      >
                        <CheckCircle2
                          className={`h-4 w-4 ${
                            item.completed
                              ? "text-emerald-400"
                              : "text-slate-600"
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-white">
                          {item.title}
                        </p>

                        {item.subtitle && (
                          <p className="mt-1 text-[11px] leading-5 text-slate-500">
                            {item.subtitle}
                          </p>
                        )}

                        {item.meta && (
                          <p className="mt-2 text-[10px] font-bold text-slate-600">
                            {item.meta}
                          </p>
                        )}

                        {item.actionLabel && item.onAction && (
                          <button
                            type="button"
                            onClick={item.onAction}
                            className="mt-3 text-[11px] font-extrabold text-amber-300 hover:text-amber-200"
                          >
                            {item.actionLabel} →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {scheduledLabel && (
            <section className="rounded-3xl border border-emerald-500/20 bg-[#0b0f17] p-5 md:p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                    <CalendarDays className="h-5 w-5 text-emerald-400" />
                  </div>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] text-emerald-400">
                      Planlagt {serviceName.toLowerCase()}
                    </p>
                    <p className="mt-1 text-base font-black text-white">
                      {scheduledLabel}
                    </p>

                    {assignmentNote && (
                      <div className="mt-3">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                          Oppdragsnotat
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-xs text-slate-300">
                          {assignmentNote}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {showTabs && (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0b0f17] p-2">
            <div className="flex min-w-max gap-1">
              {TABS.map((tab) => {
                const active = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => onTabChange(tab.key)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
                      active
                        ? "bg-[#F5B800] text-slate-950"
                        : "text-slate-400 hover:bg-slate-900 hover:text-white"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>{content[activeTab]}</div>
        </>
      )}
    </div>
  );
}