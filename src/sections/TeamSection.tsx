import { Users, PiggyBank, FileText, CheckCircle2, HeartHandshake } from "lucide-react";
import { motion } from "framer-motion";
import FadeIn from "../components/FadeIn";

const teamMembers = [
  {
    image: "/IMG-8606.jpeg", // Nøyaktig slik filen heter i public-mappen
    subtitle: "Norsk Ingeniørkompetanse",
    title: "Ingeniør på kontoret & ledelse",
    description:
      "Norsk ingeniørutdanning og over 20 års erfaring fra norske bygg, standarder og nordisk klima. Sørger for presise analyser, faglige vurderinger og sømløs prosjektoppfølging.",
    highlights: ["Norsk utdannelse", "20+ år erfaring", "Norsk standard"],
  },
  {
    image: "/IMG_7861.jpeg",
    subtitle: "Teknisk Feltanalyse",
    title: "Ingeniør i feltet & feilsøking",
    description:
      "Spesialist på fysisk lekkasjesøk og feilsøking direkte på takflaten. Kombinerer teoretisk ingeniørinnsikt med over 20 års praktisk erfaring på norske tak under krevende værforhold.",
    highlights: ["Feilsøk i felt", "Norsk klima-ekspert", "Ingeniøranalyse"],
  },
  {
    image: "/hero-3.jpg",
    subtitle: "Internasjonal Ekspertise",
    title: "Takspesialist (USA, Australia & Norge)",
    description:
      "Over 20 års erfaring med krevende takkonstruksjoner og taktekking fra USA og Australia. Bringer unike praktiske håndverksløsninger og spisskompetanse direkte inn på ditt tak.",
    highlights: ["20+ år USA & Australia", "Ekte håndverk", "Spesialist-teknikk"],
  },
];

const trustBadges = [
  {
    icon: HeartHandshake,
    title: "Direkte ansvar — Ingen mellomledd",
    desc: "Vi selger aldri oppdrag videre til andre. Perun AS tar direkte ansvar for hele prosessen, slik at du får ekte fagkvalitet, trygghet og verdi i din bolig.",
  },
  {
    icon: PiggyBank,
    title: "Visjon om å bevare",
    desc: "I de tilfellene det er teknisk mulig, tilstreber vi å utbedre framfor å skifte ut taket. Ekte håndverk og ingeniøranalyse framfor uforholdsmessige utskiftninger.",
  },
  {
    icon: FileText,
    title: "Dokumentert rapport",
    desc: "Rapporter med faglig tyngde for forsikringssaker, eierskifte, boligsalg og eiendomstvister utført direkte av våre egne ingeniører.",
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
              Etablert 2016 — Perun AS
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h3 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Vi er teamet du kan stole på
            </h3>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed font-normal">
              Da vi startet Perun AS og tjenesten taklekkasjevakten  var visjonen vår klar: Å tilby <strong>ekte håndverk</strong> i stedet for å bare selge produkter. En stor del av vår suksess er at <strong>Perun AS aldri benytter mellomledd eller selger oppdrag videre</strong>. Vi tar direkte ansvar og utfører alt arbeidet selv. Bak tjenesten står <strong>to norske ingeniører</strong> (én på kontoret og én i feltet) med over 20 års erfaring fra norske forhold, samt en <strong>takspesialist med over 20 års erfaring fra USA og Australia</strong>. Det gir våre kunder ekte varer, trygghet og langvarig verdi i sine boliger og bygg.
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-90 group-hover:opacity-75 transition-opacity" />
                  
                  {/* Badge nede på bildet */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="bg-black/80 text-[#F5B800] border border-amber-500/40 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md">
                      {member.subtitle}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-sm text-[#B45309] font-extrabold mb-2 uppercase tracking-wider">
                      {member.title}
                    </p>
                    <p className="text-gray-600 text-xs md:text-sm leading-relaxed mb-4">
                      {member.description}
                    </p>
                  </div>

                  {/* Highlights list */}
                  <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-1.5">
                    {member.highlights.map((item, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-700 bg-amber-50/80 px-2.5 py-1 rounded-md border border-amber-100"
                      >
                        <CheckCircle2 className="w-3 h-3 text-[#B45309]" />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>

        {/* Trust Badges */}
        <FadeIn delay={0.3}>
          <div className="bg-gradient-to-b from-amber-50/40 via-gray-50 to-white rounded-3xl border border-gray-200 p-8 md:p-10 shadow-sm">
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