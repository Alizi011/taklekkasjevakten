import { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import HeroSection from "../sections/HeroSection";
import ValuePropositionSection from "../sections/ValuePropositionSection";
import TeamSection from "../sections/TeamSection";
import LeakCalculator from "../components/LeakCalculator";
import InfoSection from "../sections/InfoSection";
import ProcessSection from "../sections/ProcessSection";
import ServicesSection from "../sections/ServicesSection";
import B2bSection from "../sections/B2bSection";
import ContactSection from "../sections/ContactSection";
import ContactModal from "../components/ContactModal";

export default function Forside() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isLeakGuideOpen, setIsLeakGuideOpen] = useState(false);

  return (
    <>
      {/* 1. Hero */}
      <HeroSection />

      {/* Diagnoseveiviser – kompakt inngang mellom Hero og verdibudskap */}
      <section className="bg-[#0b0f17] border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 md:py-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-amber-500/25 bg-slate-900/70 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h2 className="text-sm md:text-base font-extrabold text-white">
                Usikker på hvor lekkasjen kommer fra?
              </h2>
              <p className="mt-1 text-xs md:text-sm text-slate-400">
                Svar på tre korte spørsmål og få hjelp til å finne riktig vei videre.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsLeakGuideOpen(true)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#F5B800] px-5 py-3 text-xs font-black text-slate-950 transition-all hover:bg-[#e0a800]"
            >
              Start diagnoseveiviser
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Millionbeløp spart (Verdibudskap rett etter Hero) */}
      <ValuePropositionSection onOpenContact={() => setIsContactOpen(true)} />

      {/* 3. Teamet */}
      <TeamSection />

      {/* 4. Informasjon & Prosess */}
      <InfoSection />
      <ProcessSection />

      {/* 5. Tjenester */}
      <ServicesSection />

      {/* 6. Borettslag & Næringsbygg (B2B) */}
      <B2bSection />

      {/* 7. Kontakt-seksjon */}
      <ContactSection />

      {/* Diagnoseveiviser popup */}
      {isLeakGuideOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/80 px-3 py-5 backdrop-blur-sm md:px-6 md:py-8"
          role="dialog"
          aria-modal="true"
          aria-label="Diagnoseveiviser for taklekkasje"
          onClick={() => setIsLeakGuideOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-[#0b0f17] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsLeakGuideOpen(false)}
              className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-slate-700 bg-slate-950/90 text-slate-300 transition hover:border-slate-600 hover:text-white"
              aria-label="Lukk diagnoseveiviser"
            >
              <X className="h-5 w-5" />
            </button>

            <LeakCalculator />
          </div>
        </div>
      )}

      {/* Bestillingsskjema (modal) */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </>
  );
}
