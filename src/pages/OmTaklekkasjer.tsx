import { useState } from "react";
import { motion } from "framer-motion";
import {
  CloudLightning,
  Wrench,
  Droplets,
  Clock,
  Building2,
  Search,
  Phone,
  ClipboardList,
  CalendarCheck,
  FileSearch,
  ArrowRight,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import FadeIn from "../components/FadeIn";
import ContactModal from "../components/ContactModal";

const causes = [
  {
    icon: CloudLightning,
    title: "Skader på taktekking & beslag",
    tag: "Ytre Påvirkning",
    description:
      "Stormskader, frost, snø eller fysiske slitasjer kan føre til brudd i takets beskyttende belegg og beslag, noe som åpner veien for vanninnsig.",
  },
  {
    icon: Wrench,
    title: "Feilmontering & byggefeil",
    tag: "Konstruksjon",
    description:
      "Mangelfullt utført håndverk, feil materialvalg eller feilmontert membran skaper svake punkter i takflaten der vann gradvis trenger inn.",
  },
  {
    icon: Droplets,
    title: "Tette takrenner & avløp",
    tag: "Drenering",
    description:
      "Dårlig drenering fører til oppsamling av stående vann, som over tid presser seg gjennom skjøter og inn i bakenforliggende konstruksjon.",
  },
  {
    icon: Clock,
    title: "Materialtretthet & aldring",
    tag: "Slitasje",
    description:
      "Over tid mister takpapp, takstein og tettebånd sine beskyttende egenskaper, noe som gjør taket betydelig mer sårbart for lekkasjer.",
  },
  {
    icon: Building2,
    title: "Skjulte tekniske svikt",
    tag: "Inneklima",
    description:
      "Ulike ventilasjonsfeil, kondensproblemer eller usynlige sprekker i gjennomføringer kan føre til skjulte skader som opdages først sent.",
  },
  {
    icon: Search,
    title: "Manglende periodisk ettersyn",
    tag: "Vedlikehold",
    description:
      "Små feil som ikke oppdages og utbedres i tide, utvikler seg ofte til store og kostbare følgeskader. Regelmessig ettersyn forhindrer dette.",
  },
];

const steps = [
  {
    icon: Phone,
    step: "Steg 01",
    title: "Ta kontakt tidlig",
    description:
      "Ikke vent til nedbøren øker eller skaden blir synlig innvendig. Ved kraftig regnvær oppstår det ofte kø – ved å melde fra tidlig sikrer du rask hjelp.",
  },
  {
    icon: ClipboardList,
    step: "Steg 02",
    title: "Send inn beskrivelse",
    description:
      "Fyll ut vårt skjema med taktype og observasjoner. Du får raskt oversendt klare vilkår, priser og forslag til tidspunkt for lekkasjesøket.",
  },
  {
    icon: CalendarCheck,
    step: "Steg 03",
    title: "Bekreft avtale",
    description:
      "Når du bekrefter tidspunktet, rykker vårt serviceteam ut til avtalt tid med nødvendig utstyr for både søk og eventuell midlertidig tetting.",
  },
  {
    icon: FileSearch,
    step: "Steg 04",
    title: "Søk & Tiltak",
    description:
      "Ingeniøren gjennomfører et fysisk søk, sikrer midlertidig strakstiltak dersom mulig, og leverer en komplett tilstandsrapport med bilder.",
  },
];

export default function OmTaklekkasjer() {
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <div className="bg-[#0b0f17] text-white min-h-screen relative overflow-hidden">
      {/* Bakgrunnsglød */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-10 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <FadeIn>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider rounded-full mb-6 backdrop-blur-md">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              Akutt & Forebyggende Skadebegrensning
            </span>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              Mistenker du en lekkasje? <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#FCD34D] via-[#F5B800] to-[#B45309] bg-clip-text text-transparent">
                Stopp vannet før følgeskadene øker
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
              En ubehandlet taklekkasje kan raskt føre til omfattende fuktskader i bærende konstruksjon. Kontakt våre ingeniører for en presis inspeksjon og umiddelbar avklaring.
            </p>

            <button
              type="button"
              onClick={() => setIsContactOpen(true)}
              className="inline-flex items-center gap-2 bg-[#F5B800] hover:bg-[#e0a800] text-gray-950 font-extrabold px-8 py-4 rounded-2xl text-sm transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              Bestill Lekkasjesøk / Befaring
              <ArrowRight className="w-4 h-4" />
            </button>
          </FadeIn>
        </div>
      </section>

      {/* Årsaker Section */}
      <section className="py-16 px-4 md:px-8 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-500/20 text-[#F5B800] border border-amber-500/30 text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                <AlertTriangle className="w-3.5 h-3.5" /> Vanlige Årsaker
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
                Hvorfor oppstår taklekkasjer?
              </h2>
              <p className="text-slate-400 text-sm md:text-base">
                Oversikt over de hyppigste faktorene som fører til at vann finner veien inn i bygget.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {causes.map((cause, index) => {
              const Icon = cause.icon;
              return (
                <FadeIn key={index} delay={0.08 * index}>
                  <motion.div
                    whileHover={{ y: -6 }}
                    className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-6 transition-all h-full flex flex-col justify-between group backdrop-blur-md shadow-xl"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[#F5B800] group-hover:scale-110 transition-transform">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-md border border-slate-700">
                          {cause.tag}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#F5B800] transition-colors">
                        {cause.title}
                      </h3>
                      <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                        {cause.description}
                      </p>
                    </div>
                  </motion.div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Slik Handler Du (4-Steg) */}
      <section className="py-20 px-4 md:px-8 max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest block mb-2">
              Handlingsplan
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
              Slik går du fram ved en taklekkasje
            </h2>
            <p className="text-slate-400 text-sm">
              Enkel prosess fra første henvendelse til løst oppdrag.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <FadeIn key={index} delay={0.1 * index}>
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative group hover:border-amber-500/40 transition-all h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[#F5B800]">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                        {step.step}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>

        {/* Handlingsknapp i bunnen */}
        <FadeIn delay={0.4}>
          <div className="text-center mt-14">
            <button
              type="button"
              onClick={() => setIsContactOpen(true)}
              className="inline-flex items-center gap-2 bg-[#F5B800] hover:bg-[#e0a800] text-gray-950 font-extrabold px-8 py-4 rounded-2xl text-sm transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              Start Registrering i Bestillingsskjema
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </FadeIn>
      </section>

      {/* Bestillingsskjema Modal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
}