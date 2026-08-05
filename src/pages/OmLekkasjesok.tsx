import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Search,
  Wrench,
  ShieldCheck,
  FileText,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Check,
} from "lucide-react";
import FadeIn from "../components/FadeIn";
import ContactModal from "../components/ContactModal";

const features = [
  {
    icon: Search,
    title: "Presist Lekkasjesøk",
    badge: "100% Fakta",
    highlights: ["Måling over & under tak", "Ingen usikre antakelser", "Kildekartlegging"],
    description:
      "Vi lokaliserer lekkasjen ved hjelp av presise og faglige metoder for å identifisere den eksakte årsaken. Ingen gjetninger – kun dokumenterte funn! All skade blir grundig undersøkt og dokumentert, slik at du får en klar oversikt over problemet og nødvendige tiltak.",
  },
  {
    icon: Wrench,
    title: "Midlertidig Tetting",
    badge: "Strakstiltak",
    highlights: ["Forhindrer følgeskader", "Rask sikring på stedet", "Begrenser vanninnsig"],
    description:
      "Har du en pågående lekkasje? Vi utfører strakstiltak for å begrense videre skade inntil en varig løsning er på plass. Merk: Muligheten for midlertidig tetting avhenger av skadens tekniske årsaker og konstruksjonsoppbygging.",
  },
  {
    icon: ShieldCheck,
    title: "Holdbare Løsninger",
    badge: "Varig Trygghet",
    highlights: ["Målrettet utbedring", "Kostnadseffektivt", "Forlenger levetiden"],
    description:
      "Dersom lekkasjesøket avdekker behov for varig reparasjon, tilbyr vi skreddersydde tiltak. Noen ganger kreves større utbedringer, mens det i andre tilfeller holder med punktreparasjon. Vi velger alltid den mest kostnadseffektive løsningen for ditt tak.",
  },
  {
    icon: FileText,
    title: "Dokumentert Rapport",
    badge: "Godkjent Rapport",
    highlights: ["For forsikringsselskap", "Ved salg av bolig", "Komplett bildelogg"],
    description:
      "Vi dokumenterer hele prosessen med en detaljert rapport og høyoppløselig bildedokumentasjon. Rapporten kan benyttes direkte overfor forsikringsselskap og som verdidokumentasjon ved salg av bolig.",
  },
];

const methodologySteps = [
  { step: "01", title: "Fysisk Befaring", desc: "Ingeniøren klatrer opp og undersøker takflaten direkte." },
  { step: "02", title: "Feilsøking & Kilde", desc: "Manuell inspeksjon fra oversiden og underside av taket." },
  { step: "03", title: "Midlertidig Tetting", desc: "Akutt sikring på stedet hvis de tekniske forholdene tillater det." },
  { step: "04", title: "Sluttrapport", desc: "Du får komplett skriftlig og visuell tilstandsrapport." },
];

export default function OmLekkasjesok() {
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <div className="bg-[#0b0f17] text-white min-h-screen relative overflow-hidden">
      {/* Bakgrunnsglød */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-10 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 md:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 text-[#F5B800] border border-amber-500/30 text-xs font-bold uppercase tracking-wider rounded-full mb-6 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              Ingeniørfaglig Lekkasjesøk
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              Hvordan løser vi din <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#FCD34D] via-[#F5B800] to-[#B45309] bg-clip-text text-transparent">
                taklekkasje presist?
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-4 leading-relaxed font-normal">
              Fakta fremfor gjetning. Vi finner den eksakte kilden til vanninnsiget basert på fysiske og dokumenterte funn.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Main Content (Bilde + Metodikktekst) */}
      <section className="py-12 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Bilde */}
            <div className="lg:col-span-6">
              <FadeIn direction="left">
                <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl group">
                  <img
                    src="/service-lekkasjesok.jpg"
                    alt="Lekkasjesøk på tak"
                    className="w-full h-[450px] object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  
                  <div className="absolute bottom-6 left-6 right-6 bg-slate-950/85 backdrop-blur-md p-4 rounded-2xl border border-slate-800">
                    <span className="text-xs font-bold text-[#F5B800] uppercase tracking-wider block mb-1">
                      Dokumentert analyse
                    </span>
                    <p className="text-xs text-slate-300">
                      Vi klatrer opp på taket for å finne den reelle årsaken. Ingen visuelle antakelser fra bakken.
                    </p>
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Tekstblokk */}
            <div className="lg:col-span-6 space-y-6">
              <FadeIn direction="right" delay={0.2}>
                <h2 className="text-3xl font-bold text-white leading-tight">
                  Dokumentert og presis feilsøking på ditt tak
                </h2>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                  Hos oss er faglig analyse og grundig inspeksjon avgjørende for å identifisere kilden til lekkasjen. Vi jobber ikke ut fra antakelser, og tilbyr ikke gratis befaringer med raske, ubegrunnede konklusjoner om at hele taket må skiftes ut.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                    <h3 className="text-base font-bold text-[#F5B800] mb-1">
                      Grundig metodikk gir trygghet
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Vårt team gjennomfører en systematisk inspeksjon. Vi benytter manuelle metoder og fysisk undersøkelse – enten ved å kontrollere takflaten direkte fra oversiden eller ved å sjekke konstruksjonen fra undersiden.
                    </p>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl">
                    <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Din sikkerhet for riktig utbedring
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Ved å investere i et profesjonelt lekkasjesøk unngår du feilinvesteringer på hundretusener av kroner. Vårt serviceteam har fokus på å stoppe pågående vanninnsig umiddelbart.
                    </p>
                  </div>
                </div>
              </FadeIn>
            </div>

          </div>
        </div>
      </section>

      {/* 4-Stegs Metodikk-Tidslinje */}
      <section className="py-16 px-4 md:px-8 border-y border-slate-800/80 bg-slate-900/40">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold text-amber-500 uppercase tracking-widest block mb-2">
                Steg for steg
              </span>
              <h3 className="text-2xl md:text-4xl font-extrabold text-white">
                Prosessen ved et lekkasjesøk
              </h3>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {methodologySteps.map((m, idx) => (
              <FadeIn key={idx} delay={0.1 * idx}>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative group hover:border-amber-500/40 transition-all h-full flex flex-col justify-between">
                  <div>
                    <span className="text-3xl font-black text-amber-500/40 group-hover:text-[#F5B800] transition-colors block mb-3">
                      {m.step}
                    </span>
                    <h4 className="text-lg font-bold text-white mb-2">{m.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid (Hva du får) */}
      <section className="py-20 px-4 md:px-8 max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-500/20 text-[#F5B800] border border-amber-500/30 text-xs font-bold uppercase tracking-wider rounded-full mb-4">
              <Check className="w-3.5 h-3.5" /> Hva du får
            </span>
            <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Dette får du med Taklekkasjevakten
            </h3>
            <p className="text-slate-300 text-sm md:text-base">
              Vårt erfarne ingeniør- og håndverksteam finner feilen og leverer skreddersydde tiltak.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <FadeIn key={index} delay={0.1 * index}>
                <motion.div
                  whileHover={{ y: -6 }}
                  className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-7 shadow-xl transition-all h-full flex flex-col justify-between backdrop-blur-md group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[#F5B800] shadow-md group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="bg-slate-800 text-[#F5B800] text-[10px] font-extrabold px-3 py-1 rounded-full border border-amber-500/30">
                        {feature.badge}
                      </span>
                    </div>

                    <h4 className="text-xl font-bold text-white mb-3 group-hover:text-[#F5B800] transition-colors">
                      {feature.title}
                    </h4>

                    {/* Hake-punkter */}
                    <ul className="space-y-1.5 mb-4">
                      {feature.highlights.map((h, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>

                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed border-t border-slate-800 pt-4">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              </FadeIn>
            );
          })}
        </div>

        {/* Handlingsknapper nederst */}
        <FadeIn delay={0.4}>
          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setIsContactOpen(true)}
              className="bg-[#F5B800] hover:bg-[#e0a800] text-gray-950 font-extrabold px-8 py-4 rounded-2xl text-sm transition-all shadow-lg active:scale-95 cursor-pointer w-full sm:w-auto text-center"
            >
              Bestill Lekkasjesøk Nå
            </button>
            <Link to="/om-taklekkasjer" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-slate-700 rounded-2xl text-slate-200 font-semibold hover:border-amber-500/50 hover:text-white transition-all w-full text-center"
              >
                Les mer om taklekkasjer
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
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