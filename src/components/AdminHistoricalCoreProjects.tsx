import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, CalendarDays, CheckCircle2, ClipboardList, FolderArchive, Image as ImageIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { apiUrl } from "../lib/api";

// Historical Core projects are read-only, and photos are served via an admin-authenticated TLV proxy.
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
type Props = { projects: HistoricalProject[]; query?: string; sortNewest?: boolean };
type Photo = { id: number; caption: string | null; taken_at: string | null };
const dateLabel = (value: string | null) => {
  const match = (value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : "Ikke registrert";
};

function useHistoricalPhotos(projectId: number) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(apiUrl(`/admin_historical_tlv_photos.php?project_id=${projectId}`), {
      credentials: "include", cache: "no-store", signal: controller.signal,
    }).then(async response => {
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.success !== true || !Array.isArray(data.photos)) {
        throw new Error(data?.message || "Kunne ikke hente bildeoversikt.");
      }
      if (!controller.signal.aborted) { setPhotos(data.photos); setError(""); }
    }).catch(err => {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Bilder utilgjengelige.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [projectId]);
  return { photos, error, loading };
}

// Blob URL ensures browser images use the same credentialed auth check as the API.
function CorePhoto({ photoId, alt, className }: { photoId: number; alt: string; className: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let blobUrl: string | null = null;
    setSrc(null); setError(false);
    fetch(apiUrl(`/admin_historical_tlv_photo_file.php?photo_id=${photoId}`), {
      credentials: "include", cache: "no-store", signal: controller.signal,
    }).then(async response => {
      if (!response.ok) throw new Error("Bilde ikke tilgjengelig.");
      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) throw new Error("Ikke et bilde.");
      if (controller.signal.aborted) return;
      blobUrl = URL.createObjectURL(blob);
      setSrc(blobUrl);
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => { controller.abort(); if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [photoId]);
  return src
    ? <img src={src} alt={alt} loading="lazy" className={className}/>
    : <div className="flex h-full min-h-[130px] items-center justify-center bg-[#302538] text-xs text-slate-300">
      {error ? "Bildet kunne ikke åpnes" : "Henter bilde …"}
    </div>;
}

function HistoricalCard({ project }: { project: HistoricalProject }) {
  const [opened, setOpened] = useState(false);
  const [page, setPage] = useState(0);
  const { photos, error, loading } = useHistoricalPhotos(project.id);
  const pageSize = 12;
  const pages = Math.ceil(photos.length / pageSize);
  const visiblePhotos = useMemo(() => photos.slice(page * pageSize, (page + 1) * pageSize), [photos, page]);
  return <article className="relative isolate flex min-w-0 flex-col gap-3 overflow-hidden rounded-2xl border border-[#955568] bg-[#472333] p-4 text-white shadow-[0_8px_25px_rgba(0,0,0,0.16)] transition-all hover:border-rose-300/60 hover:shadow-[0_12px_32px_rgba(0,0,0,0.22)]">
    <div className="flex items-start justify-between gap-2">
      <span className="rounded-lg bg-slate-950/65 px-2.5 py-1 font-mono text-[11px] font-black">{project.project_number || `Core #${project.id}`}</span>
      <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-200">Historisk · Core</span>
    </div>
    <div className="relative h-44 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#392036] via-[#302538] to-[#172839]">
      {photos[0] ? <CorePhoto photoId={photos[0].id} alt={`Bilde fra ${project.title}`} className="h-full w-full object-cover"/> :
        <div className="flex h-full flex-col items-center justify-center gap-2"><FolderArchive size={34} className="text-amber-300/70"/><p className="text-xs text-slate-300">{loading ? "Henter prosjektbilder …" : error || "Ingen bilder registrert"}</p></div>}
      {photos.length > 0 && <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg bg-slate-950/85 px-2 py-1 text-xs font-bold"><ImageIcon size={13}/>{photos.length} bilder</span>}
    </div>
    <div className="min-h-[75px]">
      <h3 className="line-clamp-2 text-base font-black">{project.customer_name || "Kunde ikke oppgitt"}</h3>
      <p className="mt-1 line-clamp-3 text-xs text-[#f0d7dd]">{project.title || "Prosjekt uten tittel"}</p>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-200"><CheckCircle2 size={13}/> Fullført</span>
      <span className="inline-flex items-center gap-1 rounded-full border border-white/20 px-2.5 py-1 text-xs text-slate-200"><Building2 size={13}/> Perun Core</span>
    </div>
    <div className="grid grid-cols-2 gap-3 border-t border-white/20 pt-3 text-xs">
      <div><p className="text-[10px] text-[#dfb9c4]">Hovedstatus (Core)</p><p className="mt-1 font-bold text-emerald-200">Fullført</p></div>
      <div><p className="text-[10px] text-[#dfb9c4]">Fakturert</p><p className="mt-1 font-bold text-slate-300">Ikke kontrollert</p></div>
      <div className="col-span-2"><p className="flex items-center gap-1 text-[10px] text-[#dfb9c4]"><CalendarDays size={12}/> Sluttdato</p><p className="mt-1 font-bold">{dateLabel(project.end_date)}</p></div>
    </div>
    {opened && <div className="relative z-10 space-y-3 rounded-xl border border-slate-500/40 bg-[#271723] p-3 text-xs">
      <p className="font-bold">Historisk prosjekt · originaldata fra Core</p>
      <p>Core-prosjekt #{project.id} · Kunde #{project.customer_id ?? "ukjent"}</p>
      <p>Periode: {dateLabel(project.start_date)} – {dateLabel(project.end_date)}</p>
      {project.description && <p className="whitespace-pre-wrap"><ClipboardList size={13} className="mr-1 inline"/>{project.description}</p>}
      {project.notes && <p className="whitespace-pre-wrap text-slate-300">Notater: {project.notes}</p>}
      <div className="border-t border-white/15 pt-3">
        <p className="mb-2 font-bold">Prosjektbilder ({photos.length})</p>
        {error && <p className="text-amber-300">{error}</p>}
        {photos.length > 0 && <div className="grid grid-cols-2 gap-2">
          {visiblePhotos.map(photo => <div key={photo.id} className="overflow-hidden rounded-lg border border-white/15">
            <div className="h-28"><CorePhoto photoId={photo.id} alt={photo.caption || `Prosjektbilde #${photo.id}`} className="h-full w-full object-contain"/></div>
            {photo.caption && <p className="line-clamp-2 p-2 text-[10px]">{photo.caption}</p>}
          </div>)}
        </div>}
        {pages > 1 && <div className="mt-3 flex items-center justify-between gap-2">
          <button type="button" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="rounded-lg border border-slate-500 px-2 py-1 disabled:opacity-40"><ChevronLeft size={16}/></button>
          <span>Side {page + 1} av {pages}</span>
          <button type="button" onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1} className="rounded-lg border border-slate-500 px-2 py-1 disabled:opacity-40"><ChevronRight size={16}/></button>
        </div>}
      </div>
      <p className="text-slate-400">Bildene leses fra Core med administratorinnlogging. Ingen kopier opprettes.</p>
    </div>}
    <button type="button" aria-expanded={opened} onClick={() => {setOpened(!opened); setPage(0);}}
      className="relative z-10 mt-auto flex w-full items-center justify-center gap-2 rounded-xl border border-[#c57490] bg-gradient-to-r from-[#79334e] to-[#61243e] px-3 py-2.5 text-xs font-bold shadow-sm transition hover:border-rose-300 hover:from-[#92405e] hover:to-[#76314f]">
      {opened ? <X size={14}/> : <ArrowRight size={14}/>}
      {opened ? "Lukk prosjekt" : "Åpne oppdrag"}
    </button>
  </article>;
}

export default function AdminHistoricalCoreProjects({ projects, query = "", sortNewest = true }: Props) {
  const normalized = query.trim().toLocaleLowerCase("nb-NO");
  const filtered = projects.filter(project => !normalized ||
    [project.project_number, project.title, project.customer_name, project.description, String(project.id)]
      .some(value => (value || "").toLocaleLowerCase("nb-NO").includes(normalized))
  ).sort((a, b) => sortNewest ? b.id - a.id : a.id - b.id);
  return <>{filtered.map(project => <HistoricalCard key={project.id} project={project}/>)}</>;
}
