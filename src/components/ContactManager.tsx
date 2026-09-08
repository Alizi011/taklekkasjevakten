import { useState, useEffect } from "react";
import { UserPlus, Phone, Mail, MapPin, Building, Loader2, Users, ShieldCheck, ShieldAlert, Search } from "lucide-react";
import { apiUrl } from "../lib/api";
export interface Customer {
  id?: number;
  name: string;
  customer_type: "Privatperson" | "B2B" | "Borettslag/Sameie";
  email: string;
  phone: string;
  address: string;
  city: string;
}

export interface Employee {
  id?: number;
  name: string;
  role: "Prosjektleder" | "Tekniker" | "Blikkenslager" | "Lærling";
  email: string;
  phone: string;
  status: "Aktiv" | "Inaktiv";
}

export default function ContactManager() {
  const [activeSubTab, setActiveSubTab] = useState<"kunder" | "ansatte">("kunder");
  const [searchQuery, setSearchQuery] = useState("");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [newCustomer, setNewCustomer] = useState<Customer>({
    name: "",
    customer_type: "Privatperson",
    email: "",
    phone: "",
    address: "",
    city: "Oslo",
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newEmployee, setNewEmployee] = useState<Employee>({
    name: "",
    role: "Tekniker",
    email: "",
    phone: "",
    status: "Aktiv",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, [activeSubTab]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const endpoint = activeSubTab === "kunder" ? apiUrl("/customers.php") : apiUrl("/employees.php");
      const res = await fetch(endpoint);
      const data = await res.json();
      if (Array.isArray(data)) {
        if (activeSubTab === "kunder") setCustomers(data);
        else setEmployees(data);
      }
    } catch (err) {
      console.error("Feil ved henting av kontakter:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl("/customers.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      });
      const data = await res.json();
      if (data.success) {
        alert("Kunde registrert!");
        setNewCustomer({ name: "", customer_type: "Privatperson", email: "", phone: "", address: "", city: "Oslo" });
        fetchContacts();
      }
    } catch (err) {
      console.error("Feil ved lagring av kunde:", err);
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl("/employees.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEmployee),
      });
      const data = await res.json();
      if (data.success) {
        alert("Ansatt registrert med tilgang!");
        setNewEmployee({ name: "", role: "Tekniker", email: "", phone: "", status: "Aktiv" });
        fetchContacts();
      }
    } catch (err) {
      console.error("Feil ved lagring av ansatt:", err);
    }
  };

  const handleToggleEmployeeStatus = async (emp: Employee) => {
    const newStatus = emp.status === "Aktiv" ? "Inaktiv" : "Aktiv";
    try {
      const res = await fetch(apiUrl("/employees.php"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emp.id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setEmployees((prev) =>
          prev.map((item) => (item.id === emp.id ? { ...item, status: newStatus } : item))
        );
      }
    } catch (err) {
      console.error("Feil ved oppdatering av ansattstatus:", err);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery)
  );

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* UNDERNAVIGASJON */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => { setActiveSubTab("kunder"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "kunder" ? "bg-[#F5B800] text-slate-950" : "text-slate-400 hover:text-white"
            }`}
          >
            <Building className="w-4 h-4" /> Kunderegister ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveSubTab("ansatte"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "ansatte" ? "bg-[#F5B800] text-slate-950" : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" /> Ansatte & Tilgangsstyring ({employees.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder={activeSubTab === "kunder" ? "Søk på navn, by eller telefon..." : "Søk på navn, rolle eller e-post..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 pl-9"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
        </div>
      </div>

      {/* SEKSJON: KUNDER */}
      {activeSubTab === "kunder" && (
        <div className="space-y-6">
          <form onSubmit={handleSaveCustomer} className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-extrabold uppercase text-[#F5B800] flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Registrer Ny Kunde
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Navn / Firma *"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                required
              />
              <select
                value={newCustomer.customer_type}
                onChange={(e) => setNewCustomer({ ...newCustomer, customer_type: e.target.value as any })}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white cursor-pointer"
              >
                <option value="Privatperson">Privatperson</option>
                <option value="B2B">B2B / Næring</option>
                <option value="Borettslag/Sameie">Borettslag / Sameie</option>
              </select>
              <input
                type="text"
                placeholder="Telefon *"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono"
                required
              />
              <input
                type="email"
                placeholder="E-post"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Gateadresse"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Poststed / By"
                value={newCustomer.city}
                onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#F5B800] hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl cursor-pointer"
            >
              Lagre Kunde
            </button>
          </form>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#F5B800]" /> Henter kundeliste...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">Ingen kunder funnet i registeret.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((c) => (
                <div key={c.id} className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <h5 className="font-extrabold text-xs text-white truncate max-w-[180px]">{c.name}</h5>
                    <span className="text-[9px] bg-slate-900 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded font-bold">
                      {c.customer_type || "Privatperson"}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-300 space-y-1.5 font-mono">
                    <p className="flex items-center gap-2 text-amber-400">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-amber-500" /> {c.phone}
                    </p>
                    {c.email && (
                      <p className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 shrink-0 text-slate-500" /> {c.email}
                      </p>
                    )}
                    {c.address && (
                      <p className="flex items-center gap-2 text-slate-400">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500" /> {c.address}, {c.city}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SEKSJON: ANSATTE */}
      {activeSubTab === "ansatte" && (
        <div className="space-y-6">
          <form onSubmit={handleSaveEmployee} className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-extrabold uppercase text-[#F5B800] flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Legg til Ny Ansatt & Gi Tilgang
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Fullt Navn *"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                required
              />
              <select
                value={newEmployee.role}
                onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value as any })}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white cursor-pointer"
              >
                <option value="Tekniker">Tekniker</option>
                <option value="Prosjektleder">Prosjektleder</option>
                <option value="Blikkenslager">Blikkenslager</option>
                <option value="Lærling">Lærling</option>
              </select>
              <input
                type="text"
                placeholder="Telefon *"
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono"
                required
              />
              <input
                type="email"
                placeholder="E-post (BrukerID) *"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                required
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#F5B800] hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl cursor-pointer"
            >
              Registrer Ansatt
            </button>
          </form>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#F5B800]" /> Henter ansattliste...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">Ingen ansatte registrert i systemet ennå.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map((emp) => (
                <div key={emp.id} className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <h5 className="font-extrabold text-xs text-white">{emp.name}</h5>
                    <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded font-bold">
                      {emp.role}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-300 space-y-1.5 font-mono">
                    <p className="flex items-center gap-2 text-amber-400">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-amber-500" /> {emp.phone}
                    </p>
                    <p className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0 text-slate-500" /> {emp.email}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 ${
                      emp.status === "Aktiv" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-red-500/10 text-red-400 border border-red-500/30"
                    }`}>
                      {emp.status === "Aktiv" ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                      Tilgang: {emp.status}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleEmployeeStatus(emp)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer transition-colors ${
                        emp.status === "Aktiv" ? "bg-red-950 text-red-400 hover:bg-red-900" : "bg-emerald-950 text-emerald-400 hover:bg-emerald-900"
                      }`}
                    >
                      {emp.status === "Aktiv" ? "Deaktiver" : "Aktiver"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}