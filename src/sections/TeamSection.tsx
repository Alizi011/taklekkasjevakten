import { ShieldCheck, Users, PiggyBank, FileText } from "lucide-react";
import { motion } from "framer-motion";
import FadeIn from "../components/FadeIn";

const teamMembers = [
  {
    image: "/IMG-8606.jpeg", // Nøyaktig slik filen heter i public-mappen
    title: "Daglig leder & Ingeniør",
    description:
      "Over 15 års erfaring innen teknisk feilsøking på tak. Kjent for sin nøyaktighet og evne til å finne lekkasjer andre har oversett.",
  },
  {
    image: "/IMG_7861.jpeg",
    title: "Takspesialister",
    description:
      "Vårt dedikerte team utfører oppdrag over hele Oslo og Akershus. Vi kombinerer ingeniørfaglig innsikt med praktisk erfaring på takflaten.",
  },
  {
    image: "/hero-3.jpg",
    title: "Lekkasjesøk-eksperter",
    description:
      "Vi benytter målrettede metoder for å finne den reelle årsaken til lekkasjen. Ingen antakelser — kun fakta og dokumenterte funn.",
  },
];

const trustBadges = [
  {
    icon: PiggyBank,
    title: "Visjon om å bevare",
    desc: "I de tilfellene det er teknisk mulig, tilstreber vi å utbedre framfor å skifte ut taket.",
  },
  {
    icon: ShieldCheck,
    title: "Ingeniørkompetanse",
    desc: "Grundig feilsøking utføres direkte av våre fagfolk uten fordyrende mellomledd.",
  },
  {
    icon: FileText,
    title: "Dokumentert rapport",
    desc: "Rapporter med faglig tyngde for forsikringssaker, eierskifte og eiendomstvister.",
  },
];

export default function TeamSection() {
  return (
    <section className="section-padding bg-white relative overflow-hidden">
      {/* Bakgrunnsdekorasjon med myk pulsering */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 -left-40 w-[400px] h-[400px] bg-gold-50 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-20 -right-40 w-[400px] h-[400px] bg-gold-50 rounded-full blur-3xl pointer-events-none"
      />

      <div className="container-modern relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <FadeIn>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold-100 text-[#B45309] text-sm font-semibold rounded-full mb-4 shadow-sm">
              <Users className="w-4 h-4" />
              Møt Taklekkasjevakten
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Vi er teamet du kan stole på
            </h3>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed">
              I de tilfellene det lar seg gjøre, er vår visjon å bevare taket slik det er. Ved å finne den faktiske årsaken kan man i mange tilfeller unngå uforholdsmessige utskiftninger, ekstra avfall og unødvendige riggkostnader.
            </p>
          </FadeIn>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {teamMembers.map((member, index) => (
            <FadeIn key={index} delay={0.15 * index}>
              <motion.div
                whileHover={{ y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="bg-white rounded-3xl overflow-hidden shadow-soft border border-gray-100 hover:shadow-soft-lg hover:border-gold-200 transition-all group h-full flex flex-col justify-between cursor-pointer"
              >
                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden relative">
                  <motion.img
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    src={member.image}
                    alt={member.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-sm text-[#B45309] font-bold mb-2 uppercase tracking-wider">
                      {member.title}
                    </p>
                    <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                      {member.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>

        {/* Trust Badges */}
        <FadeIn delay={0.3}>
          <div className="bg-gradient-to-b from-amber-50/30 via-gray-50 to-white rounded-3xl border border-gray-200 p-8 md:p-10 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {trustBadges.map((badge, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  transition={{ delay: 0.1 * index, duration: 0.4 }}
                  className="flex items-start gap-4 p-2 rounded-2xl transition-all"
                >
                  <motion.div 
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.4 }}
                    className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center flex-shrink-0 shadow-gold text-white font-bold"
                  >
                    <badge.icon className="w-6 h-6" />
                  </motion.div>
                  <div>
                    <h5 className="font-bold text-gray-900 mb-1 text-base">
                      {badge.title}
                    </h5>
                    <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{badge.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}