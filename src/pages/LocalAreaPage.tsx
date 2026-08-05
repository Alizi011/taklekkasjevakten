import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Building2,
} from "lucide-react";
import { localAreasData } from "../data/localAreas";
import FadeIn from "../components/FadeIn";
import LeakCalculator from "../components/LeakCalculator";
import ContactModal from "../components/ContactModal";

export default function LocalAreaPage() {
  const { areaSlug } = useParams<{ areaSlug: string }>();
  const [isContactOpen, setIsContactOpen] = useState(false);

  const cleanSlug = areaSlug ? areaSlug.replace("taklekkasje-", "") : "oslo";
  const area = localAreasData[cleanSlug] || localAreasData["oslo"];

  // Oppdaterer tittel og legger inn JSON-LD Schema for Google
  useEffect(() => {
    document.title = area.metaTitle;
    window.scrollTo(0, 0);

    const schemaData = {
      "@context": "https://schema.org",
      "@type": "RoofingContractor",
      "name": "Taklekkasjevakten - Perun AS",
      "image": "https://taklekkasjevakten.no/logo.png",
      "@id": "https://taklekkasjevakten.no/#organization",
      "url": `https://taklekkasjevakten.no/taklekkasje-${area.slug}`,
      "telephone": "+4792029090",
      "email": "post@taklekkasjevakten.no",
      "priceRange": "$$$",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": area.cityName,
        "addressCountry": "NO"
      },
      "areaServed": [
        area.cityName,
        area.regionName,
        "Oslo",
        "Bærum",
        "Asker",
        "Lillestrøm"
      ],
      "description": area.metaDescription,
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday"
        ],
        "opens": "00:00",
        "closes": "23:59"
      }
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "json-ld-schema";
    script.innerHTML = JSON.stringify(schemaData);

    const existingScript = document.getElementById("json-ld-schema");
    if (existingScript) {
      existingScript.remove();
    }

    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById("json-ld-schema");
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [area]);

  return (
    <div className="bg-[#0b0f17] text-white min-h-screen">
      {/* Hero for det spesifikke området */}
      <section className="relative py-20 md:py-28 overflow-hidden border-b border-slate-800">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="max-w-3xl">
            <FadeIn>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 text-[#F5B800] border border-amber-500/30 text-xs font-black uppercase tracking-widest rounded-full mb-6 backdrop-blur-md">
                <MapPin className="w-3.5 h-3.5" />
                Lokal Tjeneste: {area.cityName} & {area.regionName}
              </span>

              <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
                {area.title}
              </h1>

              <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-8 font-normal">
                {area.introText}
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsContactOpen(true)}
                  className="bg-[#F5B800] hover:bg-[#e0a800] text-slate-950 font-black px-8 py-4 rounded-2xl text-xs md:text-sm transition-all shadow-lg cursor-pointer flex items-center gap-2"
                >
                  <span>Bestill Lekkasjesøk i {area.cityName}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href="tel:92029090"
                  className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-6 py-4 rounded-2xl text-xs md:text-sm transition-all shadow-md flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>Akutt Vakt: 92 02 90 90</span>
                </a>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Lokale fordeler & Bydeler */}
      <section className="py-16 bg-slate-950 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* Våre faglige sjekkpunkter for området */}
            <FadeIn>
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
                <h3 className="text-xl font-extrabold text-white mb-6 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#F5B800]" />
                  Hvorfor velge Perun AS i {area.cityName}?
                </h3>
                <ul className="space-y-4">
                  {area.localFocusPoints.map((point: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            {/* Bydeler og nærområder */}
            <FadeIn delay={0.2}>
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
                <h3 className="text-xl font-extrabold text-white mb-6 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#F5B800]" />
                  Områder vi dekker i {area.cityName}
                </h3>
                <p className="text-slate-400 text-xs md:text-sm mb-6">
                  Vårt 2-manns serviceteam rykker ut til alle deler av {area.cityName} og omegn:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {area.popularDistricts.map((district: string, i: number) => (
                    <div
                      key={i}
                      className="bg-slate-950/60 border border-slate-800/80 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-2"
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{district}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

          </div>
        </div>
      </section>

      {/* Interaktiv Kalkulator */}
      <LeakCalculator />

      {/* Lenker til andre lokale områder */}
      <section className="py-16 bg-[#0b0f17] border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <h4 className="text-lg font-bold text-white mb-6">
            Vi utfører også lekkasjesøk i andre nærliggende områder:
          </h4>
          <div className="flex flex-wrap justify-center gap-4">
            {Object.keys(localAreasData).map((key) => {
              const loc = localAreasData[key];
              if (loc.slug === area.slug) return null;
              return (
                <Link
                  key={loc.slug}
                  to={`/taklekkasje-${loc.slug}`}
                  className="bg-slate-900 hover:bg-slate-800 border border-amber-500/30 px-5 py-2.5 rounded-xl text-xs font-bold text-[#F5B800] transition-all hover:scale-105"
                >
                  Taklekkasje {loc.cityName} →
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
}