import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { apiUrl } from "../lib/api";
import ProfilePage, {
  type ProfileHistoryItem,
  type ProfileIdentity,
  type ProfileStat,
} from "./ProfilePage";

interface AdminProfilePageProps {
  onBack: () => void;
}

interface CoreAdmin {
  id: number;
  employee_number?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  employee_email?: string | null;
  phone?: string | null;
  role?: string | null;
  job_title?: string | null;
  department_name?: string | null;
  status?: string | null;
  profile_image?: string | null;
  hire_date?: string | null;
  end_date?: string | null;
  user_id?: number | null;
  login_email?: string | null;
  user_active?: number | boolean | null;
  last_login_at?: string | null;
}

interface AdminProject {
  id: number;
  project_number?: string | null;
  title?: string | null;
  project_type?: string | null;
  status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string | null;
  customer_name?: string | null;
  property_address?: string | null;
  property_postal_code?: string | null;
  property_city?: string | null;
}

interface AdminProfileResponse {
  success: boolean;
  message?: string;
  admin?: CoreAdmin;
  projects?: AdminProject[];
  stats?: {
    customers?: number;
    employees?: number;
    projects?: number;
    active_projects?: number;
    planned_projects?: number;
    completed_projects?: number;
  };
}

const statusLabel = (status?: string | null) => {
  switch (String(status || "").toLowerCase()) {
    case "active":
      return "Aktiv";
    case "inactive":
      return "Inaktiv";
    case "archived":
      return "Arkivert";
    default:
      return status || "Aktiv";
  }
};

const projectStatusLabel = (status?: string | null) => {
  switch (String(status || "").toLowerCase()) {
    case "active":
      return "Aktiv";
    case "planned":
      return "Planlagt";
    case "completed":
      return "Fullført";
    case "cancelled":
      return "Avlyst";
    case "archived":
      return "Arkivert";
    default:
      return status || "Ukjent";
  }
};

export default function AdminProfilePage({
  onBack,
}: AdminProfilePageProps) {
  const [data, setData] = useState<AdminProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(apiUrl("/core/admin_profile.php"));
        const result: AdminProfileResponse = await res.json();

        if (!res.ok || !result.success || !result.admin) {
          throw new Error(
            result.message || "Kunne ikke hente administratorprofilen."
          );
        }

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Kunne ikke hente administratorprofilen."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const admin = data?.admin;

  const profile: ProfileIdentity | null = useMemo(() => {
    if (!admin) return null;

    return {
      id: admin.id,
      name:
        admin.display_name ||
        [admin.first_name, admin.last_name].filter(Boolean).join(" ") ||
        "Administrator",
      roleLabel: admin.job_title || "Administrator",
      email: admin.employee_email || admin.login_email || null,
      phone: admin.phone || null,
      employeeNumber: admin.employee_number || String(admin.id),
      department: admin.department_name || null,
      status: statusLabel(admin.status),
    };
  }, [admin]);

  const stats: ProfileStat[] = useMemo(
    () => [
      {
        label: "Kunder",
        value: Number(data?.stats?.customers || 0),
      },
      {
        label: "Ansatte",
        value: Number(data?.stats?.employees || 0),
      },
      {
        label: "Prosjekter",
        value: Number(data?.stats?.projects || 0),
      },
      {
        label: "Aktive / planlagte",
        value:
          Number(data?.stats?.active_projects || 0) +
          Number(data?.stats?.planned_projects || 0),
      },
    ],
    [data]
  );

  const history: ProfileHistoryItem[] = useMemo(
    () =>
      (data?.projects || []).map((project) => ({
        id: project.id,
        title:
          project.project_number && project.title
            ? `${project.project_number} · ${project.title}`
            : project.title ||
              project.project_number ||
              `Prosjekt #${project.id}`,
        subtitle: [
          project.customer_name,
          project.property_address,
          project.property_postal_code,
          project.property_city,
        ]
          .filter(Boolean)
          .join(" · "),
        date: project.start_date || project.created_at || undefined,
        status: projectStatusLabel(project.status),
      })),
    [data]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a11] text-white grid place-items-center">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-[#F5B800]" />
          Henter administratorprofil...
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#070a11] text-white p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-5">
          <p className="text-sm font-black text-red-300">
            Kunne ikke åpne administratorprofil
          </p>
          <p className="mt-2 text-xs text-slate-400">
            {error || "Administratordata mangler."}
          </p>

          <button
            type="button"
            onClick={onBack}
            className="mt-4 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-black"
          >
            Tilbake
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProfilePage
      kind="admin"
      profile={profile}
      stats={stats}
      history={history}
      onBack={onBack}
    />
  );
}
