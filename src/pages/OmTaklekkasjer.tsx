import { motion } from "framer-motion";
import { Link } from "react-router-dom";
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
} from "lucide-react";
import FadeIn from "../components/FadeIn";

const causes = [
  {
    icon: CloudLightning,
    title: "Skader på taktekking eller beslag",
    description:
      "Stormskader, frost, snø eller fysiske påvirkninger kan føre til brudd i takets beskyttende lag, som gir vann en vei inn.",
  },
  {
    icon: Wrench,
    title: "Feilmontering eller byggefeil",
    description:
      "Mangelfullt utført arbeid, feil materialvalg eller manglende tetting kan skape svake punkter i taket der vann trenger inn.",
  },
  {
    icon: Droplets,
    title: "Tette takrenner og avløp",
    description:
      "Dårlig drenering kan føre til oppsamling av vann, som over tid trenger inn i konstruksjonen og skaper fuktskader.",
  },
  {
    icon: Clock,
    title: "Slitasje og aldring",
    description:
      "Over tid kan materialer svekkes og miste sin beskyttende funksjon, noe som gjør taket mer utsatt for lekkasjer.",
  },
  {
    icon: Building2,
    title: "Skjulte tekniske feil",
    description:
      "Feil i konstruksjonen, utilstrekkelig ventilasjon eller feilplasserte gjennomføringer kan føre til lekkasjer som utvikler seg gradvis og blir synlige først når skadene er omfattende.",
  },
  {
    icon: Search,
    title: "Manglende vedlikehold",
    description:
      "Små skader som ikke oppdages og utbedres i tide, kan utvikle seg til større lekkasjer. Regelmessig inspeksjon og vedlikehold er derfor avgjørende for å unngå alvorlige skader.",
  },
];

const steps = [
  {
    icon: Phone,
    title: "Ta kontakt så tidlig som mulig!",
    description:
      "Ikke vent til problemet forverrer seg, eller til det meldes store mengder nedbør før du tar kontakt. Ved kraftig regnvær kan mange oppleve lekkasjer samtidig, noe som kan gjøre det utfordrende å tilby rask nok service.",
  },
  {
    icon: ClipboardList,
    title: "1. Fyll ut kontaktskjemaet",
    description:
      "Husk å gi oss informasjon og beskrivelse av situasjonen. Hvilken taktype det gjelder, når lekkasjen ble oppdaget, eventuelle andre observasjoner. Vi svarer deg med våre vilkår, priser og forslag til tidspunkt for lekkasjesøk.",
  },
  {
    icon: CalendarCheck,
    title: "2. Bekreft tidspunkt for lekkasjesøk",
    description:
      "Når vi har sendt deg et forslag til tid, ber vi deg om å bekrefte om tidspunktet passer og akseptere lekkasjesøket. Dette sikrer at vi kan planlegge og prioritere ditt oppdrag så raskt som mulig.",
  },
  {
    icon: FileSearch,
    title: "3. Utførelse av lekkasjesøk og vurdering av tiltak",
    description:
      "Vårt team vil deretter utføre et nøyaktig lekkasjesøk, og vi vil dokumentere problemet med både bilder og tekst og levere en rapport med detaljerte funn. Basert på inspeksjonen vil vi enten utføre en midlertidig løsning for å begrense skadeomfanget eller tilby en varig utbedring for å sikre takets levetid.",
  },
];

export default function OmTaklekkasjer() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative pt-16 pb-20 px-4 md:px-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gold-50 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              Mistenker du en lekkasje? Ikke vent! Stopp lekkasjen før den
              utvikler seg
            </h2>
            <p className="text-xl text-[#F5B800] font-semibold mb-6">
              Ikke vent på følgeskadene.
            </p>
            <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed mb-8">
              En taklekkasje kan raskt føre til omfattende og kostbare skader på
              bygningsmassen. Kontakt oss for en profesjonell inspeksjon nå. Vi
              identifiserer kilden før problemet utvikler seg videre.
            </p>
            <Link
              to="/"
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
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="gold-gradient text-white font-bold px-8 py-4 rounded-2xl shadow-gold-lg"
              >
                Kontakt oss nå
              </motion.button>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Årsaker */}
      <section className="py-16 px-4 md:px-8 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gold-50 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-gold-100 text-[#B45309] text-sm font-semibold rounded-full mb-4">
                Vanlige årsaker
              </span>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                Årsaker til at taklekkasjer oppstår:
              </h3>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {causes.map((cause, index) => (
              <FadeIn key={index} delay={0.08 * index}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 hover:shadow-soft-lg hover:border-gold-200 transition-all h-full"
                >
                  <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center mb-4 shadow-gold">
                    <cause.icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                    {cause.title}
                  </h4>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {cause.description}
                  </p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Slik handler du */}
      <section className="py-16 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-gold-100 text-[#B45309] text-sm font-semibold rounded-full mb-4">
                Steg for steg
              </span>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Slik handler du ved en taklekkasje
              </h3>
              <p className="text-gray-500">
                Oppdaget en lekkasje? Ikke vent – kontakt oss umiddelbart
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <FadeIn key={index} delay={0.1 * index}>
                <motion.div
                  whileHover={{ y: -6 }}
                  className="bg-gradient-to-b from-[#FEF3C7] via-[#FDE68A] to-[#F5B800] rounded-2xl border-[3px] border-black p-6 h-full"
                >
                  <step.icon className="w-8 h-8 text-gray-900 mb-4" />
                  <h4 className="text-base font-bold text-gray-900 mb-3 leading-tight">
                    {step.title}
                  </h4>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.4}>
            <div className="text-center mt-10">
              <Link
                to="/"
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
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 gold-gradient text-white font-bold px-8 py-4 rounded-2xl shadow-gold-lg"
                >
                  Gå til kontaktskjema
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
