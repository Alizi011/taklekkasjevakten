import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Droplets,
  Home,
  Building2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Phone,
  FileCheck,
} from "lucide-react";
import ContactModal from "./ContactModal";

// Step 1: Hvor lekker det?
const locationOptions = [
  { id: "skratak", label: "Skråtak (stein/plater)", desc: "Tradisjonelt skråtak med takstein, plater eller shingel" },
  { id: "flatt", label: "Flatt tak / Terrassedekke", desc: "Papp, folie, asfalt eller betongdekke" },
  { id: "pipe", label: "Pipe / Takvindu / Gjennomføring", desc: "Lekkasje ved beslag, lufterør eller overganger" },
  { id: "usikker", label: "Usikker / Synlig på innervegg", desc: "Ser kun fuktflekker innvendig, ukjent kilde" },
];

// Step 2: Hva er symptomet?
const symptomOptions = [
  { id: "akutt", label: "Det fosser / ruller vann inn", severity: "akutt", desc: "Fare for umiddelbare store materielle skader" },
  { id: "regn", label: "Sildrer / drypper kun når det regner", severity: "ordinar", desc: "Aktiv lekkasje under nedbør" },
  { id: "sno", label: "Drypper ved snøsmelting / tining", severity: "ordinar", desc: "Typisk isgang, kapillærkrefter eller oppdemming" },
  { id: "fukt", label: "Fuktflekker / misfarging i taket", severity: "ordinar", desc: "Langsom fuktvandring eller svellede plater" },
];

// Step 3: Hvilken type bygg?
const buildingOptions = [
  { id: "enebolig", label: "Enebolig / Rekkehus", icon: Home },
  { id: "borettslag", label: "Borettslag / Sameie", icon: Building2 },
  { id: "naering", label: "Næringsbygg / Industribygg", icon: Building2 },
];

export default function LeakCalculator() {
  const [step, setStep] = useState<number>(1);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedSymptom, setSelectedSymptom] = useState<string>("");
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [isContactOpen, setIsContactOpen] = useState<boolean>(false);

  const isAkutt = selectedSymptom === "akutt";

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };


  return (
    <section className="py-20 bg-[#0b0f17] text-white relative overflow-hidden">
      {/* Bakgrunnsdekorasjon */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 md:px-8 relative z-10">
        
        {/* Tittelseksjon */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 text-[#F5B800] border border-amber-500/30 text-xs font-black uppercase tracking-widest rounded-full mb-4 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            Interaktiv Diagnoseveiviser
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            Hva slags lekkasje har du?
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
            Svar på 3 raske spørsmål for å få en umiddelbar faglig anbefaling og estimat for ditt tak.
          </p>
        </div>

        {/* Kalkulator-kort */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          
          {/* Fremdriftslinje */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
              <span>Steg {step} av 3</span>
              <span>{step === 1 ? "Plassering" : step === 2 ? "Symptom" : "Bygningstype"}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 to-[#F5B800]"
                initial={{ width: "33%" }}
                animate={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Steg 1: Plassering */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-white mb-4">1. Hvor på taket mistenker du at kilden ligger?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {locationOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedLocation(opt.id)}
                      className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                        selectedLocation === opt.id
                          ? "bg-amber-500/10 border-[#F5B800] text-white shadow-[0_0_15px_rgba(245,184,0,0.15)]"
                          : "bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div className="font-bold text-sm text-white mb-1 flex items-center justify-between">
                        {opt.label}
                        {selectedLocation === opt.id && <CheckCircle2 className="w-4 h-4 text-[#F5B800]" />}
                      </div>
                      <p className="text-xs text-slate-400">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Steg 2: Symptom */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-white mb-4">2. Hvilket symptom beskriver lekkasjen best?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {symptomOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedSymptom(opt.id)}
                      className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                        selectedSymptom === opt.id
                          ? opt.severity === "akutt"
                            ? "bg-red-950/40 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                            : "bg-amber-500/10 border-[#F5B800] text-white shadow-[0_0_15px_rgba(245,184,0,0.15)]"
                          : "bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div className="font-bold text-sm text-white mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {opt.severity === "akutt" && <Droplets className="w-4 h-4 text-red-400" />}
                          {opt.label}
                        </span>
                        {selectedSymptom === opt.id && (
                          <CheckCircle2 className={`w-4 h-4 ${opt.severity === "akutt" ? "text-red-400" : "text-[#F5B800]"}`} />
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Steg 3: Bygningstype */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-white mb-4">3. Hva slags type bygning gjelder oppdraget?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {buildingOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedBuilding(opt.id)}
                        className={`text-center p-6 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                          selectedBuilding === opt.id
                            ? "bg-amber-500/10 border-[#F5B800] text-white shadow-[0_0_15px_rgba(245,184,0,0.15)]"
                            : "bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <div className={`p-3 rounded-xl ${selectedBuilding === opt.id ? "bg-[#F5B800] text-slate-950" : "bg-slate-800 text-slate-400"}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-sm text-white">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigasjonsknapper */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800/80">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Tilbake
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                type="button"
                disabled={(step === 1 && !selectedLocation) || (step === 2 && !selectedSymptom)}
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#F5B800] hover:bg-[#e0a800] disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-lg"
              >
                Neste steg <ArrowRight className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          {/* Konklusjon & Anbefaling (vises når alle 3 valg er tatt) */}
          {selectedBuilding && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-8 p-6 rounded-2xl border ${
                isAkutt ? "bg-red-950/60 border-red-500/80" : "bg-amber-950/40 border-amber-500/50"
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {isAkutt ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black uppercase text-red-400 bg-red-500/20 px-3 py-1 rounded-full border border-red-500/30">
                        <AlertTriangle className="w-3.5 h-3.5" /> Anbefaling: Døgnåpen Utrykning
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-black uppercase text-[#F5B800] bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
                        <FileCheck className="w-3.5 h-3.5" /> Anbefaling: Ordinært Lekkasjesøk
                      </span>
                    )}
                  </div>

                  <h4 className="text-lg font-extrabold text-white mb-1">
                    {isAkutt ? "Dette krever strakstiltak på stedet!" : "Nødvendig tiltak: Ingeniørfaglig Lekkasjesøk"}
                  </h4>

                  <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                    {isAkutt
                      ? "Vann som fosser inn kan føre til store følgeskader i etasjene under. Ring serviceteamet omgående."
                      : "For å isolere årsaken og unngå unødvendig utskifting av uskadde takflater anbefaler vi et 2-manns lekkasjesøk. Faktureres etter medgått tid (kr 1 960,- eks. mva / t)."}
                  </p>
                </div>

                {/* CTA Knapp */}
                <div className="shrink-0 w-full md:w-auto">
                  {isAkutt ? (
                    <a
                      href="tel:92029090"
                      className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-extrabold px-6 py-3.5 rounded-xl text-xs transition-all shadow-lg text-center"
                    >
                      <Phone className="w-4 h-4" /> Ring Akuttvakt: 92 02 90 90
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsContactOpen(true)}
                      className="w-full md:w-auto bg-[#F5B800] hover:bg-[#e0a800] text-slate-950 font-black px-6 py-3.5 rounded-xl text-xs transition-all shadow-lg cursor-pointer"
                    >
                      Bestill Lekkasjesøk Nå
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </section>
  );
}