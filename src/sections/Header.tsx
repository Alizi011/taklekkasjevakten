import { useState, useEffect } from "react";
import { Phone, Mail } from "lucide-react";
import { motion } from "framer-motion";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl shadow-soft py-3"
          : "bg-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img
            src="/logo-icon.jpg"
            alt="Taklekkasjevakten logo"
            className={`h-10 w-auto rounded-lg transition-all ${scrolled ? "" : "ring-2 ring-white/30"}`}
          />
          <h1 className={`text-lg md:text-xl font-bold leading-tight transition-colors ${scrolled ? "bg-gradient-to-r from-[#F5B800] to-[#D97706] bg-clip-text text-transparent" : "text-white"}`}>
            Taklekkasjevakten.no
          </h1>
          <img
            src="/logo-perun.jpg"
            alt="Perun AS"
            className={`h-8 w-auto rounded transition-all ${scrolled ? "opacity-60" : "opacity-80 ring-2 ring-white/30"}`}
          />
        </div>

        {/* Contact Info */}
        <div className="flex items-center gap-4 md:gap-6">
          <a
            href="tel:92029090"
            className={`flex items-center gap-2 transition-colors group ${scrolled ? "text-gray-600 hover:text-[#F5B800]" : "text-white/80 hover:text-white"}`}
          >
            <div className={`p-2 rounded-full transition-colors ${scrolled ? "bg-gray-100 group-hover:bg-gold-50" : "bg-white/15 backdrop-blur-sm group-hover:bg-white/25"}`}>
              <Phone className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-medium hidden sm:inline">92 02 90 90</span>
          </a>
          <a
            href="mailto:post@taklekkasjevakten.no"
            className={`hidden md:flex items-center gap-2 transition-colors group ${scrolled ? "text-gray-600 hover:text-[#F5B800]" : "text-white/80 hover:text-white"}`}
          >
            <div className={`p-2 rounded-full transition-colors ${scrolled ? "bg-gray-100 group-hover:bg-gold-50" : "bg-white/15 backdrop-blur-sm group-hover:bg-white/25"}`}>
              <Mail className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-medium">post@taklekkasjevakten.no</span>
          </a>
        </div>
      </div>
    </motion.header>
  );
}
