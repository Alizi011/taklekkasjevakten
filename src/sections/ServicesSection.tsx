import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import FadeIn from "../components/FadeIn";
import ContactModal from "../components/ContactModal";

interface ServiceItem {
  id: string;
  category: "akutt" | "tak" | "terrasse";
  image: string;
  title: string;
  badge: string;
  shortDesc: string;
  description: string;
  highlights: string[];
}

const services: ServiceItem[] = [
  {
    id: "lekkasjesok",
    category: "akutt",
    image: "/service-lekkasjesok.jpg",
    title: "Lekkasjesøk & Service Tak",
    badge: "Kjernetjeneste",
    shortDesc: "Vårt spesialteam rykker ut, lokaliserer den eksakte lekkasjekilden på takflaten og utfører reparasjon på stedet.",
    description:
      "Drypper det fra taket? Vårt team lokaliserer lekkasjen og utfører det nødvendige arbeidet dersom de tekniske manglene ikke er for store. Perun AS tilbyr lekkasjesøk samt midlertidig tetning på stedet dersom det lar seg utføre.\n\nOm det avdekkes større tekniske mangler ved et lekkasjesøk vil vi fremme et nytt pristilbud med varige utbedringer.",
    highlights: ["Søker kilde fra over- & underside", "Midlertidig tetting på stedet", "Forsikrings- & tilstandsrapport"],
  },
  {
    id: "takkontroll",
    category: "tak",
    image: "/service-takkontroll.jpg",
    title: "Takkontroll og Inspeksjon",
    badge: "Forebyggende",
    shortDesc: "Regelmessig inspeksjon for å opprettholde garantier og forlenge takets levetid.",
    description:
      "Visste du at alle tak, selv ditt burde kontrolleres årlig? Selv et helt nytt tak trenger kontroll for å opprettholde håndverks- og materialgarantier. Regelmessig takkontroll kan forhindre lekkasjer og forlenge takets levetid.\n\nMed profesjonelle takkontroller fra Perun AS kan du sikre at taket ditt er trygt, funksjonelt og lekkasjefritt.",
    highlights: ["Gjennomgang av beslag & sluk", "Opprettholder garantier", "Avdekker slitasje tidlig"],
  },
  {
    id: "vedlikehold",
    category: "tak",
    image: "/service-vedlikehold.jpg",
    title: "Vedlikeholdsavtaler Tak",
    badge: "Langsiktig trygghet",
    shortDesc: "Skreddersydde avtaler med årlig sjekk, takrennevask og utskifting av skadd stein.",
    description:
      "Vedlikehold av taket er en investering i hjemmets langsiktige tekniske helse og verdi. Regelmessige takkontroll med utbytte av skadet takstein, sjekk av takrenner og beslag, samt årlig vask, er kritiske tiltak for et tak.\n\nVi tilbyr skreddersydde vedlikeholdsavtaler, ivareta taket ditt med oss.",
    highlights: ["Vask & rense av takrenner", "Bytte av skadde takstein", "Skreddersydd for eiendommen"],
  },
  {
    id: "flattak",
    category: "tak",
    image: "/service-flatt-tak.jpg",
    title: "Flatt tak & Membran",
    badge: "Spesialistfag",
    shortDesc: "Profesjonell feilsøking, legging og tetting av flate tak med kvalitetssikring av fall.",
    description:
      "Perun AS legger flatt tak uansett størrelse. Flate tak er blitt en mer ordinær løsning i moderne arkitektur.\n\nVed flate tak er taktekkingen samt et fall på minst 2% viktig å ta hensyn til, som sikrer riktig drenering av vann.\n\nNår du velger oss som din tjenesteleverandør får du ikke bare et flatt tak, men et varig resultat. Vi kvalitetssikrer vårt arbeid ved å teste at drenering fungerer slik den skal før overlevering.",
    highlights: ["Sikrer minst 2% fall & drenering", "Testing før overlevering", "Næringsbygg & bolig"],
  },
  {
    id: "terrasse",
    category: "terrasse",
    image: "/service-terrasse.jpg",
    title: "Terrasser / Takterrasser",
    badge: "Uteområde",
    shortDesc: "Tetting av fuktinnsig, membranarbeid og konstruksjonsfeil på terrasser og balkonger.",
    description:
      "Perun AS utbedrer alle typer lekkasjer på takterrasser/ terrasser og balkonger.\n\nVi utbedrer byggefeil, konstruksjon og membran arbeider. Be om en skreddersydd løsning basert på spesifikke situasjoner.\n\nPerun AS sørger for at ditt uteområde blir tett, funksjonelt og estetisk tiltalende.",
    highlights: ["Tetting mot fasade & overganger", "Membran & konstruksjonsfeil", "Varig & estetisk resultat"],
  },
  {
    id: "takfornying",
    category: "tak",
    image: "/service-takfornying.jpg",
    title: "Takfornying",
    badge: "Estetisk & Teknisk",
    shortDesc: "Helhetlig fornying av betongtakstein og metalltak for forlenget levetid.",
    description:
      "Perun AS tilbyr profesjonell takfornying, inkludert grundig teknisk kontroll. Med oss sikrer du at taket ditt blir både estetisk tiltalende og teknisk solid.\n\nVi sørger for at taket ditt ikke bare ser bra ut, men også fungerer optimalt. Vår helhetlige tilnærming sikrer at du får et tak som er både vakkert og solid.\n\nVi fornyer både betong takstein og metalltak.",
    highlights: ["Fornyer betongstein & metall", "Grundig teknisk kontroll", "Forlenger takets levetid"],
  },
];

export default function ServicesSection() {
  const [activeFilter, setActiveFilter] = useState<string>("alle");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const filteredServices = services.filter((s) => {
    if (activeFilter === "alle") return true;
    return s.category === activeFilter;
  });

  return (
    <section id="vart-arbeid" className="py-20 bg-slate-900 text-white relative overflow-hidden">
      {/* Bakgrunn med mørke, moderne lysgløder */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-amber-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <FadeIn>
            <span className="inline-flex items-center px-4 py-1.5 bg-amber-500/20 text-[#F5B800] border border-amber-500/30 text-xs font-bold uppercase tracking-wider rounded-full mb-4 backdrop-blur-md">
              Ingeniørfaglig Ekspertise
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
              Våre Tjenester
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed">
              Utforsk hva vi tilbyr. Klikk på kortene for å lese mer eller bestille fagfolk direkte til ditt tak.
            </p>
          </FadeIn>
        </div>

        {/* INTERAKTIVE FILTER-KNAPPER */}
        <FadeIn delay={0.25}>
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-12">
            {[
              { id: "alle", label: "Alle Tjenester" },
              { id: "akutt", label: "Akutt & Lekkasjesøk" },
              { id: "tak", label: "Tak & Membran" },
              { id: "terrasse", label: "Terrasse & Uteområder" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-5 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all duration-300 ${
                  activeFilter === tab.id
                    ? "bg-[#F5B800] text-gray-950 shadow-lg shadow-amber-500/20 scale-105"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </FadeIn>

        {/* SYMMETRISK GRID (3 like kolonner) */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredServices.map((service) => {
              const isExpanded = expandedId === service.id;

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  key={service.id}
                  className="bg-slate-800/60 border border-slate-700/70 hover:border-amber-500/50 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group backdrop-blur-md"
                >
                  {/* Topp-bilde */}
                  <div className="relative overflow-hidden h-56">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    
                    <span className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md text-[#F5B800] border border-amber-500/30 text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
                      {service.badge}
                    </span>

                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-bold text-white mb-1">
                        {service.title}
                      </h3>
                      <p className="text-slate-300 text-xs line-clamp-2">
                        {service.shortDesc}
                      </p>
                    </div>
                  </div>

                  {/* Innhold & Kulepunkter */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <ul className="grid grid-cols-1 gap-2 mb-4">
                        {service.highlights.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.35, ease: "easeInOut" }}
                            className="overflow-hidden pt-4 mt-3 border-t border-slate-700/60"
                          >
                            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                              {service.description}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Handlingsknapper */}
                    <div className="pt-5 mt-4 border-t border-slate-700/50 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : service.id)}
                        className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {isExpanded ? "Vis mindre" : "Les hele teksten"}
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsContactOpen(true)}
                        className="bg-[#F5B800] hover:bg-[#e0a800] text-gray-950 font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                      >
                        Bestill <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* NEDERSTE BANNER */}
        <FadeIn delay={0.4}>
          <div className="mt-16 bg-gradient-to-r from-amber-500/20 via-slate-800 to-slate-800 border border-amber-500/30 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-1 text-center md:text-left">
              <h4 className="text-xl font-bold text-white">Usikker på hvilken tjeneste du trenger?</h4>
              <p className="text-slate-300 text-xs md:text-sm">
                Velg «Gratis Digital Befaring» eller «Lekkasjesøk» i vårt bestillingsskjema for en rask vurdering.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsContactOpen(true)}
              className="bg-[#F5B800] hover:bg-[#e0a800] text-gray-950 font-extrabold px-6 py-3.5 rounded-2xl text-sm transition-all shadow-lg whitespace-nowrap active:scale-95 cursor-pointer"
            >
              Åpne Bestillingsskjema
            </button>
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