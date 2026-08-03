import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Users,
  ShieldCheck,
  ArrowRight,
  HardHat,
  ClipboardCheck,
} from "lucide-react";
import FadeIn from "../components/FadeIn";

const differentiators = [
  {
    icon: HardHat,
    title: "Ingeniør på taket",
    description:
      "Når vi rykker ut, er det en ingeniør som klatrer opp og utfører selve lekkasjesøket. Dette sikrer at inspeksjonen ikke bare er visuell fra bakken, men en direkte og teknisk vurdering av taket.",
  },
  {
    icon: ClipboardCheck,
    title: "Kvalitetssikring i bakgrunnen",
    description:
      "Samtidig som arbeidet utføres ute, jobber en ingeniør i bakgrunnen med kvalitetssikring og analyse. Dette to-spannet sørger for at du får dokumenterte fakta og løsninger som holder over tid.",
  },
  {
    icon: ShieldCheck,
    title: "Dokumenterte fakta",
    description:
      "Mange lekkasjesøk i bransjen baseres på visuelle antakelser fra bakkeplan. Dette fører ofte til at kunden ender opp med å betale for utbedringer som ikke treffer det reelle problemet. Hos oss får du fakta, ikke gjetning.",
  },
];

const team = [
  {
    image: "/hero-2.jpg",
    title: "Daglig leder & Ingeniør",
    description:
      "Vår daglige leder har over 15 års erfaring innen tak og lekkasjesøk.",
  },
  {
    image: "/hero-1.jpg",
    title: "Team Perun",
    description:
      "Vårt team består av utdannede tømrere, taktekkere, blikkenslagere og ingeniører.",
  },
];

export default function OmOss() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative pt-16 pb-20 px-4 md:px-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gold-50 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <FadeIn>
            <span className="inline-block px-4 py-1.5 bg-gold-100 text-[#B45309] text-sm font-semibold rounded-full mb-4">
              Om Oss
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
              Perun AS er bygget på en visjon: Å fjerne gjetning fra
              takbransjen.
            </h2>
            <p className="text-lg text-gray-500 max-w-3xl mx-auto mb-4 leading-relaxed">
              <strong className="text-gray-700">
                Vår styrke: Ingeniørkompetanse i alle ledd
              </strong>{" "}
              – Som ingeniører er vårt mål å erstatte gjetning med fakta, slik
              at du unngår kostbare feilinvesteringer på taket ditt.
            </p>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Vi så et behov for en tjeneste som kombinerer dyp bygningsteknisk
              forståelse med rask, praktisk utførelse når krisen oppstår.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Vision */}
      <section className="py-16 px-4 md:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 items-center mb-16">
            <FadeIn direction="left">
              <div>
                <span className="inline-block px-4 py-1.5 bg-gold-100 text-[#B45309] text-sm font-semibold rounded-full mb-4">
                  Vår Visjon
                </span>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                  Ledende på taklekkasjer – vi finner årsaken, ikke bare
                  fukten
                </h3>
                <p className="text-xl text-gray-700 font-semibold mb-4">
                  Det trengs mer enn en fuktmåler for å forstå en lekkasje.
                  Vi bruker fagkunnskap.
                </p>
                <p className="text-gray-500 leading-relaxed">
                  Ingen fuktmåler kan erstatte erfaring og ingeniørforståelse.
                  Derfor finner vi feilen – ikke bare fuktigheten. Vår
                  tilnærming sikrer at du får en grundig og dokumentert
                  vurdering hver gang.
                </p>
              </div>
            </FadeIn>

            <FadeIn direction="right" delay={0.2}>
              <div className="rounded-3xl overflow-hidden shadow-soft-lg border border-gray-100">
                <img
                  src="/hero-3.jpg"
                  alt="Perun AS team på taket"
                  className="w-full h-full object-cover"
                />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="py-16 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-gold-100 text-[#B45309] text-sm font-semibold rounded-full mb-4">
                Hva skiller oss ut
              </span>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Slik skiller vi oss ut:
              </h3>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Mange lekkasjesøk i bransjen baseres på visuelle antakelser fra
                bakkeplan. Dette fører ofte til at kunden ender opp med å
                betale for utbedringer som ikke treffer det reelle problemet.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {differentiators.map((item, index) => (
              <FadeIn key={index} delay={0.1 * index}>
                <motion.div
                  whileHover={{ y: -6 }}
                  className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 hover:shadow-soft-lg hover:border-gold-200 transition-all h-full"
                >
                  <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center mb-4 shadow-gold">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3">
                    {item.title}
                  </h4>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 px-4 md:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-gold-100 text-[#B45309] text-sm font-semibold rounded-full mb-4">
                <Users className="w-4 h-4 inline mr-1" />
                Teamet
              </span>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                Møt menneskene bak Perun AS
              </h3>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {team.map((member, index) => (
              <FadeIn key={index} delay={0.1 * index}>
                <motion.div
                  whileHover={{ y: -6 }}
                  className="bg-white rounded-3xl overflow-hidden shadow-soft border border-gray-100 hover:shadow-soft-lg transition-all group"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={member.image}
                      alt={member.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-[#F5B800] font-semibold mb-2">
                      {member.title}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {member.description}
                    </p>
                  </div>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 md:px-8 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <div className="bg-gradient-to-b from-[#FEF3C7] via-[#FDE68A] to-[#F5B800] rounded-3xl border-[3px] border-black p-8 md:p-12">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Klar for å finne lekkasjen?
              </h3>
              <p className="text-gray-700 mb-8">
                Kontakt oss i dag – klikk her for å fylle ut vårt
                kontaktskjema på forsiden.
              </p>
              <Link to="/">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 bg-gray-900 text-white font-bold px-8 py-4 rounded-2xl hover:bg-gray-800 transition-colors"
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
                  Kontakt oss i dag
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
