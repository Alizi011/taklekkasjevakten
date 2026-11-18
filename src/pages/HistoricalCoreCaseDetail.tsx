import { useMemo, useState } from "react";
import { ArrowLeft, Building2, CalendarDays, CheckCircle2, FileText, FolderArchive, Image as ImageIcon, ChevronLeft, ChevronRight, X, ClipboardList } from "lucide-react";
import { CorePhoto, dateLabel, useHistoricalPhotos, type HistoricalProject } from "../components/AdminHistoricalCoreProjects";

// Historical case detail resembles TLV InquiryDetail but does not invent a TLV inquiry.
// All original data and photos are read-only from authenticated Core-backed endpoints.
export default function HistoricalCoreCaseDetail({ project, onBack }: { project: HistoricalProject; onBack: () => void }) {
  const { photos, error, loading } = useHistoricalPhotos(project.id);
  const [tab, setTab] = useState<"overview" | "photos">("overview");
  const [page, setPage] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const pageSize = 16;
  const pages = Math.max(1, Math.ceil(photos.length / pageSize));
  const visiblePhotos = useMemo(() => photos.slice(page * pageSize, (page + 1) * pageSize), [photos, page]);
  const chosen = photos.find(p => p.id === selectedPhoto);
  return <div className="tlv-admin-theme min-h-screen bg-[radial-gradient(ellipse_at_65%_0%,#41111d_0%,#270b13_45%,#18070d_100%)] px-4 py-6 text-white md:px-8">
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-[#713b50] bg-[#230e1b] px-4 py-3 text-sm font-bold hover:bg-[#482033]">
          <ArrowLeft size={16}/> Tilbake til fullførte oppdrag
        </button>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-200">Historisk · Perun Core</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-200"><CheckCircle2 size={15}/> Fullført</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <section className="overflow-hidden rounded-2xl border border-[#713b50] bg-[#301624]">
          <div className="grid gap-4 p-4 sm:grid-cols-[minmax(170px,40%)_1fr] sm:p-5">
            <button type="button" onClick={() => { setTab("photos"); setPage(0); }} className="relative h-56 overflow-hidden rounded-xl border border-white/10 bg-slate-900 text-left">
              {photos[0] ? <CorePhoto photoId={photos[0].id} alt="Prosjektbilde" className="h-full w-full object-cover"/> :
                <div className="flex h-full items-center justify-center gap-2 text-slate-300"><FolderArchive size={24}/>{loading ? "Henter bilder …" : "Ingen bilder"}</div>}
              {photos.length > 0 && <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-lg bg-slate-950/80 px-2 py-1 text-xs"><ImageIcon size={14}/>{photos.length} bilder · Vis galleri</span>}
            </button>
            <div className="min-w-0 space-y-3">
              <p className="text-xs font-bold text-cyan-300">CORE-PROSJEKT #{project.id} · {project.project_number || "Uten prosjektnummer"}</p>
              <h1 className="break-words text-2xl font-black tracking-tight md:text-3xl">{project.title || "Historisk oppdrag"}</h1>
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-200"><Building2 size={16}/>{project.customer_name || "Ukjent kunde"}</p>
              <p className="text-xs text-slate-400">Originalprosjekt fra Perun Core · Taklekkasjevakten</p>
            </div>
          </div>
        </section>
        <aside className="rounded-2xl border border-[#713b50] bg-[#2b1421] p-5">
          <h2 className="mb-4 text-sm font-black">Saksprosess · historisk</h2>
          <div className="space-y-4 border-l border-emerald-500/30 pl-4 text-xs">
            <p className="flex items-center gap-2 text-emerald-300"><CheckCircle2 size={16}/> Fullført i Perun Core</p>
            <p><span className="text-slate-400">Startdato</span><span className="mt-1 block font-bold">{dateLabel(project.start_date)}</span></p>
            <p><span className="text-slate-400">Sluttdato</span><span className="mt-1 block font-bold">{dateLabel(project.end_date)}</span></p>
            <p><span className="text-slate-400">Fakturering</span><span className="mt-1 block font-bold">Ikke kontrollert</span></p>
          </div>
          <p className="mt-5 border-t border-white/10 pt-3 text-xs text-slate-400">Historisk visning, uten nye godkjenninger, avtaler eller fiktive saksstatushendelser.</p>
        </aside>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#713b50] bg-[#221320]">
        <div className="flex flex-wrap gap-1 border-b border-[#713b50] p-2" role="tablist" aria-label="Historiske saksdetaljer">
          <button type="button" role="tab" aria-selected={tab === "overview"} onClick={() => setTab("overview")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold ${tab === "overview" ? "bg-[#68344c] text-white" : "text-slate-300 hover:bg-white/5"}`}>
            <ClipboardList size={16}/> Oversikt
          </button>
          <button type="button" role="tab" aria-selected={tab === "photos"} onClick={() => setTab("photos")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold ${tab === "photos" ? "bg-[#68344c] text-white" : "text-slate-300 hover:bg-white/5"}`}>
            <ImageIcon size={16}/> Bilder ({photos.length})
          </button>
        </div>
        {tab === "overview" && <div className="grid gap-4 p-5 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-white/10 bg-[#291725] p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold"><Building2 size={16}/> Prosjektopplysninger</h3>
            <p className="text-xs text-slate-300">Kunde: <strong className="text-white">{project.customer_name || "Ikke registrert"}</strong></p>
            <p className="text-xs text-slate-300">Core-kunde-ID: <strong className="text-white">{project.customer_id ?? "Ikke registrert"}</strong></p>
            <p className="text-xs text-slate-300">Prosjektnummer: <strong className="text-white">{project.project_number || "Ikke registrert"}</strong></p>
            <p className="text-xs text-slate-300">Kilde: <strong className="text-white">{project.source_reference || "Ikke registrert"}</strong></p>
          </div>
          <div className="space-y-3 rounded-xl border border-white/10 bg-[#291725] p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold"><CalendarDays size={16}/> Arbeidsperiode</h3>
            <p className="text-xs text-slate-300">Startdato: <strong className="text-white">{dateLabel(project.start_date)}</strong></p>
            <p className="text-xs text-slate-300">Sluttdato: <strong className="text-white">{dateLabel(project.end_date)}</strong></p>
            <p className="text-xs text-slate-300">Antall bilder: <strong className="text-white">{loading ? "Henter …" : photos.length}</strong></p>
          </div>
          <div className="space-y-3 rounded-xl border border-white/10 bg-[#291725] p-4 lg:col-span-2">
            <h3 className="flex items-center gap-2 text-sm font-bold"><FileText size={16}/> Arbeidsbeskrivelse og notater</h3>
            <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-200">{project.description || "Ingen arbeidsbeskrivelse registrert."}</div>
            {project.notes && <div className="whitespace-pre-wrap break-words border-t border-white/10 pt-3 text-sm text-slate-300">{project.notes}</div>}
          </div>
        </div>}
        {tab === "photos" && <div className="space-y-4 p-5">
          {loading && <p className="text-sm text-slate-300">Henter prosjektbilder …</p>}
          {error && <p role="alert" className="text-sm text-amber-300">{error}</p>}
          {!loading && !error && photos.length === 0 && <p className="text-sm text-slate-300">Ingen prosjektbilder ble funnet.</p>}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {visiblePhotos.map(photo => <button type="button" key={photo.id} onClick={() => setSelectedPhoto(photo.id)}
              className="overflow-hidden rounded-xl border border-white/15 bg-[#291725] text-left hover:border-amber-400">
              <div className="h-40"><CorePhoto photoId={photo.id} alt={photo.caption || `Bilde #${photo.id}`} className="h-full w-full object-contain"/></div>
              <div className="truncate p-2 text-xs text-slate-300">{photo.caption || `Bilde #${photo.id}`}</div>
            </button>)}
          </div>
          {pages > 1 && <div className="flex items-center justify-center gap-4">
            <button type="button" aria-label="Forrige bildeside" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p-1))}
              className="rounded-lg border border-white/20 p-2 disabled:opacity-40"><ChevronLeft size={17}/></button>
            <span className="text-xs">Side {page + 1} av {pages}</span>
            <button type="button" aria-label="Neste bildeside" disabled={page + 1 >= pages} onClick={() => setPage(p => p+1)}
              className="rounded-lg border border-white/20 p-2 disabled:opacity-40"><ChevronRight size={17}/></button>
          </div>}
        </div>}
      </section>
    </div>
    {chosen && <div role="dialog" aria-modal="true" aria-label="Stort prosjektbilde"
      className="fixed inset-0 z-[250] flex flex-col items-center justify-center bg-black/95 p-4">
      <button type="button" aria-label="Lukk bilde" onClick={() => setSelectedPhoto(null)}
        className="absolute right-5 top-5 rounded-full border border-white/30 p-2 text-white"><X size={22}/></button>
      <div className="h-[78vh] w-full max-w-6xl"><CorePhoto photoId={chosen.id} alt={chosen.caption || "Prosjektbilde"} className="h-full w-full object-contain"/></div>
      {chosen.caption && <p className="mt-3 max-w-4xl text-center text-sm text-white">{chosen.caption}</p>}
    </div>}
  </div>;
}
