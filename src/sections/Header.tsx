import { useState, useEffect } from "react";
import { Phone, Mail } from "lucide-react";
import { motion } from "framer-motion";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0b0f17]/95 backdrop-blur-2xl border-b border-amber-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.8)] py-2"
          : "bg-gradient-to-b from-black/90 via-black/50 to-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        
        {/* Logo og Døgnåpen Badge */}
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Taklekkasjevakten"
            className="h-20 md:h-28 w-auto object-contain transition-transform duration-300 hover:scale-105 filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
          />

          <div className="hidden lg:flex items-center gap-2 bg-slate-900/90 border border-emerald-500/40 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">
              Døgnåpen Vakt
            </span>
          </div>
        </div>

        {/* RÅ Kontaktlinje med høy kontrast */}
        <div className="flex items-center gap-3">
          
          {/* E-post kasse */}
          <a
            href="mailto:post@taklekkasjevakten.no"
            className="hidden sm:flex items-center gap-2.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 hover:border-[#F5B800] text-slate-200 hover:text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-lg backdrop-blur-md group"
          >
            <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[#F5B800] group-hover:scale-110 transition-transform">
              <Mail className="w-4 h-4" />
            </div>
            <span>post@taklekkasjevakten.no</span>
          </a>

          {/* Telefonknapp med Gull-Glød og animert pulsering */}
          <a
            href="tel:+4792029090"
            className="flex items-center gap-2.5 bg-gradient-to-r from-[#F5B800] via-amber-400 to-[#F5B800] hover:brightness-110 text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs md:text-sm transition-all shadow-[0_0_20px_rgba(245,184,0,0.3)] hover:shadow-[0_0_25px_rgba(245,184,0,0.5)] active:scale-95 group"
          >
            <div className="p-1.5 rounded-xl bg-slate-950/20 text-slate-950 group-hover:scale-110 transition-transform">
              <Phone className="w-4 h-4 fill-current" />
            </div>
            <span className="tracking-wider">92 02 90 90</span>
          </a>

        </div>
      </div>
    </motion.header>
  );
}