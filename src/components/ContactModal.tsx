import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  X, CalendarCheck, Zap,
  ChevronRight, ChevronLeft, Check, Upload, Video, 
  ShieldCheck, Wrench, Info, Eye, Sparkles, ArrowRight, AlertCircle 
} from "lucide-react";
import { apiUrl } from "../lib/api";
type ContactType = "privat" | "foretak";
type OrganizationType = "B2B" | "Borettslag/Sameie";
type IntentType = "lekkasjesok" | "takkontroll" | "service" | "akutt" | "digital" | "befaring";
type BuildingType = "enebolig" | "naering" | "tomannsbolig" | "sameie_blokk" | "sameie_rekkehus" | "annen";
type RoofType = "flattak" | "skråtak" | "takstein" | "papptak" | "balkong" | "dekke" | "annen";
type LeakLocation = "pipe" | "vindu" | "flate" | "rennestein" | "balkong_sluk" | "ukjent";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoofType?: string;
  initialNotes?: string;
}

interface BrregCompany {
  organization_number: string;
  name: string | null;
  organization_form?: string | null;
  organization_form_description?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
}

interface BrregRole {
  name: string;
  role_code?: string | null;
  role?: string | null;
  role_group?: string | null;
  holder_type?: string | null;
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [contactType, setContactType] = useState<ContactType>("privat");
  const [organizationType, setOrganizationType] = useState<OrganizationType>("B2B");
  const [intent, setIntent] = useState<IntentType>("lekkasjesok");
  
  // Tekniske detaljer
  const [buildingType, setBuildingType] = useState<BuildingType>("enebolig");
  const [roofType, setRoofType] = useState<RoofType>("flattak");
  const [leakLocation, setLeakLocation] = useState<LeakLocation>("ukjent");
  const [hasImages, setHasImages] = useState<boolean>(false);
  const [activeInfo, setActiveInfo] = useState<string | null>(null);

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formData, setFormData] = useState({
    fornavn: "",
    etternavn: "",
    firmavn: "",
    orgnr: "",
    epost: "",
    telefon: "",
    adresse: "",
    postnr: "",
    poststed: "",
    henvendelse: "",
    kontaktrolle: "",
    medkontakt_fornavn: "",
    medkontakt_etternavn: "",
    medkontakt_epost: "",
    medkontakt_telefon: "",
    medkontakt_rolle: "",
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [submittedCustomerId, setSubmittedCustomerId] = useState<number | null>(null);
  const [submittedInquiryId, setSubmittedInquiryId] = useState<number | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showAdditionalContact, setShowAdditionalContact] = useState(false);
  const [brregLoading, setBrregLoading] = useState(false);
  const [brregError, setBrregError] = useState<string | null>(null);
  const [brregCompany, setBrregCompany] = useState<BrregCompany | null>(null);
  const [brregRoles, setBrregRoles] = useState<BrregRole[]>([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const normalizeName = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");

  const lookupBrreg = async () => {
    const orgnr = formData.orgnr.replace(/\D/g, "");

    if (orgnr.length !== 9) {
      setBrregError("Organisasjonsnummer må bestå av 9 siffer.");
      setBrregCompany(null);
      setBrregRoles([]);
      return;
    }

    setBrregLoading(true);
    setBrregError(null);

    try {
      const response = await fetch(
        apiUrl(`/brreg_lookup.php?orgnr=${encodeURIComponent(orgnr)}`)
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Kunne ikke hente virksomheten fra BRREG."
        );
      }

      const company: BrregCompany = result.company;
      const roles: BrregRole[] = Array.isArray(result.roles)
        ? result.roles
        : [];

      setBrregCompany(company);
      setBrregRoles(roles);

      setFormData((prev) => ({
        ...prev,
        firmavn: company?.name || prev.firmavn,
        orgnr: company?.organization_number || orgnr,
      }));
    } catch (err) {
      setBrregCompany(null);
      setBrregRoles([]);
      setBrregError(
        err instanceof Error
          ? err.message
          : "Kunne ikke hente virksomheten fra BRREG."
      );
    } finally {
      setBrregLoading(false);
    }
  };

  const primaryContactNameForMatch =
    `${formData.fornavn} ${formData.etternavn}`.trim();

  const matchedBrregRole = brregRoles.find(
    (role) =>
      normalizeName(role.name) === normalizeName(primaryContactNameForMatch)
  );

  const handleSelectIntent = (newIntent: IntentType) => {
    setIntent(newIntent);
    setAcceptedTerms(false);
  };

  const getReadableRoofType = (rt: RoofType, bt: BuildingType) => {
    const roofLabels: Record<RoofType, string> = {
      flattak: "Flatt tak (PVC/Papp)",
      skråtak: "Skråtak",
      takstein: "Takstein",
      papptak: "Papptak",
      balkong: "Balkong / Terrasse",
      dekke: "Parkeringstak / Dekke",
      annen: "Annet / Usikker",
    };
    const buildingLabels: Record<BuildingType, string> = {
      enebolig: "Enebolig",
      tomannsbolig: "Tomannsbolig",
      sameie_rekkehus: "Sameie (rekkehus)",
      sameie_blokk: "Sameie (blokk)",
      naering: "Næringsbygg",
      annen: "Annet",
    };
    return `${roofLabels[rt] || rt} — ${buildingLabels[bt] || bt}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (intent !== "befaring" && !acceptedTerms) return;

    setServerError(null);
    setSubmittedCustomerId(null);
    setSubmittedInquiryId(null);

    const primaryContactName =
      `${formData.fornavn} ${formData.etternavn}`.trim();

    const customerName =
      contactType === "foretak"
        ? formData.firmavn.trim()
        : primaryContactName;

    const additionalContacts =
      showAdditionalContact &&
      (
        formData.medkontakt_fornavn.trim() ||
        formData.medkontakt_etternavn.trim()
      )
        ? [
            {
              first_name: formData.medkontakt_fornavn.trim(),
              last_name: formData.medkontakt_etternavn.trim(),
              email: formData.medkontakt_epost.trim() || null,
              phone: formData.medkontakt_telefon.trim() || null,
              role:
                formData.medkontakt_rolle.trim() ||
                (contactType === "foretak"
                  ? "Kontaktperson"
                  : "Medkontakt"),
              receive_messages: true,
              receive_notifications: true,
            },
          ]
        : [];

    const combinedNotes = [
      `Bygning: ${buildingType}`,
      `Taktype: ${roofType}`,
      `Skadested: ${leakLocation}`,
      `Bilder/Dokumentasjon: ${hasImages ? "Ja" : "Nei"}`,
      formData.henvendelse ? `Beskrivelse: ${formData.henvendelse}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const payload = {
      inquiry_type: intent,

      // Kunde/juridisk enhet
      customer_name: customerName,
      customer_type:
        contactType === "foretak"
          ? organizationType
          : "Privatperson",
      organization_name:
        contactType === "foretak"
          ? formData.firmavn.trim()
          : null,
      organization_number:
        contactType === "foretak"
          ? formData.orgnr.replace(/\s/g, "")
          : null,
      brreg_verified:
        contactType === "foretak" ? Boolean(brregCompany) : false,
      brreg_role_verified:
        contactType === "foretak" ? Boolean(matchedBrregRole) : false,
      brreg_role:
        contactType === "foretak" && matchedBrregRole
          ? matchedBrregRole.role || matchedBrregRole.role_group || null
          : null,

      // Hovedkontakt
      contact_first_name: formData.fornavn.trim(),
      contact_last_name: formData.etternavn.trim(),
      contact_name: primaryContactName,
      contact_role:
        formData.kontaktrolle.trim() || "Hovedkontakt",
      contact_email: formData.epost.trim(),
      contact_phone: formData.telefon.trim(),

      // Bakoverkompatibilitet
      phone: formData.telefon.trim(),
      email: formData.epost.trim(),

      address: formData.adresse.trim(),
      postal_code: formData.postnr.trim(),
      city: formData.poststed || "Ukjent",
      roof_type: getReadableRoofType(roofType, buildingType),
      estimated_price:
        intent === "akutt"
          ? "3 920,- / t"
          : intent === "digital"
          ? "1 490,-"
          : intent === "befaring"
          ? "Gratis"
          : "1 960,- / t",
      notes: combinedNotes,
      contacts: additionalContacts,
    };

    try {
      const response = await fetch(apiUrl("/inquiries.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setSubmittedCustomerId(
          result.customer_id !== null && result.customer_id !== undefined
            ? Number(result.customer_id)
            : null
        );
        setSubmittedInquiryId(
          result.id !== null && result.id !== undefined
            ? Number(result.id)
            : null
        );
        setSubmitted(true);
      } else {
        setServerError(result.message || "Det oppstod en feil ved lagring. Ring oss på 92 02 90 90.");
      }
    } catch (err) {
      console.error("Feil ved innsending til database:", err);
      setServerError("Kunne ikke koble til serveren. Vennligst sjekk internettforbindelsen eller ring oss på 92 02 90 90.");
    }
  };

  const portalBase =
    contactType === "foretak"
      ? "/bedriftsportal"
      : "/kundeportal";

  const customerPortalUrl = submittedCustomerId
    ? `${portalBase}?customer_id=${submittedCustomerId}${
        submittedInquiryId ? `&inquiry_id=${submittedInquiryId}` : ""
      }`
    : portalBase;

  const inputClasses =
    "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F5B800]/50 focus:border-[#F5B800] focus:bg-white transition-all";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-pointer"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed top-0 left-0 right-0 z-50 bg-white rounded-b-3xl shadow-2xl max-w-2xl mx-auto max-h-[92vh] overflow-y-auto border-b-2 border-[#F5B800]"
          >
            <div className="p-6 md:p-8 relative">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors"
                aria-label="Lukk"
              >
                <X className="w-5 h-5" />
              </button>

              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="text-center py-6 px-2 space-y-6"
                >
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                    <Check className="w-8 h-8" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-extrabold text-gray-900">
                      Henvendelsen er registrert
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed max-w-md mx-auto">
                      Vi har mottatt henvendelsen din. For å gi prosjektansvarlig et best mulig grunnlag
                      trenger vi noen flere opplysninger før videre behandling.
                    </p>
                  </div>

                  <div className="bg-slate-900 text-white rounded-2xl p-6 text-left max-w-md mx-auto space-y-3 shadow-xl border border-amber-500/30">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#F5B800]" />
                      <h4 className="text-xs font-bold text-[#F5B800]">Følg saken din i Kundeportalen</h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Du kan følge prosessen direkte, se saksstatus, rapport og bildedokumentasjon i vår kundeportal.
                    </p>
                    
                    <Link
                      to={customerPortalUrl}
                      className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[#F5B800] hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md mt-2"
                    >
                      <span>Gå til Kundeportal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setSubmittedCustomerId(null);
                      setSubmittedInquiryId(null);
                      setStep(1);
                      onClose();
                    }}
                    className="text-xs text-gray-500 hover:text-gray-900 pt-2 transition-colors block mx-auto underline"
                  >
                    Lukk dette vinduet
                  </button>
                </motion.div>
              ) : (
                <>
                  {/* Steg-indikator */}
                  <div className="flex items-center justify-center gap-2 mb-6">
                    {[1, 2, 3, 4].map((s) => (
                      <div key={s} className="flex items-center gap-1.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            step === s
                              ? "bg-[#F5B800] text-gray-900 shadow-md ring-4 ring-amber-100"
                              : step > s
                              ? "bg-gray-900 text-white"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {step > s ? <Check className="w-3.5 h-3.5" /> : s}
                        </div>
                        {s < 4 && <div className={`w-6 h-0.5 ${step > s ? "bg-gray-900" : "bg-gray-200"}`} />}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSubmit}>
                    {/* STEG 1: Velg Tjeneste */}
                    {step === 1 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="text-center mb-6">
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">Velg henvendelsestype</h3>
                          <p className="text-gray-500 text-sm">Velg den tjenesten som passer ditt behov.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 mb-6">
                          {/* 1. Lekkasjesøk */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => handleSelectIntent("lekkasjesok")}
                              className={`w-full p-3.5 rounded-2xl text-left border text-xs font-medium transition-all flex items-center justify-between ${
                                intent === "lekkasjesok"
                                  ? "border-[#F5B800] bg-amber-50/60 text-amber-950 ring-2 ring-[#F5B800]/30"
                                  : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <CalendarCheck className="w-5 h-5 text-amber-600 shrink-0" />
                                <div>
                                  <div className="font-bold text-sm text-gray-900">Bestille taklekkasjesøk</div>
                                  <div className="text-gray-800 font-semibold text-[11px] mt-0.5">
                                    Team (2 mann): kr 1 960,- eks. mva / t (+ kr 340,- bil/drift)
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setActiveInfo(activeInfo === "lekkasjesok" ? null : "lekkasjesok"); }}
                                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-white rounded-full transition-colors"
                              >
                                <Info className="w-4 h-4" />
                              </button>
                            </button>
                            {activeInfo === "lekkasjesok" && (
                              <div className="mt-2 p-3.5 bg-slate-900 text-white text-xs rounded-xl shadow-lg leading-relaxed border-l-4 border-[#F5B800]">
                                <strong className="text-[#F5B800] block mb-1">Hva innebærer et lekkasjesøk?</strong>
                                En systematisk teknisk undersøkelse for å avdekke den reelle årsaken til fukt eller lekkasje. Teamet kombinerer utvendig taksjekk med innvendig fuktmåling, og leverer en komplett tilstandsrapport med bildedokumentasjon.
                              </div>
                            )}
                          </div>

                          {/* 2. Takkontroll */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => handleSelectIntent("takkontroll")}
                              className={`w-full p-3.5 rounded-2xl text-left border text-xs font-medium transition-all flex items-center justify-between ${
                                intent === "takkontroll"
                                  ? "border-[#F5B800] bg-amber-50/60 text-amber-950 ring-2 ring-[#F5B800]/30"
                                  : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                                <div>
                                  <div className="font-bold text-sm text-gray-900">Takkontroll og inspeksjon</div>
                                  <div className="text-gray-800 font-semibold text-[11px] mt-0.5">
                                    Team (2 mann): kr 1 960,- eks. mva / t (+ kr 340,- bil/drift)
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setActiveInfo(activeInfo === "takkontroll" ? null : "takkontroll"); }}
                                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-white rounded-full transition-colors"
                              >
                                <Info className="w-4 h-4" />
                              </button>
                            </button>
                            {activeInfo === "takkontroll" && (
                              <div className="mt-2 p-3.5 bg-slate-900 text-white text-xs rounded-xl shadow-lg leading-relaxed border-l-4 border-blue-400">
                                <strong className="text-blue-400 block mb-1">Hva innebærer takkontroll?</strong>
                                En forebyggende gjennomgang av hele takflaten, beslag, sluk og gjennomføringer. Du får en tilstandsrapport som avdekker slitasje før det oppstår kostbare lekkasjer.
                              </div>
                            )}
                          </div>

                          {/* 3. Servicearbeid */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => handleSelectIntent("service")}
                              className={`w-full p-3.5 rounded-2xl text-left border text-xs font-medium transition-all flex items-center justify-between ${
                                intent === "service"
                                  ? "border-[#F5B800] bg-amber-50/60 text-amber-950 ring-2 ring-[#F5B800]/30"
                                  : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Wrench className="w-5 h-5 text-emerald-600 shrink-0" />
                                <div>
                                  <div className="font-bold text-sm text-gray-900">Servicearbeid og reparasjon</div>
                                  <div className="text-gray-800 font-semibold text-[11px] mt-0.5">
                                    Team (2 mann): kr 1 960,- eks. mva / t (+ kr 340,- bil/drift + evt. materiell)
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setActiveInfo(activeInfo === "service" ? null : "service"); }}
                                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-white rounded-full transition-colors"
                              >
                                <Info className="w-4 h-4" />
                              </button>
                            </button>
                            {activeInfo === "service" && (
                              <div className="mt-2 p-3.5 bg-slate-900 text-white text-xs rounded-xl shadow-lg leading-relaxed border-l-4 border-emerald-400">
                                <strong className="text-emerald-400 block mb-1">Hva innebærer servicearbeid?</strong>
                                Mindre utbedringer, tetting av kjente svakheter eller utskifting av beslag på stedet. Utføres på ordinære vilkår av 2 mannskap.
                              </div>
                            )}
                          </div>

                          {/* 4. AKUTT UTBEDRING NÅ */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => handleSelectIntent("akutt")}
                              className={`w-full p-3.5 rounded-2xl text-left border text-xs font-medium transition-all flex items-center justify-between ${
                                intent === "akutt"
                                  ? "border-red-500 bg-red-50 text-red-950 ring-2 ring-red-500/20"
                                  : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Zap className="w-5 h-5 text-red-600 shrink-0" />
                                <div>
                                  <div className="font-bold text-sm text-red-600">AKUTT UTBEDRING NÅ</div>
                                  <div className="text-red-900 font-bold text-[11px] mt-0.5">
                                    Akutt utrykning (2 mann): kr 3 920,- eks. mva / t (+ kr 340,- bil/drift)
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setActiveInfo(activeInfo === "akutt" ? null : "akutt"); }}
                                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-white rounded-full transition-colors"
                              >
                                <Info className="w-4 h-4 text-red-600" />
                              </button>
                            </button>
                            {activeInfo === "akutt" && (
                              <div className="mt-2 p-3.5 bg-red-950 text-white text-xs rounded-xl shadow-lg leading-relaxed border-l-4 border-red-500">
                                <strong className="text-red-400 block mb-1">Hvorfor påløper 100% tillegg?</strong>
                                Akuttutrykning krever at teamet mobiliserer umiddelbart, forlater pågående arbeid eller rykker ut utenfor ordinær arbeidstid. Reservert for situasjoner hvor vannet fosser inn og tiltak må iverksettes strakst.
                              </div>
                            )}
                          </div>

                          {/* 5. Digital Konsultasjon */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => handleSelectIntent("digital")}
                              className={`w-full p-3.5 rounded-2xl text-left border text-xs font-medium transition-all flex items-center justify-between ${
                                intent === "digital"
                                  ? "border-purple-500 bg-purple-50/60 text-purple-950 ring-2 ring-purple-500/20"
                                  : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Video className="w-5 h-5 text-purple-600 shrink-0" />
                                <div>
                                  <div className="font-bold text-sm text-gray-900">Digital Konsultasjon (Videomøte 45 min)</div>
                                  <div className="text-purple-900 font-semibold text-[11px] mt-0.5">
                                    Fastpris kr 1 490,- eks. mva (Direkte med prosjektansvarlig / daglig leder)
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setActiveInfo(activeInfo === "digital" ? null : "digital"); }}
                                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-white rounded-full transition-colors"
                              >
                                <Info className="w-4 h-4" />
                              </button>
                            </button>
                            {activeInfo === "digital" && (
                              <div className="mt-2 p-3.5 bg-slate-900 text-white text-xs rounded-xl shadow-lg leading-relaxed border-l-4 border-purple-400">
                                <strong className="text-purple-400 block mb-1">Hvem passer dette for?</strong>
                                Videomøte direkte med vår prosjektansvarlige eller daglig leder. Spesielt egnet for håndverkere, boligeiere som ønsker å utføre arbeidet selv, eller kunder utenfor Oslo og Akershus som ønsker faglig ingeniørrådgivning, tegningsevaluering eller vurdering av bildemateriale.
                              </div>
                            )}
                          </div>

                          {/* 6. Gratis Digital Befaring */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => handleSelectIntent("befaring")}
                              className={`w-full p-3.5 rounded-2xl text-left border text-xs font-medium transition-all flex items-center justify-between ${
                                intent === "befaring"
                                  ? "border-green-500 bg-green-50/60 text-green-950 ring-2 ring-green-500/20"
                                  : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Eye className="w-5 h-5 text-green-600 shrink-0" />
                                <div>
                                  <div className="font-bold text-sm text-gray-900">Gratis Digital Befaring (Maks 15 min)</div>
                                  <div className="text-green-800 font-bold text-[11px] mt-0.5">
                                    Kostnadsfri innledende prat & kortsjekk over video
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setActiveInfo(activeInfo === "befaring" ? null : "befaring"); }}
                                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-white rounded-full transition-colors"
                              >
                                <Info className="w-4 h-4 text-green-600" />
                              </button>
                            </button>
                            {activeInfo === "befaring" && (
                              <div className="mt-2 p-3.5 bg-slate-900 text-white text-xs rounded-xl shadow-lg leading-relaxed border-l-4 border-green-500">
                                <strong className="text-green-400 block mb-1">Hva er en gratis digital befaring?</strong>
                                Et kort uforpliktende videomøte (15 min) for å se på situasjonen sammen, avklare om det trengs et fysisk lekkasjesøk eller service, og gi deg retning videre før du bestiller.
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="w-full bg-[#F5B800] hover:bg-[#e0a800] text-gray-900 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          Neste: Bygning & Oppdragsdetaljer <ChevronRight className="w-4 h-4" />
                        </button>
                      </motion.div>
                    )}

                    {/* STEG 2: Bygnings- og oppdragsdetaljer */}
                    {step === 2 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="text-center mb-5">
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">Bygning & Oppdragsdetaljer</h3>
                          <p className="text-gray-500 text-sm">Hjelp oss å forstå eiendommen og skadestedet.</p>
                        </div>

                        <div className="space-y-4 mb-6">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                              Hva slags bygning gjelder det?
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {[
                                { id: "enebolig", label: "Enebolig" },
                                { id: "tomannsbolig", label: "Tomannsbolig" },
                                { id: "sameie_rekkehus", label: "Sameie (rekkehus)" },
                                { id: "sameie_blokk", label: "Sameie (blokk)" },
                                { id: "naering", label: "Næringsbygg" },
                                { id: "annen", label: "Annet" },
                              ].map((b) => (
                                <button
                                  key={b.id}
                                  type="button"
                                  onClick={() => setBuildingType(b.id as BuildingType)}
                                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    buildingType === b.id
                                      ? "bg-gray-900 text-white border-gray-900"
                                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                                  }`}
                                >
                                  {b.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                              Hva slags tak eller overflate gjelder det?
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {[
                                { id: "flattak", label: "Flatt tak (PVC/Papp)" },
                                { id: "skråtak", label: "Skråtak" },
                                { id: "takstein", label: "Takstein" },
                                { id: "papptak", label: "Papptak" },
                                { id: "balkong", label: "Balkong / Terrasse" },
                                { id: "dekke", label: "Parkeringstak / Dekke" },
                                { id: "annen", label: "Annet / Usikker" },
                              ].map((t) => (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => setRoofType(t.id as RoofType)}
                                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    roofType === t.id
                                      ? "bg-gray-900 text-white border-gray-900"
                                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                                  }`}
                                >
                                  {t.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                              Hvor antas skaden / oppdraget å være?
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {[
                                { id: "pipe", label: "Pipegjennomføring" },
                                { id: "vindu", label: "Takvindu / Kvist" },
                                { id: "flate", label: "Åpen takflate" },
                                { id: "rennestein", label: "Takrenne / Nedløp" },
                                { id: "balkong_sluk", label: "Balkong / Sluk / Slitasje" },
                                { id: "ukjent", label: "Ukjent / Trenger søk" },
                              ].map((l) => (
                                <button
                                  key={l.id}
                                  type="button"
                                  onClick={() => setLeakLocation(l.id as LeakLocation)}
                                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    leakLocation === l.id
                                      ? "bg-gray-900 text-white border-gray-900"
                                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                                  }`}
                                >
                                  {l.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                              Har du bilder eller dokumentasjon?
                            </label>
                            <button
                              type="button"
                              onClick={() => setHasImages(!hasImages)}
                              className={`w-full py-3 px-4 rounded-xl border border-dashed text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                hasImages 
                                  ? "bg-green-50 border-green-300 text-green-800"
                                  : "bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              {hasImages ? <Check className="w-4 h-4 text-green-600" /> : <Upload className="w-4 h-4" />}
                              {hasImages ? "Bilder/filer er markert for opplasting" : "Klikk her for å legge til bilder / dokumentasjon"}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" /> Tilbake
                          </button>
                          <button
                            type="button"
                            onClick={() => setStep(3)}
                            className="flex-1 bg-[#F5B800] hover:bg-[#e0a800] text-gray-900 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                          >
                            Neste: Kontaktopplysninger <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* STEG 3: Kontaktopplysninger */}
                    {step === 3 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="text-center mb-4">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            Kontaktopplysninger
                          </h3>
                          <p className="text-gray-500 text-xs">
                            Registrer kontaktinformasjonen din. Tidspunkt velges senere i kundeportalen.
                          </p>
                        </div>

                        <div className="flex justify-center gap-3 mb-3">
                          {(["privat", "foretak"] as const).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setContactType(type)}
                              className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                contactType === type ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {type === "privat" ? "Privatperson" : "Foretak"}
                            </button>
                          ))}
                        </div>

                        {contactType === "foretak" && (
                          <div className="mb-3">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                              Type foretak
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setOrganizationType("B2B")}
                                className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition-all ${
                                  organizationType === "B2B"
                                    ? "border-gray-900 bg-gray-900 text-white"
                                    : "border-gray-200 bg-gray-50 text-gray-600"
                                }`}
                              >
                                Bedrift / Foretak
                              </button>
                              <button
                                type="button"
                                onClick={() => setOrganizationType("Borettslag/Sameie")}
                                className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition-all ${
                                  organizationType === "Borettslag/Sameie"
                                    ? "border-gray-900 bg-gray-900 text-white"
                                    : "border-gray-200 bg-gray-50 text-gray-600"
                                }`}
                              >
                                Borettslag / Sameie
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2.5">
                          {contactType === "foretak" && (
                            <div className="space-y-3 bg-gray-100/70 p-3 rounded-2xl border border-gray-200">
                              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2.5">
                                <input
                                  type="text"
                                  name="orgnr"
                                  inputMode="numeric"
                                  placeholder="Organisasjonsnummer (9 siffer)"
                                  required
                                  value={formData.orgnr}
                                  onChange={(e) => {
                                    handleChange(e);
                                    setBrregCompany(null);
                                    setBrregRoles([]);
                                    setBrregError(null);
                                  }}
                                  className={inputClasses}
                                />
                                <button
                                  type="button"
                                  onClick={lookupBrreg}
                                  disabled={brregLoading}
                                  className="px-4 py-3 rounded-xl bg-gray-900 text-white text-xs font-extrabold hover:bg-gray-800 disabled:opacity-50 transition-colors whitespace-nowrap"
                                >
                                  {brregLoading ? "Henter..." : "Hent fra BRREG"}
                                </button>
                              </div>

                              <input
                                type="text"
                                name="firmavn"
                                placeholder="Firmanavn"
                                required
                                value={formData.firmavn}
                                onChange={handleChange}
                                className={inputClasses}
                              />

                              {brregError && (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
                                  {brregError}
                                </div>
                              )}

                              {brregCompany && (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                                  <div className="flex items-center gap-2 text-emerald-800">
                                    <ShieldCheck className="w-4 h-4 shrink-0" />
                                    <span className="text-xs font-extrabold">
                                      Foretak bekreftet mot Brønnøysundregistrene
                                    </span>
                                  </div>
                                  <div className="mt-2 text-[11px] text-emerald-900 space-y-1">
                                    <p>
                                      <strong>{brregCompany.name}</strong>
                                      {brregCompany.organization_form_description
                                        ? ` · ${brregCompany.organization_form_description}`
                                        : ""}
                                    </p>
                                    {(brregCompany.address ||
                                      brregCompany.postal_code ||
                                      brregCompany.city) && (
                                      <p className="text-emerald-800">
                                        {[
                                          brregCompany.address,
                                          brregCompany.postal_code,
                                          brregCompany.city,
                                        ]
                                          .filter(Boolean)
                                          .join(", ")}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {brregRoles.length > 0 && (
                                <div className="rounded-xl border border-slate-200 bg-white p-3">
                                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                                    Registrerte roller i BRREG
                                  </p>
                                  <div className="mt-2 space-y-1.5">
                                    {brregRoles
                                      .filter((role) => role.holder_type === "person")
                                      .slice(0, 12)
                                      .map((role, index) => (
                                        <div
                                          key={`${role.name}-${role.role_code || index}`}
                                          className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                                        >
                                          <span className="text-[11px] font-bold text-slate-800">
                                            {role.name}
                                          </span>
                                          <span className="text-[10px] text-slate-500 text-right">
                                            {role.role || role.role_group || "Registrert rolle"}
                                          </span>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="pt-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                              {contactType === "foretak" ? "Hovedkontakt" : "Kontaktperson"}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <input type="text" name="fornavn" placeholder="Fornavn" required value={formData.fornavn} onChange={handleChange} className={inputClasses} />
                            <input type="text" name="etternavn" placeholder="Etternavn" required value={formData.etternavn} onChange={handleChange} className={inputClasses} />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <input type="email" name="epost" placeholder="E-postadresse" required value={formData.epost} onChange={handleChange} className={inputClasses} />
                            <input type="tel" name="telefon" placeholder="Telefonnummer" required value={formData.telefon} onChange={handleChange} className={inputClasses} />
                          </div>

                          {contactType === "foretak" && (
                            <input
                              type="text"
                              name="kontaktrolle"
                              placeholder="Rolle, f.eks. styreleder, vaktmester eller daglig leder"
                              value={formData.kontaktrolle}
                              onChange={handleChange}
                              className={inputClasses}
                            />
                          )}

                          {contactType === "foretak" &&
                            brregCompany &&
                            primaryContactNameForMatch && (
                              matchedBrregRole ? (
                                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-800">
                                  <Check className="w-4 h-4 shrink-0" />
                                  Kontaktpersonen finnes i BRREG som{" "}
                                  {matchedBrregRole.role ||
                                    matchedBrregRole.role_group ||
                                    "registrert rolle"}.
                                </div>
                              ) : (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                                  Kontaktpersonen er ikke funnet blant de registrerte rollene i BRREG. Personen kan fortsatt sende inn henvendelsen, men er ikke rolle-verifisert.
                                </div>
                              )
                            )}

                          <input type="text" name="adresse" placeholder="Gateadresse for oppdraget" value={formData.adresse} onChange={handleChange} className={inputClasses} />

                          <div className="grid grid-cols-2 gap-2.5">
                            <input type="text" name="postnr" placeholder="Postnummer" value={formData.postnr} onChange={handleChange} className={inputClasses} />
                            <input type="text" name="poststed" placeholder="Poststed" value={formData.poststed} onChange={handleChange} className={inputClasses} />
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50/70 p-3">
                          {!showAdditionalContact ? (
                            <button
                              type="button"
                              onClick={() => setShowAdditionalContact(true)}
                              className="w-full text-xs font-bold text-gray-700 hover:text-gray-950"
                            >
                              + {contactType === "foretak" ? "Legg til ekstra kontaktperson" : "Legg til medkontakt"}
                            </button>
                          ) : (
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                  {contactType === "foretak" ? "Ekstra kontaktperson" : "Medkontakt"}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setShowAdditionalContact(false)}
                                  className="text-[10px] font-bold text-gray-500 hover:text-gray-900"
                                >
                                  Fjern
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <input type="text" name="medkontakt_fornavn" placeholder="Fornavn" value={formData.medkontakt_fornavn} onChange={handleChange} className={inputClasses} />
                                <input type="text" name="medkontakt_etternavn" placeholder="Etternavn" value={formData.medkontakt_etternavn} onChange={handleChange} className={inputClasses} />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <input type="email" name="medkontakt_epost" placeholder="E-postadresse" value={formData.medkontakt_epost} onChange={handleChange} className={inputClasses} />
                                <input type="tel" name="medkontakt_telefon" placeholder="Telefonnummer" value={formData.medkontakt_telefon} onChange={handleChange} className={inputClasses} />
                              </div>

                              {contactType === "foretak" && (
                                <input
                                  type="text"
                                  name="medkontakt_rolle"
                                  placeholder="Rolle, f.eks. styremedlem, vaktmester eller forretningsfører"
                                  value={formData.medkontakt_rolle}
                                  onChange={handleChange}
                                  className={inputClasses}
                                />
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-5">
                          <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" /> Tilbake
                          </button>
                          <button
                            type="button"
                            onClick={() => setStep(4)}
                            className="flex-1 bg-[#F5B800] hover:bg-[#e0a800] text-gray-900 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                          >
                            Neste: Siste trinn & Oppsummering <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* STEG 4: Oppsummering & Bekreftelse */}
                    {step === 4 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="text-center mb-4">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">Oppsummering & Beskrivelse</h3>
                          <p className="text-gray-500 text-xs">Gå gjennom detaljene før du sender inn henvendelsen.</p>
                        </div>

                        <div className="mb-4">
                          <label className="block text-xs font-bold text-gray-700 mb-1">Utdyp situasjonen (Valgfritt):</label>
                          <textarea
                            name="henvendelse"
                            placeholder="Beskriv gjerne hvor det drypper eller spesielle ønsker..."
                            rows={2}
                            value={formData.henvendelse}
                            onChange={handleChange}
                            className={inputClasses + " resize-none"}
                          />
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 text-xs">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                            <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Bestillingsoppsummering</span>
                            <span className="bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                              {intent === "digital" ? "Digital Rådgivning" : intent === "befaring" ? "Digital Befaring" : intent === "akutt" ? "Akuttvakt" : intent === "takkontroll" ? "Takkontroll" : intent === "service" ? "Servicearbeid" : "Lekkasjesøk"}
                            </span>
                          </div>

                          <div className="space-y-2 text-slate-700">

                            {intent === "digital" ? (
                              <div className="flex justify-between text-purple-950 font-medium">
                                <span>Digital konsultasjon (45 min):</span>
                                <strong className="text-slate-900">Fastpris kr 1 490,- eks. mva</strong>
                              </div>
                            ) : intent === "befaring" ? (
                              <div className="flex justify-between text-green-900 font-bold">
                                <span>Digital befaring (15 min):</span>
                                <strong className="text-green-700">GRATIS</strong>
                              </div>
                            ) : intent === "akutt" ? (
                              <>
                                <div className="flex justify-between text-red-900 font-medium">
                                  <span>Akutt utrykning (2 mann):</span>
                                  <strong>kr 3 920,- eks. mva / time (100% vakt-tillegg)</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>Servicebil & rigg:</span>
                                  <strong className="text-slate-900">kr 340,- eks. mva / dag</strong>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                  <span>Eventuelt medgått materiell:</span>
                                  <strong>Faktureres i tillegg</strong>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex justify-between">
                                  <span>Sertifisert team (2 mann):</span>
                                  <strong className="text-slate-900">kr 1 960,- eks. mva / time</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>Servicebil & rigg:</span>
                                  <strong className="text-slate-900">kr 340,- eks. mva / dag</strong>
                                </div>
                                {(intent === "service" || intent === "takkontroll") && (
                                  <div className="flex justify-between text-slate-600">
                                    <span>Eventuelt medgått materiell:</span>
                                    <strong>Faktureres i tillegg</strong>
                                  </div>
                                )}
                              </>
                            )}

                            <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
                              <p className="flex items-center gap-1 text-slate-700 font-medium">
                                <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                {intent === "befaring" ? "Uforpliktende vurdering og faglige råd" : "Inkluderer tilstandsrapport og bildedokumentasjon"}
                              </p>
                            </div>
                          </div>

                          <label className="flex items-start gap-2.5 mt-3 pt-3 border-t border-slate-200 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={acceptedTerms}
                              onChange={(e) => setAcceptedTerms(e.target.checked)}
                              className="w-4 h-4 rounded text-[#F5B800] focus:ring-[#F5B800] border-gray-300 accent-[#F5B800] mt-0.5"
                            />
                            <span className="text-xs font-semibold text-slate-900 leading-tight">
                              Jeg bekrefter henvendelsen og oppgitte satser/betingelser for valgt tjeneste.
                            </span>
                          </label>
                        </div>

                        {serverError && (
                          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 text-xs text-red-600 font-medium mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                              <span>{serverError}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setServerError(null)}
                              className="text-red-700 font-bold hover:underline ml-2"
                            >
                              Lukk
                            </button>
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setStep(3)}
                            className="px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" /> Tilbake
                          </button>
                          <button
                            type="submit"
                            disabled={intent !== "befaring" && !acceptedTerms}
                            className={`flex-1 font-bold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                              intent === "befaring" || acceptedTerms
                                ? intent === "akutt"
                                  ? "bg-red-600 hover:bg-red-700 text-white shadow-lg cursor-pointer"
                                  : "bg-[#F5B800] hover:bg-[#e0a800] text-gray-900 shadow-md cursor-pointer"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            {intent === "akutt" ? "Send inn akutt henvendelse" : "Send inn henvendelse"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}