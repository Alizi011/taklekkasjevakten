import { useState } from "react";
import {
  Inbox,
  AlertTriangle,
  Building2,
  Search,
  LogOut,
  Phone,
  Mail,
  MapPin,
  Clock,
  Filter,
} from "lucide-react";
import { mockInquiriesData } from "../data/mockInquiries";
import type { Inquiry } from "../data/mockInquiries";

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>(mockInquiriesData);
  const [filterType, setFilterType] = useState<string>("alle");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const updateStatus = (id: string, newStatus: Inquiry["status"]) => {
    setInquiries((prev) =>
      prev.map((inq) => (inq.id === id ? { ...inq, status: newStatus } : inq))
    );
  };

  const filteredInquiries = inquiries.filter((inq) => {
    const matchesFilter = filterType === "alle" || inq.type === filterType;
    const matchesSearch =
      inq.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const akuttCount = inquiries.filter((i) => i.type === "akutt").length;
  const b2bCount = inquiries.filter((i) => i.type === "b2b").length;
  const totalCount = inquiries.length;

  return (
    <div className="min-h-screen bg-[#0b0f17] text-white">
      {/* Admin Topbar */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Taklekkasjevakten" className="h-10 w-auto" />
          <div>
            <h1 className="font-extrabold text-sm text-white">Perun AS — Oppdragsportal</h1>
            <p className="text-[11px] text-amber-500 font-semibold">Admin Kontrollpanel</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logg ut</span>
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* KPI-kort */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Innboks</p>
              <h2 className="text-3xl font-extrabold text-white mt-1">{totalCount}</h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[#F5B800] flex items-center justify-center">
              <Inbox className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-red-900/40 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Akutt-Utrykninger</p>
              <h2 className="text-3xl font-extrabold text-red-100 mt-1">{akuttCount}</h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-500 font-bold uppercase tracking-wider">B2B / Sameier</p>
              <h2 className="text-3xl font-extrabold text-white mt-1">{b2bCount}</h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[#F5B800] flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Søk og Filtrering */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Søk på navn, by eller ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500 pl-9"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-bold">Filter:</span>
            {["alle", "akutt", "b2b", "standard"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer ${
                  filterType === type
                    ? "bg-[#F5B800] text-slate-950"
                    : "bg-slate-950 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Tabell over henvendelser */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">ID & Dato</th>
                  <th className="p-4">Kunde</th>
                  <th className="p-4">Sted & Taktype</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Handling</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInquiries.map((inq) => (
                  <tr key={inq.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <span className="font-mono font-bold text-white block">{inq.id}</span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {inq.createdAt}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-extrabold text-white block">{inq.customerName}</span>
                      <div className="flex items-center gap-3 mt-1 text-[11px]">
                        <a href={`tel:${inq.phone}`} className="text-amber-400 hover:underline flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {inq.phone}
                        </a>
                        <a href={`mailto:${inq.email}`} className="text-slate-400 hover:underline flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {inq.email}
                        </a>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1 text-slate-200 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" /> {inq.address}, {inq.city}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">{inq.roofType}</span>
                    </td>
                    <td className="p-4">
                      {inq.type === "akutt" && (
                        <span className="px-2.5 py-1 bg-red-950 text-red-400 border border-red-800/60 rounded-full font-bold uppercase text-[10px]">
                          Akutt Vakt
                        </span>
                      )}
                      {inq.type === "b2b" && (
                        <span className="px-2.5 py-1 bg-amber-500/10 text-[#F5B800] border border-amber-500/30 rounded-full font-bold uppercase text-[10px]">
                          B2B / Sameie
                        </span>
                      )}
                      {inq.type === "standard" && (
                        <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full font-bold uppercase text-[10px]">
                          Standard Fagsøk
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <select
                        value={inq.status}
                        onChange={(e) => updateStatus(inq.id, e.target.value as Inquiry["status"])}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="ny">Ny</option>
                        <option value="kontaktet">Kontaktet</option>
                        <option value="befaring">Befaring Avtalt</option>
                        <option value="fullfort">Fullført</option>
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => alert(`Notater for ${inq.id}:\n\n${inq.notes}`)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                      >
                        Vis Detaljer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}