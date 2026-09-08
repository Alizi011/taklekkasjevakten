import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Eye,
  UserCircle,
  MessageSquare,
} from "lucide-react";
import { apiUrl } from "../lib/api";
import EmployeeProfilePage from "../pages/EmployeeProfilePage";

export interface Employee {
  id?: number;
  name: string;
  role: "Daglig leder" | "Prosjektleder" | "Tekniker" | "Blikkenslager" | "Lærling";
  email: string;
  phone: string;
  status: "Aktiv" | "Inaktiv";
}

interface EmployeeListProps {
  onViewAsEmployee?: (employee: Employee) => void;
}

export default function EmployeeList({
  onViewAsEmployee,
}: EmployeeListProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [profileEmployeeId, setProfileEmployeeId] = useState<
    number | null
  >(null);

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
      console.error(
        "Feil ved oppdatering av ansattstatus:",
        err
      );
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

    const message = window.prompt(
      `Skriv SMS til ${emp.name}:`
    );

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
      const res = await fetch(
        apiUrl("/send_employee_sms.php"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employee_id: emp.id,
            message: message.trim(),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Kunne ikke sende SMS."
        );
      }

      alert(
        `SMS er sendt til ${emp.name} via ${
          data?.strib?.sender || "Perun AS"
        }.`
      );
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Kunne ikke sende SMS."
      );
    } finally {
      setSmsSendingEmployeeId(null);
    }
  };

  const handleViewAsEmployee = (emp: Employee) => {
    if (emp.status !== "Aktiv") {
      alert(
        "Denne ansatte er deaktivert og kan ikke forhåndsvises."
      );
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

  const visibleEmployees = employees.filter(
    (emp) => emp.role !== "Daglig leder"
  );

  const filteredEmployees = visibleEmployees.filter(
    (emp) =>
      emp.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      emp.role
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      emp.email
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  if (profileEmployeeId !== null) {
    return (
      <EmployeeProfilePage
        employeeId={profileEmployeeId}
        onBack={() => setProfileEmployeeId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* REGISTRER NY ANSATT */}
      <form
        onSubmit={handleSaveEmployee}
        className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-6 space-y-5"
      >
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <UserPlus className="w-5 h-5 text-[#F5B800]" />

          <div>
            <h3 className="font-extrabold text-base text-white">
              Registrer Ny Ansatt / Tekniker & Gi Tilgang
            </h3>

            <p className="text-xs text-slate-400 mt-0.5">
              Registrer ansatte og velg hvilken rolle de skal ha
              i systemet.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
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
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white cursor-pointer"
          >
            <option value="Daglig leder">
              Daglig leder
            </option>

            <option value="Tekniker">
              Tekniker
            </option>

            <option value="Prosjektleder">
              Prosjektleder
            </option>

            <option value="Blikkenslager">
              Blikkenslager
            </option>

            <option value="Lærling">
              Lærling
            </option>
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
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono"
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
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
            required
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#F5B800] hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Lagre Ansatt
          </button>
        </div>
      </form>

      {/* ANSATTREGISTER */}
      <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#F5B800]" />

              Ansatt- og Tilgangsregister ({visibleEmployees.length})
            </h3>

            <p className="text-xs text-slate-400 mt-0.5">
              Administrer hvem som har aktiv tilgang til systemet
              og deres respektive roller.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Søk på navn, rolle eller e-post..."
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#F5B800]" />
            Henter ansattliste...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            Ingen ansatte registrert i systemet ennå.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
            {filteredEmployees.map((emp) => {
              const smsSending =
                Boolean(emp.id) &&
                smsSendingEmployeeId === emp.id;

              const isActive =
                emp.status === "Aktiv";

              return (
                <div
                  key={emp.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-md"
                >
                  {/* HEADER */}
                  <div className="flex flex-col gap-3 border-b border-slate-900 pb-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h5 className="font-extrabold text-xs text-white truncate">
                        {emp.name}
                      </h5>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* ROLLE */}
                      <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-lg font-bold whitespace-nowrap">
                        {emp.role}
                      </span>

                      {/* STATUS TOGGLE */}
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleStatus(emp)
                        }
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
                            isActive
                              ? "bg-emerald-500/30"
                              : "bg-red-500/20"
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
                            isActive
                              ? "text-emerald-300"
                              : "text-red-300"
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

                  {/* KONTAKTINFO */}
                  <div className="py-4 text-[11px] text-slate-300 space-y-2 font-mono">
                    <a
                      href={`tel:${emp.phone}`}
                      className="flex items-center gap-2 text-amber-400 hover:text-amber-300"
                    >
                      <Phone className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                      {emp.phone}
                    </a>

                    <a
                      href={`mailto:${emp.email}`}
                      className="flex items-center gap-2 truncate text-slate-300 hover:text-white"
                    >
                      <Mail className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                      <span className="truncate">
                        {emp.email}
                      </span>
                    </a>
                  </div>

                  {/* HANDLINGER */}
                  <div className="border-t border-slate-900 pt-3">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-[auto_auto_auto_1fr]">
                      {/* SMS */}
                      <button
                        type="button"
                        onClick={() =>
                          handleSendSms(emp)
                        }
                        disabled={
                          !isActive ||
                          !emp.id ||
                          !emp.phone?.trim() ||
                          smsSending
                        }
                        className="h-9 px-3 rounded-lg text-[10px] font-extrabold transition-colors bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        {smsSending ? (
                          <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                        ) : (
                          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                        )}

                        {smsSending
                          ? "Sender..."
                          : "SMS"}
                      </button>

                      {/* E-POST */}
                      {emp.email?.trim() ? (
                        <a
                          href={`mailto:${emp.email}?subject=${encodeURIComponent(
                            "Melding fra Perun AS"
                          )}`}
                          className="h-9 px-3 rounded-lg text-[10px] font-extrabold transition-colors bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 flex items-center justify-center gap-1.5 whitespace-nowrap"
                        >
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          E-post
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="h-9 px-3 rounded-lg text-[10px] font-extrabold bg-slate-900 text-slate-600 border border-slate-800 opacity-40 cursor-not-allowed flex items-center justify-center gap-1.5 whitespace-nowrap"
                        >
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          E-post
                        </button>
                      )}

                      {/* PROFIL */}
                      <button
                        type="button"
                        onClick={() => {
                          if (emp.id) {
                            setProfileEmployeeId(
                              Number(emp.id)
                            );
                          }
                        }}
                        disabled={!emp.id}
                        className="h-9 px-3 rounded-lg text-[10px] font-extrabold transition-colors bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/15 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <UserCircle className="w-3.5 h-3.5 shrink-0" />
                        Profil
                      </button>

                      {/* SE SOM ANSATT */}
                      {emp.role !== "Daglig leder" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleViewAsEmployee(emp)
                          }
                          disabled={!isActive}
                          className="h-9 px-3 rounded-lg text-[10px] font-extrabold transition-colors bg-slate-900 text-slate-300 border border-slate-700 hover:border-amber-500/50 hover:text-amber-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0" />
                          Se som ansatt
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}