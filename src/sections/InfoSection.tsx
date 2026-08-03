import { Rocket, Wrench, FileCheck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import FadeIn from "../components/FadeIn";

const benefits = [
  {
    icon: Rocket,
    title: "Rask respons",
    description: "Vi er raskt på stedet når du trenger oss",
  },
  {
    icon: Wrench,
    title: "Proff utførelse",
    description: "Kvalitetsarbeid av erfarne fagfolk",
  },
  {
    icon: FileCheck,
    title: "Dokumentert",
    description: "Full rapport med bildedokumentasjon",
  },
];

export default function InfoSection() {
  const scrollToContact = () => {
    document.getElementById("kontakt")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="om-taklekkasjer" className="section-padding bg-white relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      <div className="container-modern">
        {/* CTA Block */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <FadeIn>
            <p className="text-lg text-gray-500 mb-3">
              Slutt å lure på hvor vannet kommer fra.
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-700 mb-8">
              Ta grep før skaden blir større – kontakt oss i dag!
            </h3>
          </FadeIn>

          <FadeIn delay={0.2}>
            <motion.button
              onClick={scrollToContact}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="gold-gradient text-white font-bold text-lg px-10 py-4 rounded-2xl shadow-gold-lg hover:shadow-gold transition-all mb-12"
            >
              Fyll ut Kontaktskjema
            </motion.button>
          </FadeIn>

          <FadeIn delay={0.3}>
            <p className="text-gray-500 leading-relaxed">
              Med ingeniørkompetanse og fysisk inspeksjon på takflaten finner vi
              den reelle årsaken, slik at du slipper kostbare reparasjoner som
              ikke virker.
            </p>
          </FadeIn>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-20">
          {benefits.map((benefit, index) => (
            <FadeIn key={index} delay={0.1 * index}>
              <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 hover:shadow-soft-lg hover:border-gold-200 transition-all text-center group"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gold-100 to-gold-200 flex items-center justify-center group-hover:from-gold-200 group-hover:to-gold-300 transition-all">
                  <benefit.icon className="w-7 h-7 text-[#B45309]" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  {benefit.title}
                </h4>
                <p className="text-sm text-gray-500">{benefit.description}</p>
              </motion.div>
            </FadeIn>
          ))}
        </div>

        {/* About Text */}
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 leading-snug">
              Når taket lekker, er vi løsningen – raskt, effektivt og grundig!
            </h3>
          </FadeIn>

          <FadeIn delay={0.1}>
            <p className="text-gray-500 mb-5 leading-relaxed">
              Ikke overlat taket ditt til gjetning og tomme løfter. Mens andre
              tilbyr gratis befaringer basert på antakelser fra bakkeplan,
              leverer våre ingeniører konkrete vurderinger basert på fysisk
              inspeksjon og metodisk analyse.
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-gray-800 font-semibold mb-6 leading-relaxed">
              Målet vårt er enkelt: Bevare taket der det er mulig og forlenge
              levetiden med presise tiltak ikke unødvendige utskiftninger.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <motion.button
              onClick={scrollToContact}
              whileHover={{ x: 4 }}
              className="inline-flex items-center gap-2 text-[#F5B800] font-semibold hover:text-[#D97706] transition-colors group"
            >
              Velg presisjon fremfor tilfeldigheter. Kontakt oss i dag!
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
