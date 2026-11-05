import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Building2,
  Check,
  Loader2,
  Save,
  ShieldCheck,
  Users,
} from "lucide-react";
import { apiUrl } from "../lib/api";

export type SettingsView = "company" | "users" | "notifications";

type CompanySettings = {
  company_name: string;
  organization_number: string;
  address: string;
  postal_code: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  vat_percent: string;
  default_hourly_rate: string;
  vehicle_daily_rate: string;
  mileage_rate: string;
  default_warranty_years: string;
};

type NotificationSettings = {
  new_inquiry: boolean;
  acute_inquiry: boolean;
  report_for_review: boolean;
  offer_waiting: boolean;
  time_approval: boolean;
  import_issue: boolean;
  project_inactive: boolean;
  budget_exceeded: boolean;
};

type Employee = {
  id?: number;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  status?: string;
};

type AccessRole =
  | "admin"
  | "project_manager"
  | "field"
  | "finance"
  | "read_only";

type UserAccess = {
  employee_id: number;
  access_role: AccessRole;
  permissions?: string[];
  active: boolean;
};

type SettingsResponse = {
  success: boolean;
  message?: string;
  company?: CompanySettings;
  notifications?: NotificationSettings;
  user_access?: UserAccess[];
};

const defaultCompany: CompanySettings = {
  company_name: "Perun AS",
  organization_number: "",
  address: "",
  postal_code: "",
  city: "",
  phone: "",
  email: "",
  website: "",
  vat_percent: "25",
  default_hourly_rate: "980",
  vehicle_daily_rate: "240",
  mileage_rate: "5",
  default_warranty_years: "5",
};

const defaultNotifications: NotificationSettings = {
  new_inquiry: true,
  acute_inquiry: true,
  report_for_review: true,
  offer_waiting: true,
  time_approval: true,
  import_issue: true,
  project_inactive: false,
  budget_exceeded: true,
};

const roleLabels: Record<AccessRole, string> = {
  admin: "Administrator",
  project_manager: "Prosjektleder",
  field: "Ansatt / felt",
  finance: "Økonomi",
  read_only: "Kun lesing",
};

const roleDescriptions: Record<AccessRole, string> = {
  admin: "Full tilgang til administrasjon, data og innstillinger.",
  project_manager: "Kunder, prosjekter, rapporter, timer og kjøring.",
  field: "Prosjekter, timer og kjøring i felt.",
  finance: "Kunder, prosjektøkonomi, timer og rapportgrunnlag.",
  read_only: "Kan lese sentrale data, men ikke endre dem.",
};

const notificationLabels: Array<{
  key: keyof NotificationSettings;
  title: string;
  description: string;
}> = [
  {
    key: "new_inquiry",
    title: "Nytt oppdrag / henvendelse",
    description: "Varsle når en ny kundehenvendelse kommer inn.",
  },
  {
    key: "acute_inquiry",
    title: "Akutt henvendelse",
    description: "Prioritert varsel ved akutte lekkasjer eller hasteoppdrag.",
  },
  {
    key: "report_for_review",
    title: "Rapport til behandling",
    description: "Varsle når prosjektleder sender rapport til administrasjonen.",
  },
  {
    key: "offer_waiting",
    title: "Tilbud krever handling",
    description: "Varsle når et tilbud venter på behandling eller oppfølging.",
  },
  {
    key: "time_approval",
    title: "Timer til godkjenning",
    description: "Varsle når registrerte timer trenger kontroll.",
  },
  {
    key: "import_issue",
    title: "Importfeil / avvik",
    description: "Varsle når intelligent import finner feil eller krever kontroll.",
  },
  {
    key: "project_inactive",
    title: "Prosjekt uten aktivitet",
    description: "Varsle om prosjekter som har stått stille over tid.",
  },
  {
    key: "budget_exceeded",
    title: "Tid / budsjett overskredet",
    description: "Varsle når registrerte timer eller kostnader går over plan.",
  },
];

export default function SettingsPage({
  activeView,
}: {
  activeView: SettingsView;
}) {
  const [company, setCompany] = useState<CompanySettings>(defaultCompany);
  const [notifications, setNotifications] =
    useState<NotificationSettings>(defaultNotifications);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [access, setAccess] = useState<Record<number, UserAccess>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [settingsRes, employeesRes] = await Promise.all([
        fetch(apiUrl("/core/settings.php")),
        fetch(apiUrl("/employees.php")),
      ]);

      const settingsData: SettingsResponse = await settingsRes.json();
      const employeesData = await employeesRes.json();

      if (!settingsRes.ok || !settingsData.success) {
        throw new Error(
          settingsData.message || "Kunne ikke hente innstillinger."
        );
      }

      setCompany(settingsData.company || defaultCompany);
      setNotifications(
        settingsData.notifications || defaultNotifications
      );

      const nextAccess: Record<number, UserAccess> = {};
      (settingsData.user_access || []).forEach((item) => {
        nextAccess[Number(item.employee_id)] = item;
      });
      setAccess(nextAccess);

      setEmployees(
        Array.isArray(employeesData) ? employeesData : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kunne ikke hente innstillinger."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveSection = async (
    section: "company" | "notifications",
    data: CompanySettings | NotificationSettings
  ) => {
    setSaving(section);
    setMessage("");
    setError("");

    try {
      const res = await fetch(apiUrl("/core/settings.php"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, data }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(
          result.message || "Kunne ikke lagre innstillingene."
        );
      }

      setMessage(result.message || "Lagret.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Lagring feilet."
      );
    } finally {
      setSaving(null);
    }
  };

  const saveUserRole = async (
    employeeId: number,
    accessRole: AccessRole,
    active = true
  ) => {
    setSaving(`user-${employeeId}`);
    setMessage("");
    setError("");

    try {
      const res = await fetch(apiUrl("/core/settings.php"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "user_access",
          employee_id: employeeId,
          access_role: accessRole,
          active,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(
          result.message || "Kunne ikke lagre brukertilgangen."
        );
      }

      setAccess((current) => ({
        ...current,
        [employeeId]: result.user_access,
      }));
      setMessage("Brukertilgangen er lagret.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Lagring feilet."
      );
    } finally {
      setSaving(null);
    }
  };

  const activeEmployees = useMemo(
    () =>
      employees.filter(
        (employee) =>
          String(employee.status || "Aktiv").toLowerCase() !==
          "inaktiv"
      ),
    [employees]
  );

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-800 bg-[#0d1320]">
        <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {(message || error) && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs ${
            error
              ? "border-red-500/20 bg-red-500/[0.06] text-red-300"
              : "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300"
          }`}
        >
          {error || message}
        </div>
      )}

      {activeView === "company" && (
        <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-5 md:p-6">
          <div className="flex items-start gap-3 border-b border-slate-800 pb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-300">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                Firmainnstillinger
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Felles firmadata og standardverdier som kan brukes i tilbud,
                rapporter og kalkyler.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              ["company_name", "Firmanavn"],
              ["organization_number", "Organisasjonsnummer"],
              ["address", "Adresse"],
              ["postal_code", "Postnummer"],
              ["city", "Sted"],
              ["phone", "Telefon"],
              ["email", "E-post"],
              ["website", "Nettside"],
              ["vat_percent", "MVA %"],
              ["default_hourly_rate", "Standard timepris"],
              ["vehicle_daily_rate", "Bil / drift per dag"],
              ["mileage_rate", "Kjøring per km"],
              ["default_warranty_years", "Standard garanti (år)"],
            ].map(([key, label]) => (
              <label key={key} className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
                  {label}
                </span>
                <input
                  value={company[key as keyof CompanySettings]}
                  onChange={(e) =>
                    setCompany((current) => ({
                      ...current,
                      [key]: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-amber-500/50"
                />
              </label>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => saveSection("company", company)}
              disabled={saving === "company"}
              className="inline-flex items-center gap-2 rounded-xl bg-[#F5B800] px-4 py-2.5 text-xs font-black text-slate-950 disabled:opacity-50"
            >
              {saving === "company" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Lagre firmainnstillinger
            </button>
          </div>
        </section>
      )}

      {activeView === "users" && (
        <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-5 md:p-6">
          <div className="flex items-start gap-3 border-b border-slate-800 pb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                Brukere & roller
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Jobbrollen til den ansatte beholdes. Her bestemmer du
                systemtilgangen separat.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {activeEmployees.map((employee) => {
              const employeeId = Number(employee.id || 0);
              const current =
                access[employeeId]?.access_role ||
                (employee.role === "Prosjektleder"
                  ? "project_manager"
                  : "field");

              return (
                <div
                  key={employeeId || employee.email}
                  className="grid gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 lg:grid-cols-[1fr_260px_120px] lg:items-center"
                >
                  <div>
                    <div className="text-xs font-black text-white">
                      {employee.name}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">
                      {employee.role || "Ansatt"}
                      {employee.email ? ` · ${employee.email}` : ""}
                    </div>
                  </div>

                  <div>
                    <select
                      value={current}
                      disabled={!employeeId}
                      onChange={(e) =>
                        saveUserRole(
                          employeeId,
                          e.target.value as AccessRole
                        )
                      }
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs font-bold text-white outline-none"
                    >
                      {Object.entries(roleLabels).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        )
                      )}
                    </select>
                    <div className="mt-1.5 text-[9px] leading-4 text-slate-600">
                      {roleDescriptions[current]}
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    {saving === `user-${employeeId}` ? (
                      <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                    ) : access[employeeId] ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-300">
                        <Check className="h-3.5 w-3.5" />
                        Lagret
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-600">
                        Standardrolle
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {activeView === "notifications" && (
        <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-5 md:p-6">
          <div className="flex items-start gap-3 border-b border-slate-800 pb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-300">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                Varsler
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Velg hvilke hendelser som skal markeres i systemet. E-post og
                push kobles på senere.
              </p>
            </div>
          </div>

          <div className="mt-5 divide-y divide-slate-800">
            {notificationLabels.map((item) => {
              const enabled = notifications[item.key];

              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-5 py-4"
                >
                  <div>
                    <div className="text-xs font-black text-white">
                      {item.title}
                    </div>
                    <div className="mt-1 text-[10px] leading-5 text-slate-500">
                      {item.description}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setNotifications((current) => ({
                        ...current,
                        [item.key]: !current[item.key],
                      }))
                    }
                    className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                      enabled ? "bg-amber-400" : "bg-slate-800"
                    }`}
                    aria-pressed={enabled}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
                        enabled ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-start gap-2 text-[10px] leading-5 text-slate-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              Innstillingene styrer hvilke hendelser varslingsmotoren skal
              reagere på. Selve e-postutsendelsen bygges senere.
            </div>

            <button
              type="button"
              onClick={() =>
                saveSection("notifications", notifications)
              }
              disabled={saving === "notifications"}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#F5B800] px-4 py-2.5 text-xs font-black text-slate-950 disabled:opacity-50"
            >
              {saving === "notifications" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Lagre varsler
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
