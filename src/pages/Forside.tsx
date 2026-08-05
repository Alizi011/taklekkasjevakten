import { useState } from "react";
import HeroSection from "../sections/HeroSection";
import ValuePropositionSection from "../sections/ValuePropositionSection";
import TeamSection from "../sections/TeamSection";
import InfoSection from "../sections/InfoSection";
import ProcessSection from "../sections/ProcessSection";
import ServicesSection from "../sections/ServicesSection";
import ContactSection from "../sections/ContactSection";
import ContactModal from "../components/ContactModal";

export default function Forside() {
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <>
      {/* 1. Hero */}
      <HeroSection />

      {/* 2. Millionbeløp spart (Verdibudskap rett etter Hero) */}
      <ValuePropositionSection onOpenContact={() => setIsContactOpen(true)} />

      {/* 3. Teamet */}
      <TeamSection />

      {/* 4. Informasjon & Prosess */}
      <InfoSection />
      <ProcessSection />

      {/* 5. Tjenester */}
      <ServicesSection />

      {/* 6. Kontakt-seksjon */}
      <ContactSection />

      {/* Bestillingsskjema (modal) */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </>
  );
}