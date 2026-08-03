import { Search, FileText, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import FadeIn from "../components/FadeIn";

const steps = [
  {
    number: "1",
    icon: Search,
    title: "Lekkasjesøk & funn av lekkasje årsak",
    description:
      "Vi finner den eksakte årsaken – ingen antakelser, bare fagkunnskap.",
    link: "Om lekkasjesøk - våre metoder",
    href: "#om-lekkasjesok",
  },
  {
    number: "2",
    icon: FileText,
    title: "Rapport & bildedokumentasjon",
    description:
      "Lekkasjesøket dokumenteres med rapport og bildedokumentasjon",
    link: "Om Dokumentasjon",
    href: "#om-dokumentasjon",
  },
  {
    number: "3",
    icon: ShieldCheck,
    title: "Midlertidig eller Varig tiltak",
    description:
      "Basert på funnene fra lekkasjesøket anbefaler vi midlertidige eller permanente tiltak for å stoppe lekkasjen",
    link: "Om midlertidige og varige tiltak",
    href: "#om-tiltak",
  },
];

export default function ProcessSection() {
  return (
    <section id="om-lekkasjesok" className="section-padding bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold-100/20 rounded-full blur-3xl pointer-events-none" />

      <div className="container-modern relative z-10">
        {/* Section Header */}
        <FadeIn>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 bg-gold-100 text-[#B45309] text-sm font-semibold rounded-full mb-4">
              Vår Prosess
            </span>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              3 effektive steg
            </h3>
            <p className="text-gray-500">
              Ingen slurv, ingen bekymringer – bare solid håndverk og fornøyde kunder!
            </p>
          </div>
        </FadeIn>

        {/* Steps Grid with connecting line (desktop) */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connecting line - desktop only */}
          <div className="hidden md:block absolute top-[60px] left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-gold-200 via-[#F5B800] to-gold-200" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <FadeIn key={index} delay={0.15 * index}>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="relative bg-white rounded-3xl p-6 shadow-soft border border-gray-100 hover:shadow-soft-lg hover:border-gold-200 transition-all"
                >
                  {/* Step number badge */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:mb-4">
                    <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-gold mx-auto md:mx-0">
                      <span className="text-xl font-bold text-white">
                        {step.number}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 md:mt-0">
                    <div className="flex items-center gap-2 mb-3">
                      <step.icon className="w-5 h-5 text-[#F5B800]" />
                      <h4 className="text-base font-bold text-gray-900">
                        {step.title}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                      {step.description}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center px-5 py-2.5 bg-gray-900 hover:bg-gray-800 rounded-xl text-sm font-medium text-white transition-colors mb-2"
                    >
                      Les mer
                    </motion.button>
                    <a
                      href={step.href}
                      className="block text-xs text-[#F5B800] hover:text-[#D97706] hover:underline mt-2 transition-colors"
                    >
                      {step.link}
                    </a>
                  </div>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <FadeIn delay={0.4}>
          <p className="text-center text-lg md:text-xl text-gray-500 font-medium max-w-3xl mx-auto mt-16">
            Det beste tidspunktet for å stoppe lekkasjen var i går. Det neste
            beste er nå – før skaden blir større og dyrere enn nødvendig
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
