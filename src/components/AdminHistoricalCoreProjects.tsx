import { useEffect, useMemo, useState } from "react";
import { Archive, ChevronDown, ChevronUp, RefreshCw, Search } from "lucide-react";
import { apiUrl } from "../lib/api";

// Core is source of truth. Historical projects are read-only, never converted into inquiries.
export type HistoricalProject = {
  id: number;
  project_number: string | null;
  title: string;
  description: string | null;
  notes: string | null;
  status: string;
  customer_id: number | null;
  customer_name: string | null;
  source_reference: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  historical: number | string | null;
};
type Props = { existingInquiryIds: number[]; projects?: HistoricalProject[]; loadingExternal?: boolean; errorExternal?: string };
const fmtDate = (v: string | null) => v ? v.slice(0, 10).split("-").reverse().join(".") : "Ikke registrert";
export default function AdminHistoricalCoreProjects({ existingInquiryIds, projects, loadingExternal, errorExternal }: Props) {
  const [items, setItems] = useState<HistoricalProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (projects !== undefined) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(apiUrl("/admin_historical_tlv_projects.php"), {
      credentials: "include", cache: "no-store", signal: controller.signal,
    }).then(async response => {
      const json = await response.json().catch(() => null);
      if (!response.ok || json?.success !== true || !Array.isArray(json.projects)) {
        throw new Error(json?.message || "Historiske Core-prosjekter kunne ikke hentes.");
      }
      setItems(json.projects);
    }).catch(error => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Ukjent feil.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh, projects]);

  const existing = useMemo(() => new Set(existingInquiryIds.map(Number)), [existingInquiryIds]);
  const sourceItems = projects ?? items;
  const archived = useMemo(() => sourceItems.filter(project => {
    const match = /^inquiry:(\d+)$/.exec(project.source_reference || "");
    return !match || !existing.has(Number(match[1]));
  }), [sourceItems, existing]);
  const visible = archived.filter(project => (
    [project.project_number, project.title, project.customer_name, project.description]
      .some(v => (v || "").toLowerCase().includes(search.toLowerCase().trim()))
  ));
  const linked = sourceItems.length - archived.length;
  const isLoading = projects === undefined ? loading : Boolean(loadingExternal);
  const currentError = projects === undefined ? error : errorExternal || "";

  return <section className="mt-5 overflow-hidden rounded-2xl border border-slate-800/75 bg-[#32121d] text-white">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/70 px-5 py-4">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-black"><Archive size={17} className="text-amber-300"/> Historiske fullførte prosjekter · Perun Core</h3>
        <p className="mt-1 text-xs text-[#cbb2bd]">Viser avsluttede Taklekkasjevakten-prosjekter uten eget TLV-sakskort. Data leses direkte fra Core; ingen ny henvendelse opprettes.</p>
        <p className="mt-1 text-[11px] text-[#cbb2bd]">{archived.length} historiske prosjekter · {linked} allerede koblet til eksisterende TLV-saker</p>
      </div>
      <button type="button" onClick={() => projects === undefined ? setRefresh(v => v + 1) : window.location.reload()} disabled={isLoading}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold hover:bg-white/5 disabled:opacity-50">
        <RefreshCw size={14}/> Oppdater fra Core
      </button>
    </div>
    {currentError && <p role="alert" className="m-4 rounded-lg border border-rose-600/50 bg-rose-950/40 p-3 text-xs text-rose-200">{currentError}</p>}
    {isLoading && <p className="p-5 text-xs text-slate-300">Henter historiske prosjekter …</p>}
    {!isLoading && !currentError && <>
      <div className="relative mx-5 my-4">
        <Search size={15} className="absolute left-3 top-3 text-slate-400"/>
        <input aria-label="Søk historiske prosjekter" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Søk prosjektnummer, kunde eller adresse"
          className="w-full rounded-lg border border-slate-700 bg-[#200d16] py-2.5 pl-9 pr-3 text-xs text-white placeholder:text-slate-400"/>
      </div>
      {visible.length === 0 && <p className="px-5 pb-5 text-xs text-slate-400">Ingen historiske prosjekter funnet.</p>}
      <div className="divide-y divide-slate-800/70">
        {visible.map(project => <article key={project.id} className="px-5 py-3">
          <button type="button" aria-expanded={openId === project.id} onClick={() => setOpenId(v => v === project.id ? null : project.id)}
            className="flex w-full items-center justify-between gap-3 text-left">
            <div className="min-w-0">
              <p className="text-xs font-bold text-white">{project.project_number || "Core #" + project.id} · {project.title || "Uten tittel"}</p>
              <p className="mt-1 text-[11px] text-slate-300">{project.customer_name || "Kunde ikke oppgitt"} · {project.end_date ? "Fullført " + fmtDate(project.end_date) : "Sluttdato ikke registrert"}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full border border-emerald-600/30 px-2 py-1 text-[10px] text-emerald-300">Fullført i Core</span>
              {openId === project.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            </div>
          </button>
          {openId === project.id && <div className="mt-3 space-y-2 rounded-lg border border-slate-700/70 bg-[#1e101b] p-4 text-xs text-slate-200">
            <p><b>Core-prosjekt:</b> #{project.id}</p>
            <p><b>Periode:</b> {fmtDate(project.start_date)} – {fmtDate(project.end_date)}</p>
            <p><b>Kunde:</b> {project.customer_name || "Ikke registrert"} {project.customer_id ? "(#" + project.customer_id + ")" : ""}</p>
            {project.description && <p className="whitespace-pre-wrap"><b>Beskrivelse:</b> {project.description}</p>}
            {project.notes && <p className="whitespace-pre-wrap"><b>Prosjektnotater:</b> {project.notes}</p>}
            <p className="text-slate-400">Kun lesing av originalprosjektet. Dokumenter og bilder overføres ikke automatisk.</p>
          </div>}
        </article>)}
      </div>
    </>}
  </section>;
}
