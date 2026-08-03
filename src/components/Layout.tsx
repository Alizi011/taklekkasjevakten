import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Phone, Mail, Menu, X, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { label: "Forside", href: "/" },
  { label: "Om Taklekkasjer", href: "/om-taklekkasjer" },
  { label: "Om lekkasjesøk", href: "/om-lekkasjesok" },
  { label: "Vårt arbeid", href: "/vart-arbeid" },
  { label: "Om Oss", href: "/om-oss" },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const location = useLocation();

  const isHome = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
      setShowScrollTop(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    setMobileOpen(false);
  }, [location.pathname]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled || !isHome
            ? "bg-white/95 backdrop-blur-xl shadow-soft py-3"
            : "bg-transparent py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo-icon.jpg"
              alt="Taklekkasjevakten logo"
              className={`h-10 w-auto rounded-lg transition-all ${
                scrolled || !isHome ? "" : "ring-2 ring-white/30"
              }`}
            />
            <h1
              className={`text-lg md:text-xl font-bold leading-tight transition-colors ${
                scrolled || !isHome
                  ? "bg-gradient-to-r from-[#F5B800] to-[#D97706] bg-clip-text text-transparent"
                  : "text-white"
              }`}
            >
              Taklekkasjevakten.no
            </h1>
            <img
              src="/logo-perun.jpg"
              alt="Perun AS"
              className={`h-8 w-auto rounded transition-all ${
                scrolled || !isHome ? "opacity-60" : "opacity-80"
              }`}
            />
          </Link>

          <div className="flex items-center gap-4 md:gap-6">
            <a
              href="tel:92029090"
              className={`flex items-center gap-2 transition-colors group ${
                scrolled || !isHome
                  ? "text-gray-600 hover:text-[#F5B800]"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <div
                className={`p-2 rounded-full transition-colors ${
                  scrolled || !isHome
                    ? "bg-gray-100 group-hover:bg-gold-50"
                    : "bg-white/15 backdrop-blur-sm group-hover:bg-white/25"
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-medium hidden sm:inline">
                92 02 90 90
              </span>
            </a>
            <a
              href="mailto:post@taklekkasjevakten.no"
              className={`hidden md:flex items-center gap-2 transition-colors group ${
                scrolled || !isHome
                  ? "text-gray-600 hover:text-[#F5B800]"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <div
                className={`p-2 rounded-full transition-colors ${
                  scrolled || !isHome
                    ? "bg-gray-100 group-hover:bg-gold-50"
                    : "bg-white/15 backdrop-blur-sm group-hover:bg-white/25"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-medium">
                post@taklekkasjevakten.no
              </span>
            </a>
          </div>
        </div>
      </motion.header>

      {/* Navigation */}
      <nav
        className={`fixed top-[60px] md:top-[68px] left-0 right-0 z-40 transition-all duration-500 ${
          scrolled || !isHome
            ? "bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-xs"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="hidden md:flex items-center gap-1 mx-auto">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`relative px-4 py-2 text-sm font-medium rounded-full transition-colors group ${
                    scrolled || !isHome
                      ? location.pathname === item.href
                        ? "text-[#F5B800]"
                        : "text-gray-600 hover:text-gray-900"
                      : location.pathname === item.href
                        ? "text-[#F5B800]"
                        : "text-white/80 hover:text-white"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-300 ${
                      location.pathname === item.href
                        ? "w-6 bg-[#F5B800]"
                        : "w-0 group-hover:w-6 " +
                          (scrolled || !isHome
                            ? "bg-[#F5B800]"
                            : "bg-white")
                    }`}
                  />
                </Link>
              ))}
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors ml-auto ${
                scrolled || !isHome
                  ? "text-gray-700 hover:bg-gray-100"
                  : "text-white hover:bg-white/15"
              }`}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

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
                <Link
                  key={item.href}
                  to={item.href}
                  className={`block px-6 py-3 text-sm font-medium transition-colors border-b border-gray-50 ${
                    location.pathname === item.href
                      ? "text-[#F5B800] bg-gold-50"
                      : "text-gray-700 hover:text-[#F5B800] hover:bg-gold-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main content */}
      <main className={!isHome ? "pt-[108px] md:pt-[116px]" : ""}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 gold-gradient" />
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/logo-icon.jpg"
                  alt="Taklekkasjevakten"
                  className="h-10 w-auto rounded-lg"
                />
                <div>
                  <h4 className="font-bold text-lg bg-gradient-to-r from-[#FCD34D] to-[#F5B800] bg-clip-text text-transparent">
                    Taklekkasjevakten.no
                  </h4>
                  <p className="text-xs text-gray-400">
                    En del av Perun AS
                  </p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Eksperter på taklekkasjer i Oslo og Akershus. Vi finner
                lekkasjen andre bare leter etter.
              </p>
            </div>

            <div>
              <h5 className="font-semibold text-sm text-gray-300 uppercase tracking-wider mb-4">
                Navigasjon
              </h5>
              <ul className="space-y-2.5">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className="text-gray-400 hover:text-[#F5B800] text-sm transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-sm text-gray-300 uppercase tracking-wider mb-4">
                Kontakt
              </h5>
              <ul className="space-y-3">
                <li>
                  <a
                    href="tel:92029090"
                    className="flex items-center gap-2.5 text-gray-400 hover:text-[#F5B800] text-sm transition-colors"
                  >
                    <Phone className="w-4 h-4 text-[#F5B800]" />
                    92 02 90 90
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:post@taklekkasjevakten.no"
                    className="flex items-center gap-2.5 text-gray-400 hover:text-[#F5B800] text-sm transition-colors"
                  >
                    <Mail className="w-4 h-4 text-[#F5B800]" />
                    post@taklekkasjevakten.no
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Perun AS. All rights reserved.
            </p>
            <p className="text-sm text-gray-500">
              Designet av{" "}
              <span className="text-[#F5B800] font-medium">@ll-easy</span>{" "}
              design
            </p>
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
            className="fixed bottom-6 right-6 z-50 p-3 bg-gray-900 hover:bg-gray-800 text-white rounded-full shadow-soft-lg hover:shadow-xl transition-all"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
