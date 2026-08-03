import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import FadeIn from "../components/FadeIn";

const services = [
  {
    image: "/service-lekkasjesok.jpg",
    title: "Lekkasjesøk & Service Tak",
    description:
      "Drypper det fra taket? Vårt team lokaliserer lekkasjen og utfører det nødvendige arbeidet dersom de tekniske manglene ikke er for store. Perun AS tilbyr lekkasjesøk samt midlertidig tetning på stedet dersom det lar seg utføre på stedet.\n\nOm det avdekkes større tekniske mangler ved et lekkasjesøk vil vi fremme et nytt pristilbud med varige utbedringer.",
  },
  {
    image: "/service-takkontroll.jpg",
    title: "Tak kontroll",
    description:
      "Visste du at alle tak, selv ditt burde kontrolleres årlig? Selv et helt nytt tak trenger kontroll for å opprettholde håndverks- og materialgarantier. Regelmessig takkontroll kan forhindre lekkasjer og forlenge takets levetid.\n\nMed profesjonelle takkontroller fra Perun AS kan du sikre at taket ditt er trygt, funksjonelt og lekkasjefritt.",
  },
  {
    image: "/service-vedlikehold.jpg",
    title: "Vedlikeholdsavtaler Tak",
    description:
      "Vedlikehold av taket er en investering i hjemmets langsiktige tekniske helse og verdi. Regelmessige takkontroll med utbytte av skadet takstein, sjekk av takrenner og beslag, samt årlig vask, er kritiske tiltak for et tak.\n\nVi tilbyr skreddersydde vedlikeholdsavtaler, ivareta taket ditt med oss.",
  },
  {
    image: "/service-flatt-tak.jpg",
    title: "Flatt tak",
    description:
      "Perun AS legger flatt tak uansett størrelse. Flate tak er blitt en mer ordinær løsning i moderne arkitektur.\n\nVed flate tak er taktekkingen samt et fall på minst 2% viktig å ta hensyn til, som sikrer riktig drenering av vann.\n\nNår du velger oss som din tjenesteleverandør får du ikke bare et flatt tak, men et varig resultat. Vi kvalitetssikrer vårt arbeid ved å teste at drenering fungerer slik den skal før overlevering av arbeidet.",
  },
  {
    image: "/service-terrasse.jpg",
    title: "Terrasser / Takterrasser",
    description:
      "Perun AS utbedrer alle typer lekkasjer på takterrasser/ terrasser og balkonger.\n\nVi utbedrer byggefeil, konstruksjon og membran arbeider. Be om en skreddersydd løsning basert på spesifikke situasjoner.\n\nPerun AS sørger for at ditt uteområde blir tett, funksjonelt og estetisk tiltalende.",
  },
  {
    image: "/service-takfornying.jpg",
    title: "Takfornying",
    description:
      "Perun AS tilbyr profesjonell takfornying, inkludert grundig teknisk kontroll. Med oss sikrer du at taket ditt blir både estetisk tiltalende og teknisk solid.\n\nVi sørger for at taket ditt ikke bare ser bra ut, men også fungerer optimalt. Vår helhetlige tilnærming sikrer at du får et tak som er både vakkert og solid.\n\nVi fornyer både betong takstein og metalltak",
  },
];

export default function ServicesSection() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <section id="vart-arbeid" className="section-padding bg-white relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gold-50 rounded-full blur-3xl pointer-events-none" />

      <div className="container-modern relative z-10">
        {/* Section Title */}
        <FadeIn>
          <div className="mb-12">
            <span className="inline-block px-4 py-1.5 bg-gold-100 text-[#B45309] text-sm font-semibold rounded-full mb-4">
              Hva vi tilbyr
            </span>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
              Våre Tjenester
            </h3>
          </div>
        </FadeIn>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <FadeIn key={index} delay={0.08 * index}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-3xl overflow-hidden shadow-soft border border-gray-100 hover:shadow-soft-lg hover:border-gold-200 transition-all group h-full flex flex-col"
              >
                {/* Image */}
                <div className="aspect-video overflow-hidden relative">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-3">
                    {service.title}
                  </h4>

                  <AnimatePresence initial={false}>
                    <motion.div
                      initial={false}
                      animate={{
                        height: expandedIndex === index ? "auto" : 80,
                      }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">
                        {service.description}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  <motion.button
                    onClick={() =>
                      setExpandedIndex(
                        expandedIndex === index ? null : index
                      )
                    }
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-gray-50 hover:bg-gold-50 border border-gray-200 hover:border-gold-300 rounded-xl text-sm font-medium text-gray-700 hover:text-[#B45309] transition-all w-fit"
                  >
                    {expandedIndex === index ? "Vis mindre" : "Les mer"}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        expandedIndex === index ? "rotate-180" : ""
                      }`}
                    />
                  </motion.button>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
