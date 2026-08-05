import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  ChevronDown,
  Search,
  Phone,
  Sparkles,
  FileText,
  DollarSign,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import FadeIn from "../components/FadeIn";
import ContactModal from "../components/ContactModal";

interface FaqItem {
  id: string;
  category: "sok" | "pris" | "rapport" | "akutt" | "garanti";
  question: string;
  answer: string;
}

const categories = [
  { id: "alle", label: "Alle spørsmål", icon: HelpCircle },
  { id: "sok", label: "Lekkasjesøk & Metode", icon: Search },
  { id: "pris", label: "Pris & Betingelser", icon: DollarSign },
  { id: "garanti", label: "Garanti & Tetning", icon: ShieldCheck },
  { id: "rapport", label: "Rapport & Forsikring", icon: FileText },
  { id: "akutt", label: "Akuttvakt & Responstid", icon: AlertCircle },
];

const faqData: FaqItem[] = [
  {
    id: "1",
    category: "sok",
    question: "Hvordan utfører dere et lekkasjesøk?",
    answer:
      "Vi gjennomfører et fysisk og ingeniørfaglig lekkasjesøk ved å klatre opp på taket og undersøke konstruksjonen direkte fra oversiden og undersiden. Vi bruker faglige målemetoder og fysisk ettersyn for å kartlegge den eksakte kilden til vanninnsiget – helt uten gjetninger.",
  },
  {
    id: "2",
    category: "sok",
    question: "Hvorfor tilbyr dere ikke gratis befaring?",
    answer:
      "En rask, gratis visuell sjekk fra bakken eller takkanten avdekker sjeldent årsaken. Å finne en lekkasje er sjelden 'piece of cake'. Vann kan vandre mange meter internt i takkonstruksjonen, bak undertak og lekter, før det drypper ned. En uforpliktende 'gratis befaring' ender ofte opp med overfladiske gjetninger, feildiagnoser og unødvendig utskiftning av uskadde takflater.",
  },
  {
    id: "3",
    category: "sok",
    question: "Hvorfor er et faglig lekkasjesøk nødvendig fremfor en enkel sjekk?",
    answer:
      "Det er sjelden direkte sammenheng mellom hvor vannet drypper innvendig og hvor det faktiske hullet i taket ligger. En lekkasje påvirkes av mange tekniske faktorer – som kapillærkrefter, dampsperre, luftespalter, beslagsoverganger, gjennomføringer og snø/is-oppbygging. For at du skal få et godt og varig resultat kreves det et fagsøk som isolerer den reelle kilden og avdekker de underliggende tekniske manglene.",
  },
  {
    id: "4",
    category: "sok",
    question: "Hva skjer dersom det viser seg å være en omfattende skade?",
    answer:
      "Vårt primære fokus ved første oppmøte er strakstiltak for å stoppe videre fuktinnsig dersom det er teknisk mulig. Deretter gir vi deg en detaljert rapport med konkrete anbefalinger for varige reparasjoner eller utbedringer.",
  },
  {
    id: "5",
    category: "pris",
    question: "Hva koster et ordinært lekkasjesøk?",
    answer:
      "Lekkasjesøket faktureres etter medgått tid med en timesats på kr 1 960,- eks. mva per påbegynte time for serviceteamet (2 mann), i tillegg til bil/driftstillegg og eventuelle medgåtte materialer for strakstiltak. Tidsbruken varierer fra 1 time til flere timer, helt avhengig av omfanget og de tekniske manglene som avdekkes underveis. Mange kunder antar at de vet hvor feilen ligger, men når fagsøket er fullført viser det seg ofte at lekkasjen skyldes noe helt annet enn først antatt.",
  },
  {
    id: "6",
    category: "pris",
    question: "Blir ikke et fagsøk dyrere enn å be om en gratis sjekk?",
    answer:
      "Nei, tvert imot. Å reparere feil sted basert på en gratis 'gjetning' koster betydelig mer enn å gjøre et grundig søk med en gang. Ved å finne den faktiske kilden med én gang unngår du gjentatte vannskader, ødelagte innervegger og unødvendig utskifting av deler av taket som egentlig er helt fine.",
  },
  {
    id: "7",
    category: "pris",
    question: "Hva koster akutt utrykning?",
    answer:
      "Døgnåpen akutt utrykning (2 mann) faktureres til kr 3 920,- eks. mva per time (+ kr 340,- i bil/driftstillegg). Dette gjelder akutte nødstilfeller på kveld, natt eller helg der vann fosser inn.",
  },
  {
    id: "8",
    category: "garanti",
    question: "Gis det garanti på midlertidige tetninger og utbedringer?",
    answer:
      "Midlertidige tetninger utføres for å stoppe skadeomfanget der og da, og det gis ingen garanti på disse. Noen midlertidige tetninger kan vare i opptil flere år, mens andre varer kortere tid og krever varige utbedringer. Det gis 5 års garanti ved varige utbedringer for arbeid utført av Perun AS. Dette opplyses også tydelig i gitt dokumentasjon når arbeidet utføres.",
  },
  {
    id: "9",
    category: "rapport",
    question: "Kan rapporten brukes overfor min boligforsikring?",
    answer:
      "Ja! Våre tilstandsrapporter inneholder høyoppløselig bildedokumentasjon og faglige vurderinger som er skreddersydd for å oversendes forsikringsselskap ved skadesaker.",
  },
  {
    id: "10",
    category: "rapport",
    question: "Kan rapporten benyttes ved salg av bolig?",
    answer:
      "Ja, absolutt! Dokumtasjonen fungerer som et bevis på takets faktiske tilstand. Dersom det er utført varige utbedringer, følger 5-årsgarantien fra Perun AS selve arbeidet videre til ny kjøper. Dette gir stor trygghet for både selger og kjøper, minsker risikoen for konflikter og eierskifteklager i ettertid, og kan bidra til å øke boligens verdi. En ordinær takstmann gjør sjeldent annet enn en rask visuell sjekk av taket, noe som innebærer skjult risiko for begge parter. En grundig takkontroll med tilstandsrapport sikrer at alt er avdekket og dokumentert før salg.",
  },
  {
    id: "11",
    category: "akutt",
    question: "Når bør jeg benytte akuttvakt i stedet for ordinært skjema?",
    answer:
      "Benytt akuttvakt dersom vann fosser inn og det er fare for umiddelbare store materielle skader. Dersom det kun er merker etter fukt eller små dråper, anbefaler vi å fylle ut kontaktskjemaet for ordinær oppdragstid.",
  },
  {
    id: "12",
    category: "akutt",
    question: "Hvor raskt kan dere rykke ut i Oslo og Akershus?",
    answer:
      "Ved akutte nødstilfeller prioriterer vi utrykning omgående med vårt serviceteam.",
  },
];

export default function Faq() {
  const [openId, setOpenId] = useState<string | null>("2");
  const [activeCategory, setActiveCategory] = useState<string>("alle");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isContactOpen, setIsContactOpen] = useState(false);

  // Filtrering basert på søk og valgt kategori
  const filteredFaqs = faqData.filter((item) => {
    const matchesCategory =
      activeCategory === "alle" || item.category === activeCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleAccordion = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="bg-[#0b0f17] text-white min-h-screen relative overflow-hidden">
      {/* Bakgrunnsglød */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-amber-500/10 rounded-full blur-[170px] pointer-events-none" />

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 md:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 text-[#F5B800] border border-amber-500/30 text-xs font-bold uppercase tracking-wider rounded-full mb-6 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              Svar På Det Du Lurer På
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              Ofte stilte spørsmål om <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#FCD34D] via-[#F5B800] to-[#B45309] bg-clip-text text-transparent">
                taklekkasjer & lekkasjesøk
              </span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
              Få raske og klare svar på prosess, priser, garanti, rapporter og hvorfor ingeniørfaglig lekkasjesøk er helt avgjørende.
            </p>

            {/* Søkestolpe */}
            <div className="relative max-w-xl mx-auto">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Søk etter spørsmål eller tema (f.eks. pris, garanti, gratis befaring)..."
                className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-[#F5B800] text-white placeholder-slate-500 pl-12 pr-4 py-3.5 rounded-2xl text-sm outline-none transition-all shadow-xl backdrop-blur-md"
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Kategori-velger */}
      <section className="py-4 px-4 md:px-8 max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#F5B800] text-slate-950 shadow-[0_0_15px_rgba(245,184,0,0.3)]"
                    : "bg-slate-900/80 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* FAQ Liste (Harmonika) */}
      <section className="py-12 px-4 md:px-8 max-w-4xl mx-auto">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-3xl">
            <HelpCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Ingen treff på søket ditt</h3>
            <p className="text-xs text-slate-400 mb-6">Prøv et annet søkeord eller ta kontakt med oss direkte.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("alle");
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl text-slate-200 cursor-pointer"
            >
              Nullstill søk
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFaqs.map((item, idx) => {
              const isOpen = openId === item.id;
              return (
                <FadeIn key={item.id} delay={0.05 * idx}>
                  <div
                    className={`border rounded-2xl transition-all overflow-hidden ${
                      isOpen
                        ? "bg-slate-900/90 border-amber-500/40 shadow-lg"
                        : "bg-slate-900/50 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleAccordion(item.id)}
                      className="w-full text-left p-5 md:p-6 flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <span className="text-base md:text-lg font-bold text-white leading-snug">
                        {item.question}
                      </span>
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 ${
                          isOpen
                            ? "bg-amber-500/20 text-[#F5B800] rotate-180"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="px-5 pb-6 md:px-6 md:pb-6 text-slate-300 text-sm leading-relaxed border-t border-slate-800/60 pt-4">
                            {item.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        )}
      </section>

      {/* Fant du ikke svar banner */}
      <section className="py-16 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-3xl p-8 md:p-10 text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
              Fant du ikke svaret du leter etter?
            </h3>
            <p className="text-slate-300 text-sm max-w-xl mx-auto mb-8">
              Våre ingeniører og fagfolk står klare til å besvare dine spørsmål direkte eller ta i mot bestilling.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setIsContactOpen(true)}
                className="bg-[#F5B800] hover:bg-[#e0a800] text-slate-950 font-extrabold px-6 py-3.5 rounded-2xl text-xs md:text-sm transition-all shadow-lg active:scale-95 cursor-pointer w-full sm:w-auto"
              >
                Send melding i skjema
              </button>
              <a
                href="tel:92029090"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-slate-700 rounded-2xl text-slate-200 font-bold hover:border-amber-500/50 hover:text-white text-xs md:text-sm transition-all w-full sm:w-auto"
              >
                <Phone className="w-4 h-4 text-[#F5B800]" />
                Ring oss: 92 02 90 90
              </a>
            </div>
          </div>
        </div>
      </section>

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
}