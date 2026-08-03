import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { label: "Forside", href: "#forside" },
  { label: "Om Taklekkasjer", href: "#om-taklekkasjer" },
  { label: "Om lekkasjesøk", href: "#om-lekkasjesok" },
  { label: "Vårt arbeid", href: "#vart-arbeid" },
  { label: "Om Oss", href: "#om-oss" },
];

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-[60px] md:top-[68px] left-0 right-0 z-40 transition-all duration-500 ${
      scrolled ? "bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-xs" : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-12">
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1 mx-auto">
            {navItems.map((item, index) => (
              <motion.a
                key={item.href}
                href={item.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                className={`relative px-4 py-2 text-sm font-medium rounded-full transition-colors group ${
                  scrolled ? "text-gray-600 hover:text-gray-900" : "text-white/80 hover:text-white"
                }`}
              >
                {item.label}
                <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 rounded-full transition-all duration-300 group-hover:w-6 ${
                  scrolled ? "bg-[#F5B800]" : "bg-white"
                }`} />
              </motion.a>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ml-auto ${
              scrolled ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-white/15"
            }`}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden bg-white/95 backdrop-blur-xl border-t border-gray-100"
          >
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block px-6 py-3 text-sm font-medium text-gray-700 hover:text-[#F5B800] hover:bg-gold-50 transition-colors border-b border-gray-50"
              >
                {item.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
