import {
  AlertTriangle,
  Camera,
  CarFront,
  CheckCircle2,
  Gauge,
  MapPin,
  Navigation,
  Route,
  UserRound,
} from "lucide-react";

type DrivingLogView =
  | "oversikt"
  | "kjoringer"
  | "kjoretoy"
  | "kilometerstand";

interface DrivingLogPageProps {
  activeView?: DrivingLogView;
}

const EMPTY_TRIPS: Array<{
  id: number;
  employee: string;
  vehicle: string;
  from: string;
  to: string;
  distanceKm: number;
  purpose: string;
  project: string;
  status: string;
}> = [];

const EMPTY_VEHICLES: Array<{
  id: number;
  registration: string;
  name: string;
  employee: string;
  odometerKm: number | null;
  status: string;
}> = [];

export default function DrivingLogPage({
  activeView = "oversikt",
}: DrivingLogPageProps) {
  const trips = EMPTY_TRIPS;
  const vehicles = EMPTY_VEHICLES;

  const activeTrips = trips.filter((trip) => trip.status === "aktiv").length;
  const totalKm = trips.reduce((sum, trip) => sum + trip.distanceKm, 0);
  const odometerChecks = vehicles.filter(
    (vehicle) => vehicle.odometerKm === null
  ).length;

  const title =
    activeView === "oversikt"
      ? "Kjørebokoversikt"
      : activeView === "kjoringer"
        ? "Kjøringer"
        : activeView === "kjoretoy"
          ? "Kjøretøy"
          : "Kilometerstand";

  const description =
    activeView === "oversikt"
      ? "Operativ oversikt over kjøring registrert fra felt."
      : activeView === "kjoringer"
        ? "Alle registrerte kjøringer med ansatt, kjøretøy, rute, prosjekt og formål."
        : activeView === "kjoretoy"
          ? "Firmabiler, tilordning til ansatte og status."
          : "Kontrollpunkt for månedlig kilometerstand og dokumentasjon.";

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-5 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
              <CarFront className="h-4 w-4" />
              Felt / kjørebok
            </div>
            <h3 className="text-xl font-black text-white">{title}</h3>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
              {description}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              Klar for mobilregistrering
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              Data skal senere komme fra den felles kjørebokmotoren.
            </p>
          </div>
        </div>
      </section>

      {activeView === "oversikt" && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Pågående kjøringer",
                value: activeTrips,
                icon: Navigation,
              },
              {
                label: "Registrerte kjøringer",
                value: trips.length,
                icon: Route,
              },
              {
                label: "Kilometer registrert",
                value: `${totalKm.toFixed(1)} km`,
                icon: Gauge,
              },
              {
                label: "Kontroller mangler",
                value: odometerChecks,
                icon: AlertTriangle,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                      {item.label}
                    </span>
                    <Icon className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="mt-3 text-2xl font-black text-white">
                    {item.value}
                  </div>
                </div>
              );
            })}
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-800/80 bg-[#0d1320]">
              <div className="border-b border-slate-800/70 px-5 py-4">
                <h4 className="text-sm font-black text-white">
                  Siste kjøringer
                </h4>
                <p className="mt-1 text-[11px] text-slate-500">
                  De siste registreringene fra ansatte i felt.
                </p>
              </div>

              <EmptyState
                icon={Route}
                title="Ingen kjøringer registrert ennå"
                text="Når mobilregistreringen kobles til, vil kjøringene vises her automatisk."
              />
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-[#0d1320]">
              <div className="border-b border-slate-800/70 px-5 py-4">
                <h4 className="text-sm font-black text-white">
                  Kontrollpunkter
                </h4>
                <p className="mt-1 text-[11px] text-slate-500">
                  Avvik som trenger administrativ oppfølging.
                </p>
              </div>

              <div className="space-y-3 p-5">
                <ControlRow
                  icon={Gauge}
                  title="Kilometerstand"
                  text="Månedlig avlesning og sammenligning mot registrerte kjøringer."
                />
                <ControlRow
                  icon={Camera}
                  title="Bilde av kilometerteller"
                  text="Dokumentasjon kan kreves ved månedskontroll eller avvik."
                />
                <ControlRow
                  icon={UserRound}
                  title="Biltilordning"
                  text="Kontroller hvilken ansatt som disponerer hvert kjøretøy."
                />
              </div>
            </div>
          </section>
        </>
      )}

      {activeView === "kjoringer" && (
        <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
          <div className="border-b border-slate-800/70 px-5 py-4">
            <h4 className="text-sm font-black text-white">Alle kjøringer</h4>
            <p className="mt-1 text-[11px] text-slate-500">
              Start, slutt, fra/til, distanse, ansatt, kjøretøy, prosjekt og formål.
            </p>
          </div>

          {trips.length === 0 ? (
            <EmptyState
              icon={Navigation}
              title="Ingen kjøringer å vise"
              text="Kjøringer vil komme hit når en ansatt starter og avslutter kjøring i mobilfeltet."
            />
          ) : null}
        </section>
      )}

      {activeView === "kjoretoy" && (
        <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
          <div className="border-b border-slate-800/70 px-5 py-4">
            <h4 className="text-sm font-black text-white">Kjøretøy</h4>
            <p className="mt-1 text-[11px] text-slate-500">
              Registrerte biler og hvem som disponerer dem.
            </p>
          </div>

          {vehicles.length === 0 ? (
            <EmptyState
              icon={CarFront}
              title="Ingen kjøretøy registrert ennå"
              text="Her kobles firmabiler til ansatte og den felles kjøreboken."
            />
          ) : null}
        </section>
      )}

      {activeView === "kilometerstand" && (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-2xl border border-slate-800/80 bg-[#0d1320]">
            <div className="border-b border-slate-800/70 px-5 py-4">
              <h4 className="text-sm font-black text-white">
                Kilometerstand per kjøretøy
              </h4>
              <p className="mt-1 text-[11px] text-slate-500">
                Månedlig kontroll mot registrert kjørelengde.
              </p>
            </div>

            <EmptyState
              icon={Gauge}
              title="Ingen kilometerkontroller ennå"
              text="Når kjøretøy er registrert, vises siste avlesning, differanse og neste kontroll her."
            />
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-5">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-amber-300" />
              <h4 className="text-sm font-black text-white">
                Dokumentasjon
              </h4>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              Modellen er lagt opp slik at en ansatt kan bli bedt om å registrere
              kilometerstand og laste opp bilde av kilometertelleren ved
              kontrollpunkt.
            </p>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                Planlagt kontrollflyt
              </div>
              <div className="mt-3 space-y-2 text-xs text-slate-300">
                <div>1. Systemet varsler om avlesning.</div>
                <div>2. Ansatt registrerer kilometerstand.</div>
                <div>3. Bilde dokumenterer avlesningen.</div>
                <div>4. Admin ser differanse og eventuelle avvik.</div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-blue-500/15 bg-blue-500/[0.04] p-4">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
          <div>
            <div className="text-xs font-black text-blue-200">
              GPS og mobil
            </div>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              Denne adminsiden er laget for telefonbasert kjørebok: kjøring
              registreres i mobilfeltet, knyttes til ansatt og kjøretøy, og kan
              senere kobles til prosjekt/sak og GPS-punkter.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Route;
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

function ControlRow({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Gauge;
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
