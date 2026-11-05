import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { apiUrl } from "../lib/api";
import InternalCustomerControls from "./InternalCustomerControls";
import ProfilePage, {
  type ProfileHistoryItem,
  type ProfileIdentity,
  type ProfileStat,
} from "./ProfilePage";

interface CustomerProfilePageProps {
  customerId: number;
  onBack: () => void;
}

interface CoreCustomer {
  id: number;
  customer_number?: string | null;
  customer_type?: string | null;
  name?: string | null;
  organization_number?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  status?: string | null;
}

interface CoreContact {
  id: number;
  name?: string | null;
}

interface CoreProperty {
  id: number;
  address?: string | null;
  city?: string | null;
}

interface CoreProject {
  id: number;
  project_number?: string | null;
  title?: string | null;
  status?: string | null;
  start_date?: string | null;
  created_at?: string | null;
  property_address?: string | null;
  property_city?: string | null;
}

interface CustomerProfileResponse {
  success: boolean;
  message?: string;
  customer?: CoreCustomer;
  contacts?: CoreContact[];
  properties?: CoreProperty[];
  projects?: CoreProject[];
  stats?: {
    contacts?: number;
    properties?: number;
    projects?: number;
    active_projects?: number;
    planned_projects?: number;
    completed_projects?: number;
  };
}

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

export default function CustomerProfilePage({
  customerId,
  onBack,
}: CustomerProfilePageProps) {
  const [data, setData] = useState<CustomerProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(
          apiUrl(`/core/customer_profile.php?id=${customerId}`)
        );
        const result: CustomerProfileResponse = await res.json();

        if (!res.ok || !result.success || !result.customer) {
          throw new Error(result.message || "Kunne ikke hente kundeprofilen.");
        }

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Kunne ikke hente kundeprofilen."
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
  }, [customerId]);

  const customer = data?.customer;

  const kind =
    String(customer?.customer_type || "").toLowerCase() === "private"
      ? "customer_private"
      : "customer_business";

  const profile: ProfileIdentity | null = useMemo(() => {
    if (!customer) return null;

    return {
      id: customer.id,
      name: customer.name || "Kunde",
      roleLabel:
        kind === "customer_private" ? "Privatkunde" : "Bedriftskunde",
      email: customer.email || null,
      phone: customer.phone || null,
      customerNumber:
        customer.customer_number || String(customer.id),
      organizationNumber: customer.organization_number || null,
      status:
        String(customer.status || "").toLowerCase() === "active"
          ? "Aktiv"
          : customer.status || "Aktiv",
      address: customer.address || null,
      postalCode: customer.postal_code || null,
      city: customer.city || null,
    };
  }, [customer, kind]);

  const stats: ProfileStat[] = useMemo(
    () => [
      { label: "Kontaktpersoner", value: Number(data?.stats?.contacts || 0) },
      { label: "Eiendommer", value: Number(data?.stats?.properties || 0) },
      { label: "Prosjekter", value: Number(data?.stats?.projects || 0) },
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
            : project.title || project.project_number || `Prosjekt #${project.id}`,
        subtitle: [project.property_address, project.property_city]
          .filter(Boolean)
          .join(", "),
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
          Henter kundeprofil...
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#070a11] text-white p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-5">
          <p className="text-sm font-black text-red-300">Kunne ikke åpne profil</p>
          <p className="mt-2 text-xs text-slate-400">
            {error || "Kundedata mangler."}
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
      kind={kind}
      profile={profile}
      stats={stats}
      history={history}
      onBack={onBack}
      settingsContent={<InternalCustomerControls customerId={customerId} />}
    />
  );
}
