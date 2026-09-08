import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarCheck,
  Clock3,
  Camera,
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Search,
  Send,
  ShieldCheck,
  User,
  UserCheck,
  Users,
  Wrench,
  AlertTriangle,
  ClipboardList,
  Paperclip,
  Building2,
  Hammer,
  Home,
  Activity,
  FileCheck2,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import AdminReportReview, {
  type ReportData,
} from "../components/AdminReportReview";
import { apiUrl } from "../lib/api";
import InquiryMessages from "../components/InquiryMessages";
import InquiryCommunicationLog from "../components/project-manager/InquiryCommunicationLog";
export interface Inquiry {
  id: string;
  customer_id?: number | string | null;
  parent_id?: string | null;
  created_at?: string;
  createdAt?: string;
  inquiry_type?: string;
  type?: string;
  stage:
    | "digital_befaring"
    | "utfonring_felt"
    | "rapport_funn"
    | "varige_tiltak"
    | "garanti_5ar";
  recommended_service?: "lekkasjesok" | "service" | "takkontroll" | null;
  is_new?: boolean | number;
  customer_name?: string;
  customerName?: string;
  customer_type?: string;
  phone: string;
  email: string;
  address: string;
  postal_code?: string;
  city: string;
  roof_type?: string;
  roofType?: string;
  building_type?: string;
  estimated_price?: string;
  notes?: string;
  status?: string;
  assigned_to?: string | null;
  booking_date?: string | null;
  booking_time?: string | null;
  assigned_project_manager_id?: number | string | null;
  assigned_at?: string | null;
}

interface BrregSearchResult {
  organization_number: string;
  name: string;
  organization_form?: string | null;
  organization_form_description?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
}

interface InquiryDetailProps {
  inquiry: Inquiry;
  onBack: () => void;
  onUpdateInquiry: (updated: Inquiry) => void;
  onPreviewCustomer?: (inquiryId: number) => void;
}

interface ChecklistRow {
  id: number;
  inquiry_id: number;
  item_id: string;
  item_title: string;
  status: string;
  comment?: string | null;
  photo_url?: string | null;
  audio_url?: string | null;
}

interface PhotoRow {
  id: number;
  inquiry_id: number;
  photo_url: string;
  audio_url?: string | null;
  caption_text?: string | null;
}

interface PropertyImageData {
  image_url: string;
  source: "streetview" | "satellite";
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
}

interface CompletionReportMini {
  id: number;
  status?: string | null;
  pdf_url?: string | null;
  published_at?: string | null;
  revision_no?: number | null;
}


interface PreinspectionData {
  id?: number;
  inquiry_id?: number;
  problem_description?: string | null;
  problem_started_date?: string | null;
  problem_discovered_date?: string | null;
  insurance_case?: number | boolean | null;
  insurance_details?: string | null;
  other_companies_involved?: number | boolean | null;
  other_companies_details?: string | null;
  work_since_takeover?: number | boolean | null;
  work_description?: string | null;
  work_performed_by_professionals?: number | boolean | null;
  self_performed_work?: number | boolean | null;
  building_application?: number | boolean | null;
  building_application_details?: string | null;
  last_maintenance_date?: string | null;
  last_maintenance_details?: string | null;
  additional_information?: string | null;
  submitted_at?: string | null;
}

interface PreinspectionFile {
  id: number;
  inquiry_id: number;
  preinspection_id: number;
  category: string;
  file_url: string;
  original_name?: string | null;
  created_at?: string | null;
}

interface Offer {
  id: number;
  inquiry_id: number;
  service: string;
  title: string;
  description?: string | null;
  hourly_rate?: number | string | null;
  team_rate?: number | string | null;
  vehicle_rate?: number | string | null;
  material_note?: string | null;
  terms?: string | null;
  status: "utkast" | "publisert" | "akseptert" | "avvist" | string;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  published_at?: string | null;
  accepted_at?: string | null;
  rejected_at?: string | null;
}

interface Employee {
  id: number;
  name: string;
  role: "Prosjektleder" | "Tekniker" | "Blikkenslager" | "Lærling";
  email: string;
  phone: string;
  status: "Aktiv" | "Inaktiv";
}

interface TeamMember {
  id: number;
  inquiry_id: number;
  employee_id: number;
  role: "Prosjektleder" | "Tekniker";
  name: string;
  email?: string;
  phone?: string;
  employee_status?: string;
  employee_role?: string;
}

function serviceLabel(service?: Inquiry["recommended_service"]) {
  switch (service) {
    case "lekkasjesok":
      return "Lekkasjesøk";
    case "service":
      return "Service";
    case "takkontroll":
      return "Takkontroll";
    default:
      return "Ikke valgt";
  }
}

function reportStatusLabel(status?: string) {
  switch (status) {
    case "utkast":
      return "Utkast hos feltteam";
    case "sendt_til_admin":
      return "Sendt til admin";
    case "under_gjennomgang":
      return "Under admin-gjennomgang";
    case "godkjent":
      return "Godkjent";
    case "publisert":
      return "Publisert";
    default:
      return "Ikke startet";
  }
}


function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
      <span className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
        {label}
      </span>
      <span className="text-xs font-bold text-slate-200">{value}</span>
    </div>
  );
}

function DetailBlock({
  title,
  icon,
  yesNo,
  details,
  extra = [],
  files = [],
}: {
  title: string;
  icon: React.ReactNode;
  yesNo?: string;
  details?: string | null;
  extra?: string[];
  files?: PreinspectionFile[];
}) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-xs font-extrabold text-white flex items-center gap-2">
          {icon}
          {title}
        </h4>
        {yesNo && (
          <span className="text-[10px] font-extrabold px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            {yesNo}
          </span>
        )}
      </div>

      {details && (
        <p className="text-[11px] text-slate-300 whitespace-pre-wrap leading-5">
          {details}
        </p>
      )}

      {extra.length > 0 && (
        <div className="space-y-1">
          {extra.map((item) => (
            <p key={item} className="text-[11px] text-slate-500">
              {item}
            </p>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="pt-2 border-t border-slate-800 space-y-1.5">
          {files.map((file) => (
            <a
              key={file.id}
              href={file.file_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-[11px] text-amber-400 hover:text-amber-300"
            >
              <Paperclip className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {file.original_name || file.file_url}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function InquiryDetail({
  inquiry,
  onBack,
  onUpdateInquiry,
  onPreviewCustomer,
}: InquiryDetailProps) {
  const inquiryId = Number(inquiry.id);
  const isDigitalBefaring = inquiry.stage === "digital_befaring";

  const [checklists, setChecklists] = useState<ChecklistRow[]>([]);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [completionReport, setCompletionReport] =
    useState<CompletionReportMini | null>(null);
  const [propertyImage, setPropertyImage] =
    useState<PropertyImageData | null>(null);
  const [loadingFieldStatus, setLoadingFieldStatus] = useState(true);
  const [fieldError, setFieldError] = useState("");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projectManagerId, setProjectManagerId] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [currentProjectManager, setCurrentProjectManager] = useState<TeamMember | null>(null);
  const [currentTechnician, setCurrentTechnician] = useState<TeamMember | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [savingTeam, setSavingTeam] = useState(false);
  const [teamError, setTeamError] = useState("");
  const [teamMessage, setTeamMessage] = useState("");

  const [preinspection, setPreinspection] = useState<PreinspectionData | null>(null);
  const [preinspectionFiles, setPreinspectionFiles] = useState<PreinspectionFile[]>([]);
  const [loadingPreinspection, setLoadingPreinspection] = useState(false);
  const [preinspectionError, setPreinspectionError] = useState("");
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loadingOffer, setLoadingOffer] = useState(false);
  const [savingOffer, setSavingOffer] = useState(false);
  const [offerError, setOfferError] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [showPublishedOfferDetails, setShowPublishedOfferDetails] = useState(false);
  const [handlingRejectedOffer, setHandlingRejectedOffer] = useState(false);
  const [offerForm, setOfferForm] = useState({
    title: "",
    description: "",
    hourly_rate: "",
    team_rate: "",
    vehicle_rate: "",
    material_note: "",
    terms: "",
  });

  const [showServiceChange, setShowServiceChange] = useState(false);
  const [serviceChangeContactName, setServiceChangeContactName] = useState("");
  const [serviceChangeContactPhone, setServiceChangeContactPhone] = useState("");
  const [serviceChangeNote, setServiceChangeNote] = useState("");
  const [savingServiceChange, setSavingServiceChange] = useState(false);
  const [serviceChangeError, setServiceChangeError] = useState("");
  const [serviceChangeMessage, setServiceChangeMessage] = useState("");

  const [showCustomerConversion, setShowCustomerConversion] = useState(false);
  const [customerConversionType, setCustomerConversionType] =
    useState<"Borettslag/Sameie" | "B2B">("Borettslag/Sameie");
  const [brregSearchQuery, setBrregSearchQuery] = useState(() => {
    const address = String(inquiry.address || "")
      .replace(/,?\s*\d{4}\s+.*$/i, "")
      .trim();
    return address ? `${address} sameie` : "";
  });
  const [brregSearchResults, setBrregSearchResults] = useState<BrregSearchResult[]>([]);
  const [selectedBrregCompany, setSelectedBrregCompany] =
    useState<BrregSearchResult | null>(null);
  const [searchingBrreg, setSearchingBrreg] = useState(false);
  const [savingCustomerConversion, setSavingCustomerConversion] = useState(false);
  const [customerConversionError, setCustomerConversionError] = useState("");
  const [customerConversionMessage, setCustomerConversionMessage] = useState("");

  const searchBrregForCustomerConversion = async () => {
    const query = brregSearchQuery.trim();

    if (query.length < 2) {
      setCustomerConversionError("Skriv minst 2 tegn i BRREG-søket.");
      return;
    }

    setSearchingBrreg(true);
    setCustomerConversionError("");
    setCustomerConversionMessage("");
    setSelectedBrregCompany(null);

    try {
      const res = await fetch(
        apiUrl(`/brreg_search.php?q=${encodeURIComponent(query)}`)
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke søke i BRREG.");
      }

      const rows = Array.isArray(data.results) ? data.results : [];
      setBrregSearchResults(rows);

      if (rows.length === 0) {
        setCustomerConversionError(
          "Ingen BRREG-treff. Juster navnet og søk på nytt."
        );
      }
    } catch (err) {
      setBrregSearchResults([]);
      setCustomerConversionError(
        err instanceof Error ? err.message : "Kunne ikke søke i BRREG."
      );
    } finally {
      setSearchingBrreg(false);
    }
  };

  const convertInquiryCustomer = async () => {
    if (!selectedBrregCompany?.organization_number) {
      setCustomerConversionError("Velg riktig virksomhet fra BRREG først.");
      return;
    }

    setSavingCustomerConversion(true);
    setCustomerConversionError("");
    setCustomerConversionMessage("");

    try {
      const res = await fetch(apiUrl("/convert_inquiry_customer.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiry_id: inquiryId,
          organization_number: selectedBrregCompany.organization_number,
          target_customer_type: customerConversionType,
          contact_name:
            inquiry.customer_name || inquiry.customerName || "Kontaktperson",
          contact_email: inquiry.email || "",
          contact_phone: inquiry.phone || "",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.inquiry) {
        throw new Error(
          data.message || "Kunne ikke konvertere kunden."
        );
      }

      onUpdateInquiry(data.inquiry);
      setCustomerConversionMessage(
        data.message || "Kunden er konvertert og saken er oppdatert."
      );
      setShowCustomerConversion(false);
      setBrregSearchResults([]);
      setSelectedBrregCompany(null);
    } catch (err) {
      setCustomerConversionError(
        err instanceof Error
          ? err.message
          : "Kunne ikke konvertere kunden."
      );
    } finally {
      setSavingCustomerConversion(false);
    }
  };

  type AdminCaseTab =
    | "customer"
    | "team"
    | "offer"
    | "messages"
    | "field"
    | "documents"
    | "reports";

  const [adminCaseTab, setAdminCaseTab] = useState<AdminCaseTab>(() => {
    const status = String(inquiry.status || "").toLowerCase();

    if (
      inquiry.recommended_service &&
      ["venter_pa_tilbud", "tilbud_sendt", "tilbud_akseptert", "tilbud_avvist", "avsluttet"].includes(
        status
      )
    ) {
      return "offer";
    }

    return isDigitalBefaring ? "customer" : "field";
  });

  useEffect(() => {
    const status = String(inquiry.status || "").toLowerCase();

    if (
      inquiry.recommended_service &&
      ["venter_pa_tilbud", "tilbud_sendt", "tilbud_akseptert", "tilbud_avvist", "avsluttet"].includes(
        status
      )
    ) {
      setAdminCaseTab("offer");
    }
  }, [inquiry.status, inquiry.recommended_service]);

  const [communicationView, setCommunicationView] = useState<
    "messages" | "log"
  >("messages");

  const getStageBadge = (stage: Inquiry["stage"] | string) => {
    const rawStage = (stage || "").toLowerCase();

    if (rawStage === "garanti_5ar") {
      return (
        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold uppercase inline-flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          5 Års Garanti
        </span>
      );
    }

    if (rawStage === "varige_tiltak") {
      return (
        <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/40 rounded-xl text-xs font-bold uppercase inline-flex items-center gap-1.5">
          <Wrench className="w-4 h-4" />
          Varige tiltak
        </span>
      );
    }

    if (rawStage === "rapport_funn") {
      return (
        <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-bold uppercase inline-flex items-center gap-1.5">
          <FileText className="w-4 h-4" />
          Rapport & funn
        </span>
      );
    }

    if (rawStage === "utfonring_felt") {
      return (
        <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold uppercase inline-flex items-center gap-1.5">
          <CalendarCheck className="w-4 h-4" />
          Utførelse i felt · {serviceLabel(inquiry.recommended_service)}
        </span>
      );
    }

    return (
      <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/30 rounded-xl text-xs font-bold uppercase inline-flex items-center gap-1.5">
        <Eye className="w-4 h-4" />
        Digital befaring
      </span>
    );
  };

  const yesNoLabel = (value: unknown) => {
    if (value === 1 || value === true || value === "1" || value === "true") {
      return "Ja";
    }

    if (value === 0 || value === false || value === "0" || value === "false") {
      return "Nei";
    }

    return "Ikke oppgitt";
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "Ikke oppgitt";

    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("nb-NO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const filesForCategory = (category: string) =>
    preinspectionFiles.filter((file) => file.category === category);

  const fetchPreinspection = async () => {
    if (!inquiryId) return;

    setLoadingPreinspection(true);
    setPreinspectionError("");

    try {
      const res = await fetch(
        apiUrl(`/preinspection.php?inquiry_id=${inquiryId}`)
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Kunne ikke hente kundens forhåndskartlegging."
        );
      }

      setPreinspection(data.preinspection || null);
      setPreinspectionFiles(
        Array.isArray(data.files) ? data.files : []
      );
    } catch (err) {
      setPreinspectionError(
        err instanceof Error
          ? err.message
          : "Kunne ikke hente kundens forhåndskartlegging."
      );
    } finally {
      setLoadingPreinspection(false);
    }
  };

  const buildLeakSearchOfferDescription = () => {
    const parts: string[] = [];

    if (preinspection?.problem_description?.trim()) {
      parts.push(
        `Kundens beskrivelse av problemet: ${preinspection.problem_description.trim()}`
      );
    }

    const notes = String(inquiry.notes || "");
    const changeBlocks = [
      ...notes.matchAll(
        /\[Bestillingsendring[^\]]*\]\s*([\s\S]*?)(?=\n\n\[|$)/giu
      ),
    ];

    const latestChange = changeBlocks.at(-1)?.[1]?.trim();

    if (latestChange) {
      const noteMatch = latestChange.match(
        /Notat:\s*([\s\S]*?)(?=\nRegistrert av:|$)/iu
      );
      const contactMatch = latestChange.match(/Kontaktperson:\s*(.+)/iu);

      if (noteMatch?.[1]?.trim()) {
        parts.push(`Avtalt med kunden: ${noteMatch[1].trim()}`);
      }

      if (contactMatch?.[1]?.trim()) {
        parts.push(`Kontaktperson: ${contactMatch[1].trim()}`);
      }
    }

    if (parts.length === 0) {
      parts.push(
        "Lekkasjesøk for å lokalisere årsaken til den registrerte lekkasjen og avklare nødvendige videre tiltak."
      );
    }

    return parts.join("\n\n");
  };

  const hydrateOfferForm = (value: Offer | null) => {
    const service = inquiry.recommended_service;
    const isLeakSearch = service === "lekkasjesok";

    setOfferForm({
      title:
        value?.title ||
        (isLeakSearch
          ? "Pristilbud – lekkasjesøk"
          : service === "takkontroll"
          ? "Tilbud på takkontroll"
          : service === "service"
          ? "Tilbud på service"
          : "Tilbud på videre oppfølging"),
      description:
        value?.description ||
        (isLeakSearch
          ? [
              buildLeakSearchOfferDescription(),
              "Oppdraget utføres etter medgått tid. Endelig omfang og årsak fastslås etter teknisk undersøkelse på stedet.",
            ]
              .filter(Boolean)
              .join("\n\n")
          : ""),
      hourly_rate:
        value?.hourly_rate !== null && value?.hourly_rate !== undefined
          ? String(value.hourly_rate)
          : isLeakSearch
          ? "980"
          : "",
      team_rate:
        value?.team_rate !== null && value?.team_rate !== undefined
          ? String(value.team_rate)
          : isLeakSearch
          ? "1960"
          : "",
      vehicle_rate:
        value?.vehicle_rate !== null && value?.vehicle_rate !== undefined
          ? String(value.vehicle_rate)
          : isLeakSearch
          ? "340"
          : "",
      material_note: value?.material_note || "",
      terms:
        value?.terms ||
        (isLeakSearch
          ? "Arbeid utover beskrevet omfang avklares med kunden før utførelse. Fakturering skjer etter faktisk medgått tid og eventuelt materiell."
          : ""),
    });
  };

  const fetchOffer = async () => {
    if (!inquiryId) return;

    setLoadingOffer(true);
    setOfferError("");

    try {
      const res = await fetch(apiUrl(`/offers.php?inquiry_id=${inquiryId}`));
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke hente tilbudet.");
      }

      const latestOffer = data.offer || null;
      setOffer(latestOffer);
      hydrateOfferForm(latestOffer);
    } catch (err) {
      setOfferError(
        err instanceof Error ? err.message : "Kunne ikke hente tilbudet."
      );
    } finally {
      setLoadingOffer(false);
    }
  };

  const offerPayload = () => ({
    service: inquiry.recommended_service,
    title: offerForm.title.trim(),
    description: offerForm.description.trim(),
    hourly_rate: offerForm.hourly_rate,
    team_rate: offerForm.team_rate,
    vehicle_rate: offerForm.vehicle_rate,
    material_note: offerForm.material_note.trim(),
    terms: offerForm.terms.trim(),
  });

  const saveOfferDraft = async () => {
    if (!inquiry.recommended_service) {
      setOfferError("Prosjektansvarlig har ikke valgt anbefalt tjeneste.");
      return;
    }

    setSavingOffer(true);
    setOfferError("");
    setOfferMessage("");

    try {
      const res = await fetch(apiUrl("/offers.php"), {
        method: offer ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          offer
            ? { id: offer.id, ...offerPayload() }
            : { inquiry_id: inquiryId, ...offerPayload(), created_by: "Admin" }
        ),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke lagre tilbudet.");
      }

      setOffer(data.offer || null);
      hydrateOfferForm(data.offer || null);
      setOfferMessage("Tilbudsutkastet er lagret.");
    } catch (err) {
      setOfferError(
        err instanceof Error ? err.message : "Kunne ikke lagre tilbudet."
      );
    } finally {
      setSavingOffer(false);
    }
  };

  const handleRejectedOfferAction = async (
    action: "revise_offer" | "close_case"
  ) => {
    if (!offer?.id || offer.status !== "avvist") {
      setOfferError("Fant ikke et avvist tilbud å følge opp.");
      return;
    }

    if (
      action === "close_case" &&
      !window.confirm(
        "Avslutte saken etter at kunden har avvist tilbudet? Tilbud og kommunikasjon beholdes i historikken."
      )
    ) {
      return;
    }

    setHandlingRejectedOffer(true);
    setOfferError("");
    setOfferMessage("");

    try {
      const res = await fetch(apiUrl("/admin_offer_rejection.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiry_id: inquiryId,
          offer_id: offer.id,
          action,
          changed_by: "Admin",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message ||
            (action === "revise_offer"
              ? "Kunne ikke opprette revidert tilbud."
              : "Kunne ikke avslutte saken.")
        );
      }

      if (data.inquiry) {
        onUpdateInquiry(data.inquiry);
      }

      if (action === "revise_offer") {
        const nextOffer = data.offer || null;
        setOffer(nextOffer);
        hydrateOfferForm(nextOffer);
        setShowPublishedOfferDetails(true);
        setOfferMessage(
          data.message ||
            "Nytt tilbudsutkast er opprettet. Kontroller endringene før du publiserer."
        );
      } else {
        setOfferMessage(
          data.message ||
            "Saken er avsluttet. Tilbud og kommunikasjon er beholdt i historikken."
        );
      }
    } catch (err) {
      setOfferError(
        err instanceof Error
          ? err.message
          : "Kunne ikke følge opp det avviste tilbudet."
      );
    } finally {
      setHandlingRejectedOffer(false);
    }
  };

  const handleChangeToLeakSearch = async () => {
    const contactName = serviceChangeContactName.trim();
    const contactPhone = serviceChangeContactPhone.trim();
    const note = serviceChangeNote.trim();

    if (!contactName) {
      setServiceChangeError("Oppgi hvem som tok kontakt.");
      return;
    }

    if (!contactPhone) {
      setServiceChangeError("Oppgi telefonnummeret kontakten kom fra.");
      return;
    }

    if (!note) {
      setServiceChangeError("Skriv et kort notat om hva kunden ba om.");
      return;
    }

    setSavingServiceChange(true);
    setServiceChangeError("");
    setServiceChangeMessage("");

    try {
      const res = await fetch(apiUrl("/admin_service_change.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiry_id: inquiryId,
          action: "cancel_free_inspection_and_order_leak_search",
          contact_name: contactName,
          contact_phone: contactPhone,
          note,
          changed_by: "Admin",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.inquiry) {
        throw new Error(
          data.message || "Kunne ikke endre bestillingen til lekkasjesøk."
        );
      }

      onUpdateInquiry(data.inquiry);
      setServiceChangeMessage(
        "Gratis befaring er avbestilt og saken er endret til lekkasjesøk. Opprett og send tilbudet i fanen «Tilbud og avtale»."
      );
      setShowServiceChange(false);
      setAdminCaseTab("offer");
    } catch (err) {
      setServiceChangeError(
        err instanceof Error
          ? err.message
          : "Kunne ikke endre bestillingen til lekkasjesøk."
      );
    } finally {
      setSavingServiceChange(false);
    }
  };

  const sendOfferNotifications = async (offerId: number) => {
    const res = await fetch(apiUrl("/send_offer_notifications.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inquiry_id: inquiryId,
        offer_id: offerId,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(
        data.message ||
          "Tilbudet ble publisert, men kundevarslingen kunne ikke fullføres."
      );
    }

    return data;
  };

  const publishOffer = async () => {
    if (!inquiry.recommended_service) {
      setOfferError("Prosjektansvarlig har ikke valgt anbefalt tjeneste.");
      return;
    }

    setSavingOffer(true);
    setOfferError("");
    setOfferMessage("");

    try {
      let offerToPublish = offer;

      if (!offerToPublish) {
        const createRes = await fetch(apiUrl("/offers.php"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inquiry_id: inquiryId,
            ...offerPayload(),
            created_by: "Admin",
          }),
        });
        const createData = await createRes.json();

        if (!createRes.ok || !createData.success || !createData.offer) {
          throw new Error(
            createData.message || "Kunne ikke opprette tilbudsutkastet."
          );
        }
        offerToPublish = createData.offer as Offer;
      } else {
        const saveRes = await fetch(apiUrl("/offers.php"), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: offerToPublish.id,
            ...offerPayload(),
          }),
        });
        const saveData = await saveRes.json();

        if (!saveRes.ok || !saveData.success || !saveData.offer) {
          throw new Error(saveData.message || "Kunne ikke lagre tilbudet.");
        }
        offerToPublish = saveData.offer;
      }

      if (!offerToPublish) {
        throw new Error("Tilbudsutkastet mangler og kan ikke publiseres.");
      }

      const publishRes = await fetch(apiUrl("/offers.php"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: offerToPublish.id,
          publish: true,
        }),
      });
      const publishData = await publishRes.json();

      if (!publishRes.ok || !publishData.success) {
        throw new Error(
          publishData.message || "Kunne ikke publisere tilbudet."
        );
      }

      const publishedOffer = publishData.offer || offerToPublish;

      setOffer(publishedOffer);
      hydrateOfferForm(publishedOffer);
      onUpdateInquiry({ ...inquiry, status: "tilbud_sendt" });

      try {
        await sendOfferNotifications(Number(publishedOffer.id));
        setOfferMessage(
          "Tilbudet er publisert. Kunden er varslet med SMS og e-post."
        );
      } catch (notificationError) {
        console.error("Kundevarsling etter publisering feilet:", notificationError);
        setOfferMessage(
          "Tilbudet er publisert til kundeportalen, men én eller flere varslinger feilet. Kontroller kommunikasjonsloggen."
        );
      }
    } catch (err) {
      setOfferError(
        err instanceof Error ? err.message : "Kunne ikke publisere tilbudet."
      );
    } finally {
      setSavingOffer(false);
    }
  };

  const fetchTeamData = async () => {
    if (!inquiryId) return;

    setLoadingTeam(true);
    setTeamError("");

    try {
      const [employeesRes, teamRes] = await Promise.all([
        fetch(apiUrl("/employees.php")),
        fetch(apiUrl(`/inquiry_team.php?inquiry_id=${inquiryId}`)),
      ]);

      const [employeesData, teamData] = await Promise.all([
        employeesRes.json(),
        teamRes.json(),
      ]);

      if (!employeesRes.ok || !Array.isArray(employeesData)) {
        throw new Error(
          employeesData?.message || "Kunne ikke hente ansattregisteret."
        );
      }

      setEmployees(employeesData);

      if (!teamRes.ok || !teamData.success) {
        throw new Error(teamData.message || "Kunne ikke hente oppdragsteamet.");
      }

      const projectManager = teamData.project_manager || null;
      const technician = teamData.technician || null;

      setCurrentProjectManager(projectManager);
      setCurrentTechnician(technician);

      setProjectManagerId(
        projectManager?.employee_id
          ? String(projectManager.employee_id)
          : ""
      );

      setTechnicianId(
        technician?.employee_id
          ? String(technician.employee_id)
          : ""
      );
    } catch (err) {
      setTeamError(
        err instanceof Error
          ? err.message
          : "Kunne ikke hente teamtildeling."
      );
    } finally {
      setLoadingTeam(false);
    }
  };

  const saveTeamAssignment = async (
    employeeId: number,
    role: "Prosjektleder" | "Tekniker"
  ) => {
    const res = await fetch(apiUrl("/inquiry_team.php"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inquiry_id: inquiryId,
        employee_id: employeeId,
        role,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(
        data.message ||
          `Kunne ikke lagre ${role.toLowerCase()} på oppdraget.`
      );
    }
  };

  const markTransferredToProjectManager = async (
    managerId: number,
    managerName: string
  ) => {
    // Prosjektansvarlig lagres allerede via inquiry_team.php.
    // inquiries.php skal her kun flytte saken videre i workflowen.
    const res = await fetch(apiUrl("/inquiries.php"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: inquiryId,
        status: "tildelt_prosjektansvarlig",
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(
        data.message ||
          "Prosjektansvarlig ble lagret, men saken kunne ikke overføres."
      );
    }

    return (
      data.inquiry ||
      data.updated || {
        ...inquiry,
        status: "tildelt_prosjektansvarlig",
        assigned_to: managerName,
        assigned_project_manager_id: managerId,
      }
    );
  };

  const handleSaveTeam = async () => {
    const managerId = Number(projectManagerId);
    const techId = Number(technicianId);

    if (!managerId) {
      setTeamError("Velg prosjektansvarlig før tildelingen lagres.");
      return;
    }

    if (!isDigitalBefaring && !techId) {
      setTeamError(
        "Velg både prosjektansvarlig og tekniker før teamet lagres."
      );
      return;
    }

    if (!isDigitalBefaring && managerId === techId) {
      setTeamError(
        "Prosjektansvarlig og tekniker må være to forskjellige ansatte."
      );
      return;
    }

    setSavingTeam(true);
    setTeamError("");
    setTeamMessage("");

    try {
      await saveTeamAssignment(managerId, "Prosjektleder");

      // Digital befaring utføres kun av prosjektansvarlig.
      if (!isDigitalBefaring) {
        await saveTeamAssignment(techId, "Tekniker");
      }

      await fetchTeamData();

      const selectedManager = employees.find(
        (employee) => employee.id === managerId
      );

      if (selectedManager) {
        if (isDigitalBefaring) {
          const updatedFromApi =
            await markTransferredToProjectManager(
              managerId,
              selectedManager.name
            );

          onUpdateInquiry(
            updatedFromApi || {
              ...inquiry,
              status: "tildelt_prosjektansvarlig",
              assigned_to: selectedManager.name,
              assigned_project_manager_id: managerId,
            }
          );
        } else {
          onUpdateInquiry({
            ...inquiry,
            assigned_to: selectedManager.name,
          });
        }
      }

      setTeamMessage(
        isDigitalBefaring
          ? "Saken er kontrollert og overført til prosjektansvarlig."
          : "Oppdragsteamet er lagret."
      );
    } catch (err) {
      setTeamError(
        err instanceof Error
          ? err.message
          : isDigitalBefaring
          ? "Kunne ikke lagre prosjektansvarlig."
          : "Kunne ikke lagre oppdragsteamet."
      );
    } finally {
      setSavingTeam(false);
    }
  };

  const fetchPropertyImage = async () => {
    if (!inquiryId) return;

    try {
      const res = await fetch(
        apiUrl(`/property_image.php?inquiry_id=${inquiryId}`)
      );
      const data = await res.json();

      if (res.ok && data.success && data.image_url) {
        const apiOrigin = new URL(apiUrl("/")).origin;

        setPropertyImage({
          image_url: `${apiOrigin}${data.image_url}`,
          source: data.source,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          address: data.address ?? null,
        });
      } else {
        setPropertyImage(null);
      }
    } catch (err) {
      console.error("Kunne ikke hente eiendomsbilde i admin:", err);
      setPropertyImage(null);
    }
  };

  const fetchFieldStatus = async () => {
    if (!inquiryId) return;

    setLoadingFieldStatus(true);
    setFieldError("");

    try {
      const [checkRes, photoRes, reportRes, completionRes] = await Promise.all([
        fetch(apiUrl(`/checklists.php?inquiry_id=${inquiryId}`)),
        fetch(apiUrl(`/photos.php?inquiry_id=${inquiryId}`)),
        fetch(apiUrl(`/reports.php?inquiry_id=${inquiryId}`)),
        fetch(apiUrl(`/completion_reports.php?inquiry_id=${inquiryId}`)),
      ]);

      const [checkData, photoData, reportData, completionData] =
        await Promise.all([
          checkRes.json(),
          photoRes.json(),
          reportRes.json(),
          completionRes.json(),
        ]);

      setChecklists(
        checkRes.ok && checkData.success && Array.isArray(checkData.checklists)
          ? checkData.checklists
          : []
      );

      setPhotos(
        photoRes.ok && photoData.success && Array.isArray(photoData.photos)
          ? photoData.photos
          : []
      );

      setReport(
        reportRes.ok && reportData.success ? reportData.report || null : null
      );

      setCompletionReport(
        completionRes.ok && completionData.success
          ? completionData.report || null
          : null
      );
    } catch (err) {
      setFieldError(
        err instanceof Error
          ? err.message
          : "Kunne ikke hente feltstatus."
      );
    } finally {
      setLoadingFieldStatus(false);
    }
  };

  useEffect(() => {
    fetchFieldStatus();
    fetchTeamData();
    fetchPreinspection();
    fetchOffer();
    fetchPropertyImage();
  }, [inquiryId]);

  useEffect(() => {
    if (!inquiry.recommended_service) {
      return;
    }

    hydrateOfferForm(offer);
  }, [inquiry.recommended_service, offer?.id, offer?.status]);

  const activeChecklistItems = useMemo(
    () =>
      checklists.filter(
        (item) =>
          item.status &&
          item.status.toLowerCase() !== "ikke_aktuell"
      ),
    [checklists]
  );

  const deviations = useMemo(
    () =>
      checklists.filter((item) =>
        ["tg1", "tg2", "tg3"].includes(
          (item.status || "").toLowerCase()
        )
      ),
    [checklists]
  );

  const audioCount = useMemo(
    () =>
      checklists.filter((item) => Boolean(item.audio_url)).length +
      photos.filter((photo) => Boolean(photo.audio_url)).length,
    [checklists, photos]
  );

  const highDeviations = useMemo(
    () =>
      deviations.filter((item) =>
        ["tg2", "tg3"].includes(
          (item.status || "").toLowerCase()
        )
      ).length,
    [deviations]
  );

  const activeProjectManagers = useMemo(
    () =>
      employees.filter(
        (employee) =>
          employee.status === "Aktiv" &&
          employee.role === "Prosjektleder"
      ),
    [employees]
  );

  const activeTechnicians = useMemo(
    () =>
      employees.filter(
        (employee) =>
          employee.status === "Aktiv" &&
          ["Tekniker", "Blikkenslager", "Lærling"].includes(
            employee.role
          )
      ),
    [employees]
  );

  const tg2Count = deviations.filter(
    (item) => (item.status || "").toLowerCase() === "tg2"
  ).length;
  const tg3Count = deviations.filter(
    (item) => (item.status || "").toLowerCase() === "tg3"
  ).length;

  const addressLabel = [
    inquiry.address,
    inquiry.postal_code,
    inquiry.city,
  ]
    .filter(Boolean)
    .join(", ");

  const activeReportLabel = completionReport
    ? `Rapport 2 · ${reportStatusLabel(completionReport.status || undefined)}`
    : `Rapport 1 · ${reportStatusLabel(report?.status)}`;

  return (
    <div className="min-h-screen bg-[#070a11] text-white p-4 md:p-8">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Tilbake til oversikt
          </button>

          <div className="flex items-center gap-2">
            {onPreviewCustomer && (
              <button
                type="button"
                onClick={() => onPreviewCustomer(inquiryId)}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-black text-cyan-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/15"
                title="Åpne saken slik kunden ser den i kundeportalen"
              >
                <Eye className="h-4 w-4" />
                Se som kunde
              </button>
            )}

            {getStageBadge(inquiry.stage)}
          </div>
        </div>

        <section
          id="overview"
          className="scroll-mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-[#0b1b2c] via-[#0a1726] to-[#08121f]"
        >
          <div className="grid lg:grid-cols-[minmax(0,1fr)_330px]">
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center md:p-6">
              {propertyImage?.image_url ? (
                <div className="h-32 w-full shrink-0 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 sm:w-52">
                  <img
                    src={propertyImage.image_url}
                    alt={`Eiendommen ${addressLabel}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="grid h-32 w-full shrink-0 place-items-center rounded-2xl border border-slate-700 bg-slate-950 text-amber-300 sm:w-52">
                  <Home className="h-9 w-9" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                  {addressLabel || `Oppdrag #${inquiry.id}`}
                </h1>

                <p className="mt-2 text-xs text-slate-400">
                  Kunde: {inquiry.customer_name || inquiry.customerName || "Ukjent"}
                  <span className="mx-2 text-slate-700">•</span>
                  Sak #{inquiry.id}
                  <span className="mx-2 text-slate-700">•</span>
                  {serviceLabel(inquiry.recommended_service)}
                </p>

                <p className="mt-3 text-[11px] text-slate-500">
                  {inquiry.roof_type || inquiry.roofType || "Generelt tak"}
                  {inquiry.building_type ? ` · ${inquiry.building_type}` : ""}
                </p>

                {propertyImage && (
                  <p className="mt-1 text-[9px] uppercase tracking-wider text-slate-600">
                    Eiendomsbilde · {propertyImage.source === "streetview" ? "Fasade" : "Satellitt"}
                  </p>
                )}

                {String(inquiry.status || "").toLowerCase() === "avsluttet" ? (
                  <span className="mt-4 inline-flex rounded-full border border-slate-600 bg-slate-800/70 px-3 py-1 text-[9px] font-black uppercase text-slate-300">
                    Avsluttet sak
                  </span>
                ) : (
                  <span className="mt-4 inline-flex rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[9px] font-black uppercase text-emerald-300">
                    Aktiv sak
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-slate-800 bg-slate-950/25 p-5 lg:border-l lg:border-t-0">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                Status
              </p>

              <div className="mt-4 space-y-4">
                {[
                  [
                    activeReportLabel,
                    completionReport?.published_at ||
                      report?.published_at ||
                      "Aktiv rapport",
                  ],
                  [
                    offer?.status === "akseptert"
                      ? "Tilbud akseptert"
                      : offer?.status === "publisert"
                      ? "Tilbud sendt"
                      : offer?.status === "avvist"
                      ? "Tilbud avvist"
                      : "Oppfølging registrert",
                    serviceLabel(inquiry.recommended_service),
                  ],
                  [
                    "Oppdragsteam",
                    currentProjectManager?.name ||
                      inquiry.assigned_to ||
                      "Ikke tildelt",
                  ],
                ].map(([title, subtitle]) => (
                  <div key={String(title)} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <div>
                      <p className="text-xs font-black">{title}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
          <section
            id="customer-profile"
            className="scroll-mt-6 rounded-3xl border border-slate-800 bg-[#0a1624] p-5"
          >
            <div className="mb-5">
              <h2 className="text-sm font-black">Kunde og oppdragsoversikt</h2>
              <p className="mt-1 text-[10px] text-slate-500">
                Kunde, eiendom, ansvarlige og aktiv status samlet på ett sted.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-4 xl:border-r xl:border-slate-800">
                <div>
                  <p className="text-[9px] uppercase text-slate-500">Kunde</p>
                  <p className="mt-1 text-xs font-black">
                    {inquiry.customer_name || inquiry.customerName || "Ukjent"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-slate-500">E-post</p>
                  <a
                    href={`mailto:${inquiry.email}`}
                    className="mt-1 block text-xs font-bold text-slate-300 hover:text-white"
                  >
                    {inquiry.email || "Ikke oppgitt"}
                  </a>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-slate-500">Telefon</p>
                  <a
                    href={`tel:${inquiry.phone}`}
                    className="mt-1 block text-xs font-black text-amber-300"
                  >
                    {inquiry.phone || "Ikke oppgitt"}
                  </a>
                </div>
              </div>

              <div className="space-y-4 xl:border-r xl:border-slate-800">
                <div>
                  <p className="text-[9px] uppercase text-slate-500">Adresse</p>
                  <p className="mt-1 text-xs font-bold text-slate-300">
                    {addressLabel}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-slate-500">Bygningstype</p>
                  <p className="mt-1 text-xs font-bold text-slate-300">
                    {inquiry.building_type || "Ikke oppgitt"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-slate-500">Taktype</p>
                  <p className="mt-1 text-xs font-bold text-slate-300">
                    {inquiry.roof_type || inquiry.roofType || "Generelt tak"}
                  </p>
                </div>
              </div>

              <div className="space-y-4 xl:border-r xl:border-slate-800">
                <div>
                  <p className="text-[9px] uppercase text-slate-500">Saksstatus</p>
                  <p className="mt-1 text-xs font-black text-emerald-300">
                    {String(inquiry.status || "aktiv").replaceAll("_", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-slate-500">Prosjektansvarlig</p>
                  <p className="mt-1 text-xs font-bold text-slate-300">
                    {currentProjectManager?.name ||
                      inquiry.assigned_to ||
                      "Ikke tildelt"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-slate-500">Tekniker</p>
                  <p className="mt-1 text-xs font-bold text-slate-300">
                    {currentTechnician?.name || "Ikke tildelt"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[9px] uppercase text-slate-500">Aktiv rapport</p>
                  <p className="mt-1 text-xs font-black text-blue-300">
                    {activeReportLabel}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-slate-500">Tjeneste</p>
                  <p className="mt-1 text-xs font-black text-amber-300">
                    {serviceLabel(inquiry.recommended_service)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-slate-500">Dokumentasjon</p>
                  <p className="mt-1 text-xs font-bold text-slate-300">
                    {photos.length} bilder · {audioCount} lyd
                  </p>
                </div>
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border border-slate-800 bg-[#0a1624] p-4">
            <p className="text-xs font-black">Hurtighandlinger</p>

            <div className="mt-3 space-y-2">
              {String(inquiry.status || "").toLowerCase() === "venter_pa_tilbud" && (
                <button
                  type="button"
                  onClick={() => setAdminCaseTab("offer")}
                  className="flex w-full items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-left text-[10px] font-black text-amber-300"
                >
                  Opprett / send tilbud til kunden
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}

              {String(inquiry.status || "").toLowerCase() === "tilbud_sendt" && (
                <div className="rounded-xl border border-purple-500/25 bg-purple-500/10 px-3.5 py-3">
                  <p className="text-[10px] font-black text-purple-300">
                    Tilbud sendt – venter på kunde
                  </p>
                  <p className="mt-1 text-[9px] leading-4 text-slate-500">
                    Prosjektansvarlig kan se saken, men overtar først når kunden har akseptert tilbudet.
                  </p>
                </div>
              )}

              {String(inquiry.status || "").toLowerCase() === "tilbud_akseptert" && (
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-3">
                  <p className="text-[10px] font-black text-emerald-300">
                    Tilbud akseptert – prosjektansvarlig overtar
                  </p>
                  <p className="mt-1 text-[9px] leading-4 text-slate-500">
                    Neste steg er at prosjektansvarlig foreslår et passende tidspunkt.
                  </p>
                </div>
              )}

              {String(inquiry.status || "").toLowerCase() === "avsluttet" && (
                <div className="rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-3">
                  <p className="text-[10px] font-black text-slate-200">
                    Saken er avsluttet
                  </p>
                  <p className="mt-1 text-[9px] leading-4 text-slate-500">
                    Kunden har takket nei til tilbudet. Rapport, tilbud og kommunikasjon er beholdt i historikken.
                  </p>
                </div>
              )}

              {[
                ["reports", "Åpne rapportbehandling", "emerald"],
                ["field-status", "Se feltarbeid og avvik", "amber"],
                ["messages", "Send melding til kunde", "slate"],
              ].map(([id, label, tone]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    setAdminCaseTab(
                      id === "reports"
                        ? "reports"
                        : id === "field-status"
                        ? "field"
                        : "messages"
                    )
                  }
                  className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left text-[10px] font-black ${
                    tone === "emerald"
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                      : tone === "amber"
                      ? "border-amber-500/25 bg-amber-500/10 text-amber-300"
                      : "border-slate-700 bg-slate-900 text-slate-300"
                  }`}
                >
                  {label}
                  <ChevronRight className="h-4 w-4" />
                </button>
              ))}
            </div>
          </aside>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[
            [
              "Kunde",
              inquiry.customer_name || inquiry.customerName || "Ukjent",
              "Aktiv kunde",
              "emerald",
              <User className="h-5 w-5" />,
            ],
            [
              "Aktiv rapport",
              completionReport ? "2" : report ? "1" : "–",
              completionReport
                ? "Rapport 2 – etter utbedring"
                : "Rapport 1",
              "blue",
              <FileCheck2 className="h-5 w-5" />,
            ],
            [
              "Feltstatus",
              activeChecklistItems.length,
              "Kontrollpunkter inspisert",
              "amber",
              <Activity className="h-5 w-5" />,
            ],
            [
              "Avvik",
              highDeviations,
              `${tg2Count} TG2 · ${tg3Count} TG3`,
              "red",
              <AlertTriangle className="h-5 w-5" />,
            ],
            [
              "Dokumentasjon",
              photos.length,
              `${audioCount} lydnotater`,
              "purple",
              <Camera className="h-5 w-5" />,
            ],
            [
              "Neste steg",
              String(inquiry.status || "").toLowerCase() === "venter_pa_tilbud"
                ? "Send tilbud"
                : String(inquiry.status || "").toLowerCase() === "tilbud_sendt"
                ? "Venter på kunde"
                : String(inquiry.status || "").toLowerCase() === "tilbud_akseptert"
                ? "Prosjektansvarlig overtar"
                : reportStatusLabel(
                    completionReport?.status || report?.status || undefined
                  ),
              String(inquiry.status || "").toLowerCase() === "venter_pa_tilbud"
                ? "Admin · Tilbud og avtale"
                : String(inquiry.status || "").toLowerCase() === "tilbud_sendt"
                ? "Kunden må godta eller avslå tilbudet"
                : String(inquiry.status || "").toLowerCase() === "tilbud_akseptert"
                ? `Foreslå tidspunkt for ${serviceLabel(
                    inquiry.recommended_service
                  ).toLowerCase()}`
                : serviceLabel(inquiry.recommended_service),
              "emerald",
              <CalendarCheck className="h-5 w-5" />,
            ],
          ].map(([label, value, subtitle, tone, icon]: any) => {
            const tones: Record<string, string> = {
              emerald:
                "border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-300",
              blue:
                "border-blue-500/25 bg-blue-500/[0.07] text-blue-300",
              amber:
                "border-amber-500/25 bg-amber-500/[0.07] text-amber-300",
              red:
                "border-red-500/25 bg-red-500/[0.07] text-red-300",
              purple:
                "border-purple-500/25 bg-purple-500/[0.07] text-purple-300",
            };

            return (
              <div
                key={label}
                className={`rounded-2xl border p-4 ${tones[tone]}`}
              >
                <div className="flex items-center gap-2">
                  {icon}
                  <p className="text-[10px] font-black">{label}</p>
                </div>
                <p className="mt-3 truncate text-lg font-black text-white">
                  {value}
                </p>
                <p className="mt-1 truncate text-[9px] text-slate-500">
                  {subtitle}
                </p>
              </div>
            );
          })}
        </section>

        {["venter_pa_tilbud", "tilbud_sendt", "tilbud_akseptert"].includes(
          String(inquiry.status || "").toLowerCase()
        ) && (
          <section className="rounded-2xl border border-slate-800 bg-[#0a1624] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                  Arbeidsflyt
                </p>
                <h3 className="mt-1 text-sm font-black text-white">
                  {String(inquiry.status || "").toLowerCase() === "venter_pa_tilbud"
                    ? "Admin skal sende pristilbud til kunden"
                    : String(inquiry.status || "").toLowerCase() === "tilbud_sendt"
                    ? "Tilbudet er sendt – kunden har neste handling"
                    : "Tilbudet er akseptert – prosjektansvarlig overtar"}
                </h3>
                <p className="mt-1 text-[10px] leading-5 text-slate-500">
                  {String(inquiry.status || "").toLowerCase() === "venter_pa_tilbud"
                    ? "Kontroller tilbudet i «Tilbud og avtale» og publiser det. Kunden varsles via SMS og e-post."
                    : String(inquiry.status || "").toLowerCase() === "tilbud_sendt"
                    ? "Prosjektansvarlig kan følge statusen, men skal ikke planlegge feltarbeid før kunden har akseptert tilbudet."
                    : "Prosjektansvarlig skal nå foreslå et passende tidspunkt for oppdraget."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  ["1", "Tilbud", true],
                  [
                    "2",
                    "Kundesvar",
                    ["tilbud_sendt", "tilbud_akseptert"].includes(
                      String(inquiry.status || "").toLowerCase()
                    ),
                  ],
                  [
                    "3",
                    "Planlegging",
                    String(inquiry.status || "").toLowerCase() === "tilbud_akseptert",
                  ],
                ].map(([step, label, done]: any) => (
                  <div
                    key={step}
                    className={`rounded-xl border px-3 py-2 ${
                      done
                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                        : "border-slate-800 bg-slate-950/50 text-slate-500"
                    }`}
                  >
                    <span className="text-[9px] font-black">{step}. {label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {inquiry.stage !== "digital_befaring" &&
          inquiry.recommended_service &&
          ["tilbud_akseptert", "planlagt", "pagaende"].includes(
            String(inquiry.status || "").toLowerCase()
          ) && (
            <section className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <CalendarCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-blue-300 text-xs">
                    Oppdraget er overført til feltteamet
                  </p>
                </div>
              </div>
            </section>
          )}

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1624]">
          <div className="border-b border-slate-800 px-4 py-3">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
              Administrasjon av saken
            </p>
          </div>

          <div className="flex gap-2 overflow-x-auto p-3">
            {[
              {
                id: "customer",
                label: "Kundegrunnlag",
                icon: <User className="h-4 w-4" />,
                badge: preinspectionFiles.length || undefined,
              },
              {
                id: "team",
                label: "Oppdragsteam",
                icon: <Users className="h-4 w-4" />,
              },
              {
                id: "offer",
                label: "Tilbud og avtale",
                icon: <FileText className="h-4 w-4" />,
                badge: offer ? 1 : undefined,
              },
              {
                id: "messages",
                label: "Meldinger",
                icon: <Mail className="h-4 w-4" />,
              },
              {
                id: "field",
                label: "Feltstatus",
                icon: <Activity className="h-4 w-4" />,
                badge: activeChecklistItems.length || undefined,
              },
              {
                id: "documents",
                label: "Dokumenter",
                icon: <FolderOpen className="h-4 w-4" />,
                badge: photos.length || undefined,
              },
              {
                id: "reports",
                label: completionReport ? "Rapport 2" : "Rapport",
                icon: <FileCheck2 className="h-4 w-4" />,
              },
            ].map((item) => {
              const active = adminCaseTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAdminCaseTab(item.id as AdminCaseTab)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-xs font-black transition ${
                    active
                      ? "border-amber-500/35 bg-amber-500/10 text-amber-300"
                      : "border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  {item.icon}
                  {item.label}
                  {item.badge !== undefined && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] ${
                        active
                          ? "bg-amber-500/15 text-amber-200"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {adminCaseTab === "customer" &&
          ["privatperson", "private"].includes(
            String(inquiry.customer_type || "Privatperson").toLowerCase()
          ) && (
            <section className="rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.05] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-cyan-300" />
                    <h3 className="text-sm font-black text-white">
                      Kundetype: Privatperson
                    </h3>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Hvis oppdraget egentlig gjelder et sameie, borettslag eller
                    foretak, kan admin koble denne saken til riktig juridisk enhet
                    fra BRREG. Personen beholdes som kontaktperson.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowCustomerConversion((current) => !current);
                    setCustomerConversionError("");
                    setCustomerConversionMessage("");
                  }}
                  className="shrink-0 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-black text-cyan-200 transition hover:bg-cyan-500/15"
                >
                  Endre kundetype
                </button>
              </div>

              {customerConversionMessage && (
                <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                  {customerConversionMessage}
                </div>
              )}

              {showCustomerConversion && (
                <div className="mt-5 space-y-5 border-t border-cyan-500/15 pt-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        Ny kundetype
                      </label>
                      <select
                        value={customerConversionType}
                        onChange={(e) =>
                          setCustomerConversionType(
                            e.target.value as "Borettslag/Sameie" | "B2B"
                          )
                        }
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-xs text-white outline-none focus:border-cyan-500"
                      >
                        <option value="Borettslag/Sameie">
                          Borettslag / Sameie
                        </option>
                        <option value="B2B">Bedrift / Foretak</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        Kontaktperson beholdes
                      </label>
                      <div className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-xs text-slate-300">
                        <span className="font-black text-white">
                          {inquiry.customer_name || inquiry.customerName}
                        </span>
                        <span className="ml-2 text-slate-500">
                          {inquiry.phone || ""}
                          {inquiry.email ? ` · ${inquiry.email}` : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Søk virksomhet i BRREG
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        value={brregSearchQuery}
                        onChange={(e) => setBrregSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            searchBrregForCustomerConversion();
                          }
                        }}
                        placeholder="F.eks. Mandalls gate 16-18 sameie"
                        className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-xs text-white outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={searchBrregForCustomerConversion}
                        disabled={searchingBrreg}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-xs font-black text-cyan-200 transition hover:bg-cyan-500/15 disabled:opacity-50"
                      >
                        {searchingBrreg ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                        Søk i BRREG
                      </button>
                    </div>
                  </div>

                  {brregSearchResults.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Velg riktig juridisk enhet
                      </p>

                      {brregSearchResults.map((company) => {
                        const selected =
                          selectedBrregCompany?.organization_number ===
                          company.organization_number;

                        return (
                          <button
                            key={company.organization_number}
                            type="button"
                            onClick={() => setSelectedBrregCompany(company)}
                            className={`w-full rounded-xl border p-4 text-left transition ${
                              selected
                                ? "border-cyan-400/60 bg-cyan-500/10"
                                : "border-slate-800 bg-slate-950/70 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-xs font-black text-white">
                                  {company.name}
                                </p>
                                <p className="mt-1 text-[11px] text-slate-400">
                                  Org.nr. {company.organization_number}
                                  {company.organization_form_description
                                    ? ` · ${company.organization_form_description}`
                                    : ""}
                                </p>
                                {(company.address || company.city) && (
                                  <p className="mt-1 text-[10px] text-slate-500">
                                    {[company.address, company.postal_code, company.city]
                                      .filter(Boolean)
                                      .join(", ")}
                                  </p>
                                )}
                              </div>

                              <span
                                className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border ${
                                  selected
                                    ? "border-cyan-300 bg-cyan-300 shadow-[inset_0_0_0_3px_#07111d]"
                                    : "border-slate-600"
                                }`}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedBrregCompany && (
                    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                        Klar til konvertering
                      </p>
                      <p className="mt-2 text-xs font-black text-white">
                        {selectedBrregCompany.name}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Org.nr. {selectedBrregCompany.organization_number}
                      </p>
                      <div className="mt-3 space-y-1 text-[11px] leading-5 text-slate-400">
                        <p>• Sak #{inquiry.id} beholdes med all historikk og dokumentasjon.</p>
                        <p>• Bare denne saken flyttes til den juridiske enheten.</p>
                        <p>• {inquiry.customer_name || inquiry.customerName} beholdes som hovedkontakt.</p>
                        <p>• Privatkundeprofilen slettes eller overskrives ikke.</p>
                      </div>
                    </div>
                  )}

                  {customerConversionError && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                      {customerConversionError}
                    </div>
                  )}

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomerConversion(false);
                        setCustomerConversionError("");
                        setSelectedBrregCompany(null);
                        setBrregSearchResults([]);
                      }}
                      disabled={savingCustomerConversion}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-black text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                    >
                      Avbryt
                    </button>

                    <button
                      type="button"
                      onClick={convertInquiryCustomer}
                      disabled={
                        savingCustomerConversion || !selectedBrregCompany
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-black text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
                    >
                      {savingCustomerConversion ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Building2 className="h-4 w-4" />
                      )}
                      Konverter til valgt juridisk enhet
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

        {adminCaseTab === "customer" &&
          inquiry.stage === "digital_befaring" &&
          !["venter_pa_tilbud", "tilbud_sendt", "tilbud_akseptert"].includes(
            String(inquiry.status || "").toLowerCase()
          ) && (
            <section className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-amber-300" />
                    <h3 className="text-sm font-black text-white">
                      Kunden ønsker en annen bestilling
                    </h3>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Bruk denne funksjonen når kunden tar kontakt og vil avbestille
                    gratis befaring og bestille lekkasjesøk i stedet. Tidligere
                    historikk og dokumentasjon beholdes.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowServiceChange((current) => !current);
                    setServiceChangeError("");
                    setServiceChangeMessage("");
                    if (!serviceChangeContactPhone) {
                      setServiceChangeContactPhone(inquiry.phone || "");
                    }
                  }}
                  className="shrink-0 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-black text-amber-200 transition hover:bg-amber-500/15"
                >
                  Avbestill gratis befaring / bestill lekkasjesøk
                </button>
              </div>

              {serviceChangeMessage && (
                <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                  {serviceChangeMessage}
                </div>
              )}

              {showServiceChange && (
                <div className="mt-5 border-t border-amber-500/15 pt-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        Hvem tok kontakt?
                      </label>
                      <input
                        value={serviceChangeContactName}
                        onChange={(e) =>
                          setServiceChangeContactName(e.target.value)
                        }
                        placeholder="Navn på kontaktperson"
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-xs text-white outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        Telefonnummer kontakten kom fra
                      </label>
                      <input
                        value={serviceChangeContactPhone}
                        onChange={(e) =>
                          setServiceChangeContactPhone(e.target.value)
                        }
                        placeholder="+47 ..."
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-xs text-white outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Notat fra telefonsamtalen
                    </label>
                    <textarea
                      rows={4}
                      value={serviceChangeNote}
                      onChange={(e) => setServiceChangeNote(e.target.value)}
                      placeholder="Eksempel: Kunden ønsker ikke gratis befaring. Bestiller lekkasjesøk og ønsker tilbud tilsendt før tidspunkt avtales."
                      className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-xs text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Dette skjer når du bekrefter
                    </p>
                    <div className="mt-3 space-y-2 text-xs text-slate-300">
                      <p>• Gratis befaring registreres som avbestilt.</p>
                      <p>• Tjenesten endres til lekkasjesøk.</p>
                      <p>• Saken går til «Venter tilbud» hos admin.</p>
                      <p>• Prosjektansvarlig får ikke ny oppgave før tilbudet er akseptert.</p>
                      <p>• Kontaktperson, telefon og notat lagres i sakshistorikken.</p>
                    </div>
                  </div>

                  {serviceChangeError && (
                    <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                      {serviceChangeError}
                    </div>
                  )}

                  <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setShowServiceChange(false)}
                      disabled={savingServiceChange}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-black text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                    >
                      Avbryt
                    </button>
                    <button
                      type="button"
                      onClick={handleChangeToLeakSearch}
                      disabled={savingServiceChange}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-300 disabled:opacity-50"
                    >
                      {savingServiceChange ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Bekreft endring til lekkasjesøk
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

        {String(inquiry.status || "").toLowerCase() ===
          "kundeopplysninger_mottatt" && (
          <section className={`${adminCaseTab === "customer" ? "" : "hidden"} bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-5`}>
            <div className="flex items-start gap-3">
              <UserCheck className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-cyan-200 text-sm">
                  Kundeopplysninger mottatt
                </p>
                <p className="text-xs text-slate-300 mt-1 leading-5">
                  Kunden har sendt inn forhåndskartleggingen. Kontroller opplysningene
                  og dokumentasjonen nedenfor før saken overføres til prosjektansvarlig.
                </p>
              </div>
            </div>
          </section>
        )}

        {isDigitalBefaring && (
          <section className={`${adminCaseTab === "customer" ? "" : "hidden"} bg-[#0b0f17] border border-slate-800 rounded-2xl p-5 space-y-5`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-cyan-400" />
                  Kundens forhåndskartlegging
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Grunnlaget kunden har sendt inn før digital befaring.
                </p>
              </div>

              {preinspection?.submitted_at && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-extrabold uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Innsendt
                </span>
              )}
            </div>

            {preinspectionError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {preinspectionError}
              </div>
            )}

            {loadingPreinspection ? (
              <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                Henter kundeopplysninger...
              </div>
            ) : !preinspection ? (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-xs text-slate-500">
                Kunden har ikke sendt inn forhåndskartlegging ennå.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <span className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1.5">
                    Hva er problemet?
                  </span>
                  <p className="text-xs text-slate-200 whitespace-pre-wrap leading-5">
                    {preinspection.problem_description || "Ikke oppgitt"}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoCard
                    label="Når oppstod problemet?"
                    value={formatDate(preinspection.problem_started_date)}
                  />
                  <InfoCard
                    label="Når ble det oppdaget?"
                    value={formatDate(preinspection.problem_discovered_date)}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <DetailBlock
                    title="Forsikring"
                    icon={<ShieldCheck className="w-4 h-4 text-amber-400" />}
                    yesNo={yesNoLabel(preinspection.insurance_case)}
                    details={preinspection.insurance_details}
                    files={filesForCategory("insurance")}
                  />

                  <DetailBlock
                    title="Andre selskaper / fagpersoner"
                    icon={<Building2 className="w-4 h-4 text-blue-400" />}
                    yesNo={yesNoLabel(preinspection.other_companies_involved)}
                    details={preinspection.other_companies_details}
                    files={filesForCategory("other_company")}
                  />

                  <DetailBlock
                    title="Arbeid siden overtakelse"
                    icon={<Hammer className="w-4 h-4 text-purple-400" />}
                    yesNo={yesNoLabel(preinspection.work_since_takeover)}
                    details={preinspection.work_description}
                    extra={[
                      `Utført av fagfolk: ${yesNoLabel(
                        preinspection.work_performed_by_professionals
                      )}`,
                      `Egenutført fagmessig arbeid: ${yesNoLabel(
                        preinspection.self_performed_work
                      )}`,
                    ]}
                    files={[
                      ...filesForCategory("professional_work"),
                      ...filesForCategory("previous_work"),
                    ]}
                  />

                  <DetailBlock
                    title="Byggesak / søknad"
                    icon={<FileText className="w-4 h-4 text-cyan-400" />}
                    yesNo={yesNoLabel(preinspection.building_application)}
                    details={preinspection.building_application_details}
                    files={filesForCategory("building_case")}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <DetailBlock
                    title="Vedlikehold og kontroll"
                    icon={<Wrench className="w-4 h-4 text-emerald-400" />}
                    details={[
                      `Sist utført: ${formatDate(
                        preinspection.last_maintenance_date
                      )}`,
                      preinspection.last_maintenance_details || "",
                    ]
                      .filter(Boolean)
                      .join("\n")}
                    files={filesForCategory("maintenance")}
                  />

                  <DetailBlock
                    title="Andre opplysninger"
                    icon={<FileText className="w-4 h-4 text-slate-400" />}
                    details={
                      preinspection.additional_information ||
                      "Ingen ekstra opplysninger."
                    }
                    files={filesForCategory("photo")}
                  />
                </div>
              </div>
            )}
          </section>
        )}

        <section id="team" className={`${adminCaseTab === "team" ? "" : "hidden"} scroll-mt-6 bg-[#0b0f17] border border-slate-800 rounded-2xl p-5 space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#F5B800]" />
                {isDigitalBefaring ? "Ansvarlig for digital befaring" : "Oppdragsteam"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isDigitalBefaring
                  ? "Admin kontrollerer kundegrunnlaget og overfører deretter saken til valgt prosjektansvarlig."
                  : "Tildel én prosjektansvarlig og én tekniker til oppdraget."}
              </p>
            </div>

            {(currentProjectManager || currentTechnician) && (
              <div className="text-right text-[10px] text-slate-500">
                <div>
                  Prosjektansvarlig:{" "}
                  <span className="text-amber-400 font-bold">
                    {currentProjectManager?.name || "Ikke tildelt"}
                  </span>
                </div>
                {!isDigitalBefaring && (
                  <div className="mt-0.5">
                    Tekniker:{" "}
                    <span className="text-blue-400 font-bold">
                      {currentTechnician?.name || "Ikke tildelt"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {teamError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {teamError}
            </div>
          )}

          {teamMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              {teamMessage}
            </div>
          )}

          {loadingTeam ? (
            <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-[#F5B800]" />
              Henter oppdragsteam...
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 gap-3 items-end ${
                isDigitalBefaring
                  ? "lg:grid-cols-[1fr_auto]"
                  : "lg:grid-cols-[1fr_1fr_auto]"
              }`}
            >
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-extrabold mb-1.5">
                  Prosjektansvarlig
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={projectManagerId}
                    onChange={(e) => {
                      setProjectManagerId(e.target.value);
                      setTeamMessage("");
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-3 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="">Velg prosjektansvarlig</option>
                    {activeProjectManagers.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!isDigitalBefaring && (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-extrabold mb-1.5">
                    Tekniker
                  </label>
                  <div className="relative">
                    <Wrench className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={technicianId}
                      onChange={(e) => {
                        setTechnicianId(e.target.value);
                        setTeamMessage("");
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-3 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="">Velg tekniker</option>
                      {activeTechnicians.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} · {employee.role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveTeam}
                disabled={
                  savingTeam ||
                  !projectManagerId ||
                  (!isDigitalBefaring && !technicianId)
                }
                className="px-5 py-3 bg-[#F5B800] hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {savingTeam ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isDigitalBefaring
                  ? String(inquiry.status || "").toLowerCase() ===
                    "tildelt_prosjektansvarlig"
                    ? "Oppdater prosjektansvarlig"
                    : "Overfør saken"
                  : "Lagre team"}
              </button>
            </div>
          )}
        </section>

        {adminCaseTab === "offer" &&
          !(
            inquiry.recommended_service &&
            ["venter_pa_tilbud", "tilbud_sendt", "tilbud_akseptert", "tilbud_avvist", "avsluttet"].includes(
              String(inquiry.status || "").toLowerCase()
            )
          ) && (
            <section className="rounded-2xl border border-slate-800 bg-[#0b0f17] p-6">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm font-black text-slate-300">
                    Ingen aktiv tilbudsbehandling
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Tilbudsfanen blir aktiv når saken går inn i tilbuds- eller avtaleprosessen.
                  </p>
                </div>
              </div>
            </section>
          )}

        {inquiry.recommended_service &&
          ["venter_pa_tilbud", "tilbud_sendt", "tilbud_akseptert", "tilbud_avvist", "avsluttet"].includes(
            String(inquiry.status || "").toLowerCase()
          ) && (
            <section className={`${adminCaseTab === "offer" ? "" : "hidden"} bg-[#0b0f17] border border-purple-500/30 rounded-2xl p-5 space-y-5`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-400" />
                    Tilbud til kunde
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Prosjektansvarlig anbefaler {serviceLabel(inquiry.recommended_service)}.
                    Admin kontrollerer tilbudet før det publiseres i kundeportalen.
                  </p>
                </div>

                <span className="px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-extrabold uppercase text-slate-300">
                  {offer?.status === "publisert"
                    ? "Publisert"
                    : offer?.status === "akseptert"
                    ? "Akseptert"
                    : offer?.status === "avvist"
                    ? "Avvist"
                    : offer?.status === "utkast"
                    ? "Utkast"
                    : "Ikke opprettet"}
                </span>
              </div>

              {offerError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  {offerError}
                </div>
              )}

              {offerMessage && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  {offerMessage}
                </div>
              )}

              {loadingOffer ? (
                <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  Henter tilbud...
                </div>
              ) : offer?.status === "avvist" ? (
                <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" />
                    <div>
                      <p className="text-sm font-black text-white">
                        Tilbud avvist – saken er avsluttet
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-slate-400">
                        Kunden har takket nei til tilbudet. Saken avsluttes automatisk og fjernes fra aktive oppdrag.
                        Kunden takkes via SMS og e-post. Rapport, tilbud og kommunikasjon beholdes i historikken.
                      </p>
                      {offer.rejected_at && (
                        <p className="mt-2 text-[10px] font-bold text-slate-400">
                          Avvist {new Date(offer.rejected_at).toLocaleString("nb-NO")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCommunicationView("messages");
                        setAdminCaseTab("messages");
                      }}
                      className="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-xs font-black text-slate-200 transition hover:border-slate-600 hover:text-white"
                    >
                      Se kommunikasjon
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRejectedOfferAction("revise_offer")}
                      disabled={handlingRejectedOffer}
                      className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-xs font-black text-purple-200 transition hover:bg-purple-500/15 disabled:opacity-50"
                    >
                      {handlingRejectedOffer ? "Behandler..." : "Gjenåpne med revidert tilbud"}
                    </button>
                  </div>
                </div>
              ) : offer?.status === "publisert" && !showPublishedOfferDetails ? (
                <div className="rounded-2xl border border-purple-500/25 bg-purple-500/[0.06] p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-purple-300" />
                      <div>
                        <p className="text-sm font-black text-white">
                          Tilbud sendt – venter på kundens svar
                        </p>
                        <p className="mt-1 text-[11px] leading-5 text-slate-400">
                          {serviceLabel(inquiry.recommended_service)} · Teampris{" "}
                          {offer?.team_rate ? `${Number(offer.team_rate).toLocaleString("nb-NO")} kr/time` : "se tilbud"}{" "}
                          {offer?.vehicle_rate ? `· Bil/drift ${Number(offer.vehicle_rate).toLocaleString("nb-NO")} kr` : ""}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPublishedOfferDetails(true)}
                      className="shrink-0 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-[10px] font-black text-slate-300 transition hover:border-slate-600 hover:text-white"
                    >
                      Vis tilbud
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {offer?.status === "publisert" && showPublishedOfferDetails && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowPublishedOfferDetails(false)}
                        className="rounded-xl border border-slate-700 bg-slate-950/60 px-3.5 py-2 text-[10px] font-black text-slate-400 transition hover:text-white"
                      >
                        Skjul tilbud
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-extrabold mb-1.5">
                        Tjeneste
                      </label>
                      <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs font-bold text-amber-400">
                        {serviceLabel(inquiry.recommended_service)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-extrabold mb-1.5">
                        Tittel
                      </label>
                      <input
                        value={offerForm.title}
                        onChange={(e) =>
                          setOfferForm((prev) => ({ ...prev, title: e.target.value }))
                        }
                        disabled={["publisert", "akseptert", "avvist"].includes(String(offer?.status || ""))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-purple-500 disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-extrabold mb-1.5">
                      Beskrivelse
                    </label>
                    <textarea
                      rows={4}
                      value={offerForm.description}
                      onChange={(e) =>
                        setOfferForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      disabled={["publisert", "akseptert", "avvist"].includes(String(offer?.status || ""))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs text-white resize-y focus:outline-none focus:border-purple-500 disabled:opacity-60"
                      placeholder="Beskriv hva tilbudet omfatter..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-extrabold mb-1.5">
                        Timesats
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={offerForm.hourly_rate}
                        onChange={(e) =>
                          setOfferForm((prev) => ({
                            ...prev,
                            hourly_rate: e.target.value,
                          }))
                        }
                        disabled={["publisert", "akseptert", "avvist"].includes(String(offer?.status || ""))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-purple-500 disabled:opacity-60"
                        placeholder="kr/time"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-extrabold mb-1.5">
                        Teampris
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={offerForm.team_rate}
                        onChange={(e) =>
                          setOfferForm((prev) => ({
                            ...prev,
                            team_rate: e.target.value,
                          }))
                        }
                        disabled={["publisert", "akseptert", "avvist"].includes(String(offer?.status || ""))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-purple-500 disabled:opacity-60"
                        placeholder="kr/time"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-extrabold mb-1.5">
                        Bil / drift
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={offerForm.vehicle_rate}
                        onChange={(e) =>
                          setOfferForm((prev) => ({
                            ...prev,
                            vehicle_rate: e.target.value,
                          }))
                        }
                        disabled={["publisert", "akseptert", "avvist"].includes(String(offer?.status || ""))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-purple-500 disabled:opacity-60"
                        placeholder="kr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-extrabold mb-1.5">
                        Materialer / tillegg
                      </label>
                      <textarea
                        rows={3}
                        value={offerForm.material_note}
                        onChange={(e) =>
                          setOfferForm((prev) => ({
                            ...prev,
                            material_note: e.target.value,
                          }))
                        }
                        disabled={["publisert", "akseptert", "avvist"].includes(String(offer?.status || ""))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs text-white resize-y focus:outline-none focus:border-purple-500 disabled:opacity-60"
                        placeholder="Materialer, kjøring eller andre tillegg..."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-extrabold mb-1.5">
                        Betingelser
                      </label>
                      <textarea
                        rows={3}
                        value={offerForm.terms}
                        onChange={(e) =>
                          setOfferForm((prev) => ({ ...prev, terms: e.target.value }))
                        }
                        disabled={["publisert", "akseptert", "avvist"].includes(String(offer?.status || ""))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs text-white resize-y focus:outline-none focus:border-purple-500 disabled:opacity-60"
                        placeholder="Betingelser for oppdraget..."
                      />
                    </div>
                  </div>

                  {offer?.status === "akseptert" ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-xs font-extrabold text-emerald-300">
                          Kunden har akseptert tilbudet
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Prosjektansvarlig overtar saken og kan foreslå tidspunkt for feltarbeid.
                        </p>
                      </div>
                    </div>
                  ) : offer?.status === "publisert" ? (
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 flex items-start gap-3">
                      <Clock3 className="w-5 h-5 text-purple-300 shrink-0" />
                      <div>
                        <p className="text-xs font-extrabold text-purple-200">
                          Tilbud sendt – venter på kundens svar
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1 leading-5">
                          Tilbudet er låst mens kunden vurderer det. Prosjektansvarlig kan følge saken,
                          men planlegging starter først når kunden har akseptert tilbudet.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={saveOfferDraft}
                        disabled={savingOffer}
                        className="px-5 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {savingOffer ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Lagre utkast
                      </button>

                      <button
                        type="button"
                        onClick={publishOffer}
                        disabled={savingOffer || !offerForm.title.trim()}
                        className="px-5 py-3 bg-purple-500 hover:bg-purple-400 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {savingOffer ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Publiser til kunde
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

        <section className={`${adminCaseTab === "customer" ? "" : "hidden"} grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0b0f17] p-5 rounded-2xl border border-slate-800 text-xs`}>
          <div>
            <span className="text-slate-500 block font-bold uppercase tracking-wider mb-1">
              Kundeprofil
            </span>
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-500" />
              {inquiry.customer_name || inquiry.customerName}
              {inquiry.customer_id && (
                <span className="font-mono text-[10px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-amber-400">
                  ID #{inquiry.customer_id}
                </span>
              )}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block font-bold uppercase tracking-wider mb-1">
              Telefon
            </span>
            <a
              href={`tel:${inquiry.phone}`}
              className="font-bold text-amber-400 font-mono text-sm hover:underline flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" />
              {inquiry.phone}
            </a>
          </div>

          <div>
            <span className="text-slate-500 block font-bold uppercase tracking-wider mb-1">
              E-post
            </span>
            <a
              href={`mailto:${inquiry.email}`}
              className="font-bold text-slate-200 text-sm hover:underline flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {inquiry.email || "Ikke oppgitt"}
            </a>
          </div>

          <div>
            <span className="text-slate-500 block font-bold uppercase tracking-wider mb-1">
              Taktype / bygning
            </span>
            <span className="font-bold text-slate-200">
              {inquiry.roof_type ||
                inquiry.roofType ||
                "Generelt tak"}
              {inquiry.building_type
                ? ` (${inquiry.building_type})`
                : ""}
            </span>
          </div>

          <div className="md:col-span-2">
            <span className="text-slate-500 block font-bold uppercase tracking-wider mb-1">
              Adresse
            </span>
            <span className="font-bold text-slate-200 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              {[inquiry.address, inquiry.postal_code, inquiry.city]
                .filter(Boolean)
                .join(", ")}
            </span>
          </div>
        </section>

        <section id="documents" className={`${adminCaseTab === "documents" ? "" : "hidden"} scroll-mt-6 bg-[#0b0f17] p-5 rounded-2xl border border-slate-800`}>
          <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">
            Innsendte detaljer & notater
          </h4>
          <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-mono bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            {inquiry.notes || "Ingen spesifikke notater."}
          </p>
        </section>

        <div
          id="messages"
          className={`${adminCaseTab === "messages" ? "" : "hidden"} scroll-mt-6 space-y-4`}
        >
          <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-[#0b0f17] p-2">
            <button
              type="button"
              onClick={() => setCommunicationView("messages")}
              className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
                communicationView === "messages"
                  ? "bg-[#F5B800] text-slate-950"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              Samtaler
            </button>

            <button
              type="button"
              onClick={() => setCommunicationView("log")}
              className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
                communicationView === "log"
                  ? "bg-[#F5B800] text-slate-950"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              Kommunikasjonslogg
            </button>
          </div>

          {communicationView === "messages" ? (
            <InquiryMessages
              inquiryId={inquiryId}
              projectManagerName={
                currentProjectManager?.name ||
                inquiry.assigned_to ||
                null
              }
            />
          ) : (
            <InquiryCommunicationLog inquiryId={inquiryId} />
          )}
        </div>

        {!isDigitalBefaring && (
          <>
        <section id="field-status" className={`${adminCaseTab === "field" ? "" : "hidden"} scroll-mt-6 bg-[#0b0f17] border border-slate-800 rounded-2xl p-6 space-y-5`}>
          <div className="border-b border-slate-800/80 pb-4">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#F5B800]" />
              Feltstatus
            </h3>
          </div>

          {fieldError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {fieldError}
            </div>
          )}

          {loadingFieldStatus ? (
            <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-[#F5B800]" />
              Henter feltstatus...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-500">
                    Kontrollpunkter
                  </span>
                  <strong className="text-xl font-black text-white block mt-1">
                    {activeChecklistItems.length}
                  </strong>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-500">
                    Avvik TG1–TG3
                  </span>
                  <strong className="text-xl font-black text-amber-400 block mt-1">
                    {deviations.length}
                  </strong>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-500">
                    TG2 / TG3
                  </span>
                  <strong className="text-xl font-black text-red-400 block mt-1">
                    {highDeviations}
                  </strong>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-500">
                    Bilder
                  </span>
                  <strong className="text-xl font-black text-white block mt-1">
                    {photos.length}
                  </strong>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-500">
                    Lydnotater
                  </span>
                  <strong className="text-xl font-black text-white block mt-1">
                    {audioCount}
                  </strong>
                </div>
              </div>

              {deviations.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-3">
                    Registrerte avvik
                  </h4>

                  <div className="space-y-2">
                    {deviations.slice(0, 8).map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-200">
                            {item.item_title}
                          </p>
                          {item.comment && (
                            <p className="text-[11px] text-slate-500 mt-1">
                              {item.comment}
                            </p>
                          )}
                        </div>

                        <span className="shrink-0 uppercase text-[10px] font-black px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
                  <Camera className="w-5 h-5 text-blue-400" />
                  <div>
                    <span className="block text-[9px] uppercase text-slate-500 font-extrabold">
                      Dokumentasjon
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      {photos.length} feltbilder
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <div>
                    <span className="block text-[9px] uppercase text-slate-500 font-extrabold">
                      Rapportstatus
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      {reportStatusLabel(report?.status)}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
                  <Wrench className="w-5 h-5 text-emerald-400" />
                  <div>
                    <span className="block text-[9px] uppercase text-slate-500 font-extrabold">
                      Feltansvar
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      {isDigitalBefaring
                        ? "Kun prosjektansvarlig"
                        : "Prosjektansvarlig + tekniker"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

          </>
        )}

        <div id="history" className="hidden" />

        {!isDigitalBefaring && (
          <div id="reports" className={`${adminCaseTab === "reports" ? "" : "hidden"} scroll-mt-6`}>
            <AdminReportReview inquiryId={inquiryId} />
          </div>
        )}
      </div>
    </div>
  );
}