import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Star, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  {
    image: "/hero-2.jpg",
    quote: "Rask respons, profesjonell reparasjon.",
  },
  {
    image: "/hero-1.jpg",
    quote: "Vi tetter taket før fisken flytter inn!",
  },
  {
    image: "/hero-3.jpg",
    quote: "Vi avslører skjulte lekkasjer før de blir store problemer!",
  },
  {
    image: "/hero-4.jpg",
    quote: "Vi sørger for at regnet holder seg ute, der det hører hjemme!",
  },
];

const stats = [
  { value: "15+", label: "Års erfaring" },
  { value: "2,000+", label: "Fornøyde kunder" },
  { value: "5,000+", label: "Lekkasjer funnet" },
  { value: "100%", label: "Norsk eid selskap" },
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 7000);
    return () => clearInterval(timer);
  }, [next]);

  const scrollToContact = () => {
    document.getElementById("kontakt")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="forside" className="relative min-h-screen flex flex-col">
      {/* Fullscreen Background Image Carousel */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <img
              src={slides[current].image}
              alt="Perun AS Team"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Dark gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-end pb-10 md:pb-20 pt-32">
        <div className="container-modern px-4 md:px-8">
          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-wrap items-center gap-3 mb-8"
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/15 backdrop-blur-md text-white text-sm font-semibold rounded-full border border-white/20">
              <Star className="w-4 h-4 text-[#F5B800] fill-[#F5B800]" />
              4.9/5 fra 200+ kunder
            </span>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/15 backdrop-blur-md text-white text-sm font-semibold rounded-full border border-white/20">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Tilgjengelig na — Oslo & Akershus
            </span>
          </motion.div>

          {/* Main headline */}
          <div className="max-w-3xl">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight"
            >
              Taklekkasje? <span className="text-[#F5B800]">Drypper det?</span>{" "}
              Lekker det?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-lg md:text-xl text-white/85 mb-6 leading-relaxed max-w-2xl"
            >
              Møt <strong className="text-white">teamet vårt</strong> — vi
              klatrer opp på taket ditt, finner lekkasjen andre ikke finner, og
              dokumenterer alt. Ingen gjetning. Bare fagkunnskap.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-wrap gap-4 mb-10"
            >
              <motion.button
                onClick={scrollToContact}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="gold-gradient text-white font-bold text-base px-8 py-4 rounded-2xl shadow-gold-lg hover:shadow-gold transition-all"
              >
                Fyll ut Kontaktskjema
              </motion.button>
              <motion.a
                href="tel:92029090"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/15 backdrop-blur-md text-white font-semibold rounded-2xl border border-white/25 hover:bg-white/25 transition-all"
              >
                <Phone className="w-5 h-5" />
                Ring 92 02 90 90
              </motion.a>
            </motion.div>

            {/* Quote overlay */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="mb-12"
              >
                <blockquote className="text-xl md:text-2xl text-white/90 italic font-medium max-w-xl">
                  &ldquo;{slides[current].quote}&rdquo;
                </blockquote>
              </motion.div>
            </AnimatePresence>

            {/* Carousel dots */}
            <div className="flex items-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrent(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    index === current
                      ? "bg-[#F5B800] w-8"
                      : "bg-white/40 hover:bg-white/60 w-2.5"
                  }`}
                />
              ))}
              <div className="ml-4 flex gap-1">
                <button
                  onClick={prev}
                  className="p-2 bg-white/15 backdrop-blur-sm hover:bg-white/30 rounded-full border border-white/20 transition-all"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={next}
                  className="p-2 bg-white/15 backdrop-blur-sm hover:bg-white/30 rounded-full border border-white/20 transition-all"
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.7 }}
          className="container-modern px-4 md:px-8 mt-10"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold text-[#F5B800] mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-white/70">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
