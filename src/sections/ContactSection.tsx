import { useState } from "react";
import FadeIn from "../components/FadeIn";
import ContactModal from "../components/ContactModal";

export default function ContactSection() {
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <section id="kontakt" className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
        <FadeIn>
          <p className="text-gray-500 text-base md:text-lg mb-2">
            Slutt å lure på hvor vannet kommer fra.
          </p>

          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
            Ta grep før skaden blir større – kontakt oss i dag!
          </h2>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="pt-2 pb-4">
            <button
              type="button"
              onClick={() => setIsContactOpen(true)}
              className="px-8 py-4 bg-[#F5B800] hover:bg-[#e0a800] text-gray-900 font-bold text-lg rounded-2xl shadow-gold hover:shadow-gold-lg transition-all transform active:scale-95 cursor-pointer"
            >
              Fyll ut Kontaktskjema
            </button>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed mt-4">
            Med ingeniørkompetanse og fysisk inspeksjon på takflaten finner vi den reelle årsaken, slik at du slipper kostbare reparasjoner som ikke virker.
          </p>
        </FadeIn>
      </div>

      {/* Det nye avanserte 4-stegs skjemaet */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </section>
  );
}