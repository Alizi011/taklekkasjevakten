import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  ShieldCheck,
  ArrowRight,
  HardHat,
  ClipboardCheck,
  Sparkles,
  CheckCircle2,
  Building2,
  Award,
  Search,
  Wrench,
  FileSpreadsheet,
} from "lucide-react";
import FadeIn from "../components/FadeIn";
import ContactModal from "../components/ContactModal";

const differentiators = [
  {
    icon: HardHat,
    title: "Ingeniør direkte på taket",
    badge: "Fagkompetanse",
    description:
      "Når vi rykker ut, klatrer en utdannet ingeniør direkte opp på takflaten. Inspeksjonen skjer ikke med kikkert fra bakken, men gjennom en direkte teknisk vurdering der skaden oppstår.",
  },
  {
    icon: ClipboardCheck,
    title: "Dobbel kvalitetssikring",
    badge: "Kvalitet i realtid",
    description:
      "Samtidig som feltingeniøren utfører arbeidet, kvalitetssikres funnene i bakgrunnen mot tekniske normer og bygningsteknisk analyse. Dette to-spannet gir løsninger som varer.",
  },
  {
    icon: ShieldCheck,
    title: "Dokumentert fakta – null gjetning",
    badge: "100% Presisjon",
    description:
      "Mange fuktskader blir midlertidig «flikket på» basert på antakelser. Vi lokaliserer den faktiske rotårsaken til at vannet trenger inn, og gir deg en komplett tilstandsrapport.",
  },
];

const team = [
  {
    image: "/IMG-8606.jpeg",
    name: "Daglig leder & Ingeniør",
    role: "Feilsøking & Teknisk Analyse",
    description:
      "Over 15 års erfaring innen teknisk feilsøking på tak og konstruksjon. Ekspert på å oppdage usynlige lekkasjeveier i kompliserte oppbygginger.",
  },
  {
    image: "/IMG_7861.jpeg",
    name: "Spesialistteam Perun AS",
    role: "Tømrere, Taktekkere & Blikkenslagere",
    description:
      "Vårt tverrfaglige team kombinerer ingeniørfaglig presisjon med kompromissløst håndverk ute på takflaten.",
  },
];

const processSteps = [
  {
    icon: Search,
    step: "01",
    title: "Teknisk Diagnose",
    desc: "Grundig søk på og under taket for å finne kilden, ikke bare fukten.",
  },
  {
    icon: FileSpreadsheet,
    step: "02",
    title: "Dokumentert Rapport",
    desc: "Du får en fullstendig tilstandsrapport godkjent for forsikring og eierskifte.",
  },
  {
    icon: Wrench,
    step: "03",
    title: "Varig Utbedring",
    desc: "Skreddersydd reparasjon utført av faglærte håndverkere og ingeniører.",
  },
];

export default function OmOss() {
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <div className="bg-[#0b0f17] text-white min-h-screen relative overflow-hidden">
      {/* Bakgrunnsglød */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-10 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 md:px-8">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <FadeIn>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 text-[#F5B800] border border-amber-500/30 text-xs font-bold uppercase tracking-wider rounded-full mb-6 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              Ingeniørkompetanse på taket
            </span>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              Vi fjerner gjetning fra <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#FCD34D] via-[#F5B800] to-[#B45309] bg-clip-text text-transparent">
                tak- og lekkasjebransjen
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-8 leading-relaxed font-normal">
              <strong className="text-white font-semibold">
                Perun AS ble bygget på én klar visjon:
              </strong>{" "}
              Når en lekkasje oppstår, trenger du fakta – ikke kostbare antakelser. Vi kombinerer dyp bygningsteknisk ingeniørinnsikt med umiddelbar, praktisk utførelse.
            </p>
          </FadeIn>

          {/* Verdi-fokus: Millionbesparelser */}
          <FadeIn delay={0.3}>
            <div className="max-w-3xl mx-auto mt-12 pt-8 border-t border-slate-800/80">
              <div className="bg-gradient-to-r from-[#F5B800]/10 via-slate-900 to-[#F5B800]/10 border border-[#F5B800]/30 rounded-3xl p-6 md:p-8 backdrop-blur-md text-center shadow-xl">
                <span className="text-3xl md:text-5xl font-black text-[#F5B800] block mb-2">
                  Millionbeløp spart
                </span>
                <h3 className="text-lg md:text-xl font-bold text-white mb-3">
                  Vi kamuflerer ikke salg som "gratis befaring"
                </h3>
                <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-2xl mx-auto">
                  Mange i bransjen står på bakkeplan, gjør en rask visuell sjekk og konkluderer med at hele taket må skiftes ut. 
                  Våre ingeniører klatrer opp, finner den reelle årsaken og utbedrer feilen der det er mulig – noe som har spart kundene våre for enorme beløp.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Visjon & Hvorfor Perun AS */}
      <section className="py-20 px-4 md:px-8 bg-slate-900/60 border-y border-slate-800/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <FadeIn direction="left">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-amber-500/10 text-[#F5B800] border border-amber-500/20 text-xs font-bold uppercase tracking-wider rounded-md">
                  <Building2 className="w-3.5 h-3.5" /> Vår Filosofi
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mt-2">
                  Vi finner kilden til lekkasjen – ikke bare fukten
                </h2>
                <p className="text-slate-300 text-base md:text-lg leading-relaxed font-medium">
                  Det trengs mer enn en enkel fuktmåler for å forstå en usynlig taklekkasje.
                </p>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Ingen fuktmåler i verden kan erstatte erfaring og ingeniørforståelse for hvordan vann beveger seg i lukket konstruksjon. Vår tilnærming sikrer at du får en grundig, dokumentert vurdering og en løsning som faktisk løser problemet en gang for alle.
                </p>

                <div className="pt-2 space-y-3">
                  {[
                    "Tverrfaglig team av ingeniører, tømrere og blikkenslagere",
                    "Rapporter med faglig tyngde for forsikring og eierskifte",
                    "Visjon om å utbedre og bevare eksisterende tak der det er mulig",
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs md:text-sm text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </FadeIn>
            </div>

            <div className="lg:col-span-6">
              <FadeIn direction="right" delay={0.2}>
                <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl group">
                  <img
                    src="/hero-3.jpg"
                    alt="Perun AS team på taket"
                    className="w-full h-[420px] object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  
                  <div className="absolute bottom-6 left-6 right-6 bg-slate-950/85 backdrop-blur-md p-4 rounded-2xl border border-slate-800">
                    <span className="text-xs font-bold text-[#F5B800] uppercase tracking-wider block mb-1">
                      Kvalitetssikring på stedet
                    </span>
                    <p className="text-xs text-slate-300">
                      Ingeniøren vurderer oppbygning, sluk, beslag og overganger direkte på takflaten.
                    </p>
                  </div>
                </div>
              </FadeIn>
            </div>

          </div>
        </div>
      </section>

      {/* Prosesslinje */}
      <section className="py-20 px-4 md:px-8 max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest block mb-2">
              Metodikk
            </span>
            <h3 className="text-2xl md:text-4xl font-extrabold text-white">
              Slik jobber Perun AS
            </h3>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {processSteps.map((p, idx) => {
            const Icon = p.icon;
            return (
              <FadeIn key={idx} delay={0.1 * idx}>
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative group hover:border-amber-500/40 transition-all h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[#F5B800]">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-3xl font-black text-slate-800 group-hover:text-amber-500/30 transition-colors">
                        {p.step}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">{p.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* Differentiators */}
      <section className="py-20 px-4 md:px-8 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-500/20 text-[#F5B800] border border-amber-500/30 text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                <Award className="w-3.5 h-3.5" /> Hvorfor velge oss
              </span>
              <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                Slik skiller Perun AS seg ut i bransjen
              </h3>
              <p className="text-slate-300 text-sm md:text-base">
                Unngå å betale for dyre feilinvesteringer basert på rask gjetning.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {differentiators.map((item, index) => (
              <FadeIn key={index} delay={0.1 * index}>
                <motion.div
                  whileHover={{ y: -6 }}
                  className="bg-slate-900/90 rounded-3xl p-7 border border-slate-800 hover:border-amber-500/40 shadow-xl transition-all h-full flex flex-col justify-between backdrop-blur-md group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[#F5B800] shadow-md group-hover:scale-110 transition-transform">
                        <item.icon className="w-6 h-6" />
                      </div>
                      <span className="bg-slate-800 text-slate-300 text-[10px] font-extrabold px-2.5 py-1 rounded-md border border-slate-700">
                        {item.badge}
                      </span>
                    </div>

                    <h4 className="text-xl font-bold text-white mb-3 group-hover:text-[#F5B800] transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 md:px-8 max-w-5xl mx-auto">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 text-[#F5B800] border border-amber-500/30 text-xs font-bold uppercase tracking-wider rounded-full mb-3">
              <Users className="w-4 h-4" />
              Teamet Vårt
            </span>
            <h3 className="text-3xl md:text-4xl font-extrabold text-white">
              Menneskene bak Perun AS
            </h3>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {team.map((member, index) => (
            <FadeIn key={index} delay={0.15 * index}>
              <motion.div
                whileHover={{ y: -6 }}
                className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl overflow-hidden shadow-xl transition-all group h-full flex flex-col justify-between"
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  
                  <span className="absolute bottom-3 left-4 bg-slate-950/80 backdrop-blur-md text-[#F5B800] text-[11px] font-bold px-3 py-1 rounded-md border border-amber-500/30">
                    {member.role}
                  </span>
                </div>

                <div className="p-6">
                  <h4 className="text-xl font-bold text-white mb-2">
                    {member.name}
                  </h4>
                  <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                    {member.description}
                  </p>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <div className="bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 border border-amber-500/40 rounded-3xl p-8 md:p-14 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                Trenger du en trygg vurdering av taket ditt?
              </h3>
              <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed">
                Ta kontakt i dag for å avtale et lekkasjesøk eller en uforpliktende digital konsultasjon med våre ingeniører.
              </p>

              <button
                type="button"
                onClick={() => setIsContactOpen(true)}
                className="inline-flex items-center gap-2 bg-[#F5B800] hover:bg-[#e0a800] text-gray-950 font-extrabold px-8 py-4 rounded-2xl text-sm transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                Åpne Bestillingsskjema
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ContactModal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
}