import {
  AlertTriangle, ArrowUpRight, CalendarDays, CheckCircle2,
  ClipboardCheck, FileText, Mail, MapPin, Phone, UserRound, Wrench,
} from "lucide-react";

/**
 * Visningskomponent: Ingen egne API-kall eller sideeffekter.
 * Forelderen leverer autoritativ Core-godkjenningsstatus og handlinger.
 * Kundens fritekst er en kundeopplysning, ikke et verifisert faglig funn.
 */
export interface WorkflowInquiry {
  id: string | number;
  customer_name?: string | null;
  customerName?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  customer_type?: string | null;
  building_type?: string | null;
  roof_type?: string | null;
  roofType?: string | null;
  inquiry_type?: string | null;
  recommended_service?: string | null;
  notes?: string | null;
  created_at?: string | null;
  status?: string | null;
}

export interface InquiryWorkflowOverviewProps {
  inquiry: WorkflowInquiry;
  /** Fra Perun Core via tlv_report_approval_workflow.php; aldri utled fra gammel TLV-status. */
  approvalState?: string | null;
  reportStatus?: string | null;
  /** Kun true for faktisk SMS-innlogget prosjektansvarlig, ikke admin-forhåndsvisning. */
  canReviewReport?: boolean;
  checklistCompleted?: number;
  checklistTotal?: number;
  deviations?: number;
  photosCount?: number;
  bookingLabel?: string | null;
  hideWorkStatus?: boolean;
  onOpenApproval?: () => void;
  onOpenReport?: () => void;
  onOpenControl?: () => void;
  onOpenDocumentation?: () => void;
  onOpenSchedule?: () => void;
}

function formatDate(value?: string | null): string {
  if (!value) return "Ikke registrert";
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("nb-NO", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function serviceName(value?: string | null): string {
  const labels: Record<string, string> = {
    lekkasjesok: "Lekkasjesøk", takkontroll: "Takkontroll", service: "Service",
    akutt: "Akutt utbedring", digital: "Digital konsultasjon",
  };
  return labels[String(value || "").toLowerCase()] || "Oppdrag";
}

export default function InquiryWorkflowOverview({
  inquiry, approvalState, reportStatus, canReviewReport = false,
  checklistCompleted = 0, checklistTotal = 0, deviations = 0, photosCount = 0,
  bookingLabel, hideWorkStatus = false, onOpenApproval, onOpenReport, onOpenControl,
  onOpenDocumentation, onOpenSchedule,
}: InquiryWorkflowOverviewProps) {
  const name = inquiry.customer_name || inquiry.customerName || "Ukjent kunde";
  const address = [inquiry.address, inquiry.postal_code, inquiry.city].filter(Boolean).join(", ");
  const original = String(inquiry.notes || "").trim();
  const approval = String(approvalState || "");
  const report = String(reportStatus || "");
  const isAwaitingPm = approval === "awaiting_pm";
  const isAwaitingAdmin = approval === "awaiting_admin";
  const isApproved = ["approved", "published"].includes(approval) || ["godkjent", "publisert"].includes(report);
  const isReporting = Boolean(approval && approval !== "editing") ||
    ["utkast", "sendt_til_admin", "under_gjennomgang", "returnert_til_prosjektansvarlig", "godkjent", "publisert"].includes(report);
  const isDone = ["utfort", "avsluttet"].includes(String(inquiry.status || "").toLowerCase());

  let next = "Kontroller bestillingen og planlegg neste steg.";
  let tone = "border-cyan-500/30 bg-cyan-500/[0.06]";
  let icon = <ClipboardCheck className="h-5 w-5 text-cyan-300" />;
  let action = onOpenControl;
  let actionLabel = "Åpne kontroll";

  if (isAwaitingPm) {
    next = canReviewReport
      ? "Rapport 1 er sendt fra administrator. Kontroller rapportversjonen og godkjenn faglig eller returner med kommentar."
      : "Rapport 1 venter på faglig godkjenning hos tildelt prosjektansvarlig.";
    tone = "border-amber-400/40 bg-amber-500/[0.09]";
    icon = <AlertTriangle className="h-5 w-5 text-amber-300" />;
    action = canReviewReport ? onOpenApproval : onOpenReport;
    actionLabel = canReviewReport ? "Åpne faglig godkjenning" : "Se rapportstatus";
  } else if (isAwaitingAdmin) {
    next = "Rapporten er faglig kontrollert og venter på administratorens sluttgodkjenning.";
    action = onOpenReport;
    actionLabel = "Se rapport";
  } else if (isApproved) {
    next = "Rapporten er godkjent. Se rapporten og eventuell videre oppfølging.";
    tone = "border-emerald-500/30 bg-emerald-500/[0.06]";
    icon = <CheckCircle2 className="h-5 w-5 text-emerald-300" />;
    action = onOpenReport;
    actionLabel = "Åpne rapport";
  } else if (isReporting || isDone) {
    next = "Feltarbeidet er registrert. Følg opp rapportarbeidet og eventuelle tilbakemeldinger.";
    action = onOpenReport;
    actionLabel = "Åpne rapport";
  } else if (bookingLabel) {
    next = `Oppdraget er planlagt: ${bookingLabel}. Gjennomfør og dokumenter arbeidet.`;
    action = onOpenControl || onOpenSchedule;
    actionLabel = "Åpne arbeidsflate";
  }

  const info = [
    { label: "Bygning", value: inquiry.building_type || "Ikke oppgitt" },
    { label: "Taktype", value: inquiry.roof_type || inquiry.roofType || "Ikke oppgitt" },
    { label: "Bestilt tjeneste", value: serviceName(inquiry.recommended_service || inquiry.inquiry_type) },
    { label: "Registrert", value: formatDate(inquiry.created_at) },
  ];

  return (
    <section className="space-y-4" aria-label={`Arbeidsoversikt for oppdrag ${inquiry.id}`}>
      <div className={`rounded-2xl border p-4 sm:p-5 ${tone}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/20">{icon}</span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-amber-200">Neste handling · oppdrag #{inquiry.id}</p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-stone-100">{next}</p>
            </div>
          </div>
          {action && (
            <button type="button" onClick={action}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-orange-400">
              {actionLabel}<ArrowUpRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-orange-500/20 bg-[#241813]">
        <div className="flex flex-col gap-2 border-b border-orange-500/15 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-orange-300">Kundens henvendelse</p>
            <h3 className="mt-1 text-base font-bold text-white">{name}</h3>
            {address && <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-300"><MapPin className="h-4 w-4" />{address}</p>}
          </div>
          <span className="self-start rounded-full border border-teal-500/25 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-200">
            {serviceName(inquiry.recommended_service || inquiry.inquiry_type)}
          </span>
        </div>
        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(250px,1fr)]">
          <div className="min-w-0 space-y-3">
            {original && (
              <div className="rounded-xl border border-white/10 bg-black/15 p-4">
                <h4 className="mb-3 text-sm font-bold text-stone-100">Original kundehenvendelse</h4>
                <p className="whitespace-pre-wrap text-sm leading-6 text-stone-300">{original}</p>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h4 className="flex items-center gap-2 text-sm font-bold text-white"><UserRound className="h-4 w-4 text-orange-300" />Kontakt</h4>
              <p className="mt-2 text-sm font-semibold text-stone-100">{name}</p>
              {inquiry.phone && <a className="mt-2 flex items-center gap-2 text-sm text-teal-200 hover:underline" href={`tel:${inquiry.phone}`}><Phone className="h-4 w-4" />{inquiry.phone}</a>}
              {inquiry.email && <a className="mt-2 flex items-center gap-2 break-all text-sm text-teal-200 hover:underline" href={`mailto:${inquiry.email}`}><Mail className="h-4 w-4 shrink-0" />{inquiry.email}</a>}
            </div>
            <dl className="grid grid-cols-2 gap-2">
              {info.map(row => <div key={row.label} className="rounded-lg border border-white/10 bg-black/15 p-3">
                <dt className="text-xs font-semibold text-stone-400">{row.label}</dt>
                <dd className="mt-1 text-sm font-medium text-stone-100">{row.value}</dd>
              </div>)}
            </dl>
          </div>
        </div>
      </div>

      {!hideWorkStatus && (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/15 p-3">
        <span className="mr-2 text-xs font-bold uppercase tracking-wide text-stone-300">Arbeidsstatus</span>
        <span className="inline-flex items-center gap-1 rounded-lg bg-teal-500/10 px-3 py-2 text-xs font-semibold text-teal-200"><ClipboardCheck className="h-3.5 w-3.5" />{checklistCompleted}/{checklistTotal} kontrollpunkter</span>
        <span className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200"><AlertTriangle className="h-3.5 w-3.5" />{deviations} avvik</span>
        <span className="inline-flex items-center gap-1 rounded-lg bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-200"><FileText className="h-3.5 w-3.5" />{photosCount} bilder</span>
        {bookingLabel && !isReporting && !isDone && <span className="inline-flex items-center gap-1 rounded-lg bg-orange-500/10 px-3 py-2 text-xs font-semibold text-orange-200"><CalendarDays className="h-3.5 w-3.5" />{bookingLabel}</span>}
        <div className="ml-auto flex flex-wrap gap-2">
          {onOpenControl && <button type="button" onClick={onOpenControl} className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white hover:bg-white/10"><Wrench className="h-4 w-4" />Kontroll</button>}
          {onOpenDocumentation && <button type="button" onClick={onOpenDocumentation} className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white hover:bg-white/10">Dokumentasjon</button>}
          {onOpenReport && <button type="button" onClick={onOpenReport} className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white hover:bg-white/10"><FileText className="h-4 w-4" />Rapport</button>}
        </div>
      </div>
      )}
    </section>
  );
}
