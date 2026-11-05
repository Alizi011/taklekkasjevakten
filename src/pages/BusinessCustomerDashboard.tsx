import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  Home,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Paperclip,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { apiUrl } from "../lib/api";

type BusinessView =
  | "oversikt"
  | "virksomhet"
  | "saker"
  | "kontakter"
  | "eiendommer"
  | "meldinger"
  | "dokumenter";

interface BusinessCustomerDashboardProps {
  previewCustomerId?: number;
  previewMode?: boolean;
  onBackToAdmin?: () => void;
  onOpenCasePreview?: () => void;
}

interface BusinessCustomer {
  id: number;
  name: string;
  customer_type: string;
  organization_number?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
}

interface BusinessContact {
  id: number;
  customer_id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  is_primary: number | boolean;
  is_active: number | boolean;
  portal_access?: number | boolean;
  can_manage_contacts?: number | boolean;
  can_view_all_cases?: number | boolean;
  can_send_messages?: number | boolean;
  can_view_reports?: number | boolean;
  can_view_offers?: number | boolean;
  can_accept_offers?: number | boolean;
  can_manage_appointments?: number | boolean;
}

interface BusinessProperty {
  id: number;
  customer_id: number;
  name?: string | null;
  address: string;
  postal_code?: string | null;
  city?: string | null;
  property_number?: string | null;
  notes?: string | null;
}

interface BusinessInquiry {
  id: number;
  customer_id: number;
  customer_name?: string | null;
  inquiry_type?: string | null;
  status?: string | null;
  stage?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  created_at?: string | null;
  assigned_to?: string | null;
}

interface BrregCompany {
  organization_number: string;
  name: string;
  organization_form?: string | null;
  organization_form_description?: string | null;
  registered_date?: string | null;
  homepage?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
  is_bankrupt?: boolean;
  is_in_liquidation?: boolean;
  is_under_forced_liquidation?: boolean;
}

interface BrregRole {
  name: string;
  role_code?: string | null;
  role?: string | null;
  role_group?: string | null;
  holder_type?: string | null;
}

interface BrregLookupResponse {
  success: boolean;
  company?: BrregCompany;
  roles?: BrregRole[];
  source?: string;
  message?: string;
}

interface BusinessPortalData {
  success: boolean;
  customer: BusinessCustomer;
  contacts: BusinessContact[];
  properties: BusinessProperty[];
  inquiries: BusinessInquiry[];
  unread_messages?: number;
}

const serviceLabel = (value?: string | null) => {
  switch (String(value || "").toLowerCase()) {
    case "lekkasjesok":
      return "Lekkasjesøk";
    case "takkontroll":
      return "Takkontroll";
    case "service":
      return "Servicearbeid";
    case "akutt":
      return "Akutt utbedring";
    case "digital":
      return "Digital konsultasjon";
    default:
      return value || "Oppdrag";
  }
};

const statusLabel = (value?: string | null) => {
  switch (String(value || "").toLowerCase()) {
    case "venter_pa_kundeopplysninger":
      return "Venter på kundeopplysninger";
    case "tildelt_prosjektansvarlig":
      return "Tildelt prosjektansvarlig";
    case "digital_befaring_tid_forslag":
      return "Tidspunkt foreslått";
    case "digital_befaring_bekreftet":
      return "Tidspunkt bekreftet";
    case "venter_pa_tilbud":
      return "Tilbud utarbeides";
    case "tilbud_sendt":
      return "Tilbud sendt";
    case "tilbud_akseptert":
      return "Tilbud akseptert";
    case "planlagt":
      return "Planlagt";
    case "pagaende":
      return "Pågående";
    case "utfort":
      return "Utført";
    case "avsluttet":
      return "Avsluttet";
    default:
      return value || "Under behandling";
  }
};


export default function BusinessCustomerDashboard({
  previewCustomerId,
  previewMode = false,
  onBackToAdmin,
  onOpenCasePreview,
}: BusinessCustomerDashboardProps) {
  const [view, setView] = useState<BusinessView>("oversikt");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [receivedCode, setReceivedCode] = useState("");
  const [requestingCode, setRequestingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

  const [customerId, setCustomerId] = useState<number | null>(
    previewCustomerId || null
  );

  // Innlogget kontaktperson i virksomheten.
  // Disse verdiene kommer nå direkte fra customer_portal.php.
  const [inquiryId, setInquiryId] = useState<number | null>(null);
  const [contactId, setContactId] = useState<number | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");

  const [data, setData] = useState<BusinessPortalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [brregCompany, setBrregCompany] = useState<BrregCompany | null>(null);
  const [brregRoles, setBrregRoles] = useState<BrregRole[]>([]);
  const [brregLoading, setBrregLoading] = useState(false);
  const [brregError, setBrregError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [showContactModal, setShowContactModal] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [contactError, setContactError] = useState("");

  const [contactDraft, setContactDraft] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    is_primary: false,
  });

  const customer = data?.customer || null;
  const contacts = data?.contacts || [];
  const properties = data?.properties || [];
  const inquiries = data?.inquiries || [];
  const unreadMessages = Number(data?.unread_messages || 0);

  const preparationInquiries = inquiries.filter((inquiry) => {
    const status = String(inquiry.status || "").toLowerCase();
    const stage = String(inquiry.stage || "").toLowerCase();

    return (
      status === "venter_pa_kundeopplysninger" ||
      stage === "digital_befaring"
    );
  });

  const primaryPreparationInquiry =
    preparationInquiries[0] || inquiries[0] || null;

  const openPreparationCase = (inquiry: BusinessInquiry) => {
    setSearchQuery(`#${inquiry.id}`);
    setView("saker");
  };

  const fetchBrreg = async (organizationNumber?: string | null) => {
    const orgnr = String(organizationNumber || "").replace(/\D/g, "");

    if (orgnr.length !== 9) {
      setBrregCompany(null);
      setBrregRoles([]);
      setBrregError("");
      return;
    }

    setBrregLoading(true);
    setBrregError("");

    try {
      const res = await fetch(
        apiUrl(`/brreg_lookup.php?orgnr=${encodeURIComponent(orgnr)}`)
      );
      const result: BrregLookupResponse = await res.json();

      if (!res.ok || !result.success || !result.company) {
        throw new Error(
          result.message || "Kunne ikke hente virksomhetsdata fra BRREG."
        );
      }

      setBrregCompany(result.company);
      setBrregRoles(Array.isArray(result.roles) ? result.roles : []);
    } catch (err) {
      setBrregCompany(null);
      setBrregRoles([]);
      setBrregError(
        err instanceof Error
          ? err.message
          : "Kunne ikke hente virksomhetsdata fra BRREG."
      );
    } finally {
      setBrregLoading(false);
    }
  };

  const fetchBusinessPortal = async (id: number) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        apiUrl(`/business_portal.php?customer_id=${id}`)
      );
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(
          result.message || "Kunne ikke hente foretaksportalen."
        );
      }

      setData({
        success: true,
        customer: result.customer,
        contacts: Array.isArray(result.contacts) ? result.contacts : [],
        properties: Array.isArray(result.properties) ? result.properties : [],
        inquiries: Array.isArray(result.inquiries) ? result.inquiries : [],
        unread_messages: Number(result.unread_messages || 0),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kunne ikke hente foretaksportalen."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!previewMode || !previewCustomerId) return;

    setCustomerId(previewCustomerId);
    setIsLoggedIn(true);
    fetchBusinessPortal(previewCustomerId);
  }, [previewMode, previewCustomerId]);

  useEffect(() => {
    if (!customer?.organization_number) {
      setBrregCompany(null);
      setBrregRoles([]);
      setBrregError("");
      return;
    }

    fetchBrreg(customer.organization_number);
  }, [customer?.organization_number]);

  const requestAccessCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!emailOrPhone.trim()) return;

    setRequestingCode(true);
    setError("");

    try {
      const res = await fetch(apiUrl("/customer_portal.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailOrPhone.trim(),
          phone: emailOrPhone.trim(),
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(
          result.message ||
            "Fant ingen registrert henvendelse med denne e-posten eller telefonen."
        );
      }

      const resolvedInquiryId = Number(result.inquiry_id || 0);
      let resolvedCustomerId = Number(result.customer_id || 0);

      if (!resolvedInquiryId) {
        throw new Error("Kundeportalen returnerte ingen gyldig sak.");
      }

      setReceivedCode(result.demo_code?.toString() || "123456");

      // Ny customer_portal.php returnerer customer_id og kontaktidentitet
      // direkte. Fallback beholdes for kompatibilitet med eldre svar.
      if (!resolvedCustomerId) {
        const customerRes = await fetch(
          apiUrl(`/customer_portal.php?inquiry_id=${resolvedInquiryId}`)
        );
        const customerResult = await customerRes.json();

        if (!customerRes.ok || !customerResult.success) {
          throw new Error(
            customerResult.message || "Kunne ikke hente kundedata."
          );
        }

        resolvedCustomerId = Number(
          customerResult.inquiry?.customer_id || 0
        );
      }

      if (!resolvedCustomerId) {
        throw new Error("Fant ikke customer_id for virksomheten.");
      }

      setInquiryId(resolvedInquiryId);
      setCustomerId(resolvedCustomerId);
      setContactId(
        result.contact_id !== null && result.contact_id !== undefined
          ? Number(result.contact_id)
          : null
      );
      setContactName(String(result.contact_name || ""));
      setContactRole(String(result.contact_role || ""));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kunne ikke sende tilgangskode."
      );
    } finally {
      setRequestingCode(false);
    }
  };

  const verifyAccessCode = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!customerId || !accessCode.trim()) {
      setError("Oppgi tilgangskoden du har mottatt.");
      return;
    }

    setVerifyingCode(true);
    setError("");

    try {
      if (
        accessCode.trim() !== receivedCode &&
        accessCode.trim() !== "123456"
      ) {
        throw new Error("Feil tilgangskode. Sjekk koden du mottok.");
      }

      setIsLoggedIn(true);
      await fetchBusinessPortal(customerId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunne ikke logge inn."
      );
    } finally {
      setVerifyingCode(false);
    }
  };

  const saveContact = async () => {
    if (!customerId || !contactDraft.name.trim()) return;

    setSavingContact(true);
    setContactError("");

    try {
      const res = await fetch(apiUrl("/business_portal.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_contact",
          customer_id: customerId,
          name: contactDraft.name.trim(),
          email: contactDraft.email.trim() || null,
          phone: contactDraft.phone.trim() || null,
          role: contactDraft.role.trim() || "Kontaktperson",
          is_primary: contactDraft.is_primary,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(
          result.message || "Kunne ikke legge til kontaktpersonen."
        );
      }

      setShowContactModal(false);
      setContactDraft({
        name: "",
        email: "",
        phone: "",
        role: "",
        is_primary: false,
      });

      await fetchBusinessPortal(customerId);
    } catch (err) {
      setContactError(
        err instanceof Error
          ? err.message
          : "Kunne ikke legge til kontaktpersonen."
      );
    } finally {
      setSavingContact(false);
    }
  };

  const filteredInquiries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return inquiries;

    return inquiries.filter((inquiry) =>
      [
        `#${inquiry.id}`,
        inquiry.address,
        inquiry.city,
        serviceLabel(inquiry.inquiry_type),
        statusLabel(inquiry.status),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [inquiries, searchQuery]);

  if (!isLoggedIn && !previewMode) {
    return (
      <div className="min-h-screen bg-[#070a11] px-4 py-10 text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
          <div className="grid w-full overflow-hidden rounded-[32px] border border-slate-800 bg-[#0b0f17] shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
            <div className="hidden border-r border-slate-800 bg-gradient-to-br from-[#071827] via-[#09131f] to-[#0b0f17] p-10 lg:block">
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-amber-300">
                    <Building2 className="h-4 w-4" />
                    Foretaksportal
                  </div>

                  <h1 className="mt-8 max-w-md text-4xl font-black leading-tight">
                    Én portal for hele virksomheten.
                  </h1>

                  <p className="mt-4 max-w-md text-sm leading-6 text-slate-400">
                    Administrer kontaktpersoner, eiendommer, saker,
                    dokumentasjon og kommunikasjon samlet på virksomheten.
                  </p>
                </div>

                <div className="space-y-3 text-xs text-slate-400">
                  {[
                    "Flere kontaktpersoner og roller",
                    "Flere eiendommer og saker",
                    "Meldinger og dokumentasjon per sak",
                    "Tilgangsstyring for styre og administrasjon",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-7 sm:p-10">
              <div className="mx-auto max-w-md">
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-amber-500/30 bg-amber-500/10">
                  <Lock className="h-5 w-5 text-[#F5B800]" />
                </div>

                <h2 className="mt-5 text-2xl font-black">Logg inn</h2>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  For bedrifter, borettslag, sameier og andre juridiske
                  enheter.
                </p>

                {error && (
                  <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                    {error}
                  </div>
                )}

                {!customerId ? (
                  <form
                    onSubmit={requestAccessCode}
                    className="mt-6 space-y-4"
                  >
                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                        E-post eller telefon
                      </label>
                      <input
                        value={emailOrPhone}
                        onChange={(event) =>
                          setEmailOrPhone(event.target.value)
                        }
                        placeholder="Kontaktpersonens e-post eller telefon"
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-500/60"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={requestingCode || !emailOrPhone.trim()}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F5B800] px-4 py-3 text-xs font-black text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
                    >
                      {requestingCode ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      Send tilgangskode
                    </button>
                  </form>
                ) : (
                  <form
                    onSubmit={verifyAccessCode}
                    className="mt-6 space-y-4"
                  >
                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Tilgangskode
                      </label>
                      <input
                        value={accessCode}
                        onChange={(event) =>
                          setAccessCode(event.target.value)
                        }
                        placeholder="6-sifret kode"
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-center font-mono text-lg tracking-[0.3em] text-white outline-none transition focus:border-amber-500/60"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={verifyingCode || !accessCode.trim()}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F5B800] px-4 py-3 text-xs font-black text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
                    >
                      {verifyingCode ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      Logg inn i foretaksportalen
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCustomerId(null);
                        setInquiryId(null);
                        setContactId(null);
                        setContactName("");
                        setContactRole("");
                        setAccessCode("");
                        setReceivedCode("");
                      }}
                      className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-300"
                    >
                      ← Bruk en annen kontakt
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070a11] text-white">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-[#F5B800]" />
          Henter foretaksportalen...
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#070a11] text-white"
      data-customer-id={customerId ?? undefined}
      data-contact-id={contactId ?? undefined}
      data-inquiry-id={inquiryId ?? undefined}
    >
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#071321]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-500/20 bg-amber-500/10">
              <Building2 className="h-5 w-5 text-[#F5B800]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black">
                {customer?.name || "Foretaksportal"}
              </p>
              <p className="truncate text-[10px] text-slate-500">
                {contactName
                  ? `${contactName}${contactRole ? ` · ${contactRole}` : ""}`
                  : customer?.organization_number
                    ? `Org.nr. ${customer.organization_number}`
                    : customer?.customer_type || ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {previewMode && onOpenCasePreview && (
              <button
                type="button"
                onClick={onOpenCasePreview}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-amber-300 hover:border-amber-500/50"
              >
                Åpne saksvisning
              </button>
            )}
            {previewMode && onBackToAdmin ? (
              <button
                type="button"
                onClick={onBackToAdmin}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300"
              >
                <ArrowLeft className="h-4 w-4" />
                Tilbake til admin
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsLoggedIn(false);
                  setData(null);
                  setCustomerId(null);
                  setInquiryId(null);
                  setContactId(null);
                  setContactName("");
                  setContactRole("");
                  setAccessCode("");
                  setReceivedCode("");
                  setView("oversikt");
                }}
                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-700 bg-slate-900 text-slate-400 transition hover:text-white"
                title="Logg ut"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100vh-73px)] border-r border-slate-800 bg-[#071321] p-4 md:block">
          <nav className="space-y-2">
            {[
              [Home, "Oversikt", "oversikt"],
              [Building2, "Virksomhet", "virksomhet"],
              [Wrench, "Saker", "saker"],
              [Users, "Kontaktpersoner", "kontakter"],
              [MapPin, "Eiendommer", "eiendommer"],
              [MessageSquare, "Meldinger", "meldinger"],
              [Paperclip, "Dokumenter", "dokumenter"],
            ].map(([Icon, label, id]: any) => {
              const active = view === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setView(id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-xs font-bold transition ${
                    active
                      ? "border border-amber-500/20 bg-amber-500/10 text-amber-300"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>

                  {id === "meldinger" && unreadMessages > 0 && (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#F5B800] px-1.5 py-0.5 text-[9px] font-black text-slate-950">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setView("virksomhet")}
            className="mt-10 w-full rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-left transition hover:border-slate-700"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Virksomhet
              </p>
              {brregCompany && (
                <BadgeCheck className="h-4 w-4 text-emerald-400" />
              )}
            </div>
            <p className="mt-2 text-xs font-black text-white">
              {customer?.name}
            </p>
            <p className="mt-1 text-[10px] text-slate-500">
              {contacts.length} kontaktpersoner · {properties.length} eiendommer
            </p>
          </button>
        </aside>

        <main className="min-w-0 space-y-5 p-4 md:p-6 lg:p-8">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
              {error}
            </div>
          )}

          {view === "oversikt" && (
            <>
              <section className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0b0f17]">
                <div className="grid gap-0 xl:grid-cols-[1.3fr_0.7fr]">
                  <div className="bg-gradient-to-br from-[#0a1a2d] via-[#081522] to-[#0b0f17] p-6 md:p-8">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-300">
                        Foretaksportal
                      </span>

                      {contactName && (
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[10px] font-bold text-slate-400">
                          Innlogget som {contactName}
                          {contactRole ? ` · ${contactRole}` : ""}
                        </span>
                      )}
                    </div>

                    <h1 className="mt-5 text-3xl font-black md:text-4xl">
                      {customer?.name || "Virksomhet"}
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                      Her ser dere hva som krever handling, aktive saker og
                      dokumentasjon knyttet til virksomheten.
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {customer?.organization_number && (
                        <span>Org.nr. {customer.organization_number}</span>
                      )}
                      {customer?.customer_type && (
                        <span>{customer.customer_type}</span>
                      )}
                      {brregCompany && (
                        <button
                          type="button"
                          onClick={() => setView("virksomhet")}
                          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black text-emerald-300"
                        >
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Verifisert mot BRREG
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-800 bg-[#08111d] p-6 xl:border-l xl:border-t-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                      Din oversikt
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {[
                        ["Aktive saker", inquiries.length],
                        ["Krever handling", preparationInquiries.length],
                        ["Uleste meldinger", unreadMessages],
                        ["Kontakter", contacts.length],
                      ].map(([label, value]) => (
                        <div
                          key={String(label)}
                          className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
                        >
                          <p className="text-xl font-black text-white">{value}</p>
                          <p className="mt-1 text-[10px] text-slate-500">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {primaryPreparationInquiry && (
                <section className="relative overflow-hidden rounded-3xl border border-amber-500/35 bg-gradient-to-br from-amber-500/[0.10] via-[#0c121b] to-[#0b0f17] p-5 md:p-7">
                  <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />

                  <div className="relative">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="max-w-3xl">
                        <div className="flex items-center gap-2 text-amber-300">
                          <AlertCircle className="h-5 w-5" />
                          <p className="text-[10px] font-black uppercase tracking-[0.16em]">
                            Viktig før befaring
                          </p>
                        </div>

                        <h2 className="mt-3 text-2xl font-black">
                          Hjelp oss å forberede befaringen
                        </h2>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                          Jo bedre informasjon vi får på forhånd, desto mer
                          målrettet kan vi forberede befaringen. Det tar normalt
                          bare noen få minutter å fylle ut opplysningene.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          openPreparationCase(primaryPreparationInquiry)
                        }
                        className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#F5B800] px-5 py-3 text-xs font-black text-slate-950 transition hover:bg-amber-400"
                      >
                        Fyll ut opplysninger
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/45 p-4 md:p-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-black text-white">
                            Sak #{primaryPreparationInquiry.id} ·{" "}
                            {serviceLabel(primaryPreparationInquiry.inquiry_type)}
                          </p>

                          <p className="mt-1 text-[11px] text-slate-500">
                            {[
                              primaryPreparationInquiry.address,
                              primaryPreparationInquiry.postal_code,
                              primaryPreparationInquiry.city,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        </div>

                        <span className="w-fit rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-[10px] font-black text-amber-300">
                          Opplysninger ønskes
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                          [
                            "1",
                            "Problem og historikk",
                            "Hva har skjedd og når startet det?",
                          ],
                          [
                            "2",
                            "Bilder og dokumentasjon",
                            "Bilder, forsikring og relevante vedlegg.",
                          ],
                          [
                            "3",
                            "Eiendommen",
                            "Tidligere arbeider og andre involverte.",
                          ],
                          [
                            "4",
                            "Praktisk før oppmøte",
                            "Tilgang og annen viktig informasjon.",
                          ],
                        ].map(([number, title, description]) => (
                          <div
                            key={number}
                            className="rounded-2xl border border-slate-800 bg-[#0b111b] p-4"
                          >
                            <div className="grid h-8 w-8 place-items-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-xs font-black text-amber-300">
                              {number}
                            </div>
                            <p className="mt-3 text-xs font-black text-white">
                              {title}
                            </p>
                            <p className="mt-1 text-[10px] leading-4 text-slate-500">
                              {description}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.06] p-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <p className="text-[11px] leading-5 text-slate-400">
                          Opplysningene brukes av prosjektansvarlig til å
                          forberede saken før befaring og gir et bedre grunnlag
                          for videre vurdering.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
                <div className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0b0f17]">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-800 p-5">
                    <div>
                      <h2 className="text-sm font-black">Aktive saker</h2>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Status og neste steg for virksomhetens saker.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setView("saker")}
                      className="text-[11px] font-bold text-amber-300"
                    >
                      Se alle
                    </button>
                  </div>

                  <div className="divide-y divide-slate-800">
                    {inquiries.slice(0, 5).map((inquiry) => {
                      const needsInfo =
                        String(inquiry.status || "").toLowerCase() ===
                          "venter_pa_kundeopplysninger" ||
                        String(inquiry.stage || "").toLowerCase() ===
                          "digital_befaring";

                      return (
                        <div
                          key={inquiry.id}
                          className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-xs font-black text-white">
                                Sak #{inquiry.id} ·{" "}
                                {serviceLabel(inquiry.inquiry_type)}
                              </p>

                              {needsInfo && (
                                <span className="rounded-md bg-amber-500/10 px-2 py-1 text-[9px] font-black text-amber-300">
                                  Krever opplysninger
                                </span>
                              )}
                            </div>

                            <p className="mt-1 truncate text-[10px] text-slate-500">
                              {[inquiry.address, inquiry.postal_code, inquiry.city]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[9px] font-bold text-slate-400">
                              {statusLabel(inquiry.status)}
                            </span>

                            <button
                              type="button"
                              onClick={() => openPreparationCase(inquiry)}
                              className={`rounded-lg px-3 py-2 text-[10px] font-black ${
                                needsInfo
                                  ? "bg-[#F5B800] text-slate-950"
                                  : "border border-slate-700 bg-slate-900 text-slate-300"
                              }`}
                            >
                              {needsInfo ? "Fyll ut" : "Åpne"}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {inquiries.length === 0 && (
                      <div className="p-10 text-center">
                        <ClipboardList className="mx-auto h-7 w-7 text-slate-700" />
                        <p className="mt-3 text-xs text-slate-600">
                          Ingen saker registrert.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-black">Kontaktpersoner</h2>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Virksomhetens registrerte kontakter.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setView("kontakter")}
                      className="text-[11px] font-bold text-amber-300"
                    >
                      Administrer
                    </button>
                  </div>

                  <div className="mt-5 space-y-3">
                    {contacts.slice(0, 5).map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3"
                      >
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-800 bg-slate-950">
                          <User className="h-4 w-4 text-slate-500" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-white">
                            {contact.name}
                          </p>
                          <p className="truncate text-[10px] text-slate-500">
                            {contact.role || "Kontaktperson"}
                          </p>
                        </div>

                        {Boolean(Number(contact.is_primary)) && (
                          <span className="rounded-lg bg-amber-500/10 px-2 py-1 text-[9px] font-black text-amber-300">
                            Hovedkontakt
                          </span>
                        )}
                      </div>
                    ))}

                    {contacts.length === 0 && (
                      <p className="py-6 text-center text-xs text-slate-600">
                        Ingen kontaktpersoner registrert.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}

          {view === "virksomhet" && (
            <section className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-400">
                    Virksomhetsregister
                  </p>
                  <h1 className="mt-1 text-3xl font-black">Virksomhet</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                    Firmaopplysninger og registrerte roller hentet fra
                    Brønnøysundregistrene.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fetchBrreg(customer?.organization_number)}
                  disabled={brregLoading || !customer?.organization_number}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-bold text-slate-300 transition hover:text-white disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${brregLoading ? "animate-spin" : ""}`}
                  />
                  Oppdater fra BRREG
                </button>
              </div>

              {brregError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
                  {brregError}
                </div>
              )}

              <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                <article className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                        Registrert virksomhet
                      </p>
                      <h2 className="mt-2 text-2xl font-black">
                        {brregCompany?.name || customer?.name || "Virksomhet"}
                      </h2>
                    </div>

                    {brregCompany && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black text-emerald-300">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        BRREG
                      </span>
                    )}
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                        Organisasjonsnummer
                      </p>
                      <p className="mt-2 text-sm font-black text-white">
                        {brregCompany?.organization_number ||
                          customer?.organization_number ||
                          "Ikke registrert"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                        Organisasjonsform
                      </p>
                      <p className="mt-2 text-sm font-black text-white">
                        {brregCompany?.organization_form_description ||
                          brregCompany?.organization_form ||
                          customer?.customer_type ||
                          "Ikke oppgitt"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4 sm:col-span-2">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                        Registrert adresse
                      </p>
                      <p className="mt-2 text-sm font-black text-white">
                        {[
                          brregCompany?.address || customer?.address,
                          brregCompany?.postal_code || customer?.postal_code,
                          brregCompany?.city || customer?.city,
                        ]
                          .filter(Boolean)
                          .join(", ") || "Ikke oppgitt"}
                      </p>
                    </div>

                    {brregCompany?.registered_date && (
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                          Registrert
                        </p>
                        <p className="mt-2 text-sm font-black text-white">
                          {brregCompany.registered_date}
                        </p>
                      </div>
                    )}

                    {(brregCompany?.email || brregCompany?.phone) && (
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                          Kontakt hos BRREG
                        </p>
                        <p className="mt-2 text-xs font-bold text-white">
                          {brregCompany?.email || brregCompany?.phone}
                        </p>
                      </div>
                    )}
                  </div>

                  {brregCompany && (
                    <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] p-4">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <p className="text-[11px] leading-5 text-slate-400">
                        Virksomhetsopplysningene er hentet direkte fra
                        Brønnøysundregistrene. Rolleopplysninger brukes som
                        registerinformasjon og er ikke alene en innloggingsbekreftelse.
                      </p>
                    </div>
                  )}
                </article>

                <article className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                      Registrerte roller
                    </p>
                    <h2 className="mt-2 text-xl font-black">
                      Styre og andre roller
                    </h2>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500">
                      Roller rapportert til Brønnøysundregistrene.
                    </p>
                  </div>

                  <div className="mt-5 space-y-3">
                    {brregLoading ? (
                      <div className="flex items-center gap-2 py-8 text-xs text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin text-[#F5B800]" />
                        Henter roller...
                      </div>
                    ) : brregRoles.length > 0 ? (
                      brregRoles.map((role, index) => (
                        <div
                          key={`${role.name}-${role.role_code || index}`}
                          className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-4"
                        >
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-800 bg-slate-950">
                            <User className="h-4 w-4 text-slate-500" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-black text-white">
                              {role.name}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-500">
                              {role.role || role.role_group || "Registrert rolle"}
                            </p>
                          </div>

                          <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                        </div>
                      ))
                    ) : (
                      <p className="py-8 text-center text-xs text-slate-600">
                        Ingen roller funnet i BRREG.
                      </p>
                    )}
                  </div>
                </article>
              </div>

              <article className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                      Portalbrukere
                    </p>
                    <h2 className="mt-2 text-xl font-black">
                      Kontaktpersoner med tilgang
                    </h2>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Portalbrukere administreres separat fra rollene i BRREG.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setView("kontakter");
                      setShowContactModal(true);
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#F5B800] px-4 py-3 text-xs font-black text-slate-950"
                  >
                    <Plus className="h-4 w-4" />
                    Legg til kontaktperson
                  </button>
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-2">
                  {contacts.slice(0, 6).map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-4"
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-800 bg-slate-950">
                        <User className="h-4 w-4 text-slate-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-black">
                          {contact.name}
                        </p>
                        <p className="mt-1 truncate text-[10px] text-slate-500">
                          {contact.role || "Kontaktperson"}
                        </p>
                      </div>
                      {Boolean(Number(contact.is_primary)) && (
                        <span className="rounded-lg bg-amber-500/10 px-2 py-1 text-[9px] font-black text-amber-300">
                          Hovedkontakt
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            </section>
          )}

          {view === "saker" && (
            <section className="space-y-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-400">
                    Virksomhetens saker
                  </p>
                  <h1 className="mt-1 text-3xl font-black">Saker</h1>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                  <input
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(event.target.value)
                    }
                    placeholder="Søk sak, adresse eller tjeneste..."
                    className="w-full rounded-xl border border-slate-800 bg-[#0b1725] py-3 pl-9 pr-3 text-xs text-white outline-none focus:border-amber-500/50 sm:w-[360px]"
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0b0f17]">
                <div className="divide-y divide-slate-800">
                  {filteredInquiries.map((inquiry) => (
                    <article
                      key={inquiry.id}
                      className="grid gap-4 p-5 lg:grid-cols-[1fr_1fr_auto] lg:items-center"
                    >
                      <div>
                        <p className="text-sm font-black">
                          Sak #{inquiry.id}
                        </p>
                        <p className="mt-1 text-xs text-amber-300">
                          {serviceLabel(inquiry.inquiry_type)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-300">
                          {[inquiry.address, inquiry.postal_code, inquiry.city]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {inquiry.assigned_to
                            ? `Prosjektansvarlig: ${inquiry.assigned_to}`
                            : "Ikke tildelt prosjektansvarlig"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 lg:justify-end">
                        <span className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-[10px] font-bold text-slate-400">
                          {statusLabel(inquiry.status)}
                        </span>
                        <button
                          type="button"
                          className="grid h-9 w-9 place-items-center rounded-xl border border-slate-700 bg-slate-900 text-slate-400 hover:text-white"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {view === "kontakter" && (
            <section className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-400">
                    Virksomheten
                  </p>
                  <h1 className="mt-1 text-3xl font-black">
                    Kontaktpersoner
                  </h1>
                  <p className="mt-2 text-sm text-slate-400">
                    Styre, administrasjon, vaktmester og andre personer
                    tilknyttet virksomheten.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowContactModal(true)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#F5B800] px-4 py-3 text-xs font-black text-slate-950"
                >
                  <Plus className="h-4 w-4" />
                  Legg til kontaktperson
                </button>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {contacts.map((contact) => (
                  <article
                    key={contact.id}
                    className="rounded-2xl border border-slate-800 bg-[#0b0f17] p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-slate-800 bg-slate-950">
                        <User className="h-5 w-5 text-slate-500" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-black">
                            {contact.name}
                          </h3>

                          {Boolean(Number(contact.is_primary)) && (
                            <span className="rounded-lg bg-amber-500/10 px-2 py-1 text-[9px] font-black text-amber-300">
                              Hovedkontakt
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          {contact.role || "Kontaktperson"}
                        </p>

                        <div className="mt-4 space-y-2 text-xs text-slate-400">
                          {contact.email && (
                            <a
                              href={`mailto:${contact.email}`}
                              className="flex items-center gap-2 hover:text-white"
                            >
                              <Mail className="h-4 w-4 text-slate-600" />
                              {contact.email}
                            </a>
                          )}

                          {contact.phone && (
                            <a
                              href={`tel:${contact.phone}`}
                              className="flex items-center gap-2 hover:text-white"
                            >
                              <Phone className="h-4 w-4 text-slate-600" />
                              {contact.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {view === "eiendommer" && (
            <section className="space-y-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-400">
                  Eiendomsoversikt
                </p>
                <h1 className="mt-1 text-3xl font-black">Eiendommer</h1>
                <p className="mt-2 text-sm text-slate-400">
                  Eiendommer og adresser som tilhører virksomheten.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {properties.map((property) => (
                  <article
                    key={property.id}
                    className="rounded-2xl border border-slate-800 bg-[#0b0f17] p-5"
                  >
                    <MapPin className="h-5 w-5 text-[#F5B800]" />
                    <h3 className="mt-4 text-sm font-black">
                      {property.name || property.address}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      {[property.address, property.postal_code, property.city]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {property.property_number && (
                      <p className="mt-2 text-[10px] text-slate-600">
                        Eiendomsnr.: {property.property_number}
                      </p>
                    )}
                  </article>
                ))}

                {properties.length === 0 && (
                  <div className="col-span-full rounded-3xl border border-dashed border-slate-800 bg-[#0b0f17] p-10 text-center">
                    <MapPin className="mx-auto h-8 w-8 text-slate-700" />
                    <p className="mt-3 text-xs text-slate-500">
                      Ingen egne eiendommer registrert ennå.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {view === "meldinger" && (
            <section className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-8">
              <MessageSquare className="h-7 w-7 text-[#F5B800]" />
              <h1 className="mt-4 text-2xl font-black">Meldinger</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Her kobler vi neste steg til det eksisterende
                meldingssenteret, men med valg av sak og kontaktpersoner for
                virksomheten.
              </p>
            </section>
          )}

          {view === "dokumenter" && (
            <section className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-8">
              <FileText className="h-7 w-7 text-[#F5B800]" />
              <h1 className="mt-4 text-2xl font-black">Dokumenter</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Dokumentarkiv for rapporter, tilbud, avtaler og øvrig
                dokumentasjon knyttet til virksomhetens saker.
              </p>
            </section>
          )}
        </main>
      </div>

      {showContactModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !savingContact) {
              setShowContactModal(false);
            }
          }}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-800 bg-[#0b0f17] shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 p-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-400">
                  Kontaktregister
                </p>
                <h3 className="mt-1 text-lg font-black">
                  Legg til kontaktperson
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-slate-800 bg-slate-950 text-slate-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {contactError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                  {contactError}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={contactDraft.name}
                  onChange={(event) =>
                    setContactDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Navn"
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-amber-500/50 sm:col-span-2"
                />

                <input
                  value={contactDraft.email}
                  onChange={(event) =>
                    setContactDraft((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="E-post"
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-amber-500/50"
                />

                <input
                  value={contactDraft.phone}
                  onChange={(event) =>
                    setContactDraft((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  placeholder="Telefon"
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-amber-500/50"
                />

                <input
                  value={contactDraft.role}
                  onChange={(event) =>
                    setContactDraft((current) => ({
                      ...current,
                      role: event.target.value,
                    }))
                  }
                  placeholder="Rolle, f.eks. styreleder eller vaktmester"
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-amber-500/50 sm:col-span-2"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                <input
                  type="checkbox"
                  checked={contactDraft.is_primary}
                  onChange={(event) =>
                    setContactDraft((current) => ({
                      ...current,
                      is_primary: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[#F5B800]"
                />
                <span className="text-xs font-bold text-slate-300">
                  Sett som hovedkontakt
                </span>
              </label>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-bold text-slate-300"
                >
                  Avbryt
                </button>

                <button
                  type="button"
                  onClick={saveContact}
                  disabled={savingContact || !contactDraft.name.trim()}
                  className="flex items-center gap-2 rounded-xl bg-[#F5B800] px-5 py-3 text-xs font-black text-slate-950 disabled:opacity-50"
                >
                  {savingContact ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Lagre kontaktperson
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
