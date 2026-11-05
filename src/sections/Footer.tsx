import { Phone, Mail, MapPin, Building2 } from "lucide-react";
import FadeIn from "../components/FadeIn";

export default function Footer() {
  return (
    <footer
      id="om-oss"
      className="bg-gray-900 text-white relative overflow-hidden"
    >
      {/* Decorative top gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 gold-gradient" />

      <div className="container-modern py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <FadeIn>
            <div>
              <div className="mb-5">
                <img
                  src="/logo.png"
                  alt="Taklekkasjevakten"
                  className="h-28 md:h-36 w-auto object-contain max-w-full"
                />

                <div className="mt-3 space-y-1">
                  <p className="text-sm font-semibold text-gray-200">
                    En del av Perun AS
                  </p>
                  <p className="text-xs text-gray-400">
                    Org.nr. 917 779 236
                  </p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Haavard Martinsens vei 9
                    <br />
                    0978 Oslo
                  </p>
                </div>
              </div>

              <p className="text-gray-400 text-sm leading-relaxed">
                Eksperter på taklekkasjer i Oslo og Akershus. Vi finner årsaken
                til lekkasjen basert på ingeniørfaglige metoder.
              </p>
            </div>
          </FadeIn>

          {/* Quick Links */}
          <FadeIn delay={0.1}>
            <div>
              <h5 className="font-semibold text-sm text-gray-300 uppercase tracking-wider mb-4">
                Navigasjon
              </h5>

              <ul className="space-y-2.5">
                {[
                  { label: "Forside", href: "#forside" },
                  { label: "Om Taklekkasjer", href: "#om-taklekkasjer" },
                  { label: "Om lekkasjesøk", href: "#om-lekkasjesok" },
                  { label: "Vårt arbeid", href: "#vart-arbeid" },
                  { label: "Kontakt oss", href: "#kontakt" },
                ].map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="text-gray-400 hover:text-[#F5B800] text-sm transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>

          {/* Dekningsområde */}
          <FadeIn delay={0.15}>
            <div>
              <h5 className="font-semibold text-sm text-[#F5B800] uppercase tracking-wider mb-4">
                Dekningsområde
              </h5>

              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#F5B800] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-200">Oslo</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Lekkasjesøk, takkontroll, service og akutt utbedring
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#F5B800] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-200">
                      Hele Akershus
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Vi rykker ut til alle kommuner i Akershus
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-700 bg-gray-800/70 p-3">
                  <div className="flex items-start gap-2.5">
                    <Building2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-gray-200">
                        Bolig, borettslag, sameie og næringsbygg
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                        Oppdrag planlegges etter tilgjengelighet og hastegrad.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 bg-gray-800/80 border border-gray-700 rounded-lg px-3 py-2 w-full">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-[11px] font-semibold text-gray-300">
                    Dekker <span className="text-white">Oslo og hele Akershus</span>
                  </span>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Contact */}
          <FadeIn delay={0.2}>
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

                <li className="flex items-start gap-2.5 text-gray-400 text-sm">
                  <MapPin className="w-4 h-4 text-[#F5B800] flex-shrink-0 mt-0.5" />
                  <span>
                    Haavard Martinsens vei 9
                    <br />
                    0978 Oslo
                  </span>
                </li>
              </ul>
            </div>
          </FadeIn>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Perun AS. All rights reserved.
          </p>

          <p className="text-sm text-gray-500">
            Designet av{" "}
            <span className="text-[#F5B800] font-medium">@ll-easy</span> design
          </p>
        </div>
      </div>
    </footer>
  );
}
