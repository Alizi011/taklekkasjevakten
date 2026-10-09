import { useState, useEffect } from "react";
import {
  Inbox,
  AlertTriangle,
  Search,
  LogOut,
  MapPin,
  Filter,
  FileText,
  Calendar,
  CalendarCheck,
  Wrench,
  ShieldCheck,
  Video,
  Plus,
  ShieldAlert,
  ClipboardList,
  Image as ImageIcon,
  Loader2,
  Edit3,
  PlusCircle,
  X,
  Building,
  Users,
  UserCheck,
  CircleDollarSign,
  Bell,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Database,
  UserCircle,
  Code2,
  Settings,
  CarFront,
  Clock3,
  Mail,
} from "lucide-react";
import InquiryDetail, { type Inquiry } from "./InquiryDetail";
import ChecklistManager from "../components/ChecklistManager";
import CustomerList, { type Customer } from "../components/CustomerList";
import EmployeeList, { type Employee } from "../components/EmployeeList";
import CustomerDashboard from "./CustomerDashboard";
import BusinessCustomerDashboard from "./BusinessCustomerDashboard";
import ProjectManagerDashboard from "./ProjectManagerDashboard";
import TechnicianDashboard from "./TechnicianDashboard";
import AdminReportReview from "./AdminReportReview";
import DataImportPage from "./DataImportPage";
import AdminProfilePage from "./AdminProfilePage";
import TechnicalDocumentation from "./TechnicalDocumentation";
import DrivingLogPage from "./DrivingLogPage";
import TimeOverviewPage from "./TimeOverviewPage";
import ProspectPage from "./ProspectPage";
import EmailCenterPage from "./EmailCenterPage";
import SettingsPage from "./SettingsPage";
import { API_BASE, apiUrl } from "../lib/api";
interface ProjectData {
  id: number;
  title: string;
  category: string;
  location: string;
  description: string;
  case_text?: string;
  image_url: string;
  images_json?: string;
  images?: any[];
}

interface ProjectImageInput {
  file: File | null;
  existingUrl?: string;
  caption: string;
  stage: "before" | "during" | "after";
  isCoverBefore?: boolean;
  isCoverAfter?: boolean;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

type ReportStatus =
  | "utkast"
  | "sendt_til_admin"
  | "under_gjennomgang"
  | "returnert_til_prosjektansvarlig"
  | "godkjent"
  | "publisert";

interface ReportSummary {
  status: ReportStatus;
  report_type?: "rapport1" | "rapport2";
}

interface ReportArchiveItem {
  archive_key: string;
  report_id: number;
  report_type: "rapport1" | "rapport2";
  report_type_label: string;
  title?: string | null;
  inquiry_id: number;
  revision_no: number;
  status: ReportStatus;
  archive_category: "review" | "approved" | "sent" | "draft" | "returned";
  pdf_url?: string | null;
  has_pdf?: boolean;
  submitted_at?: string | null;
  returned_at?: string | null;
  approved_at?: string | null;
  published_at?: string | null;
  activity_at?: string | null;
  customer_id?: number | null;
  customer_name?: string | null;
  recipient_name?: string | null;
  recipient_email?: string | null;
  recipient_phone?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  full_address?: string | null;
  inquiry_type?: string | null;
}

interface ReportArchiveCounts {
  all: number;
  review: number;
  approved: number;
  sent: number;
  draft: number;
  returned: number;
}

// API-konfigurasjonen hentes fra src/lib/api.ts.

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"oppdrag" | "kalender" | "sjekklister" | "prosjekter" | "kunder" | "markedsforing" | "epost" | "ansatte" | "timeliste" | "kjorebok" | "dataimport" | "rapporter" | "innstillinger">("oppdrag");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<
    "aktive" | "handling" | "avsluttede" | "rapporter"
  >("aktive");
  const [drivingLogTab, setDrivingLogTab] = useState<
    "oversikt" | "kjoringer" | "kjoretoy" | "kilometerstand"
  >("oversikt");
  const [timeOverviewTab, setTimeOverviewTab] = useState<
    "oversikt" | "timer" | "ansatte" | "godkjenning"
  >("oversikt");
  const [employeeView, setEmployeeView] = useState<
    "ansatte" | "roller" | "prosjektteam"
  >("ansatte");
  const [marketingSegment, setMarketingSegment] = useState<
    "private" | "business" | "housing"
  >("housing");
  const [customerView, setCustomerView] = useState<
    "all" | "private" | "business" | "housing" | "properties"
  >("all");
  const [dataImportView, setDataImportView] = useState<
    "new" | "history" | "issues"
  >("new");
  const [settingsView, setSettingsView] = useState<
    "company" | "users" | "notifications" | "technical"
  >("company");
  const [technicalView, setTechnicalView] = useState<
    "architecture" | "databases" | "apis" | "modules"
  >("architecture");
  const [reportView, setReportView] = useState<
    "review" | "approved" | "sent"
  >("review");
  const [reportTemplatePreview, setReportTemplatePreview] = useState<
    "lekkasjesok" | "takkontroll" | "completion" | null
  >(null);
  
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>("alle");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [previewCustomerInquiryId, setPreviewCustomerInquiryId] = useState<number | null>(null);
  const [previewBusinessCustomerId, setPreviewBusinessCustomerId] = useState<number | null>(null);
  const [previewEmployee, setPreviewEmployee] = useState<Employee | null>(null);
  const [previewEmployeeFromInquiry, setPreviewEmployeeFromInquiry] = useState(false);
  const [reportStatuses, setReportStatuses] = useState<Record<string, ReportSummary | null>>({});
  const [reportArchive, setReportArchive] = useState<ReportArchiveItem[]>([]);
  const [reportArchiveCounts, setReportArchiveCounts] = useState<ReportArchiveCounts>({
    all: 0,
    review: 0,
    approved: 0,
    sent: 0,
    draft: 0,
    returned: 0,
  });
  const [reportArchiveLoading, setReportArchiveLoading] = useState(false);
  const [reportArchiveError, setReportArchiveError] = useState("");
  const [reviewInquiry, setReviewInquiry] = useState<Inquiry | null>(null);
  const [calendarCursor, setCalendarCursor] = useState(new Date());
  const [calendarView, setCalendarView] = useState<"day" | "week" | "month">("month");
  const [checklistView, setChecklistView] = useState<"templates" | "completed">("templates");
  const [projectLibraryView, setProjectLibraryView] = useState<"published" | "new" | "archive">("published");
  const [notificationBusy, setNotificationBusy] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string>("");
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [adminEmployees, setAdminEmployees] = useState<Employee[]>([]);
  const [quickManagerSelections, setQuickManagerSelections] = useState<Record<string, string>>({});
  const [quickAssignBusyId, setQuickAssignBusyId] = useState<string | null>(null);
  const [quickAssignMessage, setQuickAssignMessage] = useState("");

  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [uploadingProject, setUploadingProject] = useState<boolean>(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [projectEditorOpen, setProjectEditorOpen] = useState<boolean>(false);

  const [newProject, setNewProject] = useState({
    title: "",
    category: "Blikkenslager",
    location: "",
    description: "",
    caseText: "",
  });

  const [projectImages, setProjectImages] = useState<ProjectImageInput[]>([
    { file: null, caption: "", stage: "after", isCoverBefore: true, isCoverAfter: false },
  ]);


  const resolveProjectImageUrl = (url?: string) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;

    // API_BASE kan være f.eks. https://api.taklekkasjevakten.no/api,
    // mens prosjektbildene ligger på domenets rot: /uploads/projects/...
    const apiOrigin = API_BASE.replace(/\/api\/?$/i, "").replace(/\/$/, "");
    const normalized = url.startsWith("/") ? url : `/${url}`;

    return `${apiOrigin}${normalized}`;
  };

  const getProjectImages = (project: ProjectData) => {
    try {
      const raw =
        Array.isArray(project.images)
          ? project.images
          : typeof project.images_json === "string"
            ? JSON.parse(project.images_json)
            : [];

      if (!Array.isArray(raw)) return [];

      return raw
        .map((img: any) => {
          if (typeof img === "string") {
            return {
              url: img,
              caption: project.title,
              stage: "after",
              is_before: false,
              isCoverBefore: false,
              isCoverAfter: false,
            };
          }

          return {
            ...img,
            url: img?.url || img?.src || "",
            caption: img?.caption || project.title,
            stage: img?.stage || (img?.is_before ? "before" : "after"),
            is_before: Boolean(img?.is_before),
            isCoverBefore: Boolean(img?.isCoverBefore),
            isCoverAfter: Boolean(img?.isCoverAfter),
          };
        })
        .filter((img: any) => Boolean(img.url));
    } catch (err) {
      console.error("Feil ved tolking av prosjektbilder:", err);
      return [];
    }
  };

  const getProjectCover = (project: ProjectData, type: "before" | "after") => {
    const images = getProjectImages(project);
    const exact =
      type === "before"
        ? images.find((img: any) => img.isCoverBefore)
        : images.find((img: any) => img.isCoverAfter);

    if (exact) return resolveProjectImageUrl(exact.url);

    const staged =
      type === "before"
        ? images.find((img: any) => img.stage === "before" || img.is_before)
        : images.find((img: any) => img.stage === "after" && !img.is_before);

    if (staged) return resolveProjectImageUrl(staged.url);

    return resolveProjectImageUrl(project.image_url);
  };

  const addProjectImageSlot = () => {
    setProjectImages((prev) => [
      ...prev,
      {
        file: null,
        caption: "",
        stage: "after",
        isCoverBefore: false,
        isCoverAfter: false,
      },
    ]);
  };

  const updateProjectImage = (
    index: number,
    patch: Partial<ProjectImageInput>
  ) => {
    setProjectImages((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  };

  const removeProjectImage = (index: number) => {
    setProjectImages((prev) =>
      prev.length <= 1
        ? [{ file: null, caption: "", stage: "after", isCoverBefore: true, isCoverAfter: false }]
        : prev.filter((_, i) => i !== index)
    );
  };

  const setProjectCoverImage = (
    index: number,
    type: "before" | "after"
  ) => {
    setProjectImages((prev) =>
      prev.map((item, i) => ({
        ...item,
        isCoverBefore:
          type === "before" ? i === index : Boolean(item.isCoverBefore),
        isCoverAfter:
          type === "after" ? i === index : Boolean(item.isCoverAfter),
      }))
    );
  };

  const fetchReportStatuses = async (items: Inquiry[]) => {
    const entries = await Promise.all(
      items.map(async (inq) => {
        try {
          const [reportRes, completionRes] = await Promise.all([
            fetch(`${API_BASE}/reports.php?inquiry_id=${inq.id}`),
            fetch(`${API_BASE}/completion_reports.php?inquiry_id=${inq.id}`),
          ]);

          const [reportData, completionData] = await Promise.all([
            reportRes.json(),
            completionRes.json(),
          ]);

          const report1 =
            reportRes.ok && reportData.success ? reportData.report || null : null;
          const report2 =
            completionRes.ok && completionData.success
              ? completionData.report || null
              : null;

          const report2Status = String(report2?.status || "") as ReportStatus;

          // Rapport 2 har prioritet i adminlisten når den er sendt inn,
          // er under behandling, godkjent eller publisert.
          if (
            report2 &&
            [
              "sendt_til_admin",
              "under_gjennomgang",
              "godkjent",
              "publisert",
            ].includes(report2Status)
          ) {
            return [
              inq.id.toString(),
              {
                status: report2Status,
                report_type: "rapport2" as const,
              },
            ] as const;
          }

          if (report1) {
            return [
              inq.id.toString(),
              {
                status: report1.status as ReportStatus,
                report_type: "rapport1" as const,
              },
            ] as const;
          }

          return [inq.id.toString(), null] as const;
        } catch (err) {
          console.error(
            `Feil ved henting av rapportstatus for #${inq.id}:`,
            err
          );
          return [inq.id.toString(), null] as const;
        }
      })
    );

    setReportStatuses(Object.fromEntries(entries));
  };


  const fetchInquiries = async () => {
    try {
      const res = await fetch(apiUrl("/inquiries.php"));
      const data = await res.json();
      if (Array.isArray(data)) {
        setInquiries(data);
        await fetchReportStatuses(data);
      }
    } catch (err) {
      console.error("Feil ved henting av henvendelser:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(apiUrl("/projects.php"));
      const data = await res.json();
      if (data.success && Array.isArray(data.projects)) {
        setProjects(data.projects);
      }
    } catch (err) {
      console.error("Feil ved henting av prosjekter:", err);
    }
  };


  const fetchReportArchive = async () => {
    setReportArchiveLoading(true);
    setReportArchiveError("");

    try {
      const res = await fetch(apiUrl("/admin/report_archive.php"));
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke hente rapportarkivet.");
      }

      setReportArchive(Array.isArray(data.reports) ? data.reports : []);
      setReportArchiveCounts({
        all: Number(data.counts?.all || 0),
        review: Number(data.counts?.review || 0),
        approved: Number(data.counts?.approved || 0),
        sent: Number(data.counts?.sent || 0),
        draft: Number(data.counts?.draft || 0),
        returned: Number(data.counts?.returned || 0),
      });
    } catch (err) {
      console.error("Feil ved henting av rapportarkiv:", err);
      setReportArchive([]);
      setReportArchiveError(
        err instanceof Error ? err.message : "Kunne ikke hente rapportarkivet."
      );
    } finally {
      setReportArchiveLoading(false);
    }
  };

  const resolveReportPdfUrl = (url?: unknown) => {
    if (url === null || url === undefined) return "";

    const rawUrl = String(url).trim();
    if (!rawUrl) return "";
    if (/^https?:\/\//i.test(rawUrl)) return rawUrl;

    const apiOrigin = API_BASE.replace(/\/api\/?$/i, "").replace(/\/$/, "");
    const normalized = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
    return `${apiOrigin}${normalized}`;
  };

  const formatReportDate = (value?: unknown) => {
    if (value === null || value === undefined) return "—";

    const rawValue = String(value).trim();
    if (!rawValue) return "—";

    const date = new Date(rawValue.replace(" ", "T"));
    if (Number.isNaN(date.getTime())) return rawValue;

    return new Intl.DateTimeFormat("nb-NO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getReportTemplatePreviewUrl = (
    type: "lekkasjesok" | "takkontroll" | "completion"
  ) => {
    return apiUrl(
      `/admin/report_template_preview.php?type=${encodeURIComponent(type)}`
    );
  };

  const openReportArchiveItem = (report: ReportArchiveItem) => {
    const inquiry = inquiries.find(
      (item) => Number(item.id) === Number(report.inquiry_id)
    );

    if (inquiry) {
      setReviewInquiry(inquiry);
      return;
    }

    if (report.pdf_url) {
      window.open(resolveReportPdfUrl(report.pdf_url), "_blank", "noopener,noreferrer");
    }
  };

  const fetchAdminEmployees = async () => {
    try {
      const res = await fetch(apiUrl("/employees.php"));
      const data = await res.json();

      if (res.ok && Array.isArray(data)) {
        setAdminEmployees(data);
      }
    } catch (err) {
      console.error("Feil ved henting av ansatte til hurtigtildeling:", err);
    }
  };

  const quickAssignProjectManager = async (inq: Inquiry) => {
    const inquiryId = Number(inq.id);
    const selectedId = Number(quickManagerSelections[inq.id.toString()]);

    if (!selectedId) {
      setQuickAssignMessage("Velg prosjektleder før du tildeler saken.");
      return;
    }

    const selectedManager = adminEmployees.find(
      (employee) =>
        Number(employee.id) === selectedId &&
        employee.status === "Aktiv" &&
        employee.role === "Prosjektleder"
    );

    if (!selectedManager) {
      setQuickAssignMessage("Valgt prosjektleder er ikke tilgjengelig.");
      return;
    }

    setQuickAssignBusyId(inq.id.toString());
    setQuickAssignMessage("");

    try {
      const teamRes = await fetch(apiUrl("/inquiry_team.php"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiry_id: inquiryId,
          employee_id: selectedId,
          role: "Prosjektleder",
        }),
      });

      const teamData = await teamRes.json();

      if (!teamRes.ok || !teamData.success) {
        throw new Error(
          teamData.message || "Kunne ikke lagre prosjektleder på oppdraget."
        );
      }

      const inquiryRes = await fetch(apiUrl("/inquiries.php"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: inquiryId,
          status: "tildelt_prosjektansvarlig",
        }),
      });

      const inquiryData = await inquiryRes.json();

      if (!inquiryRes.ok || !inquiryData.success) {
        throw new Error(
          inquiryData.message ||
            "Prosjektleder ble lagret, men saken kunne ikke overføres."
        );
      }

      setInquiries((prev) =>
        prev.map((item) =>
          item.id.toString() === inq.id.toString()
            ? {
                ...item,
                status: "tildelt_prosjektansvarlig",
                assigned_to: selectedManager.name,
                assigned_project_manager_id: selectedId,
              }
            : item
        )
      );

      setQuickManagerSelections((prev) => {
        const next = { ...prev };
        delete next[inq.id.toString()];
        return next;
      });

      setQuickAssignMessage(
        `Oppdrag #${inq.id} er tildelt ${selectedManager.name}.`
      );
    } catch (err) {
      setQuickAssignMessage(
        err instanceof Error
          ? err.message
          : "Kunne ikke tildele prosjektleder."
      );
    } finally {
      setQuickAssignBusyId(null);
    }
  };

  useEffect(() => {
    fetchInquiries();
    fetchAdminEmployees();
  }, []);

  useEffect(() => {
    if (activeTab === "prosjekter") {
      fetchProjects();
    }

    if (activeTab === "rapporter") {
      fetchReportArchive();
    }
  }, [activeTab]);

  const getServiceBadge = (inq: Inquiry) => {
    const rawInquiryType = String(
      (inq as any).inquiry_type || (inq as any).type || ""
    )
      .trim()
      .toLowerCase();
    const rawRecommendedService = String(
      (inq as any).recommended_service || ""
    )
      .trim()
      .toLowerCase();
    const rawStage = String(inq.stage || "")
      .trim()
      .toLowerCase();

    const customerService = [rawInquiryType, rawRecommendedService].find(
      (value) =>
        [
          "lekkasjesok",
          "lekkasjesøk",
          "takkontroll",
          "service",
          "akutt",
          "digital",
          "digital_befaring",
        ].includes(value)
    );

    if (customerService === "lekkasjesok" || customerService === "lekkasjesøk") {
      return (
        <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <CalendarCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          Lekkasjesøk
        </span>
      );
    }

    if (customerService === "takkontroll") {
      return (
        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          Takkontroll
        </span>
      );
    }

    if (customerService === "service") {
      return (
        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <Wrench className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          Servicearbeid
        </span>
      );
    }

    if (customerService === "akutt") {
      return (
        <span className="px-3 py-1 bg-red-500/10 text-red-300 border border-red-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <AlertTriangle className="w-3.5 h-3.5 text-red-300 shrink-0" />
          Akutt utbedring
        </span>
      );
    }

    if (customerService === "digital" || customerService === "digital_befaring") {
      return (
        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <Video className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          Digital konsultasjon
        </span>
      );
    }

    if (rawStage === "tilbud_varige_tiltak" || rawStage === "varige_tiltak") {
      return (
        <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <Plus className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          Varige tiltak
        </span>
      );
    }

    if (rawStage === "garanti_5ar") {
      return (
        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          5 års garanti
        </span>
      );
    }

    return (
      <span className="px-3 py-1 bg-slate-500/10 text-slate-400 border border-slate-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
        <ClipboardList className="w-3.5 h-3.5 shrink-0" />
        Ikke klassifisert
      </span>
    );
  };

  const getWorkflowBadge = (inq: Inquiry) => {
    const stage = String(inq.stage || "")
      .trim()
      .toLowerCase();
    const status = String((inq as any).status || "")
      .trim()
      .toLowerCase();
    const reportSummary = reportStatuses[inq.id.toString()];
    const reportStatus = reportSummary?.status;
    const reportType = reportSummary?.report_type;

    if (status === "venter_pa_kundeopplysninger") {
      return (
        <span className="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <UserCheck className="w-3.5 h-3.5 shrink-0" />
          Venter på kundeopplysninger
        </span>
      );
    }

    if (status === "kundeopplysninger_mottatt") {
      return (
        <span className="px-3 py-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <UserCheck className="w-3.5 h-3.5 shrink-0" />
          Kundeopplysninger mottatt
        </span>
      );
    }

    if (status === "venter_pa_prosjektansvarlig") {
      return (
        <span className="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <Users className="w-3.5 h-3.5 shrink-0" />
          Venter på prosjektansvarlig
        </span>
      );
    }

    if (status === "tildelt_prosjektansvarlig") {
      return (
        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <Users className="w-3.5 h-3.5 shrink-0" />
          Tildelt prosjektansvarlig
        </span>
      );
    }

    if (status === "venter_pa_tilbud") {
      return (
        <span className="px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <CircleDollarSign className="w-3.5 h-3.5 shrink-0" />
          Venter på tilbud
        </span>
      );
    }

    if (status === "tilbud_sendt") {
      return (
        <span className="px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <CircleDollarSign className="w-3.5 h-3.5 shrink-0" />
          Tilbud sendt · venter på kunde
        </span>
      );
    }

    if (status === "tilbud_akseptert") {
      return (
        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          Tilbud akseptert
        </span>
      );
    }

    if (status === "foreslatt_av_prosjektleder") {
      return (
        <span className="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          Tidspunkt foreslått
        </span>
      );
    }

    if (status === "digital_befaring_tid_forslag") {
      return (
        <span className="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          Venter på kundens valg
        </span>
      );
    }

    if (status === "digital_befaring_bekreftet") {
      return (
        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
          Digital konsultasjon bekreftet
        </span>
      );
    }

    if (reportStatus === "publisert") {
      return (
        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          {reportType === "rapport2" ? "Rapport 2 · sendt til kunde" : "Sendt til kunde"}
        </span>
      );
    }

    if (reportStatus === "godkjent") {
      return (
        <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          {reportType === "rapport2" ? "Rapport 2 · godkjent" : "Godkjent"}
        </span>
      );
    }

    if (reportStatus === "returnert_til_prosjektansvarlig") {
      return (
        <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <FileText className="w-3.5 h-3.5 shrink-0" />
          Returnert til prosjektansvarlig
        </span>
      );
    }

    if (reportStatus === "under_gjennomgang") {
      return (
        <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <Edit3 className="w-3.5 h-3.5 shrink-0" />
          {reportType === "rapport2" ? "Rapport 2 · under gjennomgang" : "Under gjennomgang"}
        </span>
      );
    }

    if (reportStatus === "sendt_til_admin") {
      return (
        <span className="px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <FileText className="w-3.5 h-3.5 shrink-0" />
          {reportType === "rapport2" ? "Rapport 2 · venter på admin" : "Venter på admin"}
        </span>
      );
    }

    if (reportStatus === "utkast") {
      return (
        <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <FileText className="w-3.5 h-3.5 shrink-0" />
          Rapportutkast pågår
        </span>
      );
    }

    if (status === "planlagt") {
      return (
        <span className="px-3 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
          Planlagt
        </span>
      );
    }

    if (status === "pagaende") {
      return (
        <span className="px-3 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <Wrench className="w-3.5 h-3.5 shrink-0" />
          Arbeid pågår
        </span>
      );
    }

    if (status === "utfort") {
      return (
        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          Utført
        </span>
      );
    }

    if (status === "tilbud_avvist") {
      return (
        <span className="px-3 py-1 bg-red-500/10 text-red-300 border border-red-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Tilbud avvist
        </span>
      );
    }

    if (status === "avsluttet") {
      return (
        <span className="px-3 py-1 bg-slate-500/10 text-slate-300 border border-slate-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          Avsluttet
        </span>
      );
    }

    if (stage === "rapport_funn") {
      return (
        <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <FileText className="w-3.5 h-3.5 shrink-0" />
          Rapportarbeid
        </span>
      );
    }

    if (stage === "utfonring_felt") {
      return (
        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <Wrench className="w-3.5 h-3.5 shrink-0" />
          Feltoppfølging
        </span>
      );
    }

    if (stage === "varige_tiltak" || stage === "tilbud_varige_tiltak") {
      return (
        <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <Wrench className="w-3.5 h-3.5 shrink-0" />
          Varige tiltak
        </span>
      );
    }

    if (stage === "garanti_5ar") {
      return (
        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          Garanti aktiv
        </span>
      );
    }

    return (
      <span className="px-3 py-1 bg-slate-500/10 text-slate-400 border border-slate-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
        <ClipboardList className="w-3.5 h-3.5 shrink-0" />
        Under behandling
      </span>
    );
  };

  const parseCompactBookingDetails = (
    notes?: string,
    createdAtRaw?: string,
    bookingDate?: string | null
  ) => {
    const formatShortDate = (value?: string | null) => {
      if (!value) return "";

      const isoDate = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoDate) {
        return `${isoDate[3]}.${isoDate[2]}.${isoDate[1].slice(-2)}`;
      }

      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return new Intl.DateTimeFormat("nb-NO", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        }).format(parsed);
      }

      return "";
    };

    if (bookingDate) {
      return formatShortDate(bookingDate) || "Nylig";
    }

    const match = notes?.match(/Valgt dato\/tid:\s*(.+)/i);

    if (match) {
      const rawString = match[1]
        .trim()
        .replace(
          /^(mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag)\s*/i,
          ""
        )
        .replace(/\s*\([^)]*\)\s*$/, "");

      const dottedDate = rawString.match(/(\d{1,2})\.(\d{1,2})\.(\d{4}|\d{2})/);
      if (dottedDate) {
        const year = dottedDate[3].length === 4
          ? dottedDate[3].slice(-2)
          : dottedDate[3];

        return `${dottedDate[1].padStart(2, "0")}.${dottedDate[2].padStart(2, "0")}.${year}`;
      }

      const shortFromNotes = formatShortDate(rawString);
      if (shortFromNotes) return shortFromNotes;
    }

    return formatShortDate(createdAtRaw) || "Nylig";
  };

  const getInquiryBookingDate = (inq: Inquiry): Date | null => {
    const bookingDate = String((inq as any).booking_date || "").trim();

    if (bookingDate) {
      const time = String((inq as any).booking_time || "09:00").substring(0, 5);
      const date = new Date(`${bookingDate}T${time}:00`);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const notes = String(inq.notes || "");

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

    return null;
  };

  const calendarMonthLabel = new Intl.DateTimeFormat("nb-NO", {
    month: "long",
    year: "numeric",
  }).format(calendarCursor);

  const calendarDays = (() => {
    const year = calendarCursor.getFullYear();
    const month = calendarCursor.getMonth();
    const first = new Date(year, month, 1);
    const mondayIndex = (first.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - mondayIndex);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  })();

  const startOfCalendarWeek = (date: Date) => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    const day = (result.getDay() + 6) % 7;
    result.setDate(result.getDate() - day);
    return result;
  };

  const calendarWeekDays = (() => {
    const start = startOfCalendarWeek(calendarCursor);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  })();

  const calendarDayLabel = new Intl.DateTimeFormat("nb-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(calendarCursor);

  const calendarWeekLabel = (() => {
    const start = calendarWeekDays[0];
    const end = calendarWeekDays[6];
    const startLabel = new Intl.DateTimeFormat("nb-NO", {
      day: "numeric",
      month: "short",
    }).format(start);
    const endLabel = new Intl.DateTimeFormat("nb-NO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(end);

    return `${startLabel} – ${endLabel}`;
  })();

  const calendarInquiries = inquiries
    .map((inq) => ({ inq, date: getInquiryBookingDate(inq) }))
    .filter((item): item is { inq: Inquiry; date: Date } => item.date !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const sameCalendarDate = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const createAdminReminder = async (
    inq: Inquiry,
    recipientType: "customer" | "project_manager"
  ) => {
    const customerName =
      inq.customer_name || inq.customerName || `kunde på oppdrag #${inq.id}`;

    const projectManagerName =
      String((inq as any).assigned_to || "").trim() || "prosjektleder";

    const isCustomer = recipientType === "customer";

    const subject = isCustomer
      ? `Påminnelse – oppdrag #${inq.id}`
      : `Purring – oppdrag #${inq.id}`;

    const message = isCustomer
      ? `Hei ${customerName}. Dette er en påminnelse om oppdrag #${inq.id}. Vi venter på din tilbakemelding for å kunne gå videre i saken. Med vennlig hilsen Perun AS / Taklekkasjevakten.`
      : `Hei ${projectManagerName}. Admin ber om oppfølging av oppdrag #${inq.id} for ${customerName}. Vennligst kontroller saken og gjennomfør neste nødvendige handling.`;

    const confirmed = window.confirm(
      isCustomer
        ? `Registrere påminnelse til ${customerName}?`
        : `Purre ${projectManagerName} på oppdrag #${inq.id}?`
    );

    if (!confirmed) return;

    const busyKey = `${inq.id}-${recipientType}`;
    setNotificationBusy(busyKey);
    setNotificationMessage("");

    try {
      const res = await fetch(apiUrl("/notifications.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiry_id: Number(inq.id),
          recipient_type: recipientType,
          recipient_id:
            recipientType === "project_manager"
              ? (inq as any).assigned_project_manager_id || null
              : null,
          recipient_name:
            recipientType === "project_manager"
              ? (inq as any).assigned_to || null
              : null,
          channel: isCustomer ? "email" : "internal",
          subject,
          message,
          created_by_name: "Admin",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke registrere påminnelsen.");
      }

      setNotificationMessage(
        isCustomer
          ? "Kundepåminnelsen er registrert i utsendingskøen."
          : "Prosjektleder er purret internt."
      );
    } catch (err) {
      setNotificationMessage(
        err instanceof Error
          ? err.message
          : "Kunne ikke registrere påminnelsen."
      );
    } finally {
      setNotificationBusy(null);
    }
  };

  const handleStartEditProject = (p: ProjectData) => {
    setProjectEditorOpen(true);
    setEditingProjectId(p.id);
    setNewProject({
      title: p.title || "",
      category: p.category || "Blikkenslager",
      location: p.location || "",
      description: p.description || "",
      caseText: p.case_text || "",
    });

    let loadedImages: ProjectImageInput[] = [];
    if (p.images_json || p.images) {
      try {
        const raw = typeof p.images_json === "string" ? JSON.parse(p.images_json) : (p.images_json || p.images);
        if (Array.isArray(raw)) {
          loadedImages = raw.map((img: any) => ({
            file: null,
            existingUrl: typeof img === "string" ? img : img.url || img.src || "",
            caption: typeof img === "object" && img.caption ? img.caption : "",
            stage: typeof img === "object" && img.stage ? img.stage : "after",
            isCoverBefore: typeof img === "object" ? Boolean(img.isCoverBefore) : false,
            isCoverAfter: typeof img === "object" ? Boolean(img.isCoverAfter) : false,
          }));
        }
      } catch (err) {
        console.error("Feil ved innlasting av bilder:", err);
      }
    }
    setProjectImages(loadedImages.length > 0 ? loadedImages : [{ file: null, caption: "", stage: "after" }]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setProjectEditorOpen(false);
    setEditingProjectId(null);
    setNewProject({ title: "", category: "Blikkenslager", location: "", description: "", caseText: "" });
    setProjectImages([{ file: null, caption: "", stage: "after", isCoverBefore: true, isCoverAfter: false }]);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const validImages = projectImages.filter((p) => p.file !== null || p.existingUrl);
    if (validImages.length === 0 || !newProject.title) {
      alert("Vennligst fyll ut prosjekttittel og legge til minst ett bilde.");
      return;
    }

    setUploadingProject(true);
    const formData = new FormData();
    if (editingProjectId) formData.append("id", editingProjectId.toString());

    formData.append("title", newProject.title);
    formData.append("category", newProject.category);
    formData.append("location", newProject.location);
    formData.append("description", newProject.description);
    formData.append("case_text", newProject.caseText);

    const captionsArray: string[] = [];
    const isBeforeArray: boolean[] = [];
    const stagesArray: string[] = [];
    const existingImagesArray: string[] = [];
    const isCoverBeforeArray: boolean[] = [];
    const isCoverAfterArray: boolean[] = [];

    validImages.forEach((imgObj) => {
      if (imgObj.file) {
        formData.append("images[]", imgObj.file);
        existingImagesArray.push("");
      } else if (imgObj.existingUrl) {
        existingImagesArray.push(imgObj.existingUrl);
      }
      captionsArray.push(imgObj.caption || newProject.title);
      isBeforeArray.push(imgObj.stage === "before");
      stagesArray.push(imgObj.stage);
      isCoverBeforeArray.push(Boolean(imgObj.isCoverBefore));
      isCoverAfterArray.push(Boolean(imgObj.isCoverAfter));
    });

    formData.append("captions", JSON.stringify(captionsArray));
    formData.append("is_before", JSON.stringify(isBeforeArray));
    formData.append("stages", JSON.stringify(stagesArray));
    formData.append("existing_images", JSON.stringify(existingImagesArray));
    formData.append("is_cover_before", JSON.stringify(isCoverBeforeArray));
    formData.append("is_cover_after", JSON.stringify(isCoverAfterArray));

    try {
      const res = await fetch(apiUrl("/projects.php"), { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        alert(editingProjectId ? "Prosjektet ble oppdatert!" : "Prosjektet ble publisert!");
        handleCancelEdit();
        fetchProjects();
      }
    } catch (err) {
      console.error("Feil ved lagring av prosjekt:", err);
    } finally {
      setUploadingProject(false);
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm("Vil du slette dette prosjektet permanent?")) return;
    try {
      const res = await fetch(apiUrl("/projects.php"), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        if (editingProjectId === id) handleCancelEdit();
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Feil ved sletting av prosjekt:", err);
    }
  };

  const handleViewAsCustomer = (customer: Customer) => {
    const customerId = customer.id != null ? Number(customer.id) : null;
    const customerType = String(customer.customer_type || "").trim().toLowerCase();

    const isBusinessCustomer =
      customerType === "b2b" ||
      customerType === "bedrift" ||
      customerType === "foretak" ||
      customerType === "borettslag/sameie" ||
      customerType.includes("borettslag") ||
      customerType.includes("sameie");

    // Foretak, borettslag og sameier skal forhåndsvises i den nye foretaksportalen.
    // Privatpersoner fortsetter å bruke eksisterende CustomerDashboard.
    if (isBusinessCustomer) {
      if (customerId === null || customerId <= 0) {
        alert("Denne virksomheten mangler gyldig customer_id.");
        return;
      }

      setPreviewCustomerInquiryId(null);
      setPreviewBusinessCustomerId(customerId);
      return;
    }

    const customerEmail = (customer.email || "").trim().toLowerCase();
    const customerPhone = (customer.phone || "").replace(/\s+/g, "");
    const customerName = (customer.name || "").trim().toLowerCase();

    setPreviewBusinessCustomerId(null);

    const matchingInquiries = inquiries
      .filter((inq) => {
        const inqCustomerId =
          (inq as any).customer_id != null
            ? Number((inq as any).customer_id)
            : null;

        if (
          customerId !== null &&
          inqCustomerId !== null &&
          inqCustomerId === customerId
        ) {
          return true;
        }

        const inqEmail = String((inq as any).email || "")
          .trim()
          .toLowerCase();
        const inqPhone = String((inq as any).phone || "").replace(/\s+/g, "");
        const inqName = String(
          (inq as any).customer_name ||
            (inq as any).customerName ||
            ""
        )
          .trim()
          .toLowerCase();

        if (customerEmail && inqEmail && customerEmail === inqEmail) {
          return true;
        }

        if (customerPhone && inqPhone && customerPhone === inqPhone) {
          return true;
        }

        return Boolean(
          customerName &&
            inqName &&
            customerName === inqName
        );
      })
      .sort((a, b) => Number(b.id) - Number(a.id));

    const latestInquiry = matchingInquiries[0];

    if (!latestInquiry) {
      alert(
        "Fant ingen oppdrag knyttet til denne kunden. Kundeportalen kan først forhåndsvises når kunden har et registrert oppdrag."
      );
      return;
    }

    setPreviewCustomerInquiryId(Number(latestInquiry.id));
  };

  const filteredInquiries = inquiries.filter((inq) => {
    const rawType = (inq.inquiry_type || inq.type || "").toLowerCase();
    const rawStage = (inq.stage || "").toLowerCase();

    let matchesFilter = filterType === "alle";
    if (!matchesFilter) {
      if (filterType === "lekkasjesok") matchesFilter = rawType.includes("lekkasje") || rawStage.includes("lekkasjesok");
      else if (filterType === "takkontroll") matchesFilter = rawType.includes("kontroll") || rawStage.includes("takkontroll");
      else if (filterType === "service") matchesFilter = rawType.includes("service") || rawStage.includes("service");
      else if (filterType === "akutt") matchesFilter = rawType.includes("akutt");
      else if (filterType === "b2b") matchesFilter = rawType.includes("b2b") || rawType.includes("sameie");
      else if (filterType === "kundeopplysninger") {
        matchesFilter =
          String((inq as any).status || "").toLowerCase() ===
          "kundeopplysninger_mottatt";
      }
      else if (filterType === "venter_pa_tilbud") {
        matchesFilter =
          String((inq as any).status || "").toLowerCase() ===
          "venter_pa_tilbud";
      }
      else if (filterType === "avventer_kunde") {
        const status = String((inq as any).status || "").toLowerCase();
        matchesFilter = [
          "tilbud_sendt",
          "digital_befaring_tid_forslag",
          "foreslatt_av_prosjektleder",
        ].includes(status);
      }
      else if (filterType === "neste_7_dager") {
        const bookingDate = getInquiryBookingDate(inq);
        if (!bookingDate) {
          matchesFilter = false;
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const limit = new Date(today);
          limit.setDate(limit.getDate() + 7);
          limit.setHours(23, 59, 59, 999);

          matchesFilter = bookingDate >= today && bookingDate <= limit;
        }
      }
      else if (filterType === "rapporter_til_gjennomgang") {
        const reportStatus = reportStatuses[inq.id.toString()]?.status;
        matchesFilter =
          reportStatus === "sendt_til_admin" ||
          reportStatus === "under_gjennomgang";
      }
      else matchesFilter = rawType === filterType || rawStage === filterType;
    }

    const custName = inq.customer_name || inq.customerName || "";
    const city = inq.city || "";
    const inqId = inq.id.toString();

    return (
      matchesFilter &&
      (custName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inqId.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const isCompletedInquiry = (inq: Inquiry) => {
    const status = String((inq as any).status || "").toLowerCase();
    const reportSummary = reportStatuses[inq.id.toString()];

    return (
      status === "avsluttet" ||
      (reportSummary?.report_type === "rapport2" &&
        reportSummary.status === "publisert")
    );
  };

  // Utløpte tilbud uten bekreftet avtale skal ikke vises som aktive.
  const hasExpiredLatestOffer = (inq: Inquiry): boolean => {
    const item = inq as Inquiry & {
      latest_offer_status?: string | null;
      latest_offer_expires_at?: string | null;
    };

    // Eksisterende bekreftede bookinger skal beholdes.
    if (item.booking_date && item.booking_time) return false;

    const status = String(item.latest_offer_status || "").toLowerCase();

    if (status === "utlopt") return true;
    if (status !== "publisert" || !item.latest_offer_expires_at) return false;

    const expiresAt = new Date(
      item.latest_offer_expires_at.replace(" ", "T")
    ).getTime();

    return Number.isFinite(expiresAt) && Date.now() >= expiresAt;
  };

  const isActiveInquiry = (inq: Inquiry): boolean =>
    !isCompletedInquiry(inq) && !hasExpiredLatestOffer(inq);

  const activeFilteredInquiries = filteredInquiries.filter(isActiveInquiry);

  const activeInquiriesCount = inquiries.filter(isActiveInquiry).length;

  const completedInquiries = inquiries.filter(isCompletedInquiry);


  const actionRequiredInquiries = activeFilteredInquiries.filter((inq) => {
    const status = String((inq as any).status || "").toLowerCase();
    const reportStatus = reportStatuses[inq.id.toString()]?.status;
    const rawType = String(inq.inquiry_type || inq.type || "").toLowerCase();
    const assignedId = (inq as any).assigned_project_manager_id;
    const assignedName = String((inq as any).assigned_to || "").trim();

    return (
      reportStatus === "sendt_til_admin" ||
      reportStatus === "under_gjennomgang" ||
      status === "kundeopplysninger_mottatt" ||
      status === "venter_pa_tilbud" ||
      rawType.includes("akutt") ||
      (!assignedId && !assignedName)
    );
  });

  const reportsForReviewInquiries = activeFilteredInquiries.filter((inq) => {
    const reportStatus = reportStatuses[inq.id.toString()]?.status;

    return (
      reportStatus === "sendt_til_admin" ||
      reportStatus === "under_gjennomgang"
    );
  });

  const visibleActiveInquiries =
    activeSubTab === "handling"
      ? actionRequiredInquiries
      : activeSubTab === "rapporter"
        ? reportsForReviewInquiries
        : activeFilteredInquiries;


  const akuttCount = inquiries.filter((i) => (i.inquiry_type || i.type || "").toLowerCase().includes("akutt")).length;
  const totalCount = inquiries.length;
  const newInquiriesCount = inquiries.filter(
    (i) => !isCompletedInquiry(i) && Boolean((i as any).is_new)
  ).length;
  const customerInfoReceivedCount = inquiries.filter(
    (i) =>
      String((i as any).status || "").toLowerCase() ===
      "kundeopplysninger_mottatt"
  ).length;
  const waitingForOfferCount = inquiries.filter(
    (i) =>
      String((i as any).status || "").toLowerCase() ===
      "venter_pa_tilbud"
  ).length;

  const reportsForReviewCount = inquiries.filter((i) => {
    const reportStatus = reportStatuses[i.id.toString()]?.status;
    return (
      reportStatus === "sendt_til_admin" ||
      reportStatus === "under_gjennomgang"
    );
  }).length;

  const awaitingCustomerCount = inquiries.filter((i) => {
    const status = String((i as any).status || "").toLowerCase();
    return [
      "tilbud_sendt",
      "digital_befaring_tid_forslag",
      "foreslatt_av_prosjektleder",
    ].includes(status);
  }).length;

  const unassignedCount = inquiries.filter((i) => {
    const assignedId = (i as any).assigned_project_manager_id;
    const assignedName = String((i as any).assigned_to || "").trim();
    return !assignedId && !assignedName;
  }).length;

  const actionRequiredCount =
    reportsForReviewCount +
    customerInfoReceivedCount +
    waitingForOfferCount +
    akuttCount +
    unassignedCount;

  const scheduledTodayCount = inquiries.filter((i) => {
    const bookingDate = String((i as any).booking_date || "");
    if (!bookingDate) return false;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return bookingDate === `${yyyy}-${mm}-${dd}`;
  }).length;

  const openOppdragShortcut = (filter: string) => {
    setActiveSubTab("aktive");
    setFilterType(filter);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document
          .getElementById("oppdrag-resultatliste")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  const scheduledNext7Days = inquiries.filter((i) => {
    const bookingDate = String((i as any).booking_date || "");
    if (!bookingDate) return false;

    const date = new Date(`${bookingDate}T12:00:00`);
    if (Number.isNaN(date.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const limit = new Date(today);
    limit.setDate(limit.getDate() + 7);

    return date >= today && date <= limit;
  }).length;

  if (showProfile) {
    return (
      <AdminProfilePage
        onBack={() => setShowProfile(false)}
      />
    );
  }

  if (previewEmployee) {
    if (
      previewEmployee.role === "Tekniker" ||
      previewEmployee.role === "Blikkenslager" ||
      previewEmployee.role === "Lærling"
    ) {
      const technicianPreviewEmployee = {
        ...previewEmployee,
        role: previewEmployee.role,
      } as {
        id?: number;
        name: string;
        role: "Tekniker" | "Blikkenslager" | "Lærling";
        email: string;
        phone: string;
        status: "Aktiv" | "Inaktiv";
      };

      return (
        <TechnicianDashboard
          previewEmployee={technicianPreviewEmployee}
          onBackToAdmin={() => {
            setPreviewEmployee(null);
            setActiveTab("ansatte");
          }}
        />
      );
    }

    return (
      <ProjectManagerDashboard
        previewEmployee={previewEmployee}
        onBackToAdmin={() => {
          setPreviewEmployee(null);

          if (previewEmployeeFromInquiry) {
            setPreviewEmployeeFromInquiry(false);
            setActiveTab("oppdrag");
          } else {
            setActiveTab("ansatte");
          }
        }}
      />
    );
  }

  if (previewBusinessCustomerId !== null) {
    return (
      <BusinessCustomerDashboard
        previewMode
        previewCustomerId={previewBusinessCustomerId}
        onBackToAdmin={() => {
          setPreviewBusinessCustomerId(null);
          setActiveTab("kunder");
        }}
      />
    );
  }

  if (previewCustomerInquiryId !== null) {
    return (
      <CustomerDashboard
        previewMode
        previewInquiryId={previewCustomerInquiryId}
        onBackToMain={() => {
          setPreviewCustomerInquiryId(null);
          if (!selectedInquiry) {
            setActiveTab("kunder");
          }
        }}
      />
    );
  }

  if (reviewInquiry) {
    const reviewName =
      reviewInquiry.customer_name ||
      reviewInquiry.customerName ||
      "Ukjent kunde";

    const reviewAddress = [
      reviewInquiry.address,
      reviewInquiry.postal_code,
      reviewInquiry.city,
    ]
      .filter(Boolean)
      .join(", ");

    return (
      <AdminReportReview
        inquiryId={Number(reviewInquiry.id)}
        customerName={reviewName}
        address={reviewAddress}
        onBack={() => {
          setReviewInquiry(null);
          setActiveSubTab("rapporter");
          setFilterType("rapporter_til_gjennomgang");
          fetchInquiries();
        }}
        onChanged={fetchInquiries}
      />
    );
  }

  if (selectedInquiry) {
    return (
      <InquiryDetail
        inquiry={selectedInquiry}
        onBack={() => {
          setSelectedInquiry(null);
          fetchInquiries();
        }}
        onUpdateInquiry={(updated) => {
          setSelectedInquiry(updated);
          setInquiries((prev) =>
            prev.map((item) => (item.id.toString() === updated.id.toString() ? updated : item))
          );
        }}
        onPreviewCustomer={(inquiryId) => {
          setPreviewCustomerInquiryId(inquiryId);
        }}
        onPreviewProjectManager={(employeeId) => {
          const projectManager = adminEmployees.find(
            (employee) =>
              Number(employee.id) === Number(employeeId) &&
              employee.status === "Aktiv" &&
              employee.role === "Prosjektleder"
          );

          if (!projectManager) {
            window.alert(
              "Fant ikke den tildelte prosjektansvarlige blant aktive ansatte."
            );
            return;
          }

          setPreviewEmployeeFromInquiry(true);
          setPreviewEmployee(projectManager);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#070a11] text-white">
      {/* FAST ADMINMENY */}
      <aside
        className={`hidden lg:flex fixed inset-y-0 left-0 z-50 flex-col border-r border-slate-800/80 bg-[#081321] transition-[width] duration-300 ${
          sidebarCollapsed ? "w-[76px]" : "w-[238px]"
        }`}
      >
        <div
          className={`relative h-[88px] border-b border-slate-800/80 flex items-center transition-all duration-300 ${
            sidebarCollapsed ? "px-2 justify-center" : "px-4"
          }`}
        >
          <img
            src="/logo.png"
            alt="Taklekkasjevakten"
            className={`w-auto object-contain transition-all duration-300 ${
              sidebarCollapsed ? "max-h-[44px] max-w-[50px]" : "max-h-[58px] max-w-[195px]"
            }`}
          />

          <button
            type="button"
            onClick={() => setSidebarCollapsed((current) => !current)}
            className="absolute top-[29px] -right-3 flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-[#0b1725] text-slate-300 shadow-lg transition-all hover:border-amber-500/50 hover:bg-slate-900 hover:text-white"
            title={sidebarCollapsed ? "Åpne meny" : "Lukk meny"}
            aria-label={sidebarCollapsed ? "Åpne meny" : "Lukk meny"}
          >
            <ChevronLeft
              className={`h-3.5 w-3.5 transition-transform duration-300 ${
                sidebarCollapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        <nav className={`py-2 space-y-1.5 ${sidebarCollapsed ? "px-2" : "px-3"}`}>
          {[
            {
              id: "oppdrag",
              label: "Prosjekter",
              icon: Inbox,
              tab: "oppdrag",
            },
            {
              id: "kalender",
              label: "Kalender",
              icon: Calendar,
              tab: "kalender",
            },
            {
              id: "sjekklister",
              label: "Sjekklister",
              icon: ClipboardList,
              tab: "sjekklister",
            },
            {
              id: "prosjekter",
              label: "Prosjektbibliotek",
              icon: ImageIcon,
              tab: "prosjekter",
            },
            {
              id: "kunder",
              label: "Kunder",
              icon: Building,
              tab: "kunder",
            },
            {
              id: "markedsforing",
              label: "Markedsføring",
              icon: Search,
              tab: "markedsforing",
            },
            {
              id: "epost",
              label: "E-post & kampanjer",
              icon: Mail,
              tab: "epost",
            },
            {
              id: "ansatte",
              label: "Ansatte / team",
              icon: Users,
              tab: "ansatte",
            },
            {
              id: "timeliste",
              label: "Timelisteoversikt",
              icon: Clock3,
              tab: "timeliste",
            },
            {
              id: "kjorebok",
              label: "Kjørebok",
              icon: CarFront,
              tab: "kjorebok",
            },
            {
              id: "dataimport",
              label: "Dataimport",
              icon: Database,
              tab: "dataimport",
            },
            {
              id: "rapporter",
              label: "Rapporter",
              icon: FileText,
              tab: "rapporter",
            },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;

            return (
              <div key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id as typeof activeTab);

                    if (item.id === "oppdrag") {
                      setActiveSubTab("aktive");
                      setFilterType("alle");
                    }

                    if (item.id === "kjorebok") {
                      setDrivingLogTab("oversikt");
                    }

                    if (item.id === "timeliste") {
                      setTimeOverviewTab("oversikt");
                    }

                  }}
                  className={`w-full flex items-center rounded-xl px-3 py-3 text-left text-sm font-bold transition-all ${
                    sidebarCollapsed ? "justify-center" : "gap-3"
                  } ${
                    active
                      ? "border border-amber-500/20 bg-[#F5B800]/10 text-[#F5B800]"
                      : "border border-transparent text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}

                  {!sidebarCollapsed && item.id === "oppdrag" && newInquiriesCount > 0 && (
                    <span
                      className="ml-auto rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-black text-amber-300"
                      title={`${newInquiriesCount} nye oppdrag`}
                    >
                      {newInquiriesCount}
                    </span>
                  )}

                  {!sidebarCollapsed && item.id === "rapporter" && reportsForReviewCount > 0 && (
                    <span className="ml-auto rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-black text-blue-300">
                      {reportsForReviewCount}
                    </span>
                  )}

                </button>
              </div>
            );
          })}
        </nav>

        <div className={`mt-auto border-t border-slate-800/80 ${sidebarCollapsed ? "p-2" : "p-3"}`}>
          <button
            type="button"
            onClick={() => setShowProfile(true)}
            className={`mb-1 w-full flex items-center rounded-xl px-3 py-3 text-sm font-bold text-slate-400 transition-all hover:bg-slate-900 hover:text-white ${sidebarCollapsed ? "justify-center" : "gap-3"}`}
            title={sidebarCollapsed ? "Min profil" : undefined}
          >
            <UserCircle className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Min profil</span>}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className={`w-full flex items-center rounded-xl px-3 py-3 text-sm font-bold text-slate-500 transition-all hover:bg-red-500/10 hover:text-red-300 ${
              sidebarCollapsed ? "justify-center" : "gap-3"
            }`}
            title={sidebarCollapsed ? "Logg ut" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Logg ut</span>}
          </button>
        </div>
      </aside>

      {/* MOBIL/TOPPHEADER */}
      <header
        className={`sticky top-0 z-40 border-b border-slate-800/80 bg-[#08111d]/95 px-4 py-4 backdrop-blur transition-[margin] duration-300 ${
          sidebarCollapsed ? "lg:ml-[76px]" : "lg:ml-[238px]"
        }`}
      >
        <div className="mx-auto flex max-w-[1750px] items-center justify-between gap-4">
          <button
            type="button"
            onClick={onLogout}
            className="lg:hidden flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-400"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logg ut
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("innstillinger");
              setSettingsView("company");
            }}
            className={`ml-auto flex h-10 w-10 items-center justify-center rounded-xl border transition ${
              activeTab === "innstillinger"
                ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                : "border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-700 hover:text-white"
            }`}
            title="Innstillinger"
            aria-label="Innstillinger"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main
        className={`px-4 md:px-6 py-6 transition-[margin] duration-300 ${
          sidebarCollapsed ? "lg:ml-[76px]" : "lg:ml-[238px]"
        }`}
      >
        <div className="mx-auto max-w-[1750px]">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              {activeTab === "oppdrag"
                ? "Oppdrag"
                : activeTab === "kalender"
                  ? "Kalender"
                  : activeTab === "sjekklister"
                    ? "Sjekklister"
                    : activeTab === "prosjekter"
                      ? "Prosjektbibliotek"
                      : activeTab === "kunder"
                        ? "Kunder"
                        : activeTab === "markedsforing"
                          ? "Markedsføring"
                        : activeTab === "epost"
                          ? "E-post & kampanjer"
                        : activeTab === "ansatte"
                          ? "Ansatte / team"
                          : activeTab === "timeliste"
                            ? "Timelisteoversikt"
                          : activeTab === "kjorebok"
                            ? "Kjørebok"
                          : activeTab === "dataimport"
                            ? "Dataimport"
                            : "Innstillinger"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {activeTab === "oppdrag"
                ? "Oversikt over aktive oppdrag, saker som krever handling og rapporter til behandling."
                : activeTab === "kalender"
                    ? "Full månedsoversikt over planlagte oppdrag og møter."
                    : activeTab === "timeliste"
                      ? "Oversikt over arbeidstid, registrerte timer og godkjenning."
                    : activeTab === "kjorebok"
                      ? "Oversikt over kjøringer, kjøretøy og kontroll av kilometerstand."
                    : activeTab === "markedsforing"
                      ? "Målgrupper, prospekter og kontaktgrunnlag for markedsføring."
                    : activeTab === "epost"
                      ? "Kundedialog, kampanjer og utsendingskø fra den felles e-postmotoren."
                    : activeTab === "dataimport"
                      ? "Kontrollert import av historiske data til perun_core."
                      : activeTab === "innstillinger"
                        ? "Konfigurasjon av firma, brukere, varsler, teknisk dokumentasjon, integrasjoner og system."
                        : "Administrasjon og operativ oversikt i Perun AS."}
            </p>
          </div>

        {/* FANE 1: OPPDRAG */}
        {activeTab === "oppdrag" && (
          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
              <div className="flex flex-col gap-4 border-b border-slate-800/80 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                    <Inbox className="h-4 w-4 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Oppdrag</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Arbeidsflyt, oppfølging og rapportbehandling.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-1 overflow-x-auto p-2">
                {[
                  {
                    id: "aktive" as const,
                    label: "Aktive oppdrag",
                    count: activeInquiriesCount,
                    filter: "alle",
                  },
                  {
                    id: "handling" as const,
                    label: "Krever handling",
                    count: actionRequiredInquiries.length,
                    filter: "alle",
                  },
                  {
                    id: "rapporter" as const,
                    label: "Rapporter til behandling",
                    count: reportsForReviewCount,
                    filter: "rapporter_til_gjennomgang",
                  },
                  {
                    id: "avsluttede" as const,
                    label: "Avsluttede saker",
                    count: completedInquiries.length,
                    filter: "alle",
                  },
                ].map((tab) => {
                  const active = activeSubTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveSubTab(tab.id);
                        setFilterType(tab.filter);
                      }}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-[11px] font-black transition ${
                        active
                          ? "bg-amber-500/10 text-amber-300"
                          : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
                      }`}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[9px] font-black ${
                            active
                              ? "bg-amber-500/15 text-amber-200"
                              : "bg-slate-900 text-slate-500"
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* TOPPOVERSIKT: I DAG / NESTE 7 DAGER / SYSTEMSTATUS */}
            <div className="grid gap-4 lg:grid-cols-3">
                <section className="rounded-2xl border border-slate-800/75 bg-[#0d1320] p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    I dag
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/55 p-3">
                      <div className="text-xl font-black text-white">{scheduledTodayCount}</div>
                      <div className="mt-1 text-[10px] text-slate-500">Oppdrag i dag</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/55 p-3">
                      <div className="text-xl font-black text-red-300">{akuttCount}</div>
                      <div className="mt-1 text-[10px] text-slate-500">Akutt</div>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-800/75 bg-[#0d1320] p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Neste 7 dager
                  </div>
                  <div className="mt-3 space-y-2">
                    <button
                      type="button"
                      onClick={() => openOppdragShortcut("neste_7_dager")}
                      className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950/55 px-3 py-3 text-left transition-colors hover:border-blue-500/30 hover:bg-slate-950"
                      title="Vis planlagte oppdrag de neste 7 dagene"
                    >
                      <span className="text-[11px] text-slate-400">Planlagte oppdrag</span>
                      <strong className="text-sm text-white">{scheduledNext7Days}</strong>
                    </button>
                    <button
                      type="button"
                      onClick={() => openOppdragShortcut("avventer_kunde")}
                      className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950/55 px-3 py-3 text-left transition-colors hover:border-amber-500/30 hover:bg-slate-950"
                      title="Vis saker som avventer kunden"
                    >
                      <span className="text-[11px] text-slate-400">Avventer kunde</span>
                      <strong className="text-sm text-amber-300">{awaitingCustomerCount}</strong>
                    </button>
                    <button
                      type="button"
                      onClick={() => openOppdragShortcut("venter_pa_tilbud")}
                      className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950/55 px-3 py-3 text-left transition-colors hover:border-violet-500/30 hover:bg-slate-950"
                      title="Vis saker der tilbud må utarbeides"
                    >
                      <span className="text-[11px] text-slate-400">Tilbud må sendes</span>
                      <strong className="text-sm text-violet-300">{waitingForOfferCount}</strong>
                    </button>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-800/75 bg-[#0d1320] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                        Kontroll
                      </div>
                      <div className="mt-1 text-xs font-black text-white">Systemstatus</div>
                    </div>
                    <ShieldCheck className="h-5 w-5 text-emerald-300" />
                  </div>

                  <div className="mt-4 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Oppdrag totalt</span>
                      <span className="font-bold text-white">{totalCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Ikke tildelt</span>
                      <span className={`font-bold ${unassignedCount > 0 ? "text-red-300" : "text-emerald-300"}`}>
                        {unassignedCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Rapporter til kontroll</span>
                      <span className={`font-bold ${reportsForReviewCount > 0 ? "text-blue-300" : "text-emerald-300"}`}>
                        {reportsForReviewCount}
                      </span>
                    </div>
                  </div>
                </section>
              </div>

            {/* OPERATIVE NØKKELTALL */}
            <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              {[
                {
                  id: "alle",
                  label: "Krever handling",
                  value: actionRequiredCount,
                  sub: "Prioriterte saker",
                  icon: Bell,
                  tone: "border-red-500/20 bg-red-500/[0.055] text-red-300",
                },
                {
                  id: "rapporter_til_gjennomgang",
                  label: "Rapporter",
                  value: reportsForReviewCount,
                  sub: "Til godkjenning",
                  icon: FileText,
                  tone: "border-blue-500/20 bg-blue-500/[0.055] text-blue-300",
                },
                {
                  id: "venter_pa_tilbud",
                  label: "Venter tilbud",
                  value: waitingForOfferCount,
                  sub: "Må utarbeides",
                  icon: CircleDollarSign,
                  tone: "border-violet-500/20 bg-violet-500/[0.055] text-violet-300",
                },
                {
                  id: "avventer_kunde",
                  label: "Avventer kunde",
                  value: awaitingCustomerCount,
                  sub: "Svar / valg",
                  icon: UserCheck,
                  tone: "border-amber-500/20 bg-amber-500/[0.055] text-amber-300",
                },
                {
                  id: "akutt",
                  label: "Akutt",
                  value: akuttCount,
                  sub: "Krever prioritet",
                  icon: AlertTriangle,
                  tone: "border-red-500/20 bg-red-500/[0.055] text-red-300",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      if (item.id === "rapporter_til_gjennomgang") {
                        setActiveSubTab("rapporter");
                      } else if (item.id === "alle") {
                        setActiveSubTab("handling");
                      } else if (item.id === "avventer_kunde") {
                        setActiveSubTab("aktive");
                      }
                      setFilterType(item.id);
                    }}
                    className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:border-opacity-60 ${item.tone}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-2xl font-black text-white">{item.value}</div>
                        <div className="mt-1 text-xs font-black text-white">{item.label}</div>
                        <div className="mt-1 text-[10px] text-slate-500">{item.sub}</div>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-current/20 bg-black/10">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </section>

            <div className="grid gap-5">
              <div className="min-w-0 space-y-5">
                {/* KREVER HANDLING NÅ */}
                <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-800/70 px-5 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-amber-300" />
                        <h3 className="text-sm font-black text-white">Krever handling nå</h3>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Saker admin bør behandle før ordinær oppfølging.
                      </p>
                    </div>
                    <span className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black text-amber-300">
                      {actionRequiredCount} totalt
                    </span>
                  </div>

                  {actionRequiredCount === 0 ? (
                    <div className="px-5 py-8 text-center text-xs text-slate-500">
                      Ingen saker krever adminhandling akkurat nå.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/60">
                      {reportsForReviewCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSubTab("rapporter");
                            setFilterType("rapporter_til_gjennomgang");
                          }}
                          className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left transition-colors hover:bg-white/[0.025]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-300">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs font-black text-white">Rapporter til godkjenning</div>
                              <div className="mt-0.5 text-[10px] text-slate-500">
                                {reportsForReviewCount} rapport(er) venter på admin
                              </div>
                            </div>
                          </div>
                          <span className="text-blue-300">→</span>
                        </button>
                      )}

                      {waitingForOfferCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const waitingOffers = inquiries.filter(
                              (inq) =>
                                String(inq.status || "").toLowerCase() ===
                                "venter_pa_tilbud"
                            );

                            if (waitingOffers.length === 1) {
                              setSelectedInquiry(waitingOffers[0]);
                              return;
                            }

                            setFilterType("venter_pa_tilbud");
                          }}
                          className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left transition-colors hover:bg-white/[0.025]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-300">
                              <CircleDollarSign className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs font-black text-white">Tilbud må utarbeides</div>
                              <div className="mt-0.5 text-[10px] text-slate-500">
                                {waitingForOfferCount} sak(er) mangler tilbud
                              </div>
                            </div>
                          </div>
                          <span className="text-violet-300">→</span>
                        </button>
                      )}

                      {customerInfoReceivedCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setFilterType("kundeopplysninger")}
                          className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left transition-colors hover:bg-white/[0.025]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                              <UserCheck className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs font-black text-white">Kundeinformasjon mottatt</div>
                              <div className="mt-0.5 text-[10px] text-slate-500">
                                {customerInfoReceivedCount} sak(er) klare for gjennomgang
                              </div>
                            </div>
                          </div>
                          <span className="text-cyan-300">→</span>
                        </button>
                      )}

                      {unassignedCount > 0 && (
                        <div className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300">
                              <Users className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs font-black text-white">Mangler prosjektleder</div>
                              <div className="mt-0.5 text-[10px] text-slate-500">
                                {unassignedCount} sak(er) er ikke tildelt
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 space-y-2">
                            {inquiries
                              .filter((inq) => {
                                const assignedId = (inq as any).assigned_project_manager_id;
                                const assignedName = String((inq as any).assigned_to || "").trim();
                                return !assignedId && !assignedName;
                              })
                              .map((inq) => (
                                <div
                                  key={inq.id}
                                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-3"
                                >
                                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedInquiry(inq)}
                                      className="min-w-0 text-left"
                                    >
                                      <div className="text-xs font-black text-white">
                                        Oppdrag #{inq.id} · {inq.customer_name || inq.customerName || "Ukjent kunde"}
                                      </div>
                                      <div className="mt-1 truncate text-[10px] text-slate-500">
                                        {[inq.address, inq.postal_code, inq.city].filter(Boolean).join(", ") || "Adresse ikke oppgitt"}
                                      </div>
                                    </button>

                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                      <select
                                        value={quickManagerSelections[inq.id.toString()] || ""}
                                        onChange={(e) =>
                                          setQuickManagerSelections((prev) => ({
                                            ...prev,
                                            [inq.id.toString()]: e.target.value,
                                          }))
                                        }
                                        className="min-w-[210px] rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] font-bold text-white outline-none focus:border-amber-500/60"
                                      >
                                        <option value="">Velg prosjektleder</option>
                                        {adminEmployees
                                          .filter(
                                            (employee) =>
                                              employee.status === "Aktiv" &&
                                              employee.role === "Prosjektleder"
                                          )
                                          .map((employee) => (
                                            <option key={employee.id} value={employee.id}>
                                              {employee.name}
                                            </option>
                                          ))}
                                      </select>

                                      <button
                                        type="button"
                                        onClick={() => void quickAssignProjectManager(inq)}
                                        disabled={
                                          quickAssignBusyId === inq.id.toString() ||
                                          !quickManagerSelections[inq.id.toString()]
                                        }
                                        className="rounded-xl bg-[#F5B800] px-4 py-2 text-[11px] font-black text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                                      >
                                        {quickAssignBusyId === inq.id.toString()
                                          ? "Tildeler..."
                                          : "Tildel"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>

                          {quickAssignMessage && (
                            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-[10px] text-slate-300">
                              {quickAssignMessage}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* SØK OG FILTER */}
                <section className="flex flex-col gap-3 rounded-2xl border border-slate-800/70 bg-slate-900/45 p-3.5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative w-full lg:max-w-[430px]">
                    <input
                      type="text"
                      placeholder="Søk kunde, adresse, by eller ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-9 pr-4 text-xs text-white outline-none transition-colors placeholder:text-slate-600 focus:border-amber-500/70"
                    />
                    <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-500" />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Filter className="mr-1 h-3.5 w-3.5 text-slate-600" />
                    {[
                      ["alle", "Alle"],
                      ["rapporter_til_gjennomgang", "Rapporter"],
                      ["venter_pa_tilbud", "Tilbud"],
                      ["akutt", "Akutt"],
                      ["lekkasjesok", "Lekkasjesøk"],
                      ["takkontroll", "Takkontroll"],
                      ["service", "Service"],
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setFilterType(id)}
                        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all ${
                          filterType === id
                            ? "bg-[#F5B800] text-slate-950"
                            : "border border-slate-800/80 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </section>

                {notificationMessage && (
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.06] px-4 py-3 text-[11px] font-bold text-blue-300">
                    {notificationMessage}
                  </div>
                )}

                {/* AKTIVE OPPDRAG / KREVER HANDLING / RAPPORTER */}
                {activeSubTab !== "avsluttede" && (
                <section
                  id="oppdrag-resultatliste"
                  className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-800/75 bg-[#0d1320]"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/70 px-5 py-4">
                    <div>
                      <h3 className="text-sm font-black text-white">
                        {activeSubTab === "handling"
                          ? "Saker som krever handling"
                          : activeSubTab === "rapporter"
                            ? "Rapporter til behandling"
                            : filterType === "alle"
                              ? "Aktive oppdrag"
                              : "Filtrerte oppdrag"}
                      </h3>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {activeSubTab === "handling"
                          ? `${visibleActiveInquiries.length} sak(er) krever oppfølging`
                          : activeSubTab === "rapporter"
                            ? `${reportsForReviewInquiries.length} rapport(er) venter på behandling`
                            : `${visibleActiveInquiries.length} av ${activeInquiriesCount} aktive oppdrag vises`}
                      </p>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center gap-2 p-10 text-xs text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin text-[#F5B800]" />
                      Henter oppdrag...
                    </div>
                  ) : inquiries.length === 0 ? (
                    <div className="p-12 text-center text-xs text-slate-500">
                      Ingen henvendelser funnet i databasen ennå.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs text-slate-300">
                        <thead className="border-b border-slate-800/70 bg-slate-950/70 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                          <tr>
                            <th className="px-5 py-3.5">Kunde / adresse</th>
                            <th className="px-4 py-3.5 w-[165px]">Ansvarlig</th>
                            <th className="px-4 py-3.5 w-[170px]">Tjeneste</th>
                            <th className="px-4 py-3.5 w-[180px]">Dato</th>
                            <th className="px-4 py-3.5 w-[205px]">Status</th>
                            <th className="px-4 py-3.5 w-[300px] text-right">Handling</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-800/60">
                          {visibleActiveInquiries.map((inq) => {
                            const custName = inq.customer_name || inq.customerName || "Ukjent kunde";
                            const roof = inq.roof_type || inq.roofType || "Generelt tak";
                            const building = inq.building_type ? ` · ${inq.building_type}` : "";
                            const isNew = Boolean(inq.is_new ?? 1);
                            const reportStatus = reportStatuses[inq.id.toString()]?.status;
                            const responsible =
                              String((inq as any).assigned_to || "").trim() ||
                              ((inq as any).assigned_project_manager_id
                                ? `Prosjektleder #${(inq as any).assigned_project_manager_id}`
                                : "Ikke tildelt");

                            const openInquiry = () => {
                              if (
                                reportStatus === "sendt_til_admin" ||
                                reportStatus === "under_gjennomgang" ||
                                reportStatus === "godkjent"
                              ) {
                                setReviewInquiry(inq);
                              } else {
                                setSelectedInquiry(inq);
                              }
                            };

                            return (
                              <tr
                                key={inq.id}
                                onClick={openInquiry}
                                className="group cursor-pointer transition-colors hover:bg-white/[0.025]"
                              >
                                <td className="px-5 py-4 align-middle">
                                  <div className="flex min-w-[285px] items-start gap-3">
                                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/80 font-mono text-[11px] font-black text-slate-400">
                                      #{inq.id}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <strong className="truncate text-[13px] font-black text-white">
                                          {custName}
                                        </strong>
                                        {isNew && (
                                          <span className="rounded-md bg-[#F5B800] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-950">
                                            Ny
                                          </span>
                                        )}
                                      </div>
                                      <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                                        <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                                        <span className="truncate">
                                          {inq.address}
                                          {inq.postal_code ? `, ${inq.postal_code}` : ""} {inq.city}
                                        </span>
                                      </div>
                                      <div className="mt-1 text-[10px] text-slate-600">
                                        {roof}{building}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-4 py-4 align-middle">
                                  <div className={`text-[11px] font-bold ${responsible === "Ikke tildelt" ? "text-red-300" : "text-slate-300"}`}>
                                    {responsible}
                                  </div>
                                </td>

                                <td className="px-4 py-4 align-middle">
                                  {getServiceBadge(inq)}
                                </td>

                                <td className="px-4 py-4 align-middle">
                                  <div className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-300">
                                    <Calendar className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                                    <span>
                                      {parseCompactBookingDetails(
                                        inq.notes,
                                        inq.created_at,
                                        (inq as any).booking_date
                                      )}
                                    </span>
                                  </div>
                                </td>

                                <td className="px-4 py-4 align-middle">
                                  {getWorkflowBadge(inq)}
                                </td>

                                <td className="px-3 py-4 text-right align-middle">
                                  <div className="relative inline-flex">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const id = inq.id.toString();
                                        setOpenActionMenuId((current) =>
                                          current === id ? null : id
                                        );
                                      }}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 transition-all hover:border-amber-500/40 hover:bg-slate-800 hover:text-white"
                                      title="Flere handlinger"
                                      aria-label={`Flere handlinger for sak #${inq.id}`}
                                      aria-expanded={openActionMenuId === inq.id.toString()}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </button>

                                    {openActionMenuId === inq.id.toString() && (
                                      <div
                                        className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-xl border border-slate-700 bg-[#0b1320] p-1.5 text-left shadow-2xl"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenActionMenuId(null);
                                            openInquiry();
                                          }}
                                          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[11px] font-black text-white transition hover:bg-slate-800"
                                        >
                                          <span>
                                            {["sendt_til_admin", "under_gjennomgang", "godkjent"].includes(
                                              reportStatus || ""
                                            )
                                              ? "Behandle rapport"
                                              : "Åpne sak"}
                                          </span>
                                          <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                                        </button>

                                        {String(inq.status || "").toLowerCase() ===
                                          "venter_pa_tilbud" && (
                                          <>
                                            <div className="my-1 border-t border-slate-800" />

                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenActionMenuId(null);
                                                setSelectedInquiry(inq);
                                              }}
                                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-[11px] font-black text-violet-300 transition hover:bg-violet-500/10"
                                            >
                                              <CircleDollarSign className="h-3.5 w-3.5" />
                                              Send tilbud til kunde
                                            </button>
                                          </>
                                        )}

                                        <div className="my-1 border-t border-slate-800" />

                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenActionMenuId(null);
                                            setSelectedInquiry(inq);
                                          }}
                                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-[11px] font-bold text-emerald-300 transition hover:bg-emerald-500/10"
                                        >
                                          <Users className="h-3.5 w-3.5" />
                                          {responsible === "Ikke tildelt"
                                            ? "Tildel prosjektleder"
                                            : "Endre prosjektleder"}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenActionMenuId(null);
                                            void createAdminReminder(inq, "customer");
                                          }}
                                          disabled={notificationBusy === `${inq.id}-customer`}
                                          className="flex w-full items-center rounded-lg px-3 py-2.5 text-[11px] font-bold text-amber-300 transition hover:bg-amber-500/10 disabled:cursor-wait disabled:opacity-50"
                                        >
                                          {notificationBusy === `${inq.id}-customer`
                                            ? "Lagrer påminnelse..."
                                            : "Påminn kunde"}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenActionMenuId(null);
                                            void createAdminReminder(inq, "project_manager");
                                          }}
                                          disabled={notificationBusy === `${inq.id}-project_manager`}
                                          className="flex w-full items-center rounded-lg px-3 py-2.5 text-[11px] font-bold text-blue-300 transition hover:bg-blue-500/10 disabled:cursor-wait disabled:opacity-50"
                                        >
                                          {notificationBusy === `${inq.id}-project_manager`
                                            ? "Lagrer purring..."
                                            : "Purr prosjektleder"}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
                )}
              </div>


            </div>
          </div>
        )}


        {activeTab === "oppdrag" &&
          activeSubTab === "avsluttede" &&
          completedInquiries.length > 0 && (
          <section className="mt-5 overflow-hidden rounded-2xl border border-slate-800/75 bg-[#0d1320]">
            <div className="flex items-center justify-between border-b border-slate-800/70 px-5 py-4">
              <div>
                <h3 className="text-sm font-black text-white">
                  Avsluttede saker
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Ferdigbehandlede saker og saker der kunden har takket nei.
                </p>
              </div>

              <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black text-emerald-300">
                {completedInquiries.length} avsluttet
              </span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {completedInquiries.map((inq) => (
                <button
                  key={inq.id}
                  type="button"
                  onClick={() => setSelectedInquiry(inq)}
                  className="flex w-full flex-col gap-2 px-5 py-4 text-left transition-colors hover:bg-white/[0.025] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] font-black text-slate-500">
                        #{inq.id}
                      </span>
                      <span className="truncate text-xs font-black text-white">
                        {inq.customer_name || inq.customerName || "Ukjent kunde"}
                      </span>
                    </div>

                    <div className="mt-1 truncate text-[10px] text-slate-500">
                      {[inq.address, inq.postal_code, inq.city]
                        .filter(Boolean)
                        .join(", ") || "Adresse ikke oppgitt"}
                    </div>
                  </div>

                  {String((inq as any).status || "").toLowerCase() === "avsluttet" &&
                  !(
                    reportStatuses[inq.id.toString()]?.report_type === "rapport2" &&
                    reportStatuses[inq.id.toString()]?.status === "publisert"
                  ) ? (
                    <span className="shrink-0 rounded-full border border-slate-600 bg-slate-800/70 px-3 py-1.5 text-[10px] font-black text-slate-300">
                      Tilbud avvist · saken avsluttet
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black text-emerald-300">
                      Rapport 2 · sendt til kunde
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {activeTab === "oppdrag" &&
          activeSubTab === "avsluttede" &&
          completedInquiries.length === 0 && (
          <section className="mt-5 rounded-2xl border border-slate-800/75 bg-[#0d1320] px-5 py-10 text-center">
            <ShieldCheck className="mx-auto h-7 w-7 text-slate-600" />
            <h3 className="mt-3 text-sm font-black text-white">Ingen avsluttede saker ennå</h3>
            <p className="mt-1 text-xs text-slate-500">
              Ferdigbehandlede saker og saker der kunden takker nei til tilbud flyttes hit automatisk.
            </p>
          </section>
        )}

        {/* FANE: FULL KALENDER */}
        {activeTab === "kalender" && (
          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
              <div className="flex flex-col gap-4 border-b border-slate-800/80 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                    <Calendar className="h-4 w-4 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Kalender</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Planlagte feltoppdrag, service, takkontroll og digitale befaringer.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-1 overflow-x-auto p-2">
                {[
                  { id: "day" as const, label: "Dagsoversikt" },
                  { id: "week" as const, label: "Ukeoversikt" },
                  { id: "month" as const, label: "Månedsoversikt" },
                ].map((tab) => {
                  const active = calendarView === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCalendarView(tab.id)}
                      className={`inline-flex shrink-0 items-center rounded-xl px-3.5 py-2.5 text-[11px] font-black transition ${
                        active
                          ? "bg-amber-500/10 text-amber-300"
                          : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
              <div className="flex flex-col gap-4 border-b border-slate-800/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-black capitalize text-white">
                    {calendarView === "day"
                      ? calendarDayLabel
                      : calendarView === "week"
                        ? calendarWeekLabel
                        : calendarMonthLabel}
                  </h3>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {calendarView === "day"
                      ? "Alle planlagte oppdrag denne dagen."
                      : calendarView === "week"
                        ? "Planlagte oppdrag fra mandag til søndag."
                        : "Full månedsoversikt over planlagte oppdrag."}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarCursor((current) => {
                        const next = new Date(current);

                        if (calendarView === "day") {
                          next.setDate(next.getDate() - 1);
                        } else if (calendarView === "week") {
                          next.setDate(next.getDate() - 7);
                        } else {
                          next.setMonth(next.getMonth() - 1, 1);
                        }

                        return next;
                      })
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                    aria-label="Forrige periode"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCalendarCursor(new Date())}
                    className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] font-black text-amber-300 hover:bg-amber-500/15"
                  >
                    I dag
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCalendarCursor((current) => {
                        const next = new Date(current);

                        if (calendarView === "day") {
                          next.setDate(next.getDate() + 1);
                        } else if (calendarView === "week") {
                          next.setDate(next.getDate() + 7);
                        } else {
                          next.setMonth(next.getMonth() + 1, 1);
                        }

                        return next;
                      })
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                    aria-label="Neste periode"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {calendarView === "month" && (
                <>
                  <div className="grid grid-cols-7 border-b border-slate-800/70 bg-slate-950/60">
                    {["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"].map((day) => (
                      <div
                        key={day}
                        className="px-2 py-3 text-center text-[9px] font-black uppercase tracking-[0.12em] text-slate-600"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7">
                    {calendarDays.map((date) => {
                      const inCurrentMonth =
                        date.getMonth() === calendarCursor.getMonth();
                      const today = sameCalendarDate(date, new Date());
                      const dayItems = calendarInquiries.filter((item) =>
                        sameCalendarDate(item.date, date)
                      );

                      return (
                        <div
                          key={date.toISOString()}
                          className={`min-h-[125px] border-b border-r border-slate-800/60 p-2 transition-colors ${
                            inCurrentMonth ? "bg-[#0d1320]" : "bg-slate-950/35"
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span
                              className={`flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-black ${
                                today
                                  ? "bg-[#F5B800] text-slate-950"
                                  : inCurrentMonth
                                    ? "text-slate-300"
                                    : "text-slate-700"
                              }`}
                            >
                              {date.getDate()}
                            </span>

                            {dayItems.length > 0 && (
                              <span className="text-[9px] font-black text-slate-600">
                                {dayItems.length}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            {dayItems.slice(0, 3).map(({ inq, date: booking }) => (
                              <button
                                key={inq.id}
                                type="button"
                                onClick={() => setSelectedInquiry(inq)}
                                className="w-full rounded-lg border border-slate-800 bg-slate-950/70 px-2 py-1.5 text-left transition-all hover:border-amber-500/30 hover:bg-slate-950"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="truncate text-[10px] font-black text-white">
                                    {inq.customer_name || inq.customerName || `#${inq.id}`}
                                  </span>
                                  <span className="shrink-0 text-[9px] font-bold text-amber-300">
                                    {booking.toLocaleTimeString("nb-NO", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                <div className="mt-0.5 truncate text-[9px] text-slate-600">
                                  {inq.address || inq.city || "Adresse ikke registrert"}
                                </div>
                              </button>
                            ))}

                            {dayItems.length > 3 && (
                              <div className="px-1 text-[9px] font-bold text-slate-500">
                                + {dayItems.length - 3} flere
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {calendarView === "week" && (
                <div className="grid grid-cols-1 divide-y divide-slate-800/60 lg:grid-cols-7 lg:divide-x lg:divide-y-0">
                  {calendarWeekDays.map((date) => {
                    const today = sameCalendarDate(date, new Date());
                    const dayItems = calendarInquiries.filter((item) =>
                      sameCalendarDate(item.date, date)
                    );

                    return (
                      <div key={date.toISOString()} className="min-h-[360px] p-3">
                        <div className="mb-3 border-b border-slate-800/70 pb-3">
                          <div className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-600">
                            {new Intl.DateTimeFormat("nb-NO", {
                              weekday: "short",
                            }).format(date)}
                          </div>
                          <div
                            className={`mt-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black ${
                              today
                                ? "bg-[#F5B800] text-slate-950"
                                : "text-slate-200"
                            }`}
                          >
                            {date.getDate()}
                          </div>
                        </div>

                        <div className="space-y-2">
                          {dayItems.map(({ inq, date: booking }) => (
                            <button
                              key={inq.id}
                              type="button"
                              onClick={() => setSelectedInquiry(inq)}
                              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-left transition hover:border-amber-500/30"
                            >
                              <div className="text-[10px] font-black text-amber-300">
                                {booking.toLocaleTimeString("nb-NO", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              <div className="mt-1 truncate text-[10px] font-black text-white">
                                {inq.customer_name || inq.customerName || `Oppdrag #${inq.id}`}
                              </div>
                              <div className="mt-1 truncate text-[9px] text-slate-600">
                                {inq.address || inq.city || "Adresse ikke registrert"}
                              </div>
                            </button>
                          ))}

                          {dayItems.length === 0 && (
                            <div className="rounded-xl border border-dashed border-slate-800 px-3 py-6 text-center text-[9px] text-slate-700">
                              Ingen oppdrag
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {calendarView === "day" && (
                <div className="p-5">
                  {(() => {
                    const dayItems = calendarInquiries.filter((item) =>
                      sameCalendarDate(item.date, calendarCursor)
                    );

                    if (dayItems.length === 0) {
                      return (
                        <div className="rounded-2xl border border-dashed border-slate-800 px-5 py-12 text-center">
                          <Calendar className="mx-auto h-6 w-6 text-slate-700" />
                          <div className="mt-3 text-xs font-black text-slate-400">
                            Ingen planlagte oppdrag denne dagen
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {dayItems.map(({ inq, date }) => (
                          <button
                            key={inq.id}
                            type="button"
                            onClick={() => setSelectedInquiry(inq)}
                            className="flex w-full flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-left transition hover:border-amber-500/30 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex min-w-0 items-start gap-4">
                              <div className="flex h-12 min-w-[72px] items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-sm font-black text-amber-300">
                                {date.toLocaleTimeString("nb-NO", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>

                              <div className="min-w-0">
                                <div className="truncate text-sm font-black text-white">
                                  {inq.customer_name || inq.customerName || `Oppdrag #${inq.id}`}
                                </div>
                                <div className="mt-1 flex items-center gap-1.5 truncate text-[10px] text-slate-500">
                                  <MapPin className="h-3 w-3 shrink-0 text-amber-500" />
                                  {inq.address || inq.city || "Adresse ikke registrert"}
                                </div>
                                <div className="mt-1 text-[10px] text-slate-600">
                                  {(() => {
                                    const service = String(
                                      inq.recommended_service || ""
                                    ).toLowerCase();

                                    if (service === "lekkasjesok") return "Lekkasjesøk";
                                    if (service === "takkontroll") return "Takkontroll";
                                    if (service === "service") return "Service";
                                    if (service === "digital_befaring") return "Digital befaring";

                                    return service || "Oppdrag";
                                  })()}
                                </div>
                              </div>
                            </div>

                            <span className="shrink-0 text-[10px] font-black text-slate-500">
                              Åpne oppdrag
                            </span>
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320]">
              <div className="border-b border-slate-800/70 px-5 py-4">
                <h3 className="text-sm font-black text-white">Kommende avtaler</h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  Neste planlagte oppdrag fra i dag og fremover.
                </p>
              </div>

              <div className="divide-y divide-slate-800/60">
                {calendarInquiries
                  .filter(({ date }) => date >= new Date(new Date().setHours(0, 0, 0, 0)))
                  .slice(0, 8)
                  .map(({ inq, date }) => (
                    <button
                      key={inq.id}
                      type="button"
                      onClick={() => setSelectedInquiry(inq)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left hover:bg-white/[0.025]"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-xs font-black text-white">
                          {inq.customer_name || inq.customerName || `Oppdrag #${inq.id}`}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 truncate text-[10px] text-slate-500">
                          <MapPin className="h-3 w-3 text-amber-500" />
                          {inq.address || inq.city || "Adresse ikke registrert"}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="text-[11px] font-black text-slate-300">
                          {date.toLocaleDateString("nb-NO", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </div>
                        <div className="mt-0.5 text-[10px] font-bold text-amber-300">
                          {date.toLocaleTimeString("nb-NO", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </button>
                  ))}

                {calendarInquiries.length === 0 && (
                  <div className="px-5 py-8 text-center text-xs text-slate-500">
                    Ingen planlagte oppdrag er registrert.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* FANE: SJEKKLISTER */}
        {activeTab === "sjekklister" && (
          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
              <div className="flex flex-col gap-4 border-b border-slate-800/80 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                    <ClipboardList className="h-4 w-4 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Sjekklister</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Maler og utfylte sjekklister for gjennomføring og dokumentasjon.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-1 overflow-x-auto p-2">
                {[
                  { id: "templates" as const, label: "Sjekklister" },
                  { id: "completed" as const, label: "Utfylte sjekklister" },
                ].map((tab) => {
                  const active = checklistView === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setChecklistView(tab.id)}
                      className={`inline-flex shrink-0 items-center rounded-xl px-3.5 py-2.5 text-[11px] font-black transition ${
                        active
                          ? "bg-amber-500/10 text-amber-300"
                          : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <div className={checklistView === "templates" ? "block" : "hidden"}>
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-1">Sjekklistemaler for Feltarbeid</h3>
            </div>
            <ChecklistManager initialRoofType="Flatt tak (PVC / Papp)" />
          </div>
            </div>

            {checklistView === "completed" && (
              <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-6">
                <div className="text-sm font-black text-white">Utfylte sjekklister</div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Denne fanen er klar for oversikten over ferdig utfylte sjekklister.
                </p>
              </section>
            )}
          </div>
        )}

        {/* FANE: PROSJEKTBIBLIOTEK */}
        {activeTab === "prosjekter" && (
          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
              <div className="flex flex-col gap-4 border-b border-slate-800/80 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                    <ImageIcon className="h-4 w-4 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Prosjektbibliotek</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Publiserte prosjekter, nye prosjektopplastinger og arkiv.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-1 overflow-x-auto p-2">
                {[
                  { id: "published" as const, label: "Publiserte prosjekter" },
                  { id: "new" as const, label: "Nytt prosjekt" },
                  { id: "archive" as const, label: "Arkiv" },
                ].map((tab) => {
                  const active = projectLibraryView === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setProjectLibraryView(tab.id)}
                      className={`inline-flex shrink-0 items-center rounded-xl px-3.5 py-2.5 text-[11px] font-black transition ${
                        active
                          ? "bg-amber-500/10 text-amber-300"
                          : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <div className={projectLibraryView === "published" ? "block" : "hidden"}>
          <div className="space-y-8">
            <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-5 md:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-400/80">
                    Prosjektbibliotek
                  </div>
                  <h3 className="mt-1 text-xl font-black text-white">
                    Referanseprosjekter
                  </h3>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                    Bygg prosjektbøker med før-, underveis- og etterbilder, bildetekster,
                    prosjektbeskrivelse og egne coverbilder.
                  </p>
                </div>

                <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-xs font-black text-amber-300">
                  {projects.length} publiserte prosjekter
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320]">
              <button
                type="button"
                onClick={() => {
                  if (projectEditorOpen) {
                    handleCancelEdit();
                  } else {
                    setProjectEditorOpen(true);
                  }
                }}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left md:px-6"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
                    {projectEditorOpen ? <X className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">
                      {editingProjectId ? `Rediger referanseprosjekt #${editingProjectId}` : "Publiser nytt referanseprosjekt"}
                    </h4>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {projectEditorOpen
                        ? "Klikk for å lukke prosjekteditoren."
                        : "Åpne kun når du skal legge til eller redigere et prosjekt."}
                    </p>
                  </div>
                </div>

                <span className={`text-amber-300 transition-transform ${projectEditorOpen ? "rotate-45" : ""}`}>
                  +
                </span>
              </button>
            </section>

            {projectEditorOpen && (
            <form
              onSubmit={handleCreateProject}
              className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]"
            >
              <div className="flex items-center justify-between border-b border-slate-800/70 px-5 py-4 md:px-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
                    {editingProjectId ? (
                      <Edit3 className="h-4 w-4" />
                    ) : (
                      <PlusCircle className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">
                      {editingProjectId
                        ? `Rediger referanseprosjekt #${editingProjectId}`
                        : "Publiser nytt referanseprosjekt"}
                    </h4>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Prosjektdata, prosjektbok og komplett bildebibliotek.
                    </p>
                  </div>
                </div>

                {editingProjectId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] font-bold text-slate-400 transition-colors hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                    Avbryt
                  </button>
                )}
              </div>

              <div className="space-y-7 p-5 md:p-6">
                <section>
                  <div className="mb-3">
                    <h5 className="text-xs font-black uppercase tracking-[0.12em] text-slate-300">
                      1. Prosjektinformasjon
                    </h5>
                    <p className="mt-1 text-[11px] text-slate-600">
                      Informasjonen som brukes i prosjektkortet og prosjektboken.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <label className="space-y-1.5 md:col-span-2">
                      <span className="text-[11px] font-bold text-slate-400">
                        Prosjekttittel *
                      </span>
                      <input
                        type="text"
                        placeholder="F.eks. Kritisk takrehabilitering i Oslo"
                        value={newProject.title}
                        onChange={(e) =>
                          setNewProject({ ...newProject, title: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-800 bg-slate-950/85 px-3.5 py-3 text-xs text-white outline-none transition-colors placeholder:text-slate-700 focus:border-amber-500/60"
                        required
                      />
                    </label>

                    <label className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-400">
                        Fagområde
                      </span>
                      <select
                        value={newProject.category}
                        onChange={(e) =>
                          setNewProject({
                            ...newProject,
                            category: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-800 bg-slate-950/85 px-3.5 py-3 text-xs text-white outline-none focus:border-amber-500/60"
                      >
                        <option value="Blikkenslager">Blikkenslager</option>
                        <option value="Restaurering">Restaurering</option>
                        <option value="Takreparasjon">Takreparasjon</option>
                        <option value="Flatt Tak / Papp">Flatt Tak / Papp</option>
                      </select>
                    </label>

                    <label className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-400">
                        Sted / område
                      </span>
                      <input
                        type="text"
                        placeholder="Oslo"
                        value={newProject.location}
                        onChange={(e) =>
                          setNewProject({
                            ...newProject,
                            location: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-800 bg-slate-950/85 px-3.5 py-3 text-xs text-white outline-none transition-colors placeholder:text-slate-700 focus:border-amber-500/60"
                      />
                    </label>

                    <label className="space-y-1.5 md:col-span-2">
                      <span className="text-[11px] font-bold text-slate-400">
                        Kort beskrivelse / ingress
                      </span>
                      <textarea
                        rows={3}
                        placeholder="Kort tekst som vises på prosjektkortet..."
                        value={newProject.description}
                        onChange={(e) =>
                          setNewProject({
                            ...newProject,
                            description: e.target.value,
                          })
                        }
                        className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950/85 px-3.5 py-3 text-xs leading-5 text-white outline-none transition-colors placeholder:text-slate-700 focus:border-amber-500/60"
                      />
                    </label>
                  </div>
                </section>

                <section>
                  <div className="mb-3">
                    <h5 className="text-xs font-black uppercase tracking-[0.12em] text-slate-300">
                      2. Prosjektbok
                    </h5>
                    <p className="mt-1 text-[11px] text-slate-600">
                      Full historie, funn, teknisk vurdering og løsning.
                    </p>
                  </div>

                  <textarea
                    rows={9}
                    placeholder="Skriv prosjektets historie, utfordring, funn, løsning og resultat..."
                    value={newProject.caseText}
                    onChange={(e) =>
                      setNewProject({ ...newProject, caseText: e.target.value })
                    }
                    className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950/85 px-4 py-3 text-xs leading-6 text-white outline-none transition-colors placeholder:text-slate-700 focus:border-amber-500/60"
                  />
                </section>

                <section>
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h5 className="text-xs font-black uppercase tracking-[0.12em] text-slate-300">
                        3. Bildebibliotek
                      </h5>
                      <p className="mt-1 text-[11px] text-slate-600">
                        Legg til så mange bilder du trenger. Velg fase og egne FØR/ETTER-covere.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addProjectImageSlot}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3.5 py-2.5 text-[11px] font-black text-amber-300 transition-colors hover:bg-amber-400/15"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Legg til bilde
                    </button>
                  </div>

                  <div className="space-y-3">
                    {projectImages.map((img, index) => {
                      const previewUrl = img.file
                        ? URL.createObjectURL(img.file)
                        : resolveProjectImageUrl(img.existingUrl);

                      return (
                        <div
                          key={`${index}-${img.existingUrl || "new"}`}
                          className="grid gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/55 p-4 lg:grid-cols-[210px_minmax(0,1fr)]"
                        >
                          <div className="space-y-2">
                            <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                              {previewUrl ? (
                                <img
                                  src={previewUrl}
                                  alt={img.caption || `Prosjektbilde ${index + 1}`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="px-4 text-center text-[11px] text-slate-600">
                                  Ingen bildefil valgt
                                </div>
                              )}

                              <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                                {img.isCoverBefore && (
                                  <span className="rounded-md bg-amber-400 px-2 py-1 text-[9px] font-black text-slate-950">
                                    FØR-COVER
                                  </span>
                                )}
                                {img.isCoverAfter && (
                                  <span className="rounded-md bg-emerald-400 px-2 py-1 text-[9px] font-black text-slate-950">
                                    ETTER-COVER
                                  </span>
                                )}
                              </div>
                            </div>

                            <label className="block cursor-pointer rounded-xl border border-dashed border-slate-700 bg-slate-900/70 px-3 py-2.5 text-center text-[11px] font-bold text-slate-400 transition-colors hover:border-amber-500/40 hover:text-amber-300">
                              {img.file ? img.file.name : img.existingUrl ? "Bytt bilde" : "Velg bilde"}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  updateProjectImage(index, {
                                    file: e.target.files?.[0] || null,
                                  })
                                }
                              />
                            </label>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-xs font-black text-white">
                                  Bilde {index + 1}
                                </div>
                                <div className="mt-0.5 text-[10px] text-slate-600">
                                  Beskriv bildet og hvilken fase det tilhører.
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeProjectImage(index)}
                                className="rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-[10px] font-black text-red-300 transition-colors hover:bg-red-500/15"
                              >
                                Fjern
                              </button>
                            </div>

                            <label className="block space-y-1.5">
                              <span className="text-[11px] font-bold text-slate-400">
                                Bildetekst
                              </span>
                              <textarea
                                rows={2}
                                placeholder="Hva ser vi på bildet?"
                                value={img.caption}
                                onChange={(e) =>
                                  updateProjectImage(index, {
                                    caption: e.target.value,
                                  })
                                }
                                className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-3 text-xs text-white outline-none placeholder:text-slate-700 focus:border-amber-500/60"
                              />
                            </label>

                            <div>
                              <div className="mb-2 text-[11px] font-bold text-slate-400">
                                Fase
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { value: "before", label: "Før" },
                                  { value: "during", label: "Underveis" },
                                  { value: "after", label: "Etter" },
                                ].map((stage) => (
                                  <button
                                    key={stage.value}
                                    type="button"
                                    onClick={() =>
                                      updateProjectImage(index, {
                                        stage: stage.value as "before" | "during" | "after",
                                      })
                                    }
                                    className={`rounded-xl border px-3 py-2.5 text-[10px] font-black transition-all ${
                                      img.stage === stage.value
                                        ? stage.value === "before"
                                          ? "border-amber-400/40 bg-amber-400/15 text-amber-300"
                                          : stage.value === "after"
                                            ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
                                            : "border-cyan-400/40 bg-cyan-400/15 text-cyan-300"
                                        : "border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-300"
                                    }`}
                                  >
                                    {stage.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <div className="mb-2 text-[11px] font-bold text-slate-400">
                                Coverbilde
                              </div>
                              <div className="grid gap-2 sm:grid-cols-2">
                                <button
                                  type="button"
                                  onClick={() => setProjectCoverImage(index, "before")}
                                  className={`rounded-xl border px-3 py-2.5 text-[10px] font-black transition-all ${
                                    img.isCoverBefore
                                      ? "border-amber-400/45 bg-amber-400/15 text-amber-300"
                                      : "border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-300"
                                  }`}
                                >
                                  {img.isCoverBefore ? "✓ " : ""}Bruk som FØR-cover
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setProjectCoverImage(index, "after")}
                                  className={`rounded-xl border px-3 py-2.5 text-[10px] font-black transition-all ${
                                    img.isCoverAfter
                                      ? "border-emerald-400/45 bg-emerald-400/15 text-emerald-300"
                                      : "border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-300"
                                  }`}
                                >
                                  {img.isCoverAfter ? "✓ " : ""}Bruk som ETTER-cover
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-800/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[10px] leading-4 text-slate-600">
                    Minst ett bilde og prosjekttittel er påkrevd. Eksisterende bilder beholdes ved redigering.
                  </p>

                  <button
                    type="submit"
                    disabled={uploadingProject}
                    className="inline-flex min-w-[210px] items-center justify-center gap-2 rounded-xl bg-[#F5B800] px-6 py-3 text-xs font-black text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploadingProject ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Lagrer...
                      </>
                    ) : editingProjectId ? (
                      "Lagre endringer"
                    ) : (
                      "Publiser prosjekt"
                    )}
                  </button>
                </div>
              </div>
            </form>


            )}

            <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-5 md:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-black text-white">
                    Publiserte referanser ({projects.length})
                  </h4>
                  <p className="mt-1 text-[11px] text-slate-600">
                    Samme før/etter-logikk som prosjektbiblioteket på nettsiden.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-3">
                {projects.map((p) => {
                  const images = getProjectImages(p);
                  const beforeCover = getProjectCover(p, "before");
                  const afterCover = getProjectCover(p, "after");

                  return (
                    <article
                      key={p.id}
                      className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 transition-colors hover:border-amber-500/30"
                    >
                      <div className="grid h-48 grid-cols-2 overflow-hidden bg-slate-950">
                        <div className="relative border-r border-slate-800">
                          {beforeCover ? (
                            <img
                              src={beforeCover}
                              alt={`${p.title} før`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[11px] text-slate-700">
                              Mangler førbilde
                            </div>
                          )}
                          <span className="absolute left-2 top-2 rounded-md bg-amber-400 px-2 py-1 text-[9px] font-black text-slate-950">
                            FØR
                          </span>
                        </div>

                        <div className="relative">
                          {afterCover ? (
                            <img
                              src={afterCover}
                              alt={`${p.title} etter`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[11px] text-slate-700">
                              Mangler etterbilde
                            </div>
                          )}
                          <span className="absolute right-2 top-2 rounded-md bg-emerald-400 px-2 py-1 text-[9px] font-black text-slate-950">
                            ETTER
                          </span>
                        </div>

                        <span className="absolute mt-[158px] ml-3 rounded-md border border-slate-700 bg-slate-950/90 px-2 py-1 text-[9px] font-black text-amber-300">
                          {images.length} bilder
                        </span>
                      </div>

                      <div className="space-y-3 p-4">
                        <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.11em]">
                          <span className="text-slate-500">{p.category}</span>
                          {p.location && (
                            <span className="inline-flex items-center gap-1 normal-case tracking-normal text-amber-400">
                              <MapPin className="h-3 w-3" />
                              {p.location}
                            </span>
                          )}
                        </div>

                        <h5 className="line-clamp-3 text-sm font-black leading-5 text-white">
                          {p.title}
                        </h5>

                        {p.description && (
                          <p className="line-clamp-3 text-[11px] leading-5 text-slate-500">
                            {p.description}
                          </p>
                        )}

                        <div className="flex gap-2 border-t border-slate-800/70 pt-3">
                          <button
                            type="button"
                            onClick={() => handleStartEditProject(p)}
                            className="flex-1 rounded-xl border border-amber-400/20 bg-amber-400/10 py-2.5 text-[11px] font-black text-amber-300 transition-colors hover:bg-amber-400/15"
                          >
                            Rediger prosjekt
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(p.id)}
                            className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-[11px] font-black text-red-300 transition-colors hover:bg-red-500/15"
                          >
                            Slett
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
            </div>

            {projectLibraryView === "new" && (
              <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-6">
                <div className="text-sm font-black text-white">Nytt prosjekt</div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Prosjekteditoren kan flyttes hit i neste steg uten å endre eksisterende prosjektdata.
                </p>
              </section>
            )}

            {projectLibraryView === "archive" && (
              <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-6">
                <div className="text-sm font-black text-white">Arkiv</div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Arkiverte prosjekter kan vises her når arkivfilteret kobles på.
                </p>
              </section>
            )}
          </div>
        )}

        {/* FANE: KUNDEREGISTER */}
        {activeTab === "kunder" && (
          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
              <div className="flex flex-col gap-4 border-b border-slate-800/80 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                    <Building className="h-4 w-4 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Kunder</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Kunderegister, virksomheter, borettslag og eiendommer i perun_core.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-1 overflow-x-auto p-2">
                {[
                  { id: "all" as const, label: "Alle kunder" },
                  { id: "private" as const, label: "Privatkunder" },
                  { id: "business" as const, label: "Bedrifter" },
                  { id: "housing" as const, label: "Borettslag / sameier" },
                  { id: "properties" as const, label: "Eiendommer" },
                ].map((tab) => {
                  const active = customerView === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCustomerView(tab.id)}
                      className={`inline-flex shrink-0 items-center rounded-xl px-3.5 py-2.5 text-[11px] font-black transition ${
                        active
                          ? "bg-amber-500/10 text-amber-300"
                          : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <CustomerList
              activeView={customerView}
              onViewAsCustomer={handleViewAsCustomer}
            />
          </div>
        )}

        {/* FANE: MARKEDSFØRING */}
        {activeTab === "markedsforing" && (
          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
              <div className="flex flex-col gap-4 border-b border-slate-800/80 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                    <Search className="h-4 w-4 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Markedsføring</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Prospekter, målgrupper og kontaktgrunnlag fra perun_core.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-1 overflow-x-auto p-2">
                {[
                  { id: "private" as const, label: "Private kunder" },
                  { id: "business" as const, label: "Bedrifter" },
                  { id: "housing" as const, label: "Sameier / borettslag" },
                ].map((tab) => {
                  const active = marketingSegment === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setMarketingSegment(tab.id)}
                      className={`inline-flex shrink-0 items-center rounded-xl px-3.5 py-2.5 text-[11px] font-black transition ${
                        active
                          ? "bg-amber-500/10 text-amber-300"
                          : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <ProspectPage segment={marketingSegment} />
          </div>
        )}

        {/* FANE: E-POST & KAMPANJER */}
        {activeTab === "epost" && (
          <EmailCenterPage />
        )}

        {/* FANE: DATAIMPORT */}
        {activeTab === "dataimport" && (
          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
              <div className="flex flex-col gap-4 border-b border-slate-800/80 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                    <Database className="h-4 w-4 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Dataimport</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Importer, kontroller og følg historiske data inn i perun_core.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-1 overflow-x-auto p-2">
                {[
                  { id: "new" as const, label: "Ny import" },
                  { id: "history" as const, label: "Importhistorikk" },
                  { id: "issues" as const, label: "Feil / avvik" },
                ].map((tab) => {
                  const active = dataImportView === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDataImportView(tab.id)}
                      className={`inline-flex shrink-0 items-center rounded-xl px-3.5 py-2.5 text-[11px] font-black transition ${
                        active
                          ? "bg-amber-500/10 text-amber-300"
                          : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <DataImportPage activeView={dataImportView} />
          </div>
        )}

        {/* FANE: TIMELISTEOVERSIKT */}
        {activeTab === "timeliste" && (
          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
              <div className="flex flex-col gap-4 border-b border-slate-800/80 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                    <Clock3 className="h-4 w-4 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Timelisteoversikt</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Registrerte timer, oversikt per ansatt og godkjenning.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-1 overflow-x-auto p-2">
                {[
                  { id: "oversikt" as const, label: "Oversikt" },
                  { id: "timer" as const, label: "Registrerte timer" },
                  { id: "ansatte" as const, label: "Per ansatt" },
                  { id: "godkjenning" as const, label: "Godkjenning" },
                ].map((tab) => {
                  const active = timeOverviewTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setTimeOverviewTab(tab.id)}
                      className={`inline-flex shrink-0 items-center rounded-xl px-3.5 py-2.5 text-[11px] font-black transition ${
                        active
                          ? "bg-amber-500/10 text-amber-300"
                          : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </section>


          <TimeOverviewPage activeView={timeOverviewTab} />
          </div>
        )}

        {/* FANE: KJØREBOK */}
        {activeTab === "kjorebok" && (
          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
              <div className="flex flex-col gap-4 border-b border-slate-800/80 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                    <CarFront className="h-4 w-4 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Kjørebok</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Kjøringer, kjøretøy og kilometerstand samlet på ett sted.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 overflow-x-auto p-2">
                {[
                  { id: "oversikt" as const, label: "Oversikt" },
                  { id: "kjoringer" as const, label: "Kjøringer" },
                  { id: "kjoretoy" as const, label: "Kjøretøy" },
                  { id: "kilometerstand" as const, label: "Kilometerstand" },
                ].map((tab) => {
                  const active = drivingLogTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDrivingLogTab(tab.id)}
                      className={`inline-flex shrink-0 items-center rounded-xl px-3.5 py-2.5 text-[11px] font-black transition ${
                        active
                          ? "bg-amber-500/10 text-amber-300"
                          : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <DrivingLogPage activeView={drivingLogTab} />
          </div>
        )}

        {/* FANE: RAPPORTER */}
        {activeTab === "rapporter" && (
          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
              <div className="border-b border-slate-800/80 px-5 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
                    <FileText className="h-4 w-4 text-cyan-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Rapportmaler</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Forhåndsvis gjeldende kundemal uten å åpne et konkret oppdrag.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setReportTemplatePreview("lekkasjesok")}
                  className="group rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5 text-left transition hover:border-amber-500/40 hover:bg-amber-500/[0.07]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="inline-flex rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-amber-300">
                        Rapport 1
                      </span>
                      <h4 className="mt-4 text-base font-black text-white">Lekkasjesøk</h4>
                      <p className="mt-1 max-w-md text-[11px] leading-5 text-slate-500">
                        Teknisk rapport for lokalisering av lekkasjeårsak, registrerte forhold, tilstandsgrader, tiltak og bildedokumentasjon.
                      </p>
                    </div>
                    <Search className="h-6 w-6 shrink-0 text-amber-400/80 transition group-hover:text-amber-300" />
                  </div>
                  <div className="mt-5 inline-flex items-center gap-2 text-[10px] font-black text-amber-300">
                    Forhåndsvis mal
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setReportTemplatePreview("takkontroll")}
                  className="group rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.04] p-5 text-left transition hover:border-indigo-500/40 hover:bg-indigo-500/[0.07]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="inline-flex rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-indigo-300">
                        Rapport 1
                      </span>
                      <h4 className="mt-4 text-base font-black text-white">Takkontroll</h4>
                      <p className="mt-1 max-w-md text-[11px] leading-5 text-slate-500">
                        Systematisk teknisk kontroll av taktekking, beslag, gjennomføringer, renner, lufting og øvrige registrerte kontrollpunkter.
                      </p>
                    </div>
                    <ShieldAlert className="h-6 w-6 shrink-0 text-indigo-400/80 transition group-hover:text-indigo-300" />
                  </div>
                  <div className="mt-5 inline-flex items-center gap-2 text-[10px] font-black text-indigo-300">
                    Forhåndsvis mal
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setReportTemplatePreview("completion")}
                  className="group rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-5 text-left transition hover:border-cyan-500/40 hover:bg-cyan-500/[0.07]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="inline-flex rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-cyan-300">
                        Rapport 2
                      </span>
                      <h4 className="mt-4 text-base font-black text-white">Utførelsesrapport</h4>
                      <p className="mt-1 max-w-md text-[11px] leading-5 text-slate-500">
                        Rapport etter utførte arbeider, bygget på Rapport 1 med dokumentasjon av tiltak, resultat, ny tilstandsgrad og bilder.
                      </p>
                    </div>
                    <ShieldCheck className="h-6 w-6 shrink-0 text-cyan-400/80 transition group-hover:text-cyan-300" />
                  </div>
                  <div className="mt-5 inline-flex items-center gap-2 text-[10px] font-black text-cyan-300">
                    Forhåndsvis mal
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </button>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
              <div className="flex flex-col gap-4 border-b border-slate-800/80 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                    <FileText className="h-4 w-4 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Rapportarkiv</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Alle produserte tekniske rapporter og utførelsesrapporter, med mottaker, revisjon, dato og PDF.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fetchReportArchive}
                  disabled={reportArchiveLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-[11px] font-black text-slate-300 transition hover:border-amber-500/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {reportArchiveLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileText className="h-3.5 w-3.5" />
                  )}
                  Oppdater arkiv
                </button>
              </div>

              <div className="flex gap-1 overflow-x-auto p-2">
                {[
                  { id: "review" as const, label: "Til behandling", count: reportArchiveCounts.review },
                  { id: "approved" as const, label: "Godkjente", count: reportArchiveCounts.approved },
                  { id: "sent" as const, label: "Sendt til kunde", count: reportArchiveCounts.sent },
                ].map((tab) => {
                  const active = reportView === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setReportView(tab.id)}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-[11px] font-black transition ${
                        active
                          ? "bg-amber-500/10 text-amber-300"
                          : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
                      }`}
                    >
                      {tab.label}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] ${
                          active ? "bg-amber-500/15 text-amber-200" : "bg-slate-900 text-slate-500"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {reportArchiveError && (
              <section className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] px-5 py-4 text-xs text-red-300">
                {reportArchiveError}
              </section>
            )}

            <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
              {reportArchiveLoading && reportArchive.length === 0 ? (
                <div className="flex items-center justify-center gap-2 px-5 py-12 text-xs text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                  Henter rapportarkiv...
                </div>
              ) : (
                <>
                  <div className="hidden grid-cols-[minmax(230px,1.4fr)_100px_minmax(190px,1fr)_minmax(200px,1fr)_155px_120px] gap-4 border-b border-slate-800/80 bg-slate-950/30 px-5 py-3 text-[9px] font-black uppercase tracking-[0.13em] text-slate-600 xl:grid">
                    <div>Rapport</div>
                    <div>Oppdrag</div>
                    <div>Mottaker</div>
                    <div>Kontakt</div>
                    <div>Dato</div>
                    <div className="text-right">Handling</div>
                  </div>

                  <div className="divide-y divide-slate-800/60">
                    {reportArchive
                      .filter((report) => report.archive_category === reportView)
                      .map((report) => {
                        const reportDate =
                          reportView === "sent"
                            ? report.published_at
                            : reportView === "approved"
                              ? report.approved_at
                              : report.submitted_at || report.activity_at;

                        const pdfUrl = resolveReportPdfUrl(report.pdf_url);

                        return (
                          <div
                            key={report.archive_key}
                            className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.02] xl:grid-cols-[minmax(230px,1.4fr)_100px_minmax(190px,1fr)_minmax(200px,1fr)_155px_120px] xl:items-center"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-lg border px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${
                                    report.report_type === "rapport2"
                                      ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-300"
                                      : "border-amber-500/20 bg-amber-500/10 text-amber-300"
                                  }`}
                                >
                                  {report.report_type === "rapport2"
                                    ? "Utførelsesrapport"
                                    : "Teknisk rapport"}
                                </span>

                                <span className="text-[9px] font-bold text-slate-600">
                                  Rev. {report.revision_no}
                                </span>
                              </div>

                              <div className="mt-2 truncate text-xs font-black text-white">
                                {String(report.title || report.report_type_label || "Rapport")}
                              </div>

                              <div className="mt-1 truncate text-[10px] text-slate-500">
                                {String(report.full_address || report.address || "Adresse ikke registrert")}
                              </div>
                            </div>

                            <div>
                              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-600 xl:hidden">
                                Oppdrag
                              </p>
                              <p className="mt-1 text-xs font-black text-slate-200 xl:mt-0">
                                #{report.inquiry_id}
                              </p>
                            </div>

                            <div className="min-w-0">
                              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-600 xl:hidden">
                                Mottaker
                              </p>
                              <p className="mt-1 truncate text-xs font-black text-white xl:mt-0">
                                {String(report.recipient_name || report.customer_name || "Ikke registrert")}
                              </p>
                              <p className="mt-1 text-[10px] text-slate-500">
                                Kunde-ID {report.customer_id ?? "—"}
                              </p>
                            </div>

                            <div className="min-w-0 space-y-1">
                              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-600 xl:hidden">
                                Kontakt
                              </p>
                              <div className="flex min-w-0 items-center gap-2 text-[10px] text-slate-400">
                                <Mail className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                                <span className="truncate">{String(report.recipient_email || "Ingen e-post")}</span>
                              </div>
                              <div className="flex min-w-0 items-center gap-2 text-[10px] text-slate-400">
                                <span className="shrink-0 text-slate-600">Tlf.</span>
                                <span className="truncate">{String(report.recipient_phone || "Ingen telefon")}</span>
                              </div>
                            </div>

                            <div>
                              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-600 xl:hidden">
                                Dato
                              </p>
                              <p className="mt-1 text-[10px] font-bold leading-5 text-slate-300 xl:mt-0">
                                {formatReportDate(reportDate)}
                              </p>
                              <p className="mt-1 text-[9px] text-slate-600">
                                {reportView === "sent"
                                  ? "Publisert"
                                  : reportView === "approved"
                                    ? "Godkjent"
                                    : "Sendt til admin"}
                              </p>
                            </div>

                            <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
                              {report.has_pdf && pdfUrl && (
                                <a
                                  href={pdfUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(event) => event.stopPropagation()}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-2 text-[9px] font-black text-emerald-300 transition hover:bg-emerald-500/15"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  PDF
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={() => openReportArchiveItem(report)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-[9px] font-black text-slate-300 transition hover:border-amber-500/30 hover:text-white"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                                Åpne
                              </button>
                            </div>
                          </div>
                        );
                      })}

                    {reportArchive.filter((report) => report.archive_category === reportView).length === 0 && (
                      <div className="px-5 py-12 text-center">
                        <FileText className="mx-auto h-6 w-6 text-slate-700" />
                        <p className="mt-3 text-xs font-bold text-slate-500">
                          Ingen rapporter i denne kategorien.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>

            {reportTemplatePreview && (
              <div
                className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm md:p-6"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) {
                    setReportTemplatePreview(null);
                  }
                }}
              >
                <div className="flex h-[94vh] w-full max-w-[1500px] flex-col overflow-hidden rounded-3xl border border-slate-700 bg-[#090d15] shadow-2xl">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
                        Forhåndsvisning av rapportmal
                      </p>
                      <h3 className="mt-1 truncate text-base font-black text-white">
                        {reportTemplatePreview === "lekkasjesok"
                          ? "Lekkasjesøk"
                          : reportTemplatePreview === "takkontroll"
                            ? "Takkontroll"
                            : "Utførelsesrapport"}
                      </h3>
                      <p className="mt-1 text-[10px] text-slate-500">
                        Eksempeldata brukes kun for å vise malen. Ingenting lagres i databasen.
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <a
                        href={getReportTemplatePreviewUrl(reportTemplatePreview)}
                        target="_blank"
                        rel="noreferrer"
                        className="hidden rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-[10px] font-black text-slate-300 transition hover:border-cyan-500/30 hover:text-white sm:inline-flex"
                      >
                        Åpne i ny fane
                      </a>
                      <button
                        type="button"
                        onClick={() => setReportTemplatePreview(null)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-950 text-slate-400 transition hover:text-white"
                        aria-label="Lukk forhåndsvisning"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 bg-slate-950 p-2 md:p-4">
                    <iframe
                      key={reportTemplatePreview}
                      title={
                        reportTemplatePreview === "lekkasjesok"
                          ? "Forhåndsvisning lekkasjesøk"
                          : reportTemplatePreview === "takkontroll"
                            ? "Forhåndsvisning takkontroll"
                            : "Forhåndsvisning utførelsesrapport"
                      }
                      src={getReportTemplatePreviewUrl(reportTemplatePreview)}
                      className="h-full w-full rounded-2xl bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FANE: INNSTILLINGER */}
        {activeTab === "innstillinger" && (
          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
              <div className="flex flex-col gap-4 border-b border-slate-800/80 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                    <Settings className="h-4 w-4 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Innstillinger</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Firmaoppsett, brukertilgang, varsler og teknisk dokumentasjon.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 overflow-x-auto p-2">
                {[
                  { id: "company" as const, label: "Firmainnstillinger" },
                  { id: "users" as const, label: "Brukere & roller" },
                  { id: "notifications" as const, label: "Varsler" },
                  { id: "technical" as const, label: "Teknisk" },
                ].map((tab) => {
                  const active = settingsView === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSettingsView(tab.id)}
                      className={`inline-flex shrink-0 items-center rounded-xl px-3.5 py-2.5 text-[11px] font-black transition ${
                        active
                          ? "bg-amber-500/10 text-amber-300"
                          : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {settingsView === "technical" ? (
              <div className="space-y-5">
                <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
                  <div className="flex flex-col gap-4 border-b border-slate-800/80 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                        <Code2 className="h-4 w-4 text-amber-300" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white">Teknisk dokumentasjon</h3>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Arkitektur, databaser, API-er og modulstatus.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 overflow-x-auto p-2">
                    {[
                      { id: "architecture" as const, label: "Arkitektur" },
                      { id: "databases" as const, label: "Databaser" },
                      { id: "apis" as const, label: "API-er" },
                      { id: "modules" as const, label: "Modulstatus" },
                    ].map((tab) => {
                      const active = technicalView === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setTechnicalView(tab.id)}
                          className={`inline-flex shrink-0 items-center rounded-xl px-3.5 py-2.5 text-[11px] font-black transition ${
                            active
                              ? "bg-amber-500/10 text-amber-300"
                              : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {technicalView === "architecture" ? (
                  <TechnicalDocumentation />
                ) : (
                  <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-6">
                    <div className="text-sm font-black text-white">
                      {technicalView === "databases"
                        ? "Databaser"
                        : technicalView === "apis"
                          ? "API-er"
                          : "Modulstatus"}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Fanen er klar for videre teknisk dokumentasjon.
                    </p>
                  </section>
                )}
              </div>
            ) : (
              <SettingsPage activeView={settingsView} />
            )}
          </div>
        )}

        {/* FANE: ANSATTE & TILGANG */}
        {activeTab === "ansatte" && (
          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
              <div className="flex flex-col gap-4 border-b border-slate-800/80 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                    <Users className="h-4 w-4 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Ansatte / team</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Ansatte, roller og prosjektteam samlet på ett sted.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-1 overflow-x-auto p-2">
                {[
                  { id: "ansatte" as const, label: "Ansatte" },
                  { id: "roller" as const, label: "Roller & tilgang" },
                  { id: "prosjektteam" as const, label: "Prosjektteam" },
                ].map((tab) => {
                  const active = employeeView === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setEmployeeView(tab.id)}
                      className={`inline-flex shrink-0 items-center rounded-xl px-3.5 py-2.5 text-[11px] font-black transition ${
                        active
                          ? "bg-amber-500/10 text-amber-300"
                          : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {employeeView === "ansatte" && (
              <EmployeeList
                onViewAsEmployee={(employee) => {
                  setPreviewEmployeeFromInquiry(false);
                  setPreviewEmployee(employee);
                }}
              />
            )}

            {employeeView === "roller" && (
              <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-6">
                <div className="text-sm font-black text-white">Roller & tilgang</div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Denne fanen er klar for rolle- og tilgangsstyringen.
                </p>
              </section>
            )}

            {employeeView === "prosjektteam" && (
              <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-6">
                <div className="text-sm font-black text-white">Prosjektteam</div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Denne fanen er klar for oversikt over prosjektteam og tildelinger.
                </p>
              </section>
            )}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}