import { useState } from "react";
import {
  Building2,
  FileCheck,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import FadeIn from "../components/FadeIn";
import ContactModal from "../components/ContactModal";

const b2bFeatures = [
  {
    icon: FileCheck,
    title: "Tilstandsrapport for Styremøter & Eiere",
    desc: "Grundig skriftlig rapport med bildedokumentasjon og faglige vurderinger. Perfekt som besluttet underlag for styret, generalforsamlingen eller forsikringsselskap.",
  },
  {
    icon: ShieldCheck,
    title: "Uavhengig Rådgivning & Tvistesaker",
    desc: "Vi opptrer som uavhengige ingeniører og fageksperter ved eierskifte, reklamasjoner på tidligere takarbeid eller forsikringsoppgjør.",
  },
  {
    icon: Wrench,
    title: "Direkte Utførelse — Ingen Mellomledd",
    desc: "Perun AS tar direkte ansvar for hele oppdraget. Ingen fordyrende underleverandører eller portalnettverk – dere forholder dere direkte til våre ingeniører.",
  },
  {
    icon: ClipboardList,
    title: "Rammeavtaler & Årlig Taksjekk",
    desc: "Forebyggende ettersyn av flate tak, sluk og beslagsoverganger før vintersesongen for å unngå akutte fuktskader og høye riggkostnader.",
  },
];

export default function B2bSection() {
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <section className="py-20 md:py-28 bg-[#0b0f17] text-white relative overflow-hidden border-t border-slate-800/80">
      {/* Bakgrunnsglød */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[400px] bg-amber-500/10 rounded-full blur-[170px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <FadeIn>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 text-[#F5B800] border border-amber-500/30 text-xs font-black uppercase tracking-widest rounded-full mb-6 backdrop-blur-md">
              <Building2 className="w-3.5 h-3.5" />
              For Borettslag, Sameier & Næringsbygg
            </span>

            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
              Ingeniørfaglig takbistand for <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#FCD34D] via-[#F5B800] to-[#B45309] bg-clip-text text-transparent">
                profesjonelle eiendomsaktører
              </span>
            </h2>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed font-normal">
              Styreledere og eiendomsforvaltere stilles ofte overfor vanskelige avgjørelser når tak begynner å lekke. Vi tilbyr uavhengige fagsøk, presis feilsøking og dokumenterte tilstandsrapporter – slik at dere unngår uforholdsmessig utskifting av hele takflater.
            </p>
          </FadeIn>
        </div>

        {/* B2B Tjenestekort */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-16">
          {b2bFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <FadeIn key={feat.title} delay={idx * 0.1}>
                <div className="h-full bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-6 md:p-8 transition-all duration-300 shadow-xl hover:shadow-[0_10px_30px_rgba(245,184,0,0.1)] flex flex-col justify-between backdrop-blur-xl group">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[#F5B800] flex items-center justify-center mb-6 group-hover:bg-[#F5B800] group-hover:text-slate-950 transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>

                    <h3 className="text-xl font-extrabold text-white mb-3 group-hover:text-[#F5B800] transition-colors">
                      {feat.title}
                    </h3>

                    <p className="text-slate-300 text-xs md:text-sm leading-relaxed mb-6 font-normal">
                      {feat.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs font-bold text-amber-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Perun AS tar direkte ansvar</span>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>

        {/* Rammeavtale & Kontakt Banner */}
        <FadeIn delay={0.3}>
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
              <div className="max-w-2xl text-center lg:text-left">
                <span className="inline-flex items-center text-xs font-bold text-[#F5B800] uppercase tracking-wider mb-2">
                  Skreddersydd for Styret & Forvalter
                </span>
                <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
                  Trenger dere en uavhengig vurdering eller rammeavtale?
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Ta kontakt med våre ingeniører for en uforpliktende prat om taktilstanden i ditt borettslag eller næringsbygg. Vi leverer ryddige dokumenter med 5 års garanti ved varige utbedringer.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={() => setIsContactOpen(true)}
                  className="w-full sm:w-auto bg-[#F5B800] hover:bg-[#e0a800] text-slate-950 font-black px-8 py-4 rounded-2xl text-xs md:text-sm transition-all shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Be om B2B-Vurdering</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </section>
  );
}
