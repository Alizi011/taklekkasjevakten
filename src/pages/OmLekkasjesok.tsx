import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Search,
  Wrench,
  ShieldCheck,
  FileText,
  ArrowRight,
} from "lucide-react";
import FadeIn from "../components/FadeIn";

const features = [
  {
    icon: Search,
    title: "Presist lekkasjesøk",
    description:
      "Vi lokaliserer lekkasjen ved hjelp av presise og faglige metoder for å identifisere den eksakte årsaken. Ingen gjetninger – kun dokumenterte funn! All skade blir grundig undersøkt og dokumentert, slik at du får en klar oversikt over problemet og nødvendige tiltak.",
  },
  {
    icon: Wrench,
    title: "Midlertidig tetting – Rask skadebegrensning",
    description:
      "Har du en pågående lekkasje? Vi kan utføre strakstiltak for å begrense videre skade inntil en varig løsning er på plass. Viktig: Muligheten for midlertidig tetting avhenger av skadens tekniske årsaker. I noen tilfeller kan skadeomfanget eller konstruksjonsfeil gjøre det utfordrende å utføre en midlertidig løsning.",
  },
  {
    icon: ShieldCheck,
    title: "Holdbare løsninger for et tett tak",
    description:
      "Dersom lekkasjesøket avdekker behov for en varig reparasjon, tilbyr vi målrettede og skreddersydde tiltak for å sikre takets levetid. Noen ganger kreves omfattende reparasjoner, mens det i andre tilfeller holder med mindre utbedringer – dette avgjøres av vår inspeksjon. Vi fokuserer alltid på den mest kostnadseffektive og holdbare løsningen for ditt tak.",
  },
  {
    icon: FileText,
    title: "Dokumentasjon og rapport – Trygghet og oversikt",
    description:
      "Vi dokumenterer hele prosessen med detaljert rapport og bildedokumentasjon, som kan brukes ved videre dialog med forsikringselskap og salg av bolig som dokumentasjon på takets tilstand og at fagarbeid er utført på taket.",
  },
];

export default function OmLekkasjesok() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="pt-16 pb-20 px-4 md:px-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-gold-50 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <FadeIn>
            <span className="inline-block px-4 py-1.5 bg-gold-100 text-[#B45309] text-sm font-semibold rounded-full mb-4">
              Vår Metode
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              Hvordan jobber vi i Taklekkasjevakten for å løse problemet?
            </h2>
            <p className="text-lg text-gray-500 mb-8">
              Presis lekkasjeårsak basert på dokumenterte funn
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Main content */}
      <section className="py-8 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 items-start mb-16">
            {/* Image */}
            <FadeIn direction="left">
              <div className="rounded-3xl overflow-hidden shadow-soft-lg border border-gray-100">
                <img
                  src="/service-lekkasjesok.jpg"
                  alt="Lekkasjesøk"
                  className="w-full h-full object-cover"
                />
              </div>
            </FadeIn>

            {/* Text */}
            <FadeIn direction="right" delay={0.2}>
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Slik løser vi din taklekkasje – Dokumentert og presist
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  Hos oss er faglig analyse og grundig inspeksjon avgjørende for
                  å identifisere kilden til lekkasjen. Vi jobber ikke ut fra
                  antakelser, og vi tilbyr ikke gratis befaringer med raske,
                  ubegrunnede konklusjoner. Feilaktige vurderinger fører ofte
                  til unødvendige kostnader og ineffektive tiltak som ikke løser
                  det reelle problemet.
                </p>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                    Grundig metodikk gir trygghet
                  </h4>
                  <p className="text-gray-500 leading-relaxed">
                    For å sikre en nøyaktig diagnose gjennomfører vårt team en
                    systematisk og metodisk inspeksjon av takets tilstand. Våre
                    lekkasjesøk innebærer at vi faktisk klatrer opp på taket for
                    å undersøke problemområdene direkte. Vi nøyer oss aldri med
                    kun en visuell vurdering fra bakkeplan, da dette sjelden gir
                    hele sannheten om lekkasjens kilde.
                  </p>
                </div>
                <p className="text-gray-500 leading-relaxed">
                  Vi benytter manuelle metoder og fysisk inspeksjon – enten ved
                  å kontrollere taket direkte fra oversiden eller ved å
                  undersøke konstruksjonen fra undersiden. Denne
                  kompromissløse tilnærmingen sikrer at ingen detaljer overses
                  og at vi baserer våre vurderinger på dokumenterte fakta, ikke
                  gjetninger.
                </p>
                <div className="bg-gold-50 rounded-2xl p-6 border border-gold-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                    Din sikkerhet for riktig utbedring
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Ved å investere i et profesjonelt lekkasjesøk får du en
                    kvalitetssikret vurdering basert på faktiske funn. Dette gir
                    deg trygghet for at nødvendige tiltak blir iverksatt på
                    riktig grunnlag, og at du unngår kostbare løsninger basert
                    på spekulasjoner. Vårt serviceteam har fokus på å stoppe
                    den pågående lekkasjen umiddelbart, enten ved en midlertidig
                    sikring eller en varig løsning.
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 md:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-gold-100 text-[#B45309] text-sm font-semibold rounded-full mb-4">
                Hva du får
              </span>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Dette får du med oss:
              </h3>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Vårt erfarne team finner feilen, gir deg en nøyaktig vurdering
                og foreslår de mest effektive løsningene – enten det gjelder
                midlertidig tetting eller permanente utbedringer.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <FadeIn key={index} delay={0.08 * index}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 hover:shadow-soft-lg hover:border-gold-200 transition-all h-full"
                >
                  <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center mb-4 shadow-gold">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h4>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.4}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="gold-gradient text-white font-bold px-8 py-4 rounded-2xl shadow-gold-lg"
                  onClick={() =>
                    setTimeout(
                      () =>
                        document
                          .getElementById("kontakt")
                          ?.scrollIntoView({ behavior: "smooth" }),
                      100
                    )
                  }
                >
                  Fyll ut kontaktskjema
                </motion.button>
              </Link>
              <Link to="/om-taklekkasjer">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-6 py-4 border-2 border-gray-200 rounded-2xl text-gray-700 font-semibold hover:border-[#F5B800] hover:text-[#F5B800] transition-all"
                >
                  Les om taklekkasjer
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
