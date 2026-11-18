import { useState } from "react";
import { ArrowRight, Building2, CalendarDays, CheckCircle2, ClipboardList, FolderArchive } from "lucide-react";

// These cards are read-only views of Perun Core projects, not TLV inquiries.
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
type Props = {
  projects: HistoricalProject[];
  query?: string;
  sortNewest?: boolean;
};
const dateLabel = (value: string | null) => {
  const match = (value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : "Ikke registrert";
};
export default function AdminHistoricalCoreProjects({
  projects, query = "", sortNewest = true,
}: Props) {
  const [openedId, setOpenedId] = useState<number | null>(null);
  const normalized = query.trim().toLocaleLowerCase("nb-NO");
  const filtered = projects.filter(project =>
    !normalized || [project.project_number, project.title, project.customer_name,
      project.description, String(project.id)].some(value =>
      (value || "").toLocaleLowerCase("nb-NO").includes(normalized)
    )
  ).sort((a, b) => sortNewest ? b.id - a.id : a.id - b.id);
  return <>
    {filtered.map(project => (
      <article key={`core-${project.id}`}
        className="relative isolate flex min-w-0 flex-col gap-3 overflow-hidden rounded-2xl border border-[#955568] bg-[#472333] p-4 text-white shadow-[0_8px_25px_rgba(0,0,0,0.16)] transition-all hover:border-rose-300/60 hover:shadow-[0_12px_32px_rgba(0,0,0,0.22)]">
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-lg bg-slate-950/65 px-2.5 py-1 font-mono text-[11px] font-black text-white">{project.project_number || `Core #${project.id}`}</span>
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-200">Historisk · Core</span>
        </div>
        <div className="flex min-h-[130px] flex-col justify-center gap-2 rounded-xl border border-white/10 bg-gradient-to-br from-[#392036] via-[#302538] to-[#172839] p-4">
          <FolderArchive className="h-9 w-9 text-amber-300/70" aria-hidden="true" />
          <p className="text-xs font-bold text-slate-200">Historisk Taklekkasjevakten-prosjekt</p>
        </div>
        <div className="min-h-[75px]">
          <h3 className="line-clamp-2 text-base font-black">{project.customer_name || "Kunde ikke oppgitt"}</h3>
          <p className="mt-1 line-clamp-3 text-xs text-[#f0d7dd]">{project.title || "Prosjekt uten tittel"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-200"><CheckCircle2 size={13} /> Fullført</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/20 px-2.5 py-1 text-xs text-slate-200"><Building2 size={13} /> Perun Core</span>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-white/20 pt-3 text-xs">
          <div><p className="text-[10px] text-[#dfb9c4]">Hovedstatus (Core)</p><p className="mt-1 font-bold text-emerald-200">Fullført</p></div>
          <div><p className="text-[10px] text-[#dfb9c4]">Fakturert</p><p className="mt-1 font-bold text-slate-300">Ikke kontrollert</p></div>
          <div className="col-span-2"><p className="flex items-center gap-1 text-[10px] text-[#dfb9c4]"><CalendarDays size={12} /> Sluttdato</p><p className="mt-1 font-bold">{dateLabel(project.end_date)}</p></div>
        </div>
        {openedId === project.id && (
          <div className="relative z-10 space-y-2 rounded-xl border border-slate-500/40 bg-[#271723] p-3 text-xs">
            <p className="font-bold">Historisk prosjekt · originaldata fra Core</p>
            <p>Core-prosjekt #{project.id} · Kunde #{project.customer_id ?? "ukjent"}</p>
            <p>Periode: {dateLabel(project.start_date)} – {dateLabel(project.end_date)}</p>
            {project.description && <p className="whitespace-pre-wrap"><ClipboardList size={13} className="mr-1 inline" />{project.description}</p>}
            {project.notes && <p className="whitespace-pre-wrap text-slate-300">Notater: {project.notes}</p>}
            <p className="text-slate-400">Kun lesing. Bilder, dokumenter og fakturastatus er ennå ikke hentet fra Core.</p>
          </div>
        )}
        <button type="button" aria-expanded={openedId === project.id}
          onClick={() => setOpenedId(value => value === project.id ? null : project.id)}
          className="relative z-10 mt-auto flex w-full items-center justify-center gap-2 rounded-xl border border-[#c57490] bg-gradient-to-r from-[#79334e] to-[#61243e] px-3 py-2.5 text-xs font-bold text-white shadow-sm transition hover:border-rose-300 hover:from-[#92405e] hover:to-[#76314f]">
          {openedId === project.id ? "Lukk prosjekt" : "Åpne oppdrag"} <ArrowRight size={14}/>
        </button>
      </article>
    ))}
  </>;
}
