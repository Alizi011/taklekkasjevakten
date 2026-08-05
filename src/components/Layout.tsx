import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Phone, Mail, Menu, X, ArrowUp, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ContactModal from "./ContactModal";

const navItems = [
  { label: "Forside", href: "/" },
  { label: "Om Taklekkasjer", href: "/om-taklekkasjer" },
  { label: "Om lekkasjesøk", href: "/om-lekkasjesok" },
  { label: "Vårt arbeid", href: "/vart-arbeid" },
  { label: "Om Oss", href: "/om-oss" },
  { label: "FAQ", href: "/faq" },
];

const localSeoLinks = [
  { label: "Taklekkasje Oslo", href: "/taklekkasje-oslo" },
  { label: "Taklekkasje Bærum", href: "/taklekkasje-baerum" },
  { label: "Taklekkasje Asker", href: "/taklekkasje-asker" },
  { label: "Taklekkasje Lillestrøm", href: "/taklekkasje-lillestrom" },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    setMobileOpen(false);
  }, [location.pathname]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-white">
      {/* Header og navigasjon samlet */}
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || !isHome
            ? "bg-[#0b0f17]/95 backdrop-blur-2xl border-b border-amber-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
            : "bg-gradient-to-b from-black/95 via-black/70 to-transparent"
        }`}
      >
        {/* Compact Akutt Vakt Banner */}
        <div className="bg-red-950/90 text-white text-xs py-1.5 px-4 border-b border-red-800/60 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-1 md:gap-3">
            <div className="flex flex-wrap items-center gap-2 text-center md:text-left justify-center md:justify-start">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="font-bold tracking-wide text-red-100 uppercase text-[11px]">
                Døgnåpen Akuttvakt:
              </span>
              <span className="text-red-200 text-[11px]">
                Utrykning (2 mann): <strong>kr 3 920,- eks. mva / t</strong> (+ kr 340,- bil/drift)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="tel:92029090"
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-extrabold px-3 py-0.5 rounded-full text-[11px] transition-colors shadow-md whitespace-nowrap"
              >
                <Phone className="w-3 h-3" />
                <span>Ring Akuttvakt: 92 02 90 90</span>
              </a>
            </div>
          </div>
        </div>

        {/* Én felles Hovedlinje: Stor, Ren Logo + Meny + Kontakt */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-2 md:py-3 flex items-center justify-between">
          
          {/* REN OG STOR LOGO */}
          <Link to="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="Taklekkasjevakten"
              className="h-20 md:h-24 w-auto object-contain transition-all duration-300 hover:scale-105 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
            />
          </Link>

          {/* Navigasjon i midten */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`relative px-3 py-1.5 text-xs font-bold rounded-full transition-colors group ${
                  location.pathname === item.href
                    ? "text-[#F5B800]"
                    : "text-slate-200 hover:text-white"
                }`}
              >
                {item.label}
                <span
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-300 ${
                    location.pathname === item.href
                      ? "w-5 bg-[#F5B800]"
                      : "w-0 group-hover:w-5 bg-[#F5B800]"
                  }`}
                />
              </Link>
            ))}
          </nav>

          {/* Ringeknapp & Bestilling til høyre */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="tel:92029090"
              className="flex items-center gap-2 bg-gradient-to-r from-[#F5B800] via-amber-400 to-[#F5B800] hover:brightness-110 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(245,184,0,0.25)] active:scale-95"
            >
              <Phone className="w-3.5 h-3.5 fill-current" />
              <span>92 02 90 90</span>
            </a>

            <button
              type="button"
              onClick={() => setIsContactOpen(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-[#F5B800] font-extrabold rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Bestill Søk
            </button>
          </div>

          {/* Mobilmeny Knapp */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Lukk meny" : "Åpne meny"}
            className="lg:hidden p-2 rounded-xl transition-colors text-slate-200 hover:bg-slate-800 border border-slate-700/60"
          >
            {mobileOpen ? <X className="w-5 h-5 text-[#F5B800]" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobilmeny Dropdown */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden bg-[#0b0f17]/95 backdrop-blur-2xl border-t border-slate-800"
            >
              <div className="p-3 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-5 py-2.5 text-sm font-bold rounded-xl transition-colors ${
                      location.pathname === item.href
                        ? "text-[#F5B800] bg-amber-500/10"
                        : "text-slate-200 hover:text-[#F5B800]"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setIsContactOpen(true);
                  }}
                  className="w-full text-center px-5 py-3 text-sm font-extrabold text-slate-950 bg-[#F5B800] hover:bg-[#e0a800] rounded-xl transition-colors mt-2"
                >
                  Bestill Lekkasjesøk
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Main content */}
      <main className="pt-[125px] md:pt-[140px]">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-white relative overflow-hidden border-t border-slate-800">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/20 via-[#F5B800] to-amber-500/20" />
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            {/* Om oss */}
            <div>
              <div className="mb-4">
                <img
                  src="/logo.png"
                  alt="Taklekkasjevakten"
                  className="h-24 md:h-32 w-auto object-contain max-w-full block mb-3 filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
                />
                <h4 className="font-extrabold text-lg bg-gradient-to-r from-[#FCD34D] to-[#F5B800] bg-clip-text text-transparent">
                  Taklekkasjevakten.no
                </h4>
                <p className="text-xs text-[#F5B800] mt-1 font-semibold">
                  En del av Perun AS
                </p>
              </div>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                Eksperter på taklekkasjer i Oslo og Akershus. Vi finner kilden til lekkasjen basert på ingeniørfaglige metoder.
              </p>
            </div>

            {/* Navigasjon */}
            <div>
              <h5 className="font-bold text-xs text-amber-500 uppercase tracking-widest mb-4">
                Navigasjon
              </h5>
              <ul className="space-y-2.5">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className="text-slate-400 hover:text-[#F5B800] text-sm transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Lokale SEO-lenker */}
            <div>
              <h5 className="font-bold text-xs text-amber-500 uppercase tracking-widest mb-4">
                Lokal Feilsøking
              </h5>
              <ul className="space-y-2.5">
                {localSeoLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-slate-400 hover:text-[#F5B800] text-sm transition-colors flex items-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Kontakt */}
            <div>
              <h5 className="font-bold text-xs text-amber-500 uppercase tracking-widest mb-4">
                Kontakt
              </h5>
              <ul className="space-y-3">
                <li>
                  <a
                    href="tel:92029090"
                    className="flex items-center gap-2.5 text-slate-300 hover:text-[#F5B800] text-sm transition-colors"
                  >
                    <Phone className="w-4 h-4 text-[#F5B800]" />
                    92 02 90 90
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:post@taklekkasjevakten.no"
                    className="flex items-center gap-2.5 text-slate-300 hover:text-[#F5B800] text-sm transition-colors"
                  >
                    <Mail className="w-4 h-4 text-[#F5B800]" />
                    post@taklekkasjevakten.no
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <p>&copy; {new Date().getFullYear()} Perun AS. All rights reserved.</p>
            <p>Designet for <span className="text-[#F5B800] font-bold">Taklekkasjevakten</span></p>
          </div>
        </div>
      </footer>

      {/* Scroll to top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 p-3 bg-slate-900 border border-amber-500/40 hover:bg-slate-800 text-[#F5B800] rounded-full shadow-2xl transition-all active:scale-95 cursor-pointer"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
}