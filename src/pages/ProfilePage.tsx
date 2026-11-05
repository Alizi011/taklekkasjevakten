import { useMemo, useState } from "react";
import {
  ArrowLeft, Building2, CalendarDays, FileText, History, KeyRound,
  Mail, MapPin, Phone, ShieldCheck, UserRound
} from "lucide-react";

export type ProfileKind = "admin" | "employee" | "customer_private" | "customer_business";

export interface ProfileIdentity {
  id?: number | string | null;
  name: string;
  roleLabel?: string | null;
  email?: string | null;
  phone?: string | null;
  employeeNumber?: string | null;
  customerNumber?: string | null;
  organizationNumber?: string | null;
  department?: string | null;
  status?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
}

export interface ProfileStat {
  label: string;
  value: string | number;
  hint?: string;
}

export interface ProfileHistoryItem {
  id: string | number;
  title: string;
  subtitle?: string;
  date?: string;
  status?: string;
}

interface ProfilePageProps {
  kind: ProfileKind;
  profile: ProfileIdentity;
  stats?: ProfileStat[];
  history?: ProfileHistoryItem[];
  onBack: () => void;
  settingsContent?: React.ReactNode;
}

type Tab = "oversikt" | "opplysninger" | "historikk" | "innstillinger";

const kindLabels: Record<ProfileKind, string> = {
  admin: "Administrator",
  employee: "Ansatt",
  customer_private: "Privatkunde",
  customer_business: "Bedriftskunde",
};

const initials = (name: string) =>
  String(name || "Profil").trim().split(/\s+/).filter(Boolean)
    .map((part) => part[0]).slice(0, 2).join("").toUpperCase();

function Info({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | number | null;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/45 p-4">
      {icon && (
        <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-800 bg-[#0d1624] text-slate-400">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <p className="mt-1 break-words text-xs font-bold text-slate-200">
          {value !== null && value !== undefined && String(value).trim()
            ? value
            : "Ikke registrert"}
        </p>
      </div>
    </div>
  );
}

export default function ProfilePage({
  kind,
  profile,
  stats = [],
  history = [],
  onBack,
  settingsContent,
}: ProfilePageProps) {
  const [tab, setTab] = useState<Tab>("oversikt");

  const address = useMemo(
    () =>
      [
        profile.address,
        [profile.postalCode, profile.city].filter(Boolean).join(" "),
      ].filter(Boolean).join(", "),
    [profile.address, profile.postalCode, profile.city]
  );

  const identifier =
    kind === "customer_business"
      ? profile.organizationNumber
        ? `Org.nr. ${profile.organizationNumber}`
        : profile.customerNumber ? `Kunde #${profile.customerNumber}` : null
      : kind === "customer_private"
        ? profile.customerNumber ? `Kunde #${profile.customerNumber}` : null
        : profile.employeeNumber ? `Ansatt #${profile.employeeNumber}` : null;

  return (
    <div className="min-h-screen bg-[#070a11] text-white">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#08111d]/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-black text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Tilbake
          </button>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-400">Taklekkasjevakten</p>
            <p className="text-[10px] text-slate-500">Profil og konto</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-5 px-4 py-6 md:px-6">
        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0d1320]">
          <div className="bg-gradient-to-br from-[#0a1a2d] via-[#081522] to-[#0d1320] p-6 md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-xl font-black text-amber-300">
                  {initials(profile.name)}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-amber-300">
                      {kindLabels[kind]}
                    </span>
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black text-emerald-300">
                      {profile.status || "Aktiv"}
                    </span>
                  </div>
                  {kind !== "employee" && (
                    <div className="mt-3 inline-flex items-center rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-amber-300">
                      Intern kundeprofil · Kun for ansatte
                    </div>
                  )}
                  <h1 className="mt-3 truncate text-2xl font-black md:text-3xl">{profile.name || "Profil"}</h1>
                  <p className="mt-1 text-xs text-slate-400">
                    {profile.roleLabel || kindLabels[kind]}{identifier ? ` · ${identifier}` : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex overflow-x-auto border-t border-slate-800 px-3">
            {[
              ["oversikt", "Oversikt"],
              ["opplysninger", "Opplysninger"],
              ["historikk", "Historikk"],
              ["innstillinger", "Innstillinger"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id as Tab)}
                className={`border-b-2 px-4 py-3 text-xs font-black ${
                  tab === id
                    ? "border-[#F5B800] text-[#F5B800]"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {tab === "oversikt" && (
          <div className="space-y-5">
            {stats.length > 0 && (
              <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-slate-800 bg-[#0d1320] p-4">
                    <p className="text-2xl font-black">{stat.value}</p>
                    <p className="mt-1 text-xs font-black text-slate-300">{stat.label}</p>
                    {stat.hint && <p className="mt-1 text-[10px] text-slate-500">{stat.hint}</p>}
                  </div>
                ))}
              </section>
            )}

            <section className="rounded-2xl border border-slate-800 bg-[#0d1320] p-5">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-amber-300" />
                <h2 className="text-sm font-black">Profiloversikt</h2>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Info label="Navn" value={profile.name} icon={<UserRound className="h-4 w-4" />} />
                <Info label="Rolle" value={profile.roleLabel || kindLabels[kind]} icon={<ShieldCheck className="h-4 w-4" />} />
                <Info label="E-post" value={profile.email} icon={<Mail className="h-4 w-4" />} />
                <Info label="Telefon" value={profile.phone} icon={<Phone className="h-4 w-4" />} />
                {(kind === "customer_private" || kind === "customer_business") && (
                  <Info label="Adresse" value={address} icon={<MapPin className="h-4 w-4" />} />
                )}
                {kind === "customer_business" && (
                  <Info label="Organisasjonsnummer" value={profile.organizationNumber} icon={<Building2 className="h-4 w-4" />} />
                )}
              </div>
            </section>
          </div>
        )}

        {tab === "opplysninger" && (
          <section className="rounded-2xl border border-slate-800 bg-[#0d1320] p-5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-300" />
              <h2 className="text-sm font-black">Registrerte opplysninger</h2>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Info label="Navn" value={profile.name} />
              <Info label="E-post" value={profile.email} />
              <Info label="Telefon" value={profile.phone} />
              {(kind === "admin" || kind === "employee") && <Info label="Ansattnummer" value={profile.employeeNumber} />}
              {(kind === "admin" || kind === "employee") && <Info label="Avdeling" value={profile.department} />}
              {(kind === "customer_private" || kind === "customer_business") && <Info label="Kundenummer" value={profile.customerNumber} />}
              {kind === "customer_business" && <Info label="Organisasjonsnummer" value={profile.organizationNumber} />}
              {(kind === "customer_private" || kind === "customer_business") && (
                <>
                  <Info label="Adresse" value={profile.address} />
                  <Info label="Postnummer" value={profile.postalCode} />
                  <Info label="Sted" value={profile.city} />
                </>
              )}
            </div>
          </section>
        )}

        {tab === "historikk" && (
          <section className="rounded-2xl border border-slate-800 bg-[#0d1320] p-5">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-violet-300" />
              <h2 className="text-sm font-black">Historikk</h2>
            </div>
            {history.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
                Historikk kobles til prosjekter og tidligere saker når dataene er tilgjengelige.
              </div>
            ) : (
              <div className="mt-4 divide-y divide-slate-800/70 overflow-hidden rounded-xl border border-slate-800">
                {history.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 bg-slate-950/35 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black">{item.title}</p>
                      {item.subtitle && <p className="mt-1 text-[10px] text-slate-500">{item.subtitle}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      {item.status && <p className="text-[10px] font-black text-amber-300">{item.status}</p>}
                      {item.date && <p className="mt-1 text-[9px] text-slate-500">{item.date}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "innstillinger" && (
          <div className="space-y-5">
            {settingsContent}
            <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-800 bg-[#0d1320] p-5">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-amber-300" />
                <h2 className="text-sm font-black">Innlogging og sikkerhet</h2>
              </div>
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/45 p-4">
                <p className="text-xs font-black">Innloggingskonto</p>
                <p className="mt-1 text-[10px] text-slate-500">{profile.email || "Ingen e-post registrert"}</p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-[#0d1320] p-5">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-300" />
                <h2 className="text-sm font-black">Varsler og preferanser</h2>
              </div>
              <p className="mt-4 rounded-xl border border-slate-800 bg-slate-950/45 p-4 text-[11px] leading-5 text-slate-500">
                Passord, tofaktor og varslingspreferanser kobles til profil-API-et i neste fase.
              </p>
            </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
