import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCircle,
  UserPlus,
  Users,
} from "lucide-react";

import { apiUrl } from "../lib/api";
import EmployeeProfilePage from "../pages/EmployeeProfilePage";

export interface Employee {
  id?: number;
  name: string;
  role:
    | "Daglig leder"
    | "Prosjektleder"
    | "Tekniker"
    | "Blikkenslager"
    | "Lærling";
  email: string;
  phone: string;
  status: "Aktiv" | "Inaktiv";
}

interface EmployeeListProps {
  onViewAsEmployee?: (employee: Employee) => void;
}

function normalizeSearch(value: string): string {
  return String(value || "").trim().toLowerCase();
}

export default function EmployeeList({
  onViewAsEmployee,
}: EmployeeListProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [profileEmployeeId, setProfileEmployeeId] = useState<number | null>(
    null
  );

  const [smsSendingEmployeeId, setSmsSendingEmployeeId] = useState<
    number | null
  >(null);

  const [newEmployee, setNewEmployee] = useState<Employee>({
    name: "",
    role: "Tekniker",
    email: "",
    phone: "",
    status: "Aktiv",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);

      const res = await fetch(apiUrl("/employees.php"));
      const data = await res.json();

      if (Array.isArray(data)) {
        setEmployees(data);
      }
    } catch (err) {
      console.error("Feil ved henting av ansatte:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(apiUrl("/employees.php"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEmployee),
      });

      const data = await res.json();

      if (data.success) {
        alert("Ny ansatt registrert med tilgang!");

        setNewEmployee({
          name: "",
          role: "Tekniker",
          email: "",
          phone: "",
          status: "Aktiv",
        });

        fetchEmployees();
      }
    } catch (err) {
      console.error("Feil ved lagring av ansatt:", err);
    }
  };

  const handleToggleStatus = async (emp: Employee) => {
    const newStatus: Employee["status"] =
      emp.status === "Aktiv" ? "Inaktiv" : "Aktiv";

    try {
      const res = await fetch(apiUrl("/employees.php"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: emp.id,
          status: newStatus,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setEmployees((prev) =>
          prev.map((item) =>
            item.id === emp.id
              ? {
                  ...item,
                  status: newStatus,
                }
              : item
          )
        );
      }
    } catch (err) {
      console.error("Feil ved oppdatering av ansattstatus:", err);
    }
  };

  const handleSendSms = async (emp: Employee) => {
    if (!emp.id) {
      alert("Den ansatte mangler ID.");
      return;
    }

    if (emp.status !== "Aktiv") {
      alert("SMS kan bare sendes til aktive ansatte.");
      return;
    }

    if (!emp.phone?.trim()) {
      alert("Den ansatte mangler telefonnummer.");
      return;
    }

    const message = window.prompt(`Skriv SMS til ${emp.name}:`);

    if (!message?.trim()) {
      return;
    }

    const confirmed = window.confirm(
      `Vil du sende denne SMS-en til ${emp.name} på ${emp.phone}?\n\n${message.trim()}`
    );

    if (!confirmed) {
      return;
    }

    setSmsSendingEmployeeId(emp.id);

    try {
      const res = await fetch(apiUrl("/send_employee_sms.php"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_id: emp.id,
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke sende SMS.");
      }

      alert(
        `SMS er sendt til ${emp.name} via ${
          data?.strib?.sender || "Perun AS"
        }.`
      );
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Kunne ikke sende SMS."
      );
    } finally {
      setSmsSendingEmployeeId(null);
    }
  };

  const handleViewAsEmployee = (emp: Employee) => {
    if (emp.status !== "Aktiv") {
      alert("Denne ansatte er deaktivert og kan ikke forhåndsvises.");
      return;
    }

    if (!onViewAsEmployee) {
      alert(
        "Knappen er lagt inn, men EmployeeList må kobles til ansattvisningen i foreldrekoden."
      );
      return;
    }

    onViewAsEmployee(emp);
  };

  const visibleEmployees = useMemo(
    () => employees.filter((emp) => emp.role !== "Daglig leder"),
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    const query = normalizeSearch(searchQuery);

    if (!query) {
      return visibleEmployees;
    }

    return visibleEmployees.filter((emp) =>
      [emp.name, emp.role, emp.email, emp.phone]
        .map((value) => normalizeSearch(value || ""))
        .some((value) => value.includes(query))
    );
  }, [visibleEmployees, searchQuery]);

  const activeEmployees = useMemo(
    () =>
      filteredEmployees
        .filter((emp) => emp.status === "Aktiv")
        .sort((a, b) => a.name.localeCompare(b.name, "nb")),
    [filteredEmployees]
  );

  const inactiveEmployees = useMemo(
    () =>
      filteredEmployees
        .filter((emp) => emp.status === "Inaktiv")
        .sort((a, b) => a.name.localeCompare(b.name, "nb")),
    [filteredEmployees]
  );

  const activeCount = useMemo(
    () => visibleEmployees.filter((emp) => emp.status === "Aktiv").length,
    [visibleEmployees]
  );

  const inactiveCount = useMemo(
    () => visibleEmployees.filter((emp) => emp.status === "Inaktiv").length,
    [visibleEmployees]
  );

  const hasSearch = Boolean(searchQuery.trim());
  const inactiveExpanded = showInactive || hasSearch;

  if (profileEmployeeId !== null) {
    return (
      <EmployeeProfilePage
        employeeId={profileEmployeeId}
        onBack={() => setProfileEmployeeId(null)}
      />
    );
  }

  const renderEmployeeCard = (emp: Employee) => {
    const smsSending =
      Boolean(emp.id) && smsSendingEmployeeId === emp.id;

    const isActive = emp.status === "Aktiv";

    return (
      <article
        key={emp.id}
        className={`rounded-2xl border p-4 shadow-md transition-all ${
          isActive
            ? "border-emerald-500/20 bg-slate-950 shadow-emerald-950/10"
            : "border-slate-800 bg-slate-950/55 opacity-80 hover:opacity-100"
        }`}
      >
        <div className="flex flex-col gap-3 border-b border-slate-900 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h5 className="truncate text-xs font-extrabold text-white">
              {emp.name}
            </h5>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="whitespace-nowrap rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[9px] font-bold text-amber-400">
              {emp.role}
            </span>

            <button
              type="button"
              onClick={() => handleToggleStatus(emp)}
              title={
                isActive
                  ? "Klikk for å deaktivere"
                  : "Klikk for å aktivere"
              }
              className={`group flex h-8 items-center gap-2 rounded-full border px-2 transition-all ${
                isActive
                  ? "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15"
                  : "border-red-500/30 bg-red-500/10 hover:bg-red-500/15"
              }`}
            >
              <span
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                  isActive ? "bg-emerald-500/30" : "bg-red-500/20"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full shadow transition-all duration-200 ${
                    isActive
                      ? "left-[18px] bg-emerald-300"
                      : "left-0.5 bg-red-300"
                  }`}
                />
              </span>

              <span
                className={`flex min-w-[46px] items-center gap-1 text-[9px] font-black uppercase tracking-wide ${
                  isActive ? "text-emerald-300" : "text-red-300"
                }`}
              >
                {isActive ? (
                  <ShieldCheck className="h-3 w-3" />
                ) : (
                  <ShieldAlert className="h-3 w-3" />
                )}

                {emp.status}
              </span>
            </button>
          </div>
        </div>

        <div className="space-y-2 py-4 font-mono text-[11px] text-slate-300">
          {emp.phone?.trim() ? (
            <a
              href={`tel:${emp.phone}`}
              className="flex items-center gap-2 text-amber-400 hover:text-amber-300"
            >
              <Phone className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span>{emp.phone}</span>
            </a>
          ) : (
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span>Telefon ikke registrert</span>
            </div>
          )}

          {emp.email?.trim() ? (
            <a
              href={`mailto:${emp.email}`}
              className="flex items-center gap-2 truncate text-slate-300 hover:text-white"
            >
              <Mail className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              <span className="truncate">{emp.email}</span>
            </a>
          ) : (
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span>E-post ikke registrert</span>
            </div>
          )}
        </div>

        <div className="border-t border-slate-900 pt-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-[auto_auto_auto_1fr]">
            <button
              type="button"
              onClick={() => handleSendSms(emp)}
              disabled={
                !isActive ||
                !emp.id ||
                !emp.phone?.trim() ||
                smsSending
              }
              className="flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 text-[10px] font-extrabold text-blue-300 transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {smsSending ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              ) : (
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              )}

              {smsSending ? "Sender..." : "SMS"}
            </button>

            {emp.email?.trim() ? (
              <a
                href={`mailto:${emp.email}?subject=${encodeURIComponent(
                  "Melding fra Perun AS"
                )}`}
                className="flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 text-[10px] font-extrabold text-cyan-300 transition-colors hover:bg-cyan-500/20"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                E-post
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="flex h-9 cursor-not-allowed items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-800 bg-slate-900 px-3 text-[10px] font-extrabold text-slate-600 opacity-40"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                E-post
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (emp.id) {
                  setProfileEmployeeId(Number(emp.id));
                }
              }}
              disabled={!emp.id}
              className="flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 text-[10px] font-extrabold text-amber-300 transition-colors hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <UserCircle className="h-3.5 w-3.5 shrink-0" />
              Profil
            </button>

            {emp.role !== "Daglig leder" && (
              <button
                type="button"
                onClick={() => handleViewAsEmployee(emp)}
                disabled={!isActive}
                className="flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-3 text-[10px] font-extrabold text-slate-300 transition-colors hover:border-amber-500/50 hover:text-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Eye className="h-3.5 w-3.5 shrink-0" />
                Se som ansatt
              </button>
            )}
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-6">
      {/* REGISTRER NY ANSATT */}
      <form
        onSubmit={handleSaveEmployee}
        className="space-y-5 rounded-3xl border border-slate-800 bg-[#0b0f17] p-6"
      >
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <UserPlus className="h-5 w-5 text-[#F5B800]" />

          <div>
            <h3 className="text-base font-extrabold text-white">
              Registrer Ny Ansatt / Tekniker & Gi Tilgang
            </h3>

            <p className="mt-0.5 text-xs text-slate-400">
              Registrer ansatte og velg hvilken rolle de skal ha i systemet.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <input
            type="text"
            placeholder="Fullt Navn *"
            value={newEmployee.name}
            onChange={(e) =>
              setNewEmployee({
                ...newEmployee,
                name: e.target.value,
              })
            }
            className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white"
            required
          />

          <select
            value={newEmployee.role}
            onChange={(e) =>
              setNewEmployee({
                ...newEmployee,
                role: e.target.value as Employee["role"],
              })
            }
            className="cursor-pointer rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white"
          >
            <option value="Daglig leder">Daglig leder</option>
            <option value="Tekniker">Tekniker</option>
            <option value="Prosjektleder">Prosjektleder</option>
            <option value="Blikkenslager">Blikkenslager</option>
            <option value="Lærling">Lærling</option>
          </select>

          <input
            type="text"
            placeholder="Telefon *"
            value={newEmployee.phone}
            onChange={(e) =>
              setNewEmployee({
                ...newEmployee,
                phone: e.target.value,
              })
            }
            className="rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-white"
            required
          />

          <input
            type="email"
            placeholder="E-post (BrukerID) *"
            value={newEmployee.email}
            onChange={(e) =>
              setNewEmployee({
                ...newEmployee,
                email: e.target.value,
              })
            }
            className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white"
            required
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#F5B800] px-4 py-2.5 text-xs font-extrabold text-slate-950 transition-all hover:bg-amber-400"
          >
            <UserPlus className="h-4 w-4" />
            Lagre Ansatt
          </button>
        </div>
      </form>

      {/* ANSATTREGISTER */}
      <section className="space-y-5 rounded-3xl border border-slate-800 bg-[#0b0f17] p-6">
        <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-extrabold text-white">
              <Users className="h-5 w-5 text-[#F5B800]" />
              Ansatt- og Tilgangsregister
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Aktive ansatte vises først. Tidligere og deaktiverte brukere er
              samlet separat.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Aktive {activeCount}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-[10px] font-black text-slate-400">
                <ShieldAlert className="h-3.5 w-3.5" />
                Inaktive {inactiveCount}
              </span>

              <span className="inline-flex items-center rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-[10px] font-bold text-slate-500">
                Totalt {visibleEmployees.length}
              </span>
            </div>
          </div>

          <div className="relative w-full xl:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            <input
              type="text"
              placeholder="Søk på navn, rolle, e-post eller telefon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-white outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-center text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-[#F5B800]" />
            Henter ansattliste...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Ingen ansatte matcher søket.
          </div>
        ) : (
          <div className="space-y-6">
            {/* AKTIVE */}
            <section className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.025]">
              <div className="flex flex-col gap-3 border-b border-emerald-500/15 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
                    <ShieldCheck className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-400">
                      Aktive ansatte
                    </p>
                    <h4 className="mt-1 text-sm font-black text-white">
                      Tilgjengelige i den operative driften
                    </h4>
                    <p className="mt-1 text-[10px] text-slate-500">
                      Kan tildeles prosjekter, motta SMS og åpnes som ansatt.
                    </p>
                  </div>
                </div>

                <span className="self-start rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black text-emerald-300 sm:self-auto">
                  {activeEmployees.length}{" "}
                  {activeEmployees.length === 1 ? "aktiv" : "aktive"}
                </span>
              </div>

              <div className="p-4 md:p-5">
                {activeEmployees.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                    {activeEmployees.map(renderEmployeeCard)}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-emerald-500/20 px-5 py-8 text-center">
                    <p className="text-xs font-bold text-slate-400">
                      {hasSearch
                        ? "Ingen aktive ansatte matcher søket."
                        : "Ingen aktive ansatte er registrert."}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* INAKTIVE */}
            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/25">
              <button
                type="button"
                onClick={() => setShowInactive((current) => !current)}
                className="flex w-full flex-col gap-3 px-5 py-4 text-left transition hover:bg-slate-900/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-red-500/20 bg-red-500/[0.07] text-red-300">
                    <ShieldAlert className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                      Inaktive ansatte
                    </p>
                    <h4 className="mt-1 text-sm font-black text-slate-200">
                      Tidligere eller deaktiverte brukere
                    </h4>
                    <p className="mt-1 text-[10px] text-slate-600">
                      Holdes utenfor den operative visningen til de aktiveres igjen.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[10px] font-black text-slate-400">
                    {inactiveEmployees.length} inaktive
                  </span>

                  <span className="grid h-8 w-8 place-items-center rounded-lg border border-slate-800 bg-slate-950 text-slate-500">
                    {inactiveExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </span>

                  <span className="text-[10px] font-black text-slate-400">
                    {inactiveExpanded ? "Skjul" : "Vis"}
                  </span>
                </div>
              </button>

              {inactiveExpanded && (
                <div className="border-t border-slate-800 p-4 md:p-5">
                  {inactiveEmployees.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                      {inactiveEmployees.map(renderEmployeeCard)}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-800 px-5 py-8 text-center">
                      <p className="text-xs text-slate-500">
                        {hasSearch
                          ? "Ingen inaktive ansatte matcher søket."
                          : "Ingen inaktive ansatte."}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </div>
  );
}
