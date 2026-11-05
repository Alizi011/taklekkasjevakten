import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Upload,
  UserCheck,
  Wrench,
} from "lucide-react";
import ChecklistManager from "../components/ChecklistManager";
import PhotoWithAudioNote from "../components/PhotoWithAudioNote";
import { apiUrl } from "../lib/api";
interface PreviewEmployee {
  id?: number;
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

interface InquiryTeam {
  project_manager: TeamMember | null;
  technician: TeamMember | null;
}

interface TechnicianDashboardProps {
  previewEmployee?: PreviewEmployee | null;
  onBackToAdmin?: () => void;
}

interface Inquiry {
  id: number | string;
  customer_id?: number | string | null;
  customer_name?: string;
  customerName?: string;
  customer_type?: string;
  phone?: string;
  email?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  roof_type?: string;
  roofType?: string;
  building_type?: string;
  inquiry_type?: string;
  type?: string;
  status?: string;
  stage?: string;
  recommended_service?: string | null;
  assigned_to?: string | null;
  notes?: string;
  created_at?: string;
  createdAt?: string;
  is_new?: boolean | number;
}

interface PhotoData {
  id: number;
  inquiry_id: number;
  photo_url: string;
  audio_url: string | null;
  caption_text?: string | null;
}

const FIELD_STAGES = new Set([
  "utfonring_felt",
  "rapport_funn",
]);

const NORWEGIAN_MONTHS: Record<string, number> = {
  januar: 0,
  februar: 1,
  mars: 2,
  april: 3,
  mai: 4,
  juni: 5,
  juli: 6,
  august: 7,
  september: 8,
  oktober: 9,
  november: 10,
  desember: 11,
};

function normalizeInquiryId(value: number | string | undefined): number {
  const id = Number(value);
  return Number.isFinite(id) ? id : 0;
}

function customerName(inquiry: Inquiry): string {
  return inquiry.customer_name || inquiry.customerName || "Ukjent kunde";
}

function fullAddress(inquiry: Inquiry): string {
  return [inquiry.address, inquiry.postal_code, inquiry.city]
    .filter(Boolean)
    .join(", ");
}

function serviceLabel(value?: string | null): string {
  switch ((value || "").toLowerCase()) {
    case "lekkasjesok":
      return "Lekkasjesøk";
    case "service":
      return "Service";
    case "takkontroll":
      return "Takkontroll";
    default:
      return "Feltkontroll";
  }
}

function parseInquiryBooking(inquiry: Inquiry): Date | null {
  const notes = inquiry.notes || "";

  const dotted = notes.match(
    /Valgt dato\/tid:\s*(?:mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag)?\s*(\d{1,2})\.(\d{1,2})\.(\d{4})\s*\((\d{1,2}):(\d{2})\)/i
  );

  if (dotted) {
    return new Date(
      Number(dotted[3]),
      Number(dotted[2]) - 1,
      Number(dotted[1]),
      Number(dotted[4]),
      Number(dotted[5])
    );
  }

  const iso = notes.match(
    /Valgt dato\/tid:\s*(\d{4})-(\d{2})-(\d{2})\s*\((\d{1,2}):(\d{2})\)/i
  );

  if (iso) {
    return new Date(
      Number(iso[1]),
      Number(iso[2]) - 1,
      Number(iso[3]),
      Number(iso[4]),
      Number(iso[5])
    );
  }

  const written = notes.match(
    /Valgt dato\/tid:\s*(?:mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag)?\s*(\d{1,2})\.?\s+([a-zæøå]+)\s+(\d{4})\s*\((\d{1,2}):(\d{2})\)/i
  );

  if (written) {
    const month = NORWEGIAN_MONTHS[written[2].toLowerCase()];

    if (month !== undefined) {
      return new Date(
        Number(written[3]),
        month,
        Number(written[1]),
        Number(written[4]),
        Number(written[5])
      );
    }
  }

  return null;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("nb-NO", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function FieldPhotos({
  inquiryId,
}: {
  inquiryId: number;
}) {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fetchPhotos = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(apiUrl(`/photos.php?inquiry_id=${inquiryId}`));
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke hente feltbilder.");
      }

      setPhotos(Array.isArray(data.photos) ? data.photos : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunne ikke hente feltbilder."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (inquiryId > 0) {
      fetchPhotos();
    }
  }, [inquiryId]);

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setError("");

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("inquiry_id", inquiryId.toString());
        formData.append("photo", file);

        const res = await fetch(apiUrl("/photos.php"), {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || `Kunne ikke laste opp ${file.name}.`);
        }
      }

      event.target.value = "";
      await fetchPhotos();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Bildeopplasting feilet."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleAudioSaved = (photoId: number, audioUrl: string) => {
    setPhotos((prev) =>
      prev.map((photo) =>
        photo.id === photoId
          ? { ...photo, audio_url: audioUrl }
          : photo
      )
    );
  };

  return (
    <section className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="font-extrabold text-base text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#F5B800]" />
            Feltbilder & lydnotater
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Dokumentasjon som lagres direkte på oppdraget.
          </p>
        </div>

        <label className="bg-[#F5B800] hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all">
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? "Laster opp..." : "Legg til bilder"}
          <input
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
          Henter dokumentasjon...
        </div>
      ) : photos.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-2xl py-10 text-center text-xs text-slate-500">
          Ingen feltbilder er lastet opp ennå.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <PhotoWithAudioNote
              key={photo.id}
              photoId={photo.id}
              photoUrl={photo.photo_url}
              onAudioSaved={handleAudioSaved}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function TechnicianDashboard({
  previewEmployee,
  onBackToAdmin,
}: TechnicianDashboardProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [teamOverview, setTeamOverview] = useState<Record<string, InquiryTeam>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeInquiryId, setActiveInquiryId] = useState<number | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  const technicianName =
    previewEmployee?.name || "Tekniker";

  const fetchTeamOverview = async (
    items: Inquiry[]
  ): Promise<Record<string, InquiryTeam>> => {
    const entries = await Promise.all(
      items.map(async (inquiry) => {
        try {
          const res = await fetch(
            apiUrl(`/inquiry_team.php?inquiry_id=${normalizeInquiryId(inquiry.id)}`)
          );
          const data = await res.json();

          if (res.ok && data.success) {
            return [
              inquiry.id.toString(),
              {
                project_manager: data.project_manager || null,
                technician: data.technician || null,
              },
            ] as const;
          }
        } catch (err) {
          console.error(
            `Feil ved henting av team for oppdrag #${inquiry.id}:`,
            err
          );
        }

        return [
          inquiry.id.toString(),
          {
            project_manager: null,
            technician: null,
          },
        ] as const;
      })
    );

    return Object.fromEntries(entries);
  };

  const fetchInquiries = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(apiUrl("/inquiries.php"));
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        throw new Error(data?.message || "Kunne ikke hente oppdrag.");
      }

      const allInquiries = data as Inquiry[];
      const teams = await fetchTeamOverview(allInquiries);
      setTeamOverview(teams);

      const employeeId = previewEmployee?.id
        ? Number(previewEmployee.id)
        : null;

      const assignedInquiries = employeeId
        ? allInquiries.filter((inquiry) => {
            // Digital befaring utføres kun av prosjektansvarlig
            // og skal aldri vises i teknikerportalen.
            if (inquiry.stage === "digital_befaring") {
              return false;
            }

            const technician =
              teams[inquiry.id.toString()]?.technician;

            return Number(technician?.employee_id) === employeeId;
          })
        : allInquiries.filter(
            (inquiry) => inquiry.stage !== "digital_befaring"
          );

      setInquiries(assignedInquiries);

      if (
        activeInquiryId &&
        !assignedInquiries.some(
          (item) =>
            normalizeInquiryId(item.id) === activeInquiryId
        )
      ) {
        setActiveInquiryId(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunne ikke hente oppdrag."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [previewEmployee?.id]);

  const fieldJobs = useMemo(() => {
    const jobs = inquiries.filter((inquiry) => {
      const stage = inquiry.stage || "";
      const status = (inquiry.status || "").toLowerCase();

      if (stage === "digital_befaring") {
        return false;
      }

      return (
        FIELD_STAGES.has(stage) ||
        status === "planlagt" ||
        status === "pagaende"
      );
    });

    return jobs;
  }, [inquiries]);

  const scheduledJobs = useMemo(
    () =>
      fieldJobs
        .map((inquiry) => ({
          inquiry,
          booking: parseInquiryBooking(inquiry),
        }))
        .filter(
          (
            item
          ): item is {
            inquiry: Inquiry;
            booking: Date;
          } => item.booking !== null
        )
        .sort((a, b) => a.booking.getTime() - b.booking.getTime()),
    [fieldJobs]
  );

  const today = new Date();

  const todayJobs = useMemo(
    () =>
      scheduledJobs.filter(({ booking }) =>
        sameDay(booking, today)
      ),
    [scheduledJobs]
  );

  const upcomingJobs = useMemo(
    () =>
      scheduledJobs.filter(
        ({ booking }) =>
          booking >= today && !sameDay(booking, today)
      ),
    [scheduledJobs]
  );

  const filteredUpcomingJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    if (!q) return upcomingJobs;

    return upcomingJobs.filter(({ inquiry }) =>
      [
        inquiry.id.toString(),
        customerName(inquiry),
        fullAddress(inquiry),
        serviceLabel(inquiry.recommended_service),
        inquiry.assigned_to || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [upcomingJobs, searchQuery]);

  const activeInquiry =
    fieldJobs.find(
      (inquiry) =>
        normalizeInquiryId(inquiry.id) === activeInquiryId
    ) || null;

  const openInquiry = (inquiry: Inquiry) => {
    const id = normalizeInquiryId(inquiry.id);
    if (id) setActiveInquiryId(id);
  };

  if (activeInquiry) {
    const booking = parseInquiryBooking(activeInquiry);

    return (
      <div className="min-h-screen bg-[#070a11] text-white">
        <header className="sticky top-0 z-40 bg-[#0b0f17] border-b border-slate-800 px-4 sm:px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div>
              <h1 className="font-extrabold text-base">
                Perun AS — Feltportal
              </h1>
              <p className="text-xs text-blue-400 font-semibold">
                Tekniker: {technicianName}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveInquiryId(null)}
              className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Til mine oppdrag
            </button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
<section className="bg-[#0b0f17] border border-amber-500/30 rounded-3xl p-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {serviceLabel(activeInquiry.recommended_service)}
                  </span>

                  <span className="font-mono text-xs text-slate-500">
                    Oppdrag #{activeInquiry.id}
                  </span>
                </div>

                <h2 className="text-2xl font-black mt-3">
                  {customerName(activeInquiry)}
                </h2>

                <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-2">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  {fullAddress(activeInquiry) || "Adresse ikke oppgitt"}
                </p>

                {activeInquiry.phone && (
                  <a
                    href={`tel:${activeInquiry.phone}`}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-blue-300 hover:text-blue-200"
                  >
                    <Phone className="w-4 h-4" />
                    {activeInquiry.phone}
                  </a>
                )}

                {booking && (
                  <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-2 font-bold">
                    <Clock3 className="w-4 h-4" />
                    {formatDate(booking)} kl. {formatTime(booking)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-[340px] max-w-full">
                <div className="bg-slate-950 border border-amber-500/20 rounded-xl px-3 py-3 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="block text-[9px] uppercase text-slate-500 font-extrabold">
                      Prosjektansvarlig
                    </span>
                    <span className="text-xs font-extrabold">
                      {teamOverview[activeInquiry.id.toString()]?.project_manager?.name ||
                        activeInquiry.assigned_to ||
                        "Ikke tildelt"}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-blue-500/20 rounded-xl px-3 py-3 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="block text-[9px] uppercase text-slate-500 font-extrabold">
                      Tekniker
                    </span>
                    <span className="text-xs font-extrabold">
                      {teamOverview[activeInquiry.id.toString()]?.technician?.name ||
                        technicianName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <ChecklistManager
            inquiryId={normalizeInquiryId(activeInquiry.id)}
            initialRoofType={
              activeInquiry.roof_type ||
              activeInquiry.roofType ||
              "Flatt tak"
            }
          />

          <FieldPhotos
            inquiryId={normalizeInquiryId(activeInquiry.id)}
          />

          <section className="bg-blue-500/10 border border-blue-500/30 rounded-2xl px-5 py-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-blue-300 text-xs">
                  Feltarbeid lagres fortløpende
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Sjekkliste, bilder og lydnotater deles med prosjektansvarlig.
                  Rapportutkast og innsending til admin håndteres av prosjektansvarlig.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a11] text-white">
      <header className="sticky top-0 z-40 bg-[#0b0f17] border-b border-slate-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-blue-400" />
            </div>

            <div>
              <h1 className="font-extrabold text-base">
                Perun AS — Feltportal
              </h1>
              <p className="text-xs text-blue-400 font-semibold">
                {previewEmployee
                  ? `Forhåndsvisning som ${previewEmployee.name} · ${previewEmployee.role}`
                  : `Tekniker: ${technicianName}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowProfile((current) => !current)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-colors ${
                showProfile
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                  : "bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Min profil
            </button>

            {onBackToAdmin && (
              <button
                type="button"
                onClick={onBackToAdmin}
                className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                Tilbake til admin
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {showProfile && (
          <section className="bg-[#0b0f17] border border-blue-500/25 rounded-3xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5 text-blue-400" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-blue-400">
                  Min profil
                </p>
                <h2 className="text-lg font-black text-white mt-1">
                  {technicianName}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {previewEmployee?.role || "Tekniker"}
                </p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                    <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-500">
                      E-post
                    </span>
                    <span className="block mt-1 font-bold text-slate-200 break-all">
                      {previewEmployee?.email || "Ikke registrert"}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                    <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-500">
                      Telefon
                    </span>
                    <span className="block mt-1 font-bold text-slate-200">
                      {previewEmployee?.phone || "Ikke registrert"}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 mt-4">
                  Profilen viser kun dine egne opplysninger. Endringer i rolle,
                  tilgang og team håndteres av prosjektansvarlig eller admin.
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
              Oppdrag i dag
            </p>
            <p className="text-2xl font-black mt-1.5 text-amber-400">
              {todayJobs.length}
            </p>
          </div>

          <div className="bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
              Kommende oppdrag
            </p>
            <p className="text-2xl font-black mt-1.5 text-blue-400">
              {upcomingJobs.length}
            </p>
          </div>

          <div className="bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
              Feltrolle
            </p>
            <p className="text-sm font-black mt-2 text-white">
              Tekniker
            </p>
          </div>
        </section>

        <section className="bg-[#0b0f17] border border-amber-500/30 rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
            <CalendarDays className="w-5 h-5 text-[#F5B800]" />
            <div>
              <h2 className="text-lg font-extrabold">
                I dag
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Dagens planlagte feltoppdrag.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-8 flex justify-center items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              Henter oppdrag...
            </div>
          ) : error ? (
            <div className="border border-red-500/30 bg-red-500/10 text-red-300 rounded-xl px-4 py-3 text-xs">
              {error}
            </div>
          ) : todayJobs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Ingen tildelte oppdrag er satt opp i dag.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {todayJobs.map(({ inquiry, booking }) => (
                <button
                  key={inquiry.id}
                  type="button"
                  onClick={() => openInquiry(inquiry)}
                  className="bg-slate-950 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 text-left flex items-center gap-4 transition-all"
                >
                  <div className="w-16 shrink-0">
                    <div className="text-xl font-black text-amber-400">
                      {formatTime(booking)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-white">
                        {serviceLabel(inquiry.recommended_service)}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        #{inquiry.id}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-bold mt-1">
                      {customerName(inquiry)}
                    </p>

                    <p className="text-[11px] text-slate-500 truncate mt-1">
                      {fullAddress(inquiry)}
                    </p>
                  </div>

                  <ArrowUpRight className="w-4 h-4 text-slate-500" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-extrabold flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-400" />
                Mine kommende oppdrag
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Kommende kontroller og feltarbeid.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  placeholder="Søk oppdrag..."
                  className="w-64 max-w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={fetchInquiries}
                className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-blue-400"
                title="Oppdater"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {filteredUpcomingJobs.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              Ingen kommende oppdrag er tildelt denne teknikeren.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Dato</th>
                    <th className="py-3 px-3">Tid</th>
                    <th className="py-3 px-3">Tjeneste</th>
                    <th className="py-3 px-3">Kunde</th>
                    <th className="py-3 px-3">Adresse</th>
                    <th className="py-3 px-3">Prosjektansvarlig</th>
                    <th className="py-3 px-3 text-right"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/80">
                  {filteredUpcomingJobs.map(
                    ({ inquiry, booking }) => (
                      <tr
                        key={inquiry.id}
                        className="hover:bg-slate-800/30"
                      >
                        <td className="py-4 px-3 text-slate-300 whitespace-nowrap">
                          {formatDate(booking)}
                        </td>

                        <td className="py-4 px-3 font-black text-amber-400">
                          {formatTime(booking)}
                        </td>

                        <td className="py-4 px-3 font-bold text-white">
                          {serviceLabel(
                            inquiry.recommended_service
                          )}
                        </td>

                        <td className="py-4 px-3 font-bold text-slate-200">
                          {customerName(inquiry)}
                        </td>

                        <td className="py-4 px-3 text-slate-400">
                          {fullAddress(inquiry)}
                        </td>

                        <td className="py-4 px-3 text-slate-300">
                          {teamOverview[inquiry.id.toString()]?.project_manager?.name ||
                            inquiry.assigned_to ||
                            "Ikke tildelt"}
                        </td>

                        <td className="py-4 px-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              openInquiry(inquiry)
                            }
                            className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 text-slate-400 hover:text-blue-400"
                            title="Åpne oppdrag"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}