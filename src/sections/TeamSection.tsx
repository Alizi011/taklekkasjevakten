import { ShieldCheck, Award, Users } from "lucide-react";
import { motion } from "framer-motion";
import FadeIn from "../components/FadeIn";

const teamMembers = [
  {
    image: "/hero-2.jpg",
    title: "Daglig leder & Ingeniør",
    description:
 "Vår daglige leder har over 15 års erfaring innen tak og lekkasjesøk, og er kjent for sin nøyaktighet og evne til å finne lekkasjer andre ikke finner.",
  },
  {
    image: "/hero-1.jpg",
    title: "Takspecialister",
    description:
      "Vårt dedikerte team klatrer på tak over hele Oslo og Akershus. Vi kombinerer ingeniørkompetanse med praktisk erfaring for å gi deg den beste servicen.",
  },
  {
    image: "/hero-3.jpg",
    title: "Lekkasjesøk-eksperter",
    description:
      "Vi bruker avanserte metoder og verktøy for å finne den eksakte årsaken til lekkasjen. Ingen antakelser — bare fakta og profesjonelle løsninger.",
  },
];

const trustBadges = [
  {
    icon: ShieldCheck,
    title: "Sertifiserte fagfolk",
    desc: "Autoriserte taktekker med dokumentert kompetanse",
  },
  {
    icon: Award,
    title: "15+ års erfaring",
    desc: "Har løst taklekkasjer siden 2009",
  },
  {
    icon: Users,
    title: "2,000+ fornøyde kunder",
    desc: "Privatpersoner, borettslag og næringsbygg",
  },
];

export default function TeamSection() {
  return (
    <section className="section-padding bg-white relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-20 -left-40 w-[400px] h-[400px] bg-gold-50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 -right-40 w-[400px] h-[400px] bg-gold-50 rounded-full blur-3xl pointer-events-none" />

      <div className="container-modern relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <FadeIn>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold-100 text-[#B45309] text-sm font-semibold rounded-full mb-4">
              <Users className="w-4 h-4" />
              Møt Teamet
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Vi er teamet du kan stole på
            </h3>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-gray-500 text-lg">
              Hos Perun AS klatrer vi på taket ditt for å finne lekkasjen. Vi er
              ikke bare fagfolk — vi er naboene dine som vil hjelpe.
            </p>
          </FadeIn>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {teamMembers.map((member, index) => (
            <FadeIn key={index} delay={0.12 * index}>
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-3xl overflow-hidden shadow-soft border border-gray-100 hover:shadow-soft-lg hover:border-gold-200 transition-all group"
              >
                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img
                    src={member.image}
                    alt={member.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-sm text-[#F5B800] font-semibold mb-3">
                    {member.title}
                  </p>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {member.description}
                  </p>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>

        {/* Trust Badges */}
        <FadeIn delay={0.3}>
          <div className="bg-gradient-to-b from-gray-50 to-white rounded-3xl border border-gray-100 p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {trustBadges.map((badge, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 * index, duration: 0.5 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center flex-shrink-0 shadow-gold">
                    <badge.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900 mb-1">
                      {badge.title}
                    </h5>
                    <p className="text-sm text-gray-500">{badge.desc}</p>
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
