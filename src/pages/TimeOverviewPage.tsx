import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileClock,
  Loader2,
  UserRound,
  Users,
} from "lucide-react";

type TimeOverviewView =
  | "oversikt"
  | "timer"
  | "ansatte"
  | "godkjenning";

interface TimeOverviewPageProps {
  activeView?: TimeOverviewView;
}

interface TimeEntryRow {
  id: number;
  employee: string;
  project: string;
  date: string;
  start: string;
  end: string;
  breakMinutes: number;
  hours: number;
  status: "registrert" | "needs_review" | "godkjent";
}

const EMPTY_ENTRIES: TimeEntryRow[] = [];

export default function TimeOverviewPage({
  activeView = "oversikt",
}: TimeOverviewPageProps) {
  const entries = EMPTY_ENTRIES;

  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
  const needsReview = entries.filter(
    (entry) => entry.status === "needs_review"
  ).length;
  const approved = entries.filter(
    (entry) => entry.status === "godkjent"
  ).length;

  const uniqueEmployees = new Set(entries.map((entry) => entry.employee)).size;

  const title =
    activeView === "oversikt"
      ? "Timelisteoversikt"
      : activeView === "timer"
        ? "Registrerte timer"
        : activeView === "ansatte"
          ? "Timer per ansatt"
          : "Godkjenning";

  const description =
    activeView === "oversikt"
      ? "Administrativ oversikt over registrert arbeidstid i den felles timemotoren."
      : activeView === "timer"
        ? "Alle fullførte tidsregistreringer med prosjekt, start, slutt og pause."
        : activeView === "ansatte"
          ? "Sammenstilling av arbeidstid per ansatt."
          : "Kontroller registreringer som trenger gjennomgang før de låses.";

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-5 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
              <Clock3 className="h-4 w-4" />
              Tid / ansatte
            </div>
            <h3 className="text-xl font-black text-white">{title}</h3>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
              {description}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              Felles timemotor
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              Bygget for check-in/check-out, pause, prosjekt og senere godkjenning.
            </p>
          </div>
        </div>
      </section>

      {activeView === "oversikt" && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Registrerte timer"
              value={`${totalHours.toFixed(1)} t`}
              icon={Clock3}
            />
            <StatCard
              label="Ansatte med timer"
              value={uniqueEmployees}
              icon={Users}
            />
            <StatCard
              label="Krever kontroll"
              value={needsReview}
              icon={AlertTriangle}
            />
            <StatCard
              label="Godkjente"
              value={approved}
              icon={CheckCircle2}
            />
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
              <div className="border-b border-slate-800/70 px-5 py-4">
                <h4 className="text-sm font-black text-white">
                  Siste tidsregistreringer
                </h4>
                <p className="mt-1 text-[11px] text-slate-500">
                  De siste avsluttede arbeidsøktene.
                </p>
              </div>

              <EmptyState
                icon={FileClock}
                title="Ingen timer å vise ennå"
                text="Når ansatte avslutter en arbeidsøkt, vil registreringen vises her."
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
              <div className="border-b border-slate-800/70 px-5 py-4">
                <h4 className="text-sm font-black text-white">
                  Kontroll
                </h4>
                <p className="mt-1 text-[11px] text-slate-500">
                  Registreringer som trenger administrativ oppfølging.
                </p>
              </div>

              <div className="space-y-3 p-5">
                <InfoRow
                  icon={AlertTriangle}
                  title="Over 12 timer"
                  text="Lange arbeidsøkter kan markeres for kontroll."
                />
                <InfoRow
                  icon={Clock3}
                  title="Manglende utsjekk"
                  text="Aktive økter skal kunne følges opp separat."
                />
                <InfoRow
                  icon={CheckCircle2}
                  title="Godkjenning"
                  text="Godkjente timer kan senere låses mot endringer."
                />
              </div>
            </div>
          </section>
        </>
      )}

      {activeView === "timer" && (
        <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
          <div className="flex flex-col gap-3 border-b border-slate-800/70 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h4 className="text-sm font-black text-white">
                Registrerte timer
              </h4>
              <p className="mt-1 text-[11px] text-slate-500">
                Dato, ansatt, prosjekt, arbeidstid, pause og status.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-[10px] font-bold text-slate-400">
              <CalendarDays className="h-3.5 w-3.5" />
              Periodefilter kobles til senere
            </div>
          </div>

          {entries.length === 0 ? (
            <EmptyState
              icon={FileClock}
              title="Ingen tidsregistreringer ennå"
              text="Fullførte check-in/check-out-økter vil vises i denne listen."
            />
          ) : null}
        </section>
      )}

      {activeView === "ansatte" && (
        <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
          <div className="border-b border-slate-800/70 px-5 py-4">
            <h4 className="text-sm font-black text-white">
              Timer per ansatt
            </h4>
            <p className="mt-1 text-[11px] text-slate-500">
              Samlet arbeidstid per medarbeider og periode.
            </p>
          </div>

          <EmptyState
            icon={UserRound}
            title="Ingen ansatte med registrerte timer"
            text="Når timer er registrert, kan de summeres per ansatt her."
          />
        </section>
      )}

      {activeView === "godkjenning" && (
        <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
          <div className="border-b border-slate-800/70 px-5 py-4">
            <h4 className="text-sm font-black text-white">
              Timer til godkjenning
            </h4>
            <p className="mt-1 text-[11px] text-slate-500">
              Kontroller avvik før timene godkjennes og låses.
            </p>
          </div>

          <EmptyState
            icon={CheckCircle2}
            title="Ingen timer venter på godkjenning"
            text="Registreringer med avvik eller kontrollbehov vil vises her."
          />
        </section>
      )}

      <section className="rounded-2xl border border-blue-500/15 bg-blue-500/[0.04] p-4">
        <div className="flex items-start gap-3">
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
          <div>
            <div className="text-xs font-black text-blue-200">
              Neste kobling
            </div>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              Denne siden er klar for data fra perun_core. Neste steg er å koble
              oversikten mot time_entries og aktive økter fra time_sessions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof Clock3;
}) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
          {label}
        </span>
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="mt-3 text-2xl font-black text-white">{value}</div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof FileClock;
  title: string;
  text: string;
}) {
  return (
    <div className="px-5 py-12 text-center">
      <Icon className="mx-auto h-7 w-7 text-slate-700" />
      <div className="mt-3 text-sm font-black text-white">{title}</div>
      <div className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
        {text}
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Clock3;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-slate-400">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-xs font-black text-white">{title}</div>
        <p className="mt-1 text-[11px] leading-5 text-slate-500">{text}</p>
      </div>
    </div>
  );
}
