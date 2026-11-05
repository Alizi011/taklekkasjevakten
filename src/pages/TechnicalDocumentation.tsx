import {
  Activity,
  Boxes,
  CheckCircle2,
  Code2,
  Database,
  FileCode2,
  GitBranch,
  Layers3,
  Network,
  Server,
  ShieldCheck,
  Smartphone,
  Users,
  Wrench,
} from "lucide-react";

type Status = "ferdig" | "delvis" | "planlagt";

interface ModuleItem {
  name: string;
  status: Status;
  description: string;
}

const modules: ModuleItem[] = [
  {
    name: "Kunderegister",
    status: "ferdig",
    description:
      "Felles kunder i perun_core med kobling mot eksisterende Taklekkasjevakten-data.",
  },
  {
    name: "Kundeprofiler",
    status: "ferdig",
    description:
      "Privat- og bedriftsprofiler med kontaktpersoner, eiendommer, prosjekter og historikk.",
  },
  {
    name: "Ansattregister",
    status: "ferdig",
    description:
      "Ansatte migrert til perun_core med roller, prosjektmedlemskap og profilvisning.",
  },
  {
    name: "Adminprofil",
    status: "ferdig",
    description:
      "Adminprofil hentes fra perun_core med prosjekt- og systemstatistikk.",
  },
  {
    name: "Prosjektmodell",
    status: "ferdig",
    description:
      "Taklekkasjevakten-saker kobles til felles prosjekter via external_references.",
  },
  {
    name: "Eiendommer",
    status: "ferdig",
    description:
      "Eiendommer er koblet til kunder og prosjekter i felles kjernedatabase.",
  },
  {
    name: "Prosjektteam",
    status: "ferdig",
    description:
      "Prosjektleder og tekniker kobles mot prosjekter gjennom project_members.",
  },
  {
    name: "Importmotor",
    status: "delvis",
    description:
      "Staging, batcher, preview og matching er etablert for eksterne systemer.",
  },
  {
    name: "Timemotor",
    status: "delvis",
    description:
      "Backend for innsjekk, utsjekk, aktive økter og time_entries er etablert.",
  },
  {
    name: "Kjørebok / feltmodul",
    status: "planlagt",
    description:
      "Mobilbasert GPS, kjøreturer, prosjektstatus og månedlig km-kontroll er planlagt.",
  },
];

const databases = [
  {
    name: "perun_core",
    role: "Felles kjernedatabase",
    detail:
      "Kunder, ansatte, prosjekter, eiendommer, prosjektmedlemmer, timer og eksterne referanser.",
  },
  {
    name: "taklekkasjevakten",
    role: "Operativ database",
    detail:
      "Eksisterende Taklekkasjevakten-flyt og kompatibilitet mot dagens portal.",
  },
  {
    name: "c2d9sf1au_taklekkasjevakten",
    role: "Historisk database",
    detail: "Beholdes urørt som historisk datakilde.",
  },
];

const apiLayers = [
  "Kunder / kundeprofil",
  "Ansatte / ansattprofil",
  "Adminprofil",
  "Migrering av kunder, kontaktpersoner, eiendommer og prosjekter",
  "Prosjektmedlemmer",
  "Importhistorikk / preview / matching",
  "Time sessions: sjekk inn, aktiv økt og sjekk ut",
];

function statusClasses(status: Status) {
  if (status === "ferdig") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (status === "delvis") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }

  return "border-slate-700 bg-slate-900 text-slate-400";
}

function statusLabel(status: Status) {
  if (status === "ferdig") return "Ferdig";
  if (status === "delvis") return "Under utvikling";
  return "Planlagt";
}

export default function TechnicalDocumentation() {
  const finished = modules.filter((item) => item.status === "ferdig").length;
  const inProgress = modules.filter((item) => item.status === "delvis").length;
  const planned = modules.filter((item) => item.status === "planlagt").length;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-[#F5B800]" />
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Teknisk dokumentasjon
              </p>
            </div>

            <h2 className="mt-3 text-2xl font-black text-white">
              Plattformarkitektur og systemstatus
            </h2>

            <p className="mt-2 max-w-3xl text-xs leading-6 text-slate-400">
              Intern oversikt over hvordan Taklekkasjevakten og Perun bygges rundt
              en felles kjernedatabase og delte API-er. Dokumentasjonen viser hva
              som allerede er etablert, hva som er under utvikling og hvilke
              moduler som kommer senere.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="min-w-[100px] rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3 text-center">
              <p className="text-2xl font-black text-emerald-400">{finished}</p>
              <p className="mt-1 text-[9px] font-bold uppercase text-slate-500">
                Ferdig
              </p>
            </div>

            <div className="min-w-[100px] rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-center">
              <p className="text-2xl font-black text-amber-400">{inProgress}</p>
              <p className="mt-1 text-[9px] font-bold uppercase text-slate-500">
                Pågår
              </p>
            </div>

            <div className="min-w-[100px] rounded-2xl border border-slate-700 bg-slate-950 p-3 text-center">
              <p className="text-2xl font-black text-slate-300">{planned}</p>
              <p className="mt-1 text-[9px] font-bold uppercase text-slate-500">
                Planlagt
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-5 xl:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
            <Network className="h-5 w-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-extrabold text-white">
                Overordnet arkitektur
              </h3>
              <p className="mt-1 text-[11px] text-slate-500">
                Felles kjerne med flere portaler på toppen.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-amber-400" />
                <p className="text-xs font-black text-white">
                  Taklekkasjevakten
                </p>
              </div>
              <p className="mt-2 text-[10px] leading-5 text-slate-500">
                Kundehenvendelser, befaring, feltarbeid, rapport, tilbud og
                operative prosjektprosesser.
              </p>
            </div>

            <div className="hidden text-center text-slate-600 lg:block">
              <GitBranch className="mx-auto h-5 w-5" />
            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.05] p-4">
              <div className="flex items-center gap-2">
                <Layers3 className="h-4 w-4 text-blue-400" />
                <p className="text-xs font-black text-white">Perun</p>
              </div>
              <p className="mt-2 text-[10px] leading-5 text-slate-500">
                Felles drift, tekniske saker, ansatte, prosjekter og kommende
                felt- og økonomimoduler.
              </p>
            </div>
          </div>

          <div className="my-4 flex justify-center">
            <div className="h-8 w-px bg-slate-800" />
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm font-black text-white">perun_core</p>
                <p className="text-[10px] text-slate-500">
                  Felles systemkjerne og masterdata
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
              {["Customers", "Employees", "Projects", "Properties"].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-center text-[10px] font-bold text-slate-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
            <Server className="h-5 w-5 text-violet-400" />
            <h3 className="text-sm font-extrabold text-white">Infrastruktur</h3>
          </div>

          <div className="mt-4 space-y-3">
            {[
              ["Frontend", "React + TypeScript + Vite"],
              ["UI", "Tailwind CSS"],
              ["API", "PHP 8.3"],
              ["Webserver", "Nginx"],
              ["Database", "MariaDB"],
              ["Drift", "VPS"],
              ["API-prinsipp", "Felles /core-endepunkter"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-start justify-between gap-4 border-b border-slate-900 pb-2 last:border-0"
              >
                <span className="text-[10px] text-slate-500">{label}</span>
                <span className="text-right text-[10px] font-bold text-slate-300">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-5">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <Boxes className="h-5 w-5 text-[#F5B800]" />
          <div>
            <h3 className="text-sm font-extrabold text-white">Modulstatus</h3>
            <p className="mt-1 text-[11px] text-slate-500">
              Funksjonelle områder i plattformen.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <div
              key={module.name}
              className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-extrabold text-white">{module.name}</p>
                <span
                  className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black uppercase ${statusClasses(
                    module.status
                  )}`}
                >
                  {statusLabel(module.status)}
                </span>
              </div>

              <p className="mt-3 text-[10px] leading-5 text-slate-500">
                {module.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
            <Database className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-extrabold text-white">
              Databaselandskap
            </h3>
          </div>

          <div className="mt-4 space-y-3">
            {databases.map((database) => (
              <div
                key={database.name}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <code className="text-xs font-black text-emerald-300">
                    {database.name}
                  </code>
                  <span className="text-[9px] font-bold uppercase text-slate-500">
                    {database.role}
                  </span>
                </div>
                <p className="mt-2 text-[10px] leading-5 text-slate-500">
                  {database.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
            <FileCode2 className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-extrabold text-white">API-lag</h3>
          </div>

          <div className="mt-4 space-y-2">
            {apiLayers.map((item) => (
              <div
                key={item}
                className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5"
              >
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span className="text-[10px] leading-5 text-slate-400">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-5">
          <Users className="h-5 w-5 text-cyan-400" />
          <h3 className="mt-3 text-sm font-extrabold text-white">
            Rollebasert portal
          </h3>
          <p className="mt-2 text-[10px] leading-5 text-slate-500">
            Admin, prosjektleder, tekniker og kunder har separate visninger og
            arbeidsflyter.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-5">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <h3 className="mt-3 text-sm font-extrabold text-white">
            Datakobling
          </h3>
          <p className="mt-2 text-[10px] leading-5 text-slate-500">
            external_references gjør at gamle og nye system-ID-er kan leve
            parallelt uten å miste sporbarhet.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-5">
          <Smartphone className="h-5 w-5 text-amber-400" />
          <h3 className="mt-3 text-sm font-extrabold text-white">
            Mobilklar arkitektur
          </h3>
          <p className="mt-2 text-[10px] leading-5 text-slate-500">
            Timemotor og planlagt felt-/kjørebokmodul bygges i kjernen slik at
            mobil kan bruke samme API senere.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-blue-500/20 bg-blue-500/[0.05] p-5">
        <div className="flex items-start gap-3">
          <Activity className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
          <div>
            <h3 className="text-sm font-extrabold text-blue-200">
              Arkitekturprinsipp
            </h3>
            <p className="mt-2 text-[10px] leading-5 text-slate-400">
              Nye funksjoner skal primært bygges mot perun_core og felles API-er.
              Eksisterende Taklekkasjevakten-funksjoner beholdes kompatible mens
              data gradvis flyttes over til den felles kjernen.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
