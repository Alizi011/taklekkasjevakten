import { useMemo, useState } from "react";
import { ArrowLeft, Building2, Camera, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, FileText, FolderOpen, Info, X } from "lucide-react";
import { CorePhoto, dateLabel, useHistoricalPhotos, type HistoricalProject } from "../components/AdminHistoricalCoreProjects";

// Reuses the case-detail visual structure. Historical projects are not TLV inquiries.
export default function HistoricalCoreCaseDetail({ project, onBack }: { project: HistoricalProject; onBack: () => void }) {
  const { photos, error, loading } = useHistoricalPhotos(project.id);
  const [tab, setTab] = useState<"overview" | "photos" | "documents">("overview");
  const [rightPanel, setRightPanel] = useState<"process" | "activity">("process");
  const [page, setPage] = useState(0);
  const [photoId, setPhotoId] = useState<number | null>(null);
  const pageSize = 16;
  const totalPages = Math.max(1, Math.ceil(photos.length / pageSize));
  const visiblePhotos = useMemo(() => photos.slice(page * pageSize, (page + 1) * pageSize), [photos, page]);
  const selected = photos.find(p => p.id === photoId);
  const subject = project.title || "Historisk oppdrag";
  const sectionClass = "rounded-2xl border border-slate-700/70 bg-[#171020]";
  const smallLabel = "text-[10px] font-extrabold uppercase tracking-wider text-slate-400";
  return (
    <div className="tlv-admin-theme min-h-screen bg-[radial-gradient(ellipse_at_65%_0%,#41111d_0%,#270b13_45%,#18070d_100%)] px-4 py-5 text-white md:px-7">
      <div className="mx-auto max-w-[1650px] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-slate-800">
            <ArrowLeft size={16}/> Tilbake til oversikt
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-200"><FolderOpen size={15}/> Historisk fra Core</span>
            <span className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200"><CheckCircle2 size={15}/> Fullført</span>
          </div>
        </div>

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(420px,0.9fr)]">
          <div className="min-w-0 space-y-4">
            <section className="overflow-hidden rounded-[24px] border border-cyan-500/20 bg-gradient-to-br from-[#142439] via-[#1b1525] to-[#190d18] shadow-xl">
              <div className="grid gap-6 p-5 lg:grid-cols-[minmax(260px,0.83fr)_minmax(0,1.17fr)] lg:p-6">
                <button type="button" onClick={() => { setTab("photos"); setPage(0); }}
                  className="relative min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-left">
                  <div className="h-72 lg:h-[350px]">
                    {photos[0] ? <CorePhoto photoId={photos[0].id} alt={subject} className="h-full w-full object-cover"/> :
                      <div className="flex h-full items-center justify-center text-xs text-slate-300">{loading ? "Henter prosjektbilder …" : "Ingen bilder registrert"}</div>}
                  </div>
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-lg border border-white/20 bg-slate-950/85 px-3 py-2 text-xs font-bold">
                    <Camera size={14}/> {photos.length} bilder
                  </span>
                </button>
                <div className="min-w-0 space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-200">PROSJEKT {project.project_number || "#" + project.id}</span>
                      <span className="text-xs text-slate-400">Taklekkasjevakten · Historisk</span>
                    </div>
                    <h1 className="mt-4 break-words text-2xl font-black tracking-tight text-white lg:text-3xl">{subject}</h1>
                    <p className="mt-2 text-sm text-slate-200">{project.customer_name || "Kunde ikke oppgitt"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-xs">
                    <div><p className={smallLabel}>Core-prosjekt</p><p className="mt-2 font-bold">#{project.id}</p></div>
                    <div><p className={smallLabel}>Kunde-ID</p><p className="mt-2 font-bold">{project.customer_id ?? "Ukjent"}</p></div>
                    <div><p className={smallLabel}>Startdato</p><p className="mt-2 font-bold">{dateLabel(project.start_date)}</p></div>
                    <div><p className={smallLabel}>Sluttdato</p><p className="mt-2 font-bold">{dateLabel(project.end_date)}</p></div>
                  </div>
                  <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-100">
                    Originalprosjekt fra Perun Core. Ingen digital TLV-avtale eller rapport er opprettet automatisk.
                  </p>
                </div>
              </div>
            </section>

            <section className={sectionClass}>
              <div className="flex flex-wrap gap-1 border-b border-slate-700/70 p-2" role="tablist" aria-label="Saksdetaljer">
                {([
                  ["overview","Oversikt",ClipboardList],
                  ["documents","Dokumenter",FileText],
                  ["photos","Bilder",Camera]
                ] as const).map(([key,label,Icon]) => (
                  <button type="button" key={key} role="tab" aria-selected={tab === key}
                    onClick={() => setTab(key)}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${tab === key ? "bg-cyan-500/15 text-cyan-200" : "text-slate-300 hover:bg-slate-800"}`}>
                    <Icon size={15}/>{label}{key === "photos" ? ` (${photos.length})` : ""}
                  </button>
                ))}
              </div>
              {tab === "overview" && <div className="grid gap-4 p-4 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4">
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-black"><Building2 size={16}/> Kunde og prosjekt</h2>
                  <p className="text-sm font-semibold">{project.customer_name || "Kunde ikke oppgitt"}</p>
                  <p className="mt-2 text-xs text-slate-400">Prosjektnummer: {project.project_number || "Ikke registrert"}</p>
                  <p className="mt-2 break-all text-xs text-slate-400">Kildereferanse: {project.source_reference || "Ikke registrert"}</p>
                </div>
                <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4">
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-black"><CalendarDays size={16}/> Arbeidsperiode</h2>
                  <p className="text-xs text-slate-300">Startet: {dateLabel(project.start_date)}</p>
                  <p className="mt-2 text-xs text-slate-300">Fullført: {dateLabel(project.end_date)}</p>
                  <p className="mt-2 text-xs text-slate-300">Bilder: {loading ? "Henter …" : photos.length}</p>
                </div>
                <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4 lg:col-span-2">
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-black"><ClipboardList size={16}/> Beskrivelse og notater</h2>
                  <p className="whitespace-pre-wrap break-words text-sm text-slate-200">{project.description || "Ingen beskrivelse registrert."}</p>
                  {project.notes && <p className="mt-3 whitespace-pre-wrap break-words border-t border-white/10 pt-3 text-sm text-slate-300">{project.notes}</p>}
                </div>
              </div>}
              {tab === "documents" && <div className="p-5 text-sm text-slate-300">
                <p className="flex items-center gap-2 font-semibold text-white"><Info size={16}/> Historiske dokumenter</p>
                <p className="mt-2 text-xs leading-5">Dokumentoversikten fra Perun Core er ikke koblet til denne visningen ennå. Dokumenter er ikke importert eller slettet.</p>
              </div>}
              {tab === "photos" && <div className="space-y-4 p-4">
                {loading && <p className="text-xs text-slate-300">Henter bilder …</p>}
                {error && <p role="alert" className="text-sm text-amber-300">{error}</p>}
                {!loading && !error && photos.length === 0 && <p className="text-xs text-slate-400">Ingen bilder registrert.</p>}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {visiblePhotos.map(photo => <button key={photo.id} type="button" onClick={() => setPhotoId(photo.id)}
                    className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/50 text-left transition hover:border-cyan-400/60">
                    <div className="h-40"><CorePhoto photoId={photo.id} alt={photo.caption || `Bilde #${photo.id}`} className="h-full w-full object-contain"/></div>
                    <p className="truncate px-2 py-2 text-[11px] text-slate-300">{photo.caption || `Bilde #${photo.id}`}</p>
                  </button>)}
                </div>
                {totalPages > 1 && <div className="flex items-center justify-center gap-4">
                  <button type="button" aria-label="Forrige bildeside" disabled={page === 0} onClick={() => setPage(v => Math.max(0,v-1))} className="rounded-lg border border-slate-600 p-2 disabled:opacity-40"><ChevronLeft size={16}/></button>
                  <span className="text-xs">Side {page + 1} av {totalPages}</span>
                  <button type="button" aria-label="Neste bildeside" disabled={page + 1 >= totalPages} onClick={() => setPage(v=>v+1)} className="rounded-lg border border-slate-600 p-2 disabled:opacity-40"><ChevronRight size={16}/></button>
                </div>}
              </div>}
            </section>
          </div>

          <aside className="min-w-0 rounded-[24px] border border-slate-700/70 bg-[#171020] p-5 lg:p-6">
            <div className="mb-5 grid grid-cols-2 gap-2" role="tablist" aria-label="Saksoversikt">
              <button type="button" role="tab" aria-selected={rightPanel === "process"} onClick={() => setRightPanel("process")}
                className={`min-h-12 rounded-xl border px-3 py-2 text-xs font-bold ${rightPanel === "process" ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-200" : "border-slate-700 text-slate-300"}`}>Saksprosess</button>
              <button type="button" role="tab" aria-selected={rightPanel === "activity"} onClick={() => setRightPanel("activity")}
                className={`min-h-12 rounded-xl border px-3 py-2 text-xs font-bold ${rightPanel === "activity" ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-200" : "border-slate-700 text-slate-300"}`}>Siste aktivitet</button>
            </div>
            {rightPanel === "process" ? <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300">Saksprosess · Historisk</p>
              <h2 className="text-lg font-extrabold">Arbeidet er fullført</h2>
              <p className="text-xs leading-5 text-slate-400">Bekreftet av prosjektstatus i Perun Core. Tidligere tilbud og rapporter kan ikke utledes fra denne statusen.</p>
              <div className="space-y-4 border-t border-white/10 pt-5 text-xs">
                <p className="flex items-center gap-2 text-emerald-300"><CheckCircle2 size={17}/> Fullført i Perun Core</p>
                <div><p className={smallLabel}>Oppstart</p><p className="mt-1 font-semibold">{dateLabel(project.start_date)}</p></div>
                <div><p className={smallLabel}>Ferdigstilt</p><p className="mt-1 font-semibold">{dateLabel(project.end_date)}</p></div>
                <div><p className={smallLabel}>Fakturering</p><p className="mt-1 font-semibold">Ikke kontrollert</p></div>
              </div>
            </div> : <div className="space-y-3 text-xs">
              <h2 className="text-sm font-black">Registrert historikk</h2>
              <p className="text-slate-300">Opprettet: {project.created_at || "Ukjent"}</p>
              <p className="text-slate-300">Sist oppdatert: {project.updated_at || "Ukjent"}</p>
              <p className="text-slate-400">Saksaktiviteter fra TLV finnes ikke automatisk for eldre Core-prosjekter.</p>
            </div>}
          </aside>
        </div>
      </div>
      {selected && <div role="dialog" aria-modal="true" aria-label="Stort prosjektbilde"
        className="fixed inset-0 z-[250] flex flex-col items-center justify-center bg-black/95 p-4">
        <button type="button" aria-label="Lukk bilde" onClick={() => setPhotoId(null)}
          className="absolute right-5 top-5 rounded-full border border-white/30 p-2 text-white"><X size={22}/></button>
        <div className="h-[78vh] w-full max-w-6xl"><CorePhoto photoId={selected.id} alt={selected.caption || "Prosjektbilde"} className="h-full w-full object-contain"/></div>
        {selected.caption && <p className="mt-3 max-w-4xl text-center text-sm text-white">{selected.caption}</p>}
      </div>}
    </div>
  );
}
