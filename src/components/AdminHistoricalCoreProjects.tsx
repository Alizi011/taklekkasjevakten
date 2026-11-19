import { useEffect, useState } from "react";
import { ArrowRight, MapPin, Image as ImageIcon } from "lucide-react";
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
type Props = { projects: HistoricalProject[]; query?: string; sortNewest?: boolean; onOpen: (project: HistoricalProject) => void };
export type Photo = { id: number; caption: string | null; taken_at: string | null };
export const dateLabel = (value: string | null) => {
  const match = (value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : "Ikke registrert";
};

export function useHistoricalPhotos(projectId: number) {
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
export function CorePhoto({ photoId, alt, className }: { photoId: number; alt: string; className: string }) {
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

// Property images are separate from field documentation; never use a work photo as the card background.
function CorePropertyBackground({ projectId }: { projectId: number }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | null = null;
    setUrl(null);
    fetch(apiUrl(`/admin_historical_tlv_property_image.php?project_id=${projectId}`), {
      method: "GET", credentials: "include", cache: "no-store", signal: controller.signal,
    }).then(async response => {
      if (!response.ok) throw new Error("Eiendomsbilde ikke tilgjengelig.");
      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) throw new Error("Ugyldig bildeformat.");
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    }).catch(() => {/* missing property view => neutral background, never field photo */});
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [projectId]);
  if (!url) return null;
  return <img src={url} alt="" className="h-full w-full object-cover object-center opacity-75"/>;
}

function HistoricalCard({ project, onOpen }: { project: HistoricalProject; onOpen: () => void }) {
  const { photos, error, loading } = useHistoricalPhotos(project.id);
  return (
    <article className="relative isolate flex min-w-0 flex-col gap-3 overflow-hidden rounded-2xl border border-[#955568] bg-[#472333] p-4 text-white shadow-[0_8px_25px_rgba(0,0,0,0.16)] transition-all hover:border-rose-300/60 hover:shadow-[0_12px_32px_rgba(0,0,0,0.22)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[54%] overflow-hidden rounded-t-2xl" aria-hidden="true">
        <CorePropertyBackground projectId={project.id}/>
        <div className="absolute inset-0 bg-gradient-to-r from-[#331522]/95 via-[#381725]/75 to-[#381725]/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#472333] via-[#472333]/35 to-transparent" />
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.035] to-transparent" aria-hidden="true" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-[#633347] bg-[#1b0a12] px-2 py-1 font-mono text-xs font-black text-[#f6e9ed]">{project.project_number || `Core #${project.id}`}</span>
            <span className="rounded-md border border-amber-500/35 bg-[#432b25]/90 px-2 py-1 text-[9px] font-bold text-amber-200">Historisk · Core</span>
          </div>
          <h4 className="break-words text-sm font-extrabold text-white">{project.customer_name || "Ukjent kunde"}</h4>
          <p className="mt-1 flex items-start gap-1.5 text-[11px] leading-5 text-[#e8cbd4]">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-amber-300" />
            <span>{project.title || "Oppdragsadresse ikke registrert"}</span>
          </p>
          <p className="mt-1 text-[10px] text-[#c5a5b2]">Taklekkasjevakten · Historisk prosjekt</p>
        </div>
        {photos.length > 0 && (
          <button type="button" onClick={onOpen} title="Åpne prosjekt og bilder"
            className="relative z-10 shrink-0 rounded-lg border border-[#714050] bg-[#1e0b13] px-2 py-1.5 text-[10px] text-[#f2dbe2] hover:bg-[#4b2331]">
            <span className="inline-flex items-center gap-1"><ImageIcon size={13}/>{photos.length}</span>
          </button>
        )}
      </div>

      <div className="relative z-10 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-200">Fullført</span>
        <span className="rounded-full border border-slate-400/25 bg-slate-700/30 px-2.5 py-1 text-[10px] font-bold text-slate-200">Perun Core</span>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-[#a16b7b]/60 pt-3 text-xs">
        <div className="min-w-0">
          <div className="mb-1 text-[10px] text-[#c5a5b2]">Hovedstatus (Core)</div>
          <span className="inline-flex rounded-lg border border-emerald-500/35 bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-200">Fullført</span>
        </div>
        <div className="min-w-0">
          <div className="mb-1 text-[10px] text-[#c5a5b2]">Fakturert</div>
          <span className="inline-flex rounded-lg border border-slate-500/50 bg-slate-900/30 px-2 py-1 text-[10px] font-bold text-slate-200">Ikke kontrollert</span>
        </div>
        <div className="col-span-2">
          <div className="mb-1 text-[10px] text-[#c5a5b2]">Dato</div>
          <span className="text-[#ecd4dd]">{dateLabel(project.end_date)}</span>
        </div>
      </div>
      {!photos.length && (loading || error) && (
        <p className="relative z-10 text-[10px] text-[#c5a5b2]">{loading ? "Henter bilder …" : error}</p>
      )}
      <button type="button" onClick={onOpen} className="relative z-10 mt-auto flex w-full items-center justify-center gap-2 rounded-xl border border-[#c57490] bg-gradient-to-r from-[#79334e] to-[#61243e] px-3 py-2.5 text-xs font-bold text-white shadow-sm transition hover:border-rose-300 hover:from-[#92405e] hover:to-[#76314f]">
        Åpne oppdrag <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </article>
  );
}

export default function AdminHistoricalCoreProjects({ projects, query = "", sortNewest = true, onOpen }: Props) {
  const normalized = query.trim().toLocaleLowerCase("nb-NO");
  const filtered = projects.filter(project => !normalized ||
    [project.project_number, project.title, project.customer_name, project.description, String(project.id)]
      .some(value => (value || "").toLocaleLowerCase("nb-NO").includes(normalized))
  ).sort((a, b) => sortNewest ? b.id - a.id : a.id - b.id);
  return <>{filtered.map(project => <HistoricalCard key={project.id} project={project} onOpen={() => onOpen(project)}/>)}</>;
}
