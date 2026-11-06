import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  Phone,
  Mail,
  Menu,
  X,
  ArrowUp,
  MapPin,
} from "lucide-react";
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
      {/* Header */}
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
        {/* Akuttvakt */}
        <div className="bg-red-950/90 text-white border-b border-red-800/60 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-2.5 flex flex-col md:flex-row items-center justify-between gap-2 md:gap-5">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>

              <span className="font-extrabold tracking-wide text-red-100 uppercase text-xs whitespace-nowrap">
                Døgnåpen Akuttvakt
              </span>

              <span className="text-red-100 text-xs sm:text-sm text-center md:text-left">
                Utrykning (2 mann):{" "}
                <strong className="text-white">kr 3 920,- eks. mva/t</strong>
                {" "}(+ kr 340,- bil/drift)
              </span>
            </div>

            <a
              href="tel:92029090"
              className="inline-flex shrink-0 items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-extrabold px-4 py-1.5 rounded-full text-xs transition-colors shadow-md whitespace-nowrap"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Ring Akuttvakt: 92 02 90 90</span>
            </a>
          </div>
        </div>
        {/* Hovedlinje */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-2 md:py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="Taklekkasjevakten"
              className="h-20 md:h-24 w-auto object-contain transition-all duration-300 hover:scale-105 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
            />
          </Link>

          {/* Desktop navigasjon */}
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

          {/* Telefon + bestilling */}
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

          {/* Mobilmeny */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Lukk meny" : "Åpne meny"}
            className="lg:hidden p-2 rounded-xl transition-colors text-slate-200 hover:bg-slate-800 border border-slate-700/60"
          >
            {mobileOpen ? (
              <X className="w-5 h-5 text-[#F5B800]" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobilmeny */}
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

      {/* Innhold */}
      <main className="pt-[125px] md:pt-[140px]">
        <Outlet />
      </main>

      {/* =========================================================
          FOOTER
      ========================================================== */}
      <footer className="relative bg-[#020713] text-white border-t border-white/[0.06] overflow-hidden">
        {/* Gullinje */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F5B800]/65 to-transparent" />

        {/* Bakgrunnsglød */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-[#F5B800]/[0.025] blur-[110px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 md:px-8">
          {/* Hoveddel */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-y-10 lg:gap-x-16 py-11 md:py-12">

            {/* Brand */}
            <div className="md:col-span-2 lg:col-span-5">
              <Link
                to="/"
                className="inline-block transition-transform duration-300 hover:scale-[1.015]"
              >
                <img
                  src="/logo.png"
                  alt="Taklekkasjevakten"
                  className="h-[82px] md:h-[92px] w-auto object-contain drop-shadow-[0_4px_14px_rgba(0,0,0,0.55)]"
                />
              </Link>

              <div className="mt-4">
                <h4 className="text-[21px] md:text-[23px] leading-tight font-extrabold tracking-[-0.02em] text-white">
                  Taklekkasjevakten
                  <span className="text-[#F5B800]">.no</span>
                </h4>

                <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#F5B800]">
                  En del av Perun AS
                </p>
              </div>

              <p className="mt-5 max-w-[390px] text-[14px] leading-6 text-slate-400">
                Spesialister på lekkasjesøk og byggtekniske feil. Vi finner
                årsaken – ikke bare symptomet.
              </p>

              <div className="mt-5 text-[12px] leading-5 text-slate-500">
                <p>Org.nr. 917 779 236</p>
                <p>Haavard Martinsens vei 9, 0978 Oslo</p>
              </div>
            </div>

            {/* Dekningsområde */}
            <div className="lg:col-span-3">
              <h5 className="text-[11px] font-extrabold uppercase tracking-[0.19em] text-[#F5B800]">
                Dekningsområde
              </h5>

              <div className="mt-5 h-px w-8 bg-[#F5B800]/50" />

              <div className="mt-5">
                <div className="flex gap-3 pb-5 border-b border-white/[0.06]">
                  <MapPin className="w-[17px] h-[17px] mt-0.5 shrink-0 text-[#F5B800]" />

                  <div>
                    <p className="text-[14px] font-bold text-slate-100">
                      Oslo
                    </p>

                    <p className="mt-1 text-[12px] leading-5 text-slate-500">
                      Lekkasjesøk, takkontroll, service og akutt utbedring
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 py-5">
                  <MapPin className="w-[17px] h-[17px] mt-0.5 shrink-0 text-[#F5B800]" />

                  <div>
                    <p className="text-[14px] font-bold text-slate-100">
                      Hele Akershus
                    </p>

                    <p className="mt-1 text-[12px] leading-5 text-slate-500">
                      Vi rykker ut til alle kommuner i Akershus
                    </p>
                  </div>
                </div>

                <p className="text-[11px] leading-5 text-slate-600">
                  Bolig · borettslag · sameie · næringsbygg
                </p>
              </div>
            </div>

            {/* Kontakt */}
            <div className="lg:col-span-4">
              <h5 className="text-[11px] font-extrabold uppercase tracking-[0.19em] text-[#F5B800]">
                Kontakt
              </h5>

              <div className="mt-5 h-px w-8 bg-[#F5B800]/50" />

              <div className="mt-5 space-y-5">
                <a
                  href="tel:92029090"
                  className="group flex items-start gap-3"
                >
                  <Phone className="w-[17px] h-[17px] mt-0.5 shrink-0 text-[#F5B800]" />

                  <div>
                    <span className="block text-[10px] uppercase tracking-[0.14em] text-slate-600">
                      Telefon
                    </span>

                    <span className="mt-0.5 block text-[14px] font-semibold text-slate-200 transition-colors group-hover:text-[#F5B800]">
                      92 02 90 90
                    </span>
                  </div>
                </a>

                <a
                  href="mailto:post@taklekkasjevakten.no"
                  className="group flex items-start gap-3"
                >
                  <Mail className="w-[17px] h-[17px] mt-0.5 shrink-0 text-[#F5B800]" />

                  <div className="min-w-0">
                    <span className="block text-[10px] uppercase tracking-[0.14em] text-slate-600">
                      E-post
                    </span>

                    <span className="mt-0.5 block text-[14px] font-semibold text-slate-200 transition-colors group-hover:text-[#F5B800] break-all">
                      post@taklekkasjevakten.no
                    </span>
                  </div>
                </a>

                <div className="flex items-start gap-3">
                  <MapPin className="w-[17px] h-[17px] mt-0.5 shrink-0 text-[#F5B800]" />

                  <div>
                    <span className="block text-[10px] uppercase tracking-[0.14em] text-slate-600">
                      Adresse
                    </span>

                    <span className="mt-0.5 block text-[14px] leading-5 text-slate-400">
                      Haavard Martinsens vei 9
                      <br />
                      0978 Oslo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================
              SEO-LOKASJONSLENKER
          ====================================================== */}
          <div className="border-t border-white/[0.07] py-5">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                Lokale tjenester
              </span>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {localSeoLinks.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="text-[12px] text-slate-500 hover:text-[#F5B800] transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/[0.07] py-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-[11px] text-slate-600">
                © {new Date().getFullYear()} Perun AS. Alle rettigheter
                reservert.
              </p>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                <span>Taklekkasjevakten.no</span>

                <span className="text-slate-800">
                  •
                </span>

                <span>
                  En tjeneste fra{" "}
                  <span className="font-semibold text-slate-400">
                    Perun AS
                  </span>
                </span>
              </div>
            </div>
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
            aria-label="Til toppen"
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