import { Phone, Mail, MapPin } from "lucide-react";
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <FadeIn>
            <div>
              <div className="mb-5">
                <p className="mt-2 text-xs text-gray-400">
                  En del av Perun AS
                </p>
              </div>

              <p className="text-gray-400 text-sm leading-relaxed">
                Eksperter på taklekkasjer i Oslo og Akershus. Vi finner lekkasjen
                andre bare leter etter.
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

                <li className="flex items-center gap-2.5 text-gray-400 text-sm">
                  <MapPin className="w-4 h-4 text-[#F5B800] flex-shrink-0" />
                  Oslo og Akershus
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