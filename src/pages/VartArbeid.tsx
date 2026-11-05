import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, BookOpen, Sparkles, Layers, ArrowDown, Loader2, MapPin, FileText } from "lucide-react";
import FadeIn from "../components/FadeIn";
import BeforeAfterSlider from "../components/BeforeAfterSlider";
import { apiUrl } from "../lib/api";
interface ProjectImage {
  src: string;
  caption: string;
  stage?: "before" | "during" | "after";
  isCoverBefore?: boolean;
  isCoverAfter?: boolean;
}

interface Project {
  id: number;
  title: string;
  category: string;
  subtitle?: string;
  location?: string;
  description?: string;
  caseText?: string;
  coverImage: string;
  images: ProjectImage[];
}

export default function VartArbeid() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);

  const readerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(apiUrl("/projects.php"))
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.projects)) {
          const formattedProjects: Project[] = data.projects.map((p: any) => {
            let parsedImages: ProjectImage[] = [];

            if (p.images_json) {
              try {
                const raw = typeof p.images_json === "string"
                  ? JSON.parse(p.images_json)
                  : p.images_json;

                if (Array.isArray(raw)) {
                  parsedImages = raw.map((img: any) => {
                    const captionText = typeof img === "object" && img.caption ? img.caption : "";

                    let imgStage: "before" | "during" | "after" = "after";
                    if (typeof img === "object") {
                      if (img.stage) {
                        imgStage = img.stage;
                      } else if (img.is_before) {
                        imgStage = "before";
                      }
                    }

                    return {
                      src: typeof img === "string" ? img : img.url || img.src || "",
                      caption: captionText.toLowerCase().startsWith("bilde ") ? "" : captionText,
                      stage: imgStage,
                      isCoverBefore: typeof img === "object" ? Boolean(img.isCoverBefore) : false,
                      isCoverAfter: typeof img === "object" ? Boolean(img.isCoverAfter) : false,
                    };
                  });
                }
              } catch (e) {
                console.error("Feil ved parsing av bilder:", e);
              }
            }

            if (parsedImages.length === 0 && p.image_url) {
              parsedImages = [
                {
                  src: p.image_url,
                  caption: "",
                  stage: "after",
                },
              ];
            }

            return {
              id: p.id,
              title: p.title,
              category: p.category || "Takreparasjon",
              subtitle: p.description || "Fullført fagutforming",
              location: p.location,
              description: p.description,
              caseText: p.case_text,
              coverImage: p.image_url || (parsedImages[0] ? parsedImages[0].src : "/hero-1.jpg"),
              images: parsedImages,
            };
          });

          setProjects(formattedProjects);

          if (formattedProjects.length > 0) {
            setSelectedProjectIndex(0);
          }
        }
      })
      .catch((err) => console.error("Feil ved henting av prosjekter:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectProject = (index: number) => {
    setSelectedProjectIndex(index);
    setCurrentPage(0);

    setTimeout(() => {
      if (readerRef.current) {
        readerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const activeProject = selectedProjectIndex !== null ? projects[selectedProjectIndex] : null;
  const totalPages = activeProject ? activeProject.images.length : 0;
  const currentImg = activeProject && totalPages > 0 ? activeProject.images[currentPage] : null;

  return (
    <div className="bg-[#0b0f17] text-white min-h-screen py-16 px-4 md:px-8 relative overflow-hidden">
      {/* Bakgrunnsdekorasjon */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">

        {/* HEADER SECTION */}
        <section className="mb-12 text-center max-w-4xl mx-auto">
          <FadeIn>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 text-[#F5B800] border border-amber-500/30 text-xs font-bold uppercase tracking-wider rounded-full mb-4 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              Prosjektarkiv & Dokumentasjon
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#F5B800] tracking-tight mb-4">
              Vårt Arbeid
            </h2>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed">
              Klikk på et prosjekt i biblioteket for å åpne den komplette fotoboken og dokumentasjonen under.
            </p>
          </FadeIn>
        </section>

        {/* PROSJEKT-HYLLE / OVERSIKT ØVERST MED DRA FØR/ETTER I KORTENE */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#F5B800]" /> Prosjektbibliotek
              </h3>
              <p className="text-slate-400 text-xs md:text-sm mt-1">
                Dra i bildene på kortene for Før/Etter-sammenligning, eller klikk for å bla i boken
              </p>
            </div>
            <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
              {projects.length} Prosjekter
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20 text-slate-400 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#F5B800]" />
              <span className="text-sm font-semibold">Henter prosjekter...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-3xl text-slate-500 text-sm">
              Ingen prosjekter er lagt til ennå.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((proj, pIdx) => {
                const isSelected = pIdx === selectedProjectIndex;

                // Sjekk om admin har satt et eksplisitt før- og etterbilde, ellers bruk fallback
                const beforeImg = proj.images.find((img) => img.isCoverBefore) || proj.images.find((img) => img.stage === "before");
                const afterImg = proj.images.find((img) => img.isCoverAfter) || proj.images.find((img) => img.stage === "after");
                const hasBeforeAfter = Boolean(beforeImg && afterImg);

                return (
                  <motion.div
                    key={proj.id}
                    whileHover={{ y: -6 }}
                    className={`bg-slate-900 rounded-2xl overflow-hidden border transition-all duration-300 group flex flex-col justify-between ${
                      isSelected
                        ? "border-[#F5B800] shadow-lg shadow-amber-500/20 ring-2 ring-[#F5B800]/60"
                        : "border-slate-800 hover:border-slate-600 hover:shadow-xl"
                    }`}
                  >
                    {/* Bildevisning på kortet */}
                    <div className="aspect-video relative overflow-hidden bg-slate-950">
                      {hasBeforeAfter && beforeImg && afterImg ? (
                        <div className="w-full h-full">
                          <BeforeAfterSlider
                            beforeSrc={beforeImg.src}
                            afterSrc={afterImg.src}
                            beforeCaption="Før"
                            afterCaption="Etter"
                            isCompact={true}
                          />
                        </div>
                      ) : (
                        <img
                          src={proj.coverImage}
                          alt={proj.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}

                      {/* TAGGER OG SLADDER ER FLYTTET TIL BUNNEN AV BILDET SLIK AT TOPPEN ER HELT REN FOR FØR/ETTER-SKILTING */}
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none z-20">
                        <span className="bg-slate-950/90 backdrop-blur-md text-[#F5B800] text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">
                          {proj.images.length} Bilder
                        </span>

                        {isSelected && (
                          <span className="bg-[#F5B800] text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded shadow-md">
                            Åpnet under
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tekstinnhold på kortet - Klikk her åpner boken */}
                    <div
                      onClick={() => handleSelectProject(pIdx)}
                      className="p-5 flex-1 flex flex-col justify-between cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {proj.category}
                          </span>
                          {proj.location && (
                            <span className="text-[10px] text-amber-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {proj.location}
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-bold text-white group-hover:text-[#F5B800] transition-colors mb-1">
                          {proj.title}
                        </h4>
                        <p className="text-slate-400 text-xs line-clamp-2">
                          {proj.subtitle}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-[#F5B800]">
                        <span>{isSelected ? "Leser bok nå" : "Åpne prosjektbok"}</span>
                        <ArrowDown className={`w-4 h-4 transition-transform ${isSelected ? "translate-y-1" : "group-hover:translate-y-0.5"}`} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* AKTIV PROSJEKTBOK - REN OG RYDDIG VISNING */}
        <div ref={readerRef} className="scroll-mt-28">
          <AnimatePresence mode="wait">
            {activeProject && currentImg ? (
              <motion.div
                key={activeProject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-md relative space-y-6"
              >
                {/* Tittel, Lang beskrivelse & Kontroller ØVERST */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-800">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" /> Prosjektbok: {activeProject.title}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-white">
                      {activeProject.title}
                    </h3>

                    {activeProject.subtitle && (
                      <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-3xl pt-1">
                        {activeProject.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Side-indikator og Bla-knapper */}
                  <div className="flex items-center gap-4 shrink-0 pt-1">
                    <span className="text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                      Side <strong className="text-[#F5B800]">{currentPage + 1}</strong> / {totalPages}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
                        disabled={currentPage === 0}
                        className={`p-2.5 rounded-xl border transition-all ${
                          currentPage === 0
                            ? "opacity-30 border-slate-800 text-slate-600 cursor-not-allowed"
                            : "border-slate-700 bg-slate-800 text-white hover:bg-[#F5B800] hover:text-gray-950 active:scale-95 cursor-pointer"
                        }`}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages - 1))}
                        disabled={currentPage === totalPages - 1}
                        className={`p-2.5 rounded-xl border transition-all ${
                          currentPage === totalPages - 1
                            ? "opacity-30 border-slate-800 text-slate-600 cursor-not-allowed"
                            : "border-slate-700 bg-slate-800 text-white hover:bg-[#F5B800] hover:text-gray-950 active:scale-95 cursor-pointer"
                        }`}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* VISNING: BILDE TIL VENSTRE, SPESIFIKK BILDETEKST TIL HØYRE */}
                <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl overflow-hidden">

                  {/* Bilde med ren status-tag i hjørnet */}
                  <div className="lg:col-span-7 relative h-72 md:h-96 rounded-xl overflow-hidden shadow-md group bg-slate-900">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={currentImg.src}
                        src={currentImg.src}
                        alt={currentImg.caption || activeProject.title}
                        initial={{ opacity: 0, scale: 0.98, x: 10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.98, x: -10 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 absolute inset-0"
                      />
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none z-10" />

                    {/* DISKRET KVALITETS-STEMPEL PÅ BILDET */}
                    <div className="absolute top-4 left-4 z-20 pointer-events-none">
                      {currentImg.stage === "before" && (
                        <span className="bg-amber-500/90 text-slate-950 font-black text-xs uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-md border border-amber-300 flex items-center gap-1.5">
                          ⚠️ Før Utførelse
                        </span>
                      )}
                      {currentImg.stage === "during" && (
                        <span className="bg-blue-600/90 text-white font-black text-xs uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-md border border-blue-400 flex items-center gap-1.5">
                          🛠 Under Arbeid / Produksjon
                        </span>
                      )}
                      {currentImg.stage === "after" && (
                        <span className="bg-emerald-500/90 text-white font-black text-xs uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-md border border-emerald-300 flex items-center gap-1.5">
                          ✓ Sluttresultat
                        </span>
                      )}
                    </div>

                    <span className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md text-[#F5B800] text-[11px] font-bold px-3 py-1 rounded-md border border-amber-500/30 z-20">
                      Bilde {currentPage + 1} av {totalPages}
                    </span>
                  </div>

                  {/* Høyre side: KUN den spesifikke BILDETEKSTEN & Miniatyrbilder */}
                  <div className="lg:col-span-5 flex flex-col justify-between p-2 md:p-4">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${activeProject.id}-${currentPage}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 inline-block">
                          {activeProject.category}
                        </span>

                        <div className="pt-2">
                          {currentImg.caption ? (
                            <h4 className="text-lg md:text-xl font-bold text-white leading-snug">
                              {currentImg.caption}
                            </h4>
                          ) : (
                            <p className="text-slate-400 text-xs italic">
                              Bilde {currentPage + 1} fra prosjektet {activeProject.title}.
                            </p>
                          )}
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    {/* Miniatyrbilde-velger */}
                    {activeProject.images.length > 1 && (
                      <div className="pt-6 border-t border-slate-800/80 mt-4">
                        <p className="text-[11px] font-semibold text-slate-400 mb-2">Sider i dette prosjektet:</p>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {activeProject.images.map((img, thumbIdx) => (
                            <button
                              key={thumbIdx}
                              type="button"
                              onClick={() => setCurrentPage(thumbIdx)}
                              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                                thumbIdx === currentPage
                                  ? "border-[#F5B800] scale-105 shadow-md"
                                  : "border-slate-800 opacity-50 hover:opacity-100"
                              }`}
                            >
                              <img src={img.src} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* MARKEDSFØRENDE CASE-TEKST */}
                {activeProject.caseText && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 space-y-2 text-slate-200">
                    <h4 className="text-xs font-bold text-[#F5B800] uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Ingeniørfaglig Analyse & Case-Historie
                    </h4>
                    <p className="text-xs md:text-sm leading-relaxed whitespace-pre-line font-sans">
                      {activeProject.caseText}
                    </p>
                  </div>
                )}

              </motion.div>
            ) : (
              <div className="text-center py-12 px-6 border border-dashed border-slate-800 rounded-3xl bg-slate-900/40">
                <BookOpen className="w-10 h-10 text-amber-500/50 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">
                  Klikk på et prosjekt i biblioteket over for å åpne fotoboken.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
