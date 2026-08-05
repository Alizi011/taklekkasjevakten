import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, BookOpen, Sparkles, Layers, ArrowDown } from "lucide-react";
import FadeIn from "../components/FadeIn";

const projects = [
  {
    id: "pipehatt",
    title: "Produksjon av Pipehatt",
    category: "Blikkenslager",
    subtitle: "Skreddersydd blikkenslagerarbeid mot fukt og vær",
    coverImage: "/prosjekt-pipe-1.jpg",
    images: [
      { src: "/prosjekt-pipe-1.jpg", caption: "Før: Pipe med utilstrekkelig pipehatt og begynnende slitasje." },
      { src: "/prosjekt-pipe-2.jpg", caption: "Under arbeid: Skreddersydd pipehatt kontrollmåles på taket." },
      { src: "/prosjekt-pipe-3.jpg", caption: "Presisjonsarbeid: Hver vinkel tilpasses individuelt for 100% tetthet." },
      { src: "/prosjekt-pipe-4.jpg", caption: "Klar for montering: Plater beskyttet og klare for siste fase." },
      { src: "/hero-3.jpg", caption: "Sluttresultat: Komplett beskyttet pipe med varig levetid." },
      { src: "/service-flatt-tak.jpg", caption: "Profesjonell godkjent overlevering på stedet." },
    ],
  },
  {
    id: "sinkkupel",
    title: "Utbedring av Sinkkupel",
    category: "Restaurering",
    subtitle: "Antikvarisk utbedring på gul listet bygg",
    coverImage: "/prosjekt-sink-1.jpg",
    images: [
      { src: "/prosjekt-sink-1.jpg", caption: "Før: Skadet og rusten sinkkupel som trengte umiddelbar utbedring." },
      { src: "/prosjekt-sink-2.jpg", caption: "Under arbeid: Ny sinkkupel tilpasses nøye etter byggets krav." },
      { src: "/prosjekt-sink-3.jpg", caption: "Resultat: Ny sinkkupel ferdig montert, forseglet og tett." },
      { src: "/hero-2.jpg", caption: "Sluttkontroll: Ingeniør- og håndverksmessig kvalitetssikring." },
    ],
  },
  // Du kan enkelt legge inn 20-30 nye prosjekter her!
];

export default function VartArbeid() {
  const [selectedProjectIndex, setSelectedProjectIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const readerRef = useRef<HTMLDivElement>(null);

  const handleSelectProject = (index: number) => {
    setSelectedProjectIndex(index);
    setCurrentPage(0);
    
    // Scroller mykt ned til leseren når kunden trykker på et prosjekt
    setTimeout(() => {
      if (readerRef.current) {
        readerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const activeProject = selectedProjectIndex !== null ? projects[selectedProjectIndex] : null;
  const totalPages = activeProject ? activeProject.images.length : 0;
  const currentImg = activeProject ? activeProject.images[currentPage] : null;

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

        {/* PROSJEKT-HYLLE / OVERSIKT ØVERST */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#F5B800]" /> Prosjektbibliotek
              </h3>
              <p className="text-slate-400 text-xs md:text-sm mt-1">
                Velg et prosjekt for å bla i bildedokumentasjonen
              </p>
            </div>
            <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
              {projects.length} Prosjekter
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj, pIdx) => {
              const isSelected = pIdx === selectedProjectIndex;

              return (
                <motion.div
                  key={proj.id}
                  whileHover={{ y: -6 }}
                  onClick={() => handleSelectProject(pIdx)}
                  className={`bg-slate-900 rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer group flex flex-col justify-between ${
                    isSelected
                      ? "border-[#F5B800] shadow-lg shadow-amber-500/20 ring-2 ring-[#F5B800]/60"
                      : "border-slate-800 hover:border-slate-600 hover:shadow-xl"
                  }`}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={proj.coverImage}
                      alt={proj.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                    
                    <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-[#F5B800] text-[10px] font-extrabold px-2.5 py-1 rounded-md border border-amber-500/30">
                      {proj.images.length} Bilder
                    </span>

                    {isSelected && (
                      <span className="absolute top-3 right-3 bg-[#F5B800] text-slate-950 text-[10px] font-extrabold px-2.5 py-1 rounded-md shadow-md">
                        Åpnet under
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                        {proj.category}
                      </span>
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
        </section>

        {/* AKTIV PROSJEKTBOK (3D READER UNDER) */}
        <div ref={readerRef} className="scroll-mt-28">
          <AnimatePresence mode="wait">
            {activeProject && currentImg ? (
              <motion.div
                key={activeProject.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-md relative"
              >
                
                {/* Tittel & Kontroller */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                      <BookOpen className="w-4 h-4" /> Prosjektbok: {activeProject.title}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-white">
                      {activeProject.title}
                    </h3>
                    <p className="text-slate-400 text-xs md:text-sm mt-1">
                      {activeProject.subtitle}
                    </p>
                  </div>

                  {/* Side-indikator og Bla-knapper */}
                  <div className="flex items-center gap-4">
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

                {/* 3D BOK-OPPSLAG / FLIP CONTAINER */}
                <div className="relative min-h-[400px] md:min-h-[480px] flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${selectedProjectIndex}-${currentPage}`}
                      initial={{ rotateY: 90, opacity: 0, scale: 0.95 }}
                      animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                      exit={{ rotateY: -90, opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl overflow-hidden origin-left"
                    >
                      {/* Venstre side: Bilde */}
                      <div className="lg:col-span-7 relative h-72 md:h-96 rounded-xl overflow-hidden shadow-md group">
                        <img
                          src={currentImg.src}
                          alt={currentImg.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none" />
                        <span className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md text-[#F5B800] text-[11px] font-bold px-3 py-1 rounded-md border border-amber-500/30">
                          Bilde {currentPage + 1} av {totalPages}
                        </span>
                      </div>

                      {/* Høyre side: Tekst */}
                      <div className="lg:col-span-5 flex flex-col justify-between p-2 md:p-4">
                        <div className="space-y-4">
                          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 inline-block">
                            {activeProject.category}
                          </span>
                          <h4 className="text-xl font-bold text-white leading-snug">
                            {currentImg.caption}
                          </h4>
                          <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                            Hvert steg kvalitetssikres og dokumenteres for at du som kunde skal få en oversiktlig rapport.
                          </p>
                        </div>

                        {/* Miniatyrbilde-velger */}
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
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

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