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
    <nav
      className={`fixed top-[60px] md:top-[68px] left-0 right-0 z-40 transition-all duration-500 ${
        scrolled
          ? "bg-[#0b0f17]/90 backdrop-blur-xl border-b border-amber-500/20 shadow-xl"
          : "bg-gradient-to-b from-slate-950/60 to-transparent"
      }`}
    >
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
                className={`relative px-4 py-2 text-xs md:text-sm font-semibold rounded-full transition-colors group ${
                  scrolled
                    ? "text-slate-200 hover:text-[#F5B800]"
                    : "text-slate-100 hover:text-[#F5B800]"
                }`}
              >
                {item.label}
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 rounded-full transition-all duration-300 group-hover:w-6 bg-[#F5B800]"
                />
              </motion.a>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl transition-colors ml-auto text-slate-200 hover:bg-slate-800 border border-slate-700/60"
          >
            {mobileOpen ? <X className="w-5 h-5 text-[#F5B800]" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden bg-[#0b0f17]/95 backdrop-blur-2xl border-t border-slate-800"
          >
            <div className="p-2 space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-6 py-3 text-sm font-bold text-slate-200 hover:text-[#F5B800] hover:bg-amber-500/10 rounded-xl transition-colors border-b border-slate-800/50 last:border-0"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}