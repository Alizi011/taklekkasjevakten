import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock3,
  FileText,
  HeartHandshake,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";

import { apiUrl } from "../lib/api";

/* ============================================================
   PROPS
   ============================================================ */

interface EmployeeProfilePageProps {
  employeeId?: number;
  sourceEmployeeId?: number;
  onBack: () => void;
}

/* ============================================================
   MASTER EMPLOYEE
   ============================================================ */

interface CoreEmployee {
  id: number;

  employee_number?: string | null;

  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;

  email?: string | null;
  phone?: string | null;

  role?: string | null;
  job_title?: string | null;

  department_id?: number | null;
  department_name?: string | null;

  status?: string | null;

  profile_image?: string | null;

  hire_date?: string | null;
  end_date?: string | null;

  created_at?: string | null;
  updated_at?: string | null;

  taklekkasjevakten_employee_id?: string | number | null;
}

/* ============================================================
   EXTENDED PROFILE
   ============================================================ */

interface EmployeeProfileDetails {
  id?: number;
  employee_id?: number;

  birth_date?: string | null;

  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country_code?: string | null;

  work_phone?: string | null;
  mobile_phone?: string | null;
  home_phone?: string | null;

  language_code?: string | null;

  profile_image?: string | null;

  employee_number?: string | null;
  job_title?: string | null;
  employment_category?: string | null;

  comments?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
}

/* ============================================================
   EMPLOYMENT
   ============================================================ */

interface EmploymentTerm {
  id: number;
  employee_id: number;

  start_date?: string | null;
  end_date?: string | null;

  employment_type?: string | null;
  employment_form?: string | null;
  salary_type?: string | null;

  position_percent?: string | number | null;

  annual_salary?: string | number | null;
  hourly_rate?: string | number | null;

  hours_per_week?: string | number | null;
  hours_per_day?: string | number | null;

  work_schedule?: string | null;
  shift_type?: string | null;

  occupation_code?: string | null;

  main_employer?: number | boolean | null;

  department_id?: number | null;
  department_name?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
}

/* ============================================================
   EMERGENCY CONTACTS
   ============================================================ */

interface EmergencyContact {
  id: number;
  employee_id?: number;

  name?: string | null;
  relationship?: string | null;

  phone?: string | null;
  email?: string | null;

  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country_code?: string | null;

  is_primary?: number | boolean | null;

  created_at?: string | null;
  updated_at?: string | null;
}

/* ============================================================
   PAYROLL
   ============================================================ */

interface PayrollSettings {
  id?: number;
  employee_id?: number;

  currency_code?: string | null;

  swift_bic?: string | null;
  payslip_email?: string | null;

  holiday_pay_percent?: string | number | null;
  tax_deduction_percent?: string | number | null;

  has_bank_account?: number | boolean | null;
  has_iban?: number | boolean | null;

  created_at?: string | null;
  updated_at?: string | null;
}

interface PayrollAdjustment {
  id: number;
  employee_id?: number;

  adjustment_type?: string | null;
  code?: string | null;
  description?: string | null;

  start_date?: string | null;
  end_date?: string | null;

  monthly_amount?: string | number | null;
  percentage?: string | number | null;
  maximum_amount?: string | number | null;

  total_amount?: string | number | null;
  remaining_amount?: string | number | null;

  active?: number | boolean | null;

  created_at?: string | null;
  updated_at?: string | null;
}

/* ============================================================
   COMPANY CAR
   ============================================================ */

interface CompanyCar {
  id: number;
  employee_id?: number;

  description?: string | null;
  registration_number?: string | null;

  list_price?: string | number | null;
  model_year?: number | null;

  start_date?: string | null;
  end_date?: string | null;

  electric_vehicle?: number | boolean | null;
  commercial_vehicle?: number | boolean | null;
  over_40000_km_year?: number | boolean | null;

  active?: number | boolean | null;

  created_at?: string | null;
  updated_at?: string | null;
}

/* ============================================================
   LEAVE / VACATION
   ============================================================ */

interface LeaveBalance {
  id: number;
  employee_id?: number;

  balance_type?: string | null;
  effective_date?: string | null;

  days?: string | number | null;
  hours?: string | number | null;

  note?: string | null;

  created_at?: string | null;
}

interface EmployeeLeave {
  id: number;
  employee_id?: number;

  leave_type?: string | null;

  start_date?: string | null;
  end_date?: string | null;

  percentage?: string | number | null;

  paid?: number | boolean | null;

  note?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
}

interface VacationEntitlement {
  id: number;
  employee_id?: number;

  year?: number | null;

  vacation_days?: string | number | null;
  senior_days?: string | number | null;

  holiday_pay_rate?: string | number | null;
  senior_holiday_pay_rate?: string | number | null;

  created_at?: string | null;
  updated_at?: string | null;
}

/* ============================================================
   WORK SCHEDULE
   ============================================================ */

interface WorkSchedule {
  id: number;
  employee_id?: number;

  valid_from?: string | null;
  valid_to?: string | null;

  hours_per_day?: string | number | null;
  hours_per_week?: string | number | null;

  monday_hours?: string | number | null;
  tuesday_hours?: string | number | null;
  wednesday_hours?: string | number | null;
  thursday_hours?: string | number | null;
  friday_hours?: string | number | null;
  saturday_hours?: string | number | null;
  sunday_hours?: string | number | null;

  created_at?: string | null;
  updated_at?: string | null;
}

/* ============================================================
   NOTIFICATIONS
   ============================================================ */

interface NotificationPreference {
  id: number;
  employee_id?: number;

  notification_key?: string | null;

  email_enabled?: number | boolean | null;
  sms_enabled?: number | boolean | null;
  in_app_enabled?: number | boolean | null;

  created_at?: string | null;
  updated_at?: string | null;
}

/* ============================================================
   PROJECTS
   BEHOLDER FELTENE FRA TIDLIGERE VERSJON
   ============================================================ */

interface EmployeeProject {
  project_member_id: number;
  project_id: number;

  project_role?: string | null;
  member_active?: number | boolean | null;

  project_number?: string | null;

  title?: string | null;
  project_type?: string | null;
  status?: string | null;

  start_date?: string | null;
  end_date?: string | null;
  deadline?: string | null;

  customer_name?: string | null;

  property_name?: string | null;
  property_address?: string | null;
  property_postal_code?: string | null;
  property_city?: string | null;

  taklekkasjevakten_inquiry_id?: string | number | null;
}

/* ============================================================
   TIME ENTRIES
   BEHOLDER TIDLIGERE FELTER + NYE FELTER
   ============================================================ */

interface TimeEntry {
  id: number;
  project_id: number;

  task_id?: number | null;

  work_date?: string | null;

  start_time?: string | null;
  end_time?: string | null;

  hours?: number | string | null;

  description?: string | null;

  approved?: number | boolean | null;
  billable?: number | boolean | null;

  hourly_rate?: string | number | null;

  project_number?: string | null;
  project_title?: string | null;
}

/* ============================================================
   API RESPONSE
   ============================================================ */

interface EmployeeProfileResponse {
  success: boolean;
  message?: string;

  employee?: CoreEmployee;

  profile?: EmployeeProfileDetails | null;

  employment_terms?: EmploymentTerm[];

  emergency_contacts?: EmergencyContact[];

  payroll_settings?: PayrollSettings | null;
  payroll_adjustments?: PayrollAdjustment[];

  company_cars?: CompanyCar[];

  leave_balances?: LeaveBalance[];
  leaves?: EmployeeLeave[];

  work_schedules?: WorkSchedule[];

  vacation_entitlements?: VacationEntitlement[];

  notification_preferences?: NotificationPreference[];

  projects?: EmployeeProject[];

  time_entries?: TimeEntry[];

  stats?: {
    projects?: number;

    active_projects?: number;
    planned_projects?: number;
    completed_projects?: number;

    time_entries?: number;

    total_hours?: number;
    approved_hours?: number;
    billable_hours?: number;

    emergency_contacts?: number;
    active_company_cars?: number;
    active_leaves?: number;
  };
}

/* ============================================================
   TABS
   ============================================================ */

type ProfileTab =
  | "overview"
  | "personal"
  | "employment"
  | "leave"
  | "payroll"
  | "car"
  | "notifications"
  | "projects";

/* ============================================================
   LABEL HELPERS
   ============================================================ */

const roleLabel = (role?: string | null) => {
  switch (String(role || "").toLowerCase()) {
    case "admin":
      return "Administrator";

    case "project_manager":
      return "Prosjektleder";

    case "technician":
      return "Tekniker";

    case "roofer":
      return "Taktekker";

    case "sheet_metal_worker":
      return "Blikkenslager";

    case "apprentice":
      return "Lærling";

    default:
      return role || "Ansatt";
  }
};

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

const projectRoleLabel = (role?: string | null) => {
  switch (String(role || "").toLowerCase()) {
    case "project_manager":
      return "Prosjektleder";

    case "technician":
      return "Tekniker";

    case "roofer":
      return "Taktekker";

    case "sheet_metal_worker":
      return "Blikkenslager";

    case "apprentice":
      return "Lærling";

    default:
      return role || "Ansatt";
  }
};

const balanceLabel = (type?: string | null) => {
  switch (type) {
    case "vacation":
      return "Ferie";

    case "flex":
      return "Fleksitid";

    case "time_bank":
      return "Timebank";

    default:
      return type || "Saldo";
  }
};

const adjustmentLabel = (type?: string | null) => {
  switch (type) {
    case "allowance":
      return "Tillegg";

    case "deduction":
      return "Trekk";

    case "expense_deduction":
      return "Utleggstrekk";

    case "benefit":
      return "Naturalytelse";

    default:
      return type || "Justering";
  }
};

/* ============================================================
   FORMAT HELPERS
   ============================================================ */

const formatDate = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  const date = new Date(
    `${String(value).slice(0, 10)}T12:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatNumber = (
  value?: string | number | null,
  decimals = 2
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return new Intl.NumberFormat("nb-NO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

const formatMoney = (
  value?: string | number | null,
  currency = "NOK"
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(number);
};

const yesNo = (
  value?: number | boolean | null
) => {
  return Number(value) === 1 || value === true
    ? "Ja"
    : "Nei";
};

const isEnabled = (
  value?: number | boolean | null
) => {
  return Number(value) === 1 || value === true;
};

/* ============================================================
   SMALL COMPONENTS
   ============================================================ */

function SectionCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1019]">
      <div className="flex items-start gap-3 border-b border-slate-800 px-5 py-4">
        {icon && (
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-300">
            {icon}
          </div>
        )}

        <div>
          <h2 className="text-sm font-black text-white">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
}

function InfoField({
  label,
  value,
}: {
  label: string;
  value?: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-800 bg-[#080d15] px-4 py-3">
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-600">
        {label}
      </p>

      <div className="mt-1.5 break-words text-sm font-bold text-slate-200">
        {value === null ||
        value === undefined ||
        value === ""
          ? "—"
          : value}
      </div>
    </div>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 px-5 py-8 text-center">
      <p className="text-xs font-bold text-slate-500">
        {text}
      </p>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */

export default function EmployeeProfilePage({
  employeeId,
  sourceEmployeeId,
  onBack,
}: EmployeeProfilePageProps) {
  const [data, setData] =
    useState<EmployeeProfileResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [activeTab, setActiveTab] =
    useState<ProfileTab>("overview");

  /* ========================================================
     LOAD PROFILE

     VIKTIG:
     Beholder tidligere støtte for både:
     - employeeId
     - sourceEmployeeId
     ======================================================== */

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        if (
          employeeId == null &&
          sourceEmployeeId == null
        ) {
          throw new Error(
            "Mangler employeeId eller sourceEmployeeId."
          );
        }

        const profileQuery =
          employeeId != null
            ? `id=${encodeURIComponent(
                String(employeeId)
              )}`
            : `source_id=${encodeURIComponent(
                String(sourceEmployeeId)
              )}`;

        const res = await fetch(
          apiUrl(
            `/core/employee_profile.php?${profileQuery}`
          )
        );

        const result: EmployeeProfileResponse =
          await res.json();

        if (
          !res.ok ||
          !result.success ||
          !result.employee
        ) {
          throw new Error(
            result.message ||
              "Kunne ikke hente ansattprofilen."
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
              : "Kunne ikke hente ansattprofilen."
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
  }, [
    employeeId,
    sourceEmployeeId,
  ]);

  /* ========================================================
     DERIVED DATA
     ======================================================== */

  const employee =
    data?.employee;

  const profile =
    data?.profile;

  const employeeName = useMemo(() => {
    if (!employee) {
      return "Ansatt";
    }

    return (
      employee.display_name ||
      [
        employee.first_name,
        employee.last_name,
      ]
        .filter(Boolean)
        .join(" ") ||
      "Ansatt"
    );
  }, [employee]);

  /*
   * Beholder samme employee-number fallback
   * som tidligere kode.
   */
  const employeeNumber = useMemo(() => {
    if (!employee) {
      return "";
    }

    return (
      employee.employee_number ||
      profile?.employee_number ||
      (
        employee.taklekkasjevakten_employee_id
          ? `TLV-E${employee.taklekkasjevakten_employee_id}`
          : String(employee.id)
      )
    );
  }, [
    employee,
    profile,
  ]);

  const currentEmployment =
    data?.employment_terms?.find(
      (item) => !item.end_date
    ) ||
    data?.employment_terms?.[0];

  const currentSchedule =
    data?.work_schedules?.find(
      (item) => !item.valid_to
    ) ||
    data?.work_schedules?.[0];

  const activeCar =
    data?.company_cars?.find(
      (car) => isEnabled(car.active)
    ) ||
    data?.company_cars?.[0];

  const totalActiveAndPlanned =
    Number(
      data?.stats?.active_projects || 0
    ) +
    Number(
      data?.stats?.planned_projects || 0
    );

  /* ========================================================
     LOADING
     ======================================================== */

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070a11] text-white">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-[#F5B800]" />

          Henter ansattprofil...
        </div>
      </div>
    );
  }

  /* ========================================================
     ERROR
     ======================================================== */

  if (
    error ||
    !employee
  ) {
    return (
      <div className="min-h-screen bg-[#070a11] p-6 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-5">
          <p className="text-sm font-black text-red-300">
            Kunne ikke åpne ansattprofil
          </p>

          <p className="mt-2 text-xs text-slate-400">
            {error ||
              "Ansattdata mangler."}
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

  /* ========================================================
     TABS
     ======================================================== */

  const tabs: {
    key: ProfileTab;
    label: string;
    icon: ReactNode;
  }[] = [
    {
      key: "overview",
      label: "Oversikt",
      icon: (
        <UserRound className="h-4 w-4" />
      ),
    },
    {
      key: "personal",
      label: "Personalia",
      icon: (
        <Users className="h-4 w-4" />
      ),
    },
    {
      key: "employment",
      label: "Arbeidsforhold",
      icon: (
        <BriefcaseBusiness className="h-4 w-4" />
      ),
    },
    {
      key: "leave",
      label: "Fravær & ferie",
      icon: (
        <CalendarDays className="h-4 w-4" />
      ),
    },
    {
      key: "payroll",
      label: "Lønn",
      icon: (
        <Banknote className="h-4 w-4" />
      ),
    },
    {
      key: "car",
      label: "Firmabil",
      icon: (
        <Car className="h-4 w-4" />
      ),
    },
    {
      key: "notifications",
      label: "Varslinger",
      icon: (
        <Bell className="h-4 w-4" />
      ),
    },
    {
      key: "projects",
      label: "Prosjekter & timer",
      icon: (
        <Building2 className="h-4 w-4" />
      ),
    },
  ];

  /* ========================================================
     PAGE
     ======================================================== */

  return (
    <div className="min-h-screen bg-[#070a11] text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        {/* ==================================================
            BACK
            ================================================== */}

        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0b1019] px-3 py-2 text-xs font-black text-slate-400 transition hover:border-slate-700 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />

          Tilbake til ansatte
        </button>

        {/* ==================================================
            HEADER
            ================================================== */}

        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0b1019]">
          <div className="relative p-5 md:p-7">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/10 text-xl font-black text-amber-300">
                  {profile?.profile_image ||
                  employee.profile_image ? (
                    <img
                      src={
                        profile?.profile_image ||
                        employee.profile_image ||
                        ""
                      }
                      alt={employeeName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    employeeName
                      .split(/\s+/)
                      .slice(0, 2)
                      .map(
                        (part) =>
                          part.charAt(0)
                      )
                      .join("")
                      .toUpperCase()
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-xl font-black text-white md:text-2xl">
                      {employeeName}
                    </h1>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${
                        String(
                          employee.status || ""
                        ).toLowerCase() ===
                        "active"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                          : "border-red-500/20 bg-red-500/10 text-red-300"
                      }`}
                    >
                      {statusLabel(
                        employee.status
                      )}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="font-bold text-slate-300">
                      {employee.job_title ||
                        profile?.job_title ||
                        roleLabel(
                          employee.role
                        )}
                    </span>

                    {employeeNumber && (
                      <span>
                        {employeeNumber}
                      </span>
                    )}

                    {employee.department_name && (
                      <span>
                        {employee.department_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {employee.phone && (
                  <a
                    href={`tel:${employee.phone}`}
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs font-black text-slate-200 transition hover:border-amber-500/30 hover:text-white"
                  >
                    <Phone className="h-4 w-4" />
                    Ring
                  </a>
                )}

                {employee.email && (
                  <a
                    href={`mailto:${employee.email}`}
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs font-black text-slate-200 transition hover:border-amber-500/30 hover:text-white"
                  >
                    <Mail className="h-4 w-4" />
                    E-post
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* ==================================================
              TAB NAVIGATION
              ================================================== */}

          <div className="overflow-x-auto border-t border-slate-800">
            <div className="flex min-w-max px-3">
              {tabs.map((tab) => {
                const selected =
                  activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() =>
                      setActiveTab(
                        tab.key
                      )
                    }
                    className={`relative flex items-center gap-2 px-4 py-3.5 text-[11px] font-black transition ${
                      selected
                        ? "text-amber-300"
                        : "text-slate-500 hover:text-slate-200"
                    }`}
                  >
                    {tab.icon}

                    {tab.label}

                    {selected && (
                      <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#F5B800]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================================================
            CONTENT
            ================================================== */}

        <div className="mt-5">
          {/* ==================================================
              OVERVIEW
              ================================================== */}

          {activeTab ===
            "overview" && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <InfoField
                  label="Prosjekter"
                  value={
                    Number(
                      data?.stats
                        ?.projects || 0
                    )
                  }
                />

                <InfoField
                  label="Aktive / planlagte"
                  value={
                    totalActiveAndPlanned
                  }
                />

                <InfoField
                  label="Registrerte timer"
                  value={`${formatNumber(
                    data?.stats
                      ?.total_hours || 0,
                    1
                  )} t`}
                />

                <InfoField
                  label="Fakturerbare timer"
                  value={`${formatNumber(
                    data?.stats
                      ?.billable_hours || 0,
                    1
                  )} t`}
                />
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                <SectionCard
                  title="Kontaktinformasjon"
                  description="Kontaktopplysninger for den ansatte."
                  icon={
                    <UserRound className="h-4 w-4" />
                  }
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoField
                      label="E-post"
                      value={
                        employee.email
                      }
                    />

                    <InfoField
                      label="Telefon"
                      value={
                        employee.phone
                      }
                    />

                    <InfoField
                      label="Jobbtelefon"
                      value={
                        profile?.work_phone
                      }
                    />

                    <InfoField
                      label="Mobiltelefon"
                      value={
                        profile?.mobile_phone ||
                        employee.phone
                      }
                    />
                  </div>
                </SectionCard>

                <SectionCard
                  title="Arbeidsforhold"
                  description="Gjeldende stilling og arbeidsbetingelser."
                  icon={
                    <BriefcaseBusiness className="h-4 w-4" />
                  }
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoField
                      label="Stilling"
                      value={
                        employee.job_title ||
                        profile?.job_title ||
                        roleLabel(
                          employee.role
                        )
                      }
                    />

                    <InfoField
                      label="Avdeling"
                      value={
                        currentEmployment
                          ?.department_name ||
                        employee.department_name
                      }
                    />

                    <InfoField
                      label="Stillingsprosent"
                      value={
                        currentEmployment
                          ?.position_percent !=
                        null
                          ? `${formatNumber(
                              currentEmployment.position_percent,
                              0
                            )} %`
                          : undefined
                      }
                    />

                    <InfoField
                      label="Timer per uke"
                      value={
                        currentEmployment
                          ?.hours_per_week !=
                        null
                          ? `${formatNumber(
                              currentEmployment.hours_per_week,
                              1
                            )} t`
                          : undefined
                      }
                    />
                  </div>
                </SectionCard>
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                <SectionCard
                  title="Ferie og fravær"
                  description="Siste registrerte ferie-, fleks- og timebanksaldo."
                  icon={
                    <CalendarDays className="h-4 w-4" />
                  }
                >
                  {data
                    ?.leave_balances
                    ?.length ? (
                    <div className="space-y-2">
                      {data.leave_balances
                        .slice(0, 4)
                        .map(
                          (
                            balance
                          ) => (
                            <div
                              key={
                                balance.id
                              }
                              className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#080d15] px-4 py-3"
                            >
                              <div>
                                <p className="text-xs font-black text-slate-200">
                                  {balanceLabel(
                                    balance.balance_type
                                  )}
                                </p>

                                <p className="mt-1 text-[10px] text-slate-500">
                                  {formatDate(
                                    balance.effective_date
                                  )}
                                </p>
                              </div>

                              <div className="text-right">
                                {balance.days !=
                                  null && (
                                  <p className="text-sm font-black text-white">
                                    {formatNumber(
                                      balance.days,
                                      1
                                    )}{" "}
                                    dager
                                  </p>
                                )}

                                {balance.hours !=
                                  null && (
                                  <p className="text-[10px] text-slate-400">
                                    {formatNumber(
                                      balance.hours,
                                      1
                                    )}{" "}
                                    timer
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        )}
                    </div>
                  ) : (
                    <EmptyState text="Ingen ferie- eller fleksisaldo registrert." />
                  )}
                </SectionCard>

                <SectionCard
                  title="Firmabil"
                  description="Aktivt kjøretøy knyttet til den ansatte."
                  icon={
                    <Car className="h-4 w-4" />
                  }
                >
                  {activeCar ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoField
                        label="Bil"
                        value={
                          activeCar.description ||
                          "Firmabil"
                        }
                      />

                      <InfoField
                        label="Registreringsnummer"
                        value={
                          activeCar.registration_number
                        }
                      />

                      <InfoField
                        label="Modellår"
                        value={
                          activeCar.model_year
                        }
                      />

                      <InfoField
                        label="Aktiv"
                        value={yesNo(
                          activeCar.active
                        )}
                      />
                    </div>
                  ) : (
                    <EmptyState text="Ingen firmabil registrert." />
                  )}
                </SectionCard>
              </div>
            </div>
          )}

          {/* ==================================================
              PERSONALIA
              ================================================== */}

          {activeTab ===
            "personal" && (
            <div className="grid gap-5 xl:grid-cols-2">
              <SectionCard
                title="Personalia"
                description="Personlige opplysninger og kontaktinformasjon."
                icon={
                  <UserRound className="h-4 w-4" />
                }
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoField
                    label="Fornavn"
                    value={
                      employee.first_name
                    }
                  />

                  <InfoField
                    label="Etternavn"
                    value={
                      employee.last_name
                    }
                  />

                  <InfoField
                    label="Fødselsdato"
                    value={
                      profile?.birth_date
                        ? formatDate(
                            profile.birth_date
                          )
                        : undefined
                    }
                  />

                  <InfoField
                    label="Språk"
                    value={
                      profile?.language_code
                    }
                  />

                  <InfoField
                    label="E-post"
                    value={
                      employee.email
                    }
                  />

                  <InfoField
                    label="Mobiltelefon"
                    value={
                      profile?.mobile_phone ||
                      employee.phone
                    }
                  />

                  <InfoField
                    label="Jobbtelefon"
                    value={
                      profile?.work_phone
                    }
                  />

                  <InfoField
                    label="Hjemmetelefon"
                    value={
                      profile?.home_phone
                    }
                  />

                  <InfoField
                    label="Ansattnummer"
                    value={
                      employeeNumber
                    }
                  />

                  <InfoField
                    label="Kategori"
                    value={
                      profile?.employment_category
                    }
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="Adresse"
                description="Registrert bostedsadresse."
                icon={
                  <MapPin className="h-4 w-4" />
                }
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoField
                    label="Adresse"
                    value={
                      profile?.address
                    }
                  />

                  <InfoField
                    label="Postnummer"
                    value={
                      profile?.postal_code
                    }
                  />

                  <InfoField
                    label="Poststed"
                    value={
                      profile?.city
                    }
                  />

                  <InfoField
                    label="Land"
                    value={
                      profile?.country_code ||
                      "NO"
                    }
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="Pårørende / nødkontakter"
                description="Personer som kan kontaktes ved behov."
                icon={
                  <HeartHandshake className="h-4 w-4" />
                }
              >
                {data
                  ?.emergency_contacts
                  ?.length ? (
                  <div className="space-y-3">
                    {data.emergency_contacts.map(
                      (
                        contact
                      ) => (
                        <div
                          key={
                            contact.id
                          }
                          className="rounded-xl border border-slate-800 bg-[#080d15] p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-black text-white">
                                {contact.name ||
                                  "Kontakt"}
                              </p>

                              <p className="mt-1 text-[10px] text-slate-500">
                                {contact.relationship ||
                                  "Relasjon ikke oppgitt"}
                              </p>
                            </div>

                            {isEnabled(
                              contact.is_primary
                            ) && (
                              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9px] font-black text-emerald-300">
                                Primær
                              </span>
                            )}
                          </div>

                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <InfoField
                              label="Telefon"
                              value={
                                contact.phone
                              }
                            />

                            <InfoField
                              label="E-post"
                              value={
                                contact.email
                              }
                            />

                            <InfoField
                              label="Adresse"
                              value={
                                contact.address
                              }
                            />

                            <InfoField
                              label="Poststed"
                              value={[
                                contact.postal_code,
                                contact.city,
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(
                                  " "
                                )}
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <EmptyState text="Ingen pårørende eller nødkontakter registrert." />
                )}
              </SectionCard>

              <SectionCard
                title="Interne merknader"
                description="Informasjon knyttet til ansattprofilen."
                icon={
                  <FileText className="h-4 w-4" />
                }
              >
                {profile?.comments ? (
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
                    {
                      profile.comments
                    }
                  </p>
                ) : (
                  <EmptyState text="Ingen merknader registrert." />
                )}
              </SectionCard>
            </div>
          )}

          {/* ==================================================
              EMPLOYMENT
              ================================================== */}

          {activeTab ===
            "employment" && (
            <div className="space-y-5">
              <SectionCard
                title="Arbeidsforhold"
                description="Nåværende og historiske arbeidsforhold."
                icon={
                  <BriefcaseBusiness className="h-4 w-4" />
                }
              >
                {data
                  ?.employment_terms
                  ?.length ? (
                  <div className="space-y-3">
                    {data.employment_terms.map(
                      (
                        term
                      ) => (
                        <div
                          key={
                            term.id
                          }
                          className="rounded-2xl border border-slate-800 bg-[#080d15] p-4"
                        >
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-white">
                                {term.employment_type ||
                                  employee.job_title ||
                                  profile?.job_title ||
                                  roleLabel(
                                    employee.role
                                  )}
                              </p>

                              <p className="mt-1 text-[10px] text-slate-500">
                                {formatDate(
                                  term.start_date
                                )}{" "}
                                –{" "}
                                {term.end_date
                                  ? formatDate(
                                      term.end_date
                                    )
                                  : "Pågående"}
                              </p>
                            </div>

                            {!term.end_date && (
                              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black uppercase text-emerald-300">
                                Gjeldende
                              </span>
                            )}
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <InfoField
                              label="Ansettelsesform"
                              value={
                                term.employment_form
                              }
                            />

                            <InfoField
                              label="Stillingsprosent"
                              value={
                                term.position_percent !=
                                null
                                  ? `${formatNumber(
                                      term.position_percent,
                                      0
                                    )} %`
                                  : undefined
                              }
                            />

                            <InfoField
                              label="Timer / uke"
                              value={
                                term.hours_per_week !=
                                null
                                  ? `${formatNumber(
                                      term.hours_per_week,
                                      1
                                    )} t`
                                  : undefined
                              }
                            />

                            <InfoField
                              label="Timer / dag"
                              value={
                                term.hours_per_day !=
                                null
                                  ? `${formatNumber(
                                      term.hours_per_day,
                                      1
                                    )} t`
                                  : undefined
                              }
                            />

                            <InfoField
                              label="Avdeling"
                              value={
                                term.department_name ||
                                employee.department_name
                              }
                            />

                            <InfoField
                              label="Lønnstype"
                              value={
                                term.salary_type
                              }
                            />

                            <InfoField
                              label="Arbeidstidsordning"
                              value={
                                term.work_schedule
                              }
                            />

                            <InfoField
                              label="Skift"
                              value={
                                term.shift_type
                              }
                            />

                            <InfoField
                              label="Yrkes-/stillingskode"
                              value={
                                term.occupation_code
                              }
                            />

                            <InfoField
                              label="Hovedarbeidsgiver"
                              value={yesNo(
                                term.main_employer
                              )}
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <EmptyState text="Ingen arbeidsforhold registrert." />
                )}
              </SectionCard>

              <SectionCard
                title="Normal arbeidstid"
                description="Ukentlig arbeidstidsplan."
                icon={
                  <Clock3 className="h-4 w-4" />
                }
              >
                {currentSchedule ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <InfoField
                        label="Gyldig fra"
                        value={
                          currentSchedule.valid_from
                            ? formatDate(
                                currentSchedule.valid_from
                              )
                            : undefined
                        }
                      />

                      <InfoField
                        label="Gyldig til"
                        value={
                          currentSchedule.valid_to
                            ? formatDate(
                                currentSchedule.valid_to
                              )
                            : "Pågående"
                        }
                      />

                      <InfoField
                        label="Timer per dag"
                        value={
                          currentSchedule.hours_per_day !=
                          null
                            ? `${formatNumber(
                                currentSchedule.hours_per_day,
                                1
                              )} t`
                            : undefined
                        }
                      />

                      <InfoField
                        label="Timer per uke"
                        value={
                          currentSchedule.hours_per_week !=
                          null
                            ? `${formatNumber(
                                currentSchedule.hours_per_week,
                                1
                              )} t`
                            : undefined
                        }
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                      {[
                        {
                          label:
                            "Man",
                          value:
                            currentSchedule.monday_hours,
                        },
                        {
                          label:
                            "Tir",
                          value:
                            currentSchedule.tuesday_hours,
                        },
                        {
                          label:
                            "Ons",
                          value:
                            currentSchedule.wednesday_hours,
                        },
                        {
                          label:
                            "Tor",
                          value:
                            currentSchedule.thursday_hours,
                        },
                        {
                          label:
                            "Fre",
                          value:
                            currentSchedule.friday_hours,
                        },
                        {
                          label:
                            "Lør",
                          value:
                            currentSchedule.saturday_hours,
                        },
                        {
                          label:
                            "Søn",
                          value:
                            currentSchedule.sunday_hours,
                        },
                      ].map(
                        (
                          day
                        ) => (
                          <div
                            key={
                              day.label
                            }
                            className="rounded-xl border border-slate-800 bg-[#080d15] px-3 py-3 text-center"
                          >
                            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-600">
                              {
                                day.label
                              }
                            </p>

                            <p className="mt-1 text-sm font-black text-white">
                              {day.value !=
                              null
                                ? `${formatNumber(
                                    day.value,
                                    1
                                  )} t`
                                : "—"}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </>
                ) : (
                  <EmptyState text="Ingen arbeidstidsplan registrert." />
                )}
              </SectionCard>
            </div>
          )}

          {/* ==================================================
              LEAVE
              ================================================== */}

          {activeTab ===
            "leave" && (
            <div className="space-y-5">
              <div className="grid gap-5 xl:grid-cols-2">
                <SectionCard
                  title="Ferie og saldo"
                  description="Ferie, fleksitid og timebank."
                  icon={
                    <CalendarDays className="h-4 w-4" />
                  }
                >
                  {data
                    ?.leave_balances
                    ?.length ? (
                    <div className="space-y-2">
                      {data.leave_balances.map(
                        (
                          balance
                        ) => (
                          <div
                            key={
                              balance.id
                            }
                            className="rounded-xl border border-slate-800 bg-[#080d15] p-4"
                          >
                            <div className="flex justify-between gap-4">
                              <div>
                                <p className="text-sm font-black text-white">
                                  {balanceLabel(
                                    balance.balance_type
                                  )}
                                </p>

                                <p className="mt-1 text-[10px] text-slate-500">
                                  Per{" "}
                                  {formatDate(
                                    balance.effective_date
                                  )}
                                </p>
                              </div>

                              <div className="text-right">
                                {balance.days !=
                                  null && (
                                  <p className="font-black text-white">
                                    {formatNumber(
                                      balance.days,
                                      1
                                    )}{" "}
                                    dager
                                  </p>
                                )}

                                {balance.hours !=
                                  null && (
                                  <p className="text-xs text-slate-400">
                                    {formatNumber(
                                      balance.hours,
                                      1
                                    )}{" "}
                                    timer
                                  </p>
                                )}
                              </div>
                            </div>

                            {balance.note && (
                              <p className="mt-3 text-[11px] leading-5 text-slate-500">
                                {
                                  balance.note
                                }
                              </p>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <EmptyState text="Ingen saldo registrert." />
                  )}
                </SectionCard>

                <SectionCard
                  title="Ferierettigheter"
                  description="Årlig ferie og feriepengesats."
                  icon={
                    <BadgeCheck className="h-4 w-4" />
                  }
                >
                  {data
                    ?.vacation_entitlements
                    ?.length ? (
                    <div className="space-y-3">
                      {data.vacation_entitlements.map(
                        (
                          item
                        ) => (
                          <div
                            key={
                              item.id
                            }
                            className="grid gap-3 rounded-xl border border-slate-800 bg-[#080d15] p-4 sm:grid-cols-2"
                          >
                            <InfoField
                              label="År"
                              value={
                                item.year
                              }
                            />

                            <InfoField
                              label="Feriedager"
                              value={
                                item.vacation_days
                              }
                            />

                            <InfoField
                              label="Feriepengesats"
                              value={
                                item.holiday_pay_rate !=
                                null
                                  ? `${formatNumber(
                                      item.holiday_pay_rate,
                                      2
                                    )} %`
                                  : undefined
                              }
                            />

                            <InfoField
                              label="Ekstra seniordager"
                              value={
                                item.senior_days
                              }
                            />

                            <InfoField
                              label="Senior feriepengesats"
                              value={
                                item.senior_holiday_pay_rate !=
                                null
                                  ? `${formatNumber(
                                      item.senior_holiday_pay_rate,
                                      2
                                    )} %`
                                  : undefined
                              }
                            />
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <EmptyState text="Ingen ferierettigheter registrert." />
                  )}
                </SectionCard>
              </div>

              <SectionCard
                title="Permisjon og fravær"
                description="Registrerte fraværs- og permisjonsperioder."
                icon={
                  <CalendarDays className="h-4 w-4" />
                }
              >
                {data
                  ?.leaves
                  ?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left">
                      <thead>
                        <tr className="border-b border-slate-800 text-[9px] font-black uppercase tracking-[0.14em] text-slate-600">
                          <th className="pb-3 pr-4">
                            Type
                          </th>

                          <th className="pb-3 pr-4">
                            Fra
                          </th>

                          <th className="pb-3 pr-4">
                            Til
                          </th>

                          <th className="pb-3 pr-4">
                            Omfang
                          </th>

                          <th className="pb-3 pr-4">
                            Betalt
                          </th>

                          <th className="pb-3">
                            Merknad
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {data.leaves.map(
                          (
                            leave
                          ) => (
                            <tr
                              key={
                                leave.id
                              }
                              className="border-b border-slate-800/70 text-xs text-slate-300"
                            >
                              <td className="py-3 pr-4 font-bold text-white">
                                {leave.leave_type ||
                                  "Fravær"}
                              </td>

                              <td className="py-3 pr-4">
                                {formatDate(
                                  leave.start_date
                                )}
                              </td>

                              <td className="py-3 pr-4">
                                {leave.end_date
                                  ? formatDate(
                                      leave.end_date
                                    )
                                  : "Pågående"}
                              </td>

                              <td className="py-3 pr-4">
                                {leave.percentage !=
                                null
                                  ? `${formatNumber(
                                      leave.percentage,
                                      0
                                    )} %`
                                  : "—"}
                              </td>

                              <td className="py-3 pr-4">
                                {yesNo(
                                  leave.paid
                                )}
                              </td>

                              <td className="py-3 text-slate-500">
                                {leave.note ||
                                  "—"}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState text="Ingen permisjoner eller fravær registrert." />
                )}
              </SectionCard>
            </div>
          )}

          {/* ==================================================
              PAYROLL
              ================================================== */}

          {activeTab ===
            "payroll" && (
            <div className="space-y-5">
              <div className="grid gap-5 xl:grid-cols-2">
                <SectionCard
                  title="Lønnsinnstillinger"
                  description="Lønnsrelaterte innstillinger. Sensitive kontodata vises ikke."
                  icon={
                    <WalletCards className="h-4 w-4" />
                  }
                >
                  {data
                    ?.payroll_settings ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoField
                        label="Valuta"
                        value={
                          data
                            .payroll_settings
                            .currency_code ||
                          "NOK"
                        }
                      />

                      <InfoField
                        label="Lønnsslipp e-post"
                        value={
                          data
                            .payroll_settings
                            .payslip_email
                        }
                      />

                      <InfoField
                        label="Feriepenger"
                        value={
                          data
                            .payroll_settings
                            .holiday_pay_percent !=
                          null
                            ? `${formatNumber(
                                data
                                  .payroll_settings
                                  .holiday_pay_percent,
                                2
                              )} %`
                            : undefined
                        }
                      />

                      <InfoField
                        label="Skattetrekk"
                        value={
                          data
                            .payroll_settings
                            .tax_deduction_percent !=
                          null
                            ? `${formatNumber(
                                data
                                  .payroll_settings
                                  .tax_deduction_percent,
                                2
                              )} %`
                            : undefined
                        }
                      />

                      <InfoField
                        label="Bankkonto registrert"
                        value={yesNo(
                          data
                            .payroll_settings
                            .has_bank_account
                        )}
                      />

                      <InfoField
                        label="IBAN registrert"
                        value={yesNo(
                          data
                            .payroll_settings
                            .has_iban
                        )}
                      />

                      <InfoField
                        label="SWIFT / BIC"
                        value={
                          data
                            .payroll_settings
                            .swift_bic
                        }
                      />
                    </div>
                  ) : (
                    <EmptyState text="Ingen lønnsinnstillinger registrert." />
                  )}
                </SectionCard>

                <SectionCard
                  title="Lønnsgrunnlag"
                  description="Lønn eller timesats fra gjeldende arbeidsforhold."
                  icon={
                    <Banknote className="h-4 w-4" />
                  }
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoField
                      label="Årslønn"
                      value={
                        currentEmployment
                          ?.annual_salary !=
                        null
                          ? formatMoney(
                              currentEmployment.annual_salary
                            )
                          : undefined
                      }
                    />

                    <InfoField
                      label="Timesats"
                      value={
                        currentEmployment
                          ?.hourly_rate !=
                        null
                          ? `${formatMoney(
                              currentEmployment.hourly_rate
                            )} / t`
                          : undefined
                      }
                    />

                    <InfoField
                      label="Lønnstype"
                      value={
                        currentEmployment
                          ?.salary_type
                      }
                    />

                    <InfoField
                      label="Stillingsprosent"
                      value={
                        currentEmployment
                          ?.position_percent !=
                        null
                          ? `${formatNumber(
                              currentEmployment.position_percent,
                              0
                            )} %`
                          : undefined
                      }
                    />
                  </div>
                </SectionCard>
              </div>

              <SectionCard
                title="Faste tillegg og trekk"
                description="Naturalytelser, tillegg og faste trekk."
                icon={
                  <Banknote className="h-4 w-4" />
                }
              >
                {data
                  ?.payroll_adjustments
                  ?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[950px] text-left">
                      <thead>
                        <tr className="border-b border-slate-800 text-[9px] font-black uppercase tracking-[0.14em] text-slate-600">
                          <th className="pb-3 pr-4">
                            Type
                          </th>

                          <th className="pb-3 pr-4">
                            Beskrivelse
                          </th>

                          <th className="pb-3 pr-4">
                            Fra
                          </th>

                          <th className="pb-3 pr-4">
                            Til
                          </th>

                          <th className="pb-3 pr-4">
                            Beløp
                          </th>

                          <th className="pb-3 pr-4">
                            Prosent
                          </th>

                          <th className="pb-3 pr-4">
                            Gjenstår
                          </th>

                          <th className="pb-3">
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {data.payroll_adjustments.map(
                          (
                            item
                          ) => (
                            <tr
                              key={
                                item.id
                              }
                              className="border-b border-slate-800/70 text-xs text-slate-300"
                            >
                              <td className="py-3 pr-4">
                                {adjustmentLabel(
                                  item.adjustment_type
                                )}
                              </td>

                              <td className="py-3 pr-4 font-bold text-white">
                                {item.description ||
                                  "—"}
                              </td>

                              <td className="py-3 pr-4">
                                {formatDate(
                                  item.start_date
                                )}
                              </td>

                              <td className="py-3 pr-4">
                                {item.end_date
                                  ? formatDate(
                                      item.end_date
                                    )
                                  : "—"}
                              </td>

                              <td className="py-3 pr-4">
                                {item.monthly_amount !=
                                null
                                  ? formatMoney(
                                      item.monthly_amount
                                    )
                                  : "—"}
                              </td>

                              <td className="py-3 pr-4">
                                {item.percentage !=
                                null
                                  ? `${formatNumber(
                                      item.percentage,
                                      2
                                    )} %`
                                  : "—"}
                              </td>

                              <td className="py-3 pr-4">
                                {item.remaining_amount !=
                                null
                                  ? formatMoney(
                                      item.remaining_amount
                                    )
                                  : "—"}
                              </td>

                              <td className="py-3">
                                {isEnabled(
                                  item.active
                                )
                                  ? "Aktiv"
                                  : "Inaktiv"}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState text="Ingen faste tillegg eller trekk registrert." />
                )}
              </SectionCard>
            </div>
          )}

          {/* ==================================================
              CAR
              ================================================== */}

          {activeTab ===
            "car" && (
            <SectionCard
              title="Firmabil"
              description="Firmabiler og kjøretøy knyttet til den ansatte."
              icon={
                <Car className="h-4 w-4" />
              }
            >
              {data
                ?.company_cars
                ?.length ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {data.company_cars.map(
                    (
                      car
                    ) => (
                      <article
                        key={
                          car.id
                        }
                        className="rounded-2xl border border-slate-800 bg-[#080d15] p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-black text-white">
                              {car.description ||
                                "Firmabil"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {car.registration_number ||
                                "Registreringsnummer mangler"}
                            </p>
                          </div>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${
                              isEnabled(
                                car.active
                              )
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                : "border-slate-700 bg-slate-900 text-slate-500"
                            }`}
                          >
                            {isEnabled(
                              car.active
                            )
                              ? "Aktiv"
                              : "Inaktiv"}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <InfoField
                            label="Modellår"
                            value={
                              car.model_year
                            }
                          />

                          <InfoField
                            label="Listepris"
                            value={
                              car.list_price !=
                              null
                                ? formatMoney(
                                    car.list_price
                                  )
                                : undefined
                            }
                          />

                          <InfoField
                            label="Fra dato"
                            value={
                              car.start_date
                                ? formatDate(
                                    car.start_date
                                  )
                                : undefined
                            }
                          />

                          <InfoField
                            label="Til dato"
                            value={
                              car.end_date
                                ? formatDate(
                                    car.end_date
                                  )
                                : undefined
                            }
                          />

                          <InfoField
                            label="Elbil"
                            value={yesNo(
                              car.electric_vehicle
                            )}
                          />

                          <InfoField
                            label="Varebil"
                            value={yesNo(
                              car.commercial_vehicle
                            )}
                          />

                          <InfoField
                            label="Over 40 000 km / år"
                            value={yesNo(
                              car.over_40000_km_year
                            )}
                          />
                        </div>
                      </article>
                    )
                  )}
                </div>
              ) : (
                <EmptyState text="Ingen firmabil registrert." />
              )}
            </SectionCard>
          )}

          {/* ==================================================
              NOTIFICATIONS
              ================================================== */}

          {activeTab ===
            "notifications" && (
            <SectionCard
              title="Varslingsinnstillinger"
              description="Hvilke kanaler den ansatte skal varsles gjennom."
              icon={
                <Bell className="h-4 w-4" />
              }
            >
              {data
                ?.notification_preferences
                ?.length ? (
                <div className="space-y-2">
                  {data.notification_preferences.map(
                    (
                      setting
                    ) => (
                      <div
                        key={
                          setting.id
                        }
                        className="grid items-center gap-3 rounded-xl border border-slate-800 bg-[#080d15] px-4 py-3 md:grid-cols-[1fr_auto_auto_auto]"
                      >
                        <div>
                          <p className="text-xs font-black text-white">
                            {setting.notification_key ||
                              "Varsling"}
                          </p>
                        </div>

                        <div
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-black ${
                            isEnabled(
                              setting.email_enabled
                            )
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                              : "border-slate-800 bg-slate-950 text-slate-600"
                          }`}
                        >
                          <Mail className="h-3.5 w-3.5" />

                          E-post
                        </div>

                        <div
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-black ${
                            isEnabled(
                              setting.sms_enabled
                            )
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                              : "border-slate-800 bg-slate-950 text-slate-600"
                          }`}
                        >
                          <Phone className="h-3.5 w-3.5" />

                          SMS
                        </div>

                        <div
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-black ${
                            isEnabled(
                              setting.in_app_enabled
                            )
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                              : "border-slate-800 bg-slate-950 text-slate-600"
                          }`}
                        >
                          <Bell className="h-3.5 w-3.5" />

                          I systemet
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <EmptyState text="Ingen varslingsinnstillinger registrert." />
              )}
            </SectionCard>
          )}

          {/* ==================================================
              PROJECTS & HOURS

              Dette erstatter ikke gammel prosjektlogikk.
              Samme data vises nå i egen fane.
              ================================================== */}

          {activeTab ===
            "projects" && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <InfoField
                  label="Prosjekter totalt"
                  value={
                    Number(
                      data?.stats
                        ?.projects || 0
                    )
                  }
                />

                <InfoField
                  label="Aktive / planlagte"
                  value={
                    totalActiveAndPlanned
                  }
                />

                <InfoField
                  label="Registrerte timer"
                  value={`${formatNumber(
                    data?.stats
                      ?.total_hours || 0,
                    1
                  )} t`}
                />

                <InfoField
                  label="Fakturerbare timer"
                  value={`${formatNumber(
                    data?.stats
                      ?.billable_hours || 0,
                    1
                  )} t`}
                />
              </div>

              {/* ==============================================
                  PROJECT HISTORY
                  Tilsvarer gammel history-delen.
                  ============================================== */}

              <SectionCard
                title="Prosjekter"
                description="Prosjekter og oppdrag den ansatte er eller har vært tilknyttet."
                icon={
                  <Building2 className="h-4 w-4" />
                }
              >
                {data
                  ?.projects
                  ?.length ? (
                  <div className="space-y-3">
                    {data.projects.map(
                      (
                        project
                      ) => (
                        <article
                          key={
                            project.project_member_id
                          }
                          className="rounded-xl border border-slate-800 bg-[#080d15] p-4"
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-400">
                                  {project.project_number ||
                                    `Prosjekt #${project.project_id}`}
                                </span>

                                <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[9px] font-black text-slate-400">
                                  {projectStatusLabel(
                                    project.status
                                  )}
                                </span>
                              </div>

                              <h3 className="mt-2 text-sm font-black text-white">
                                {project.title ||
                                  `Prosjekt #${project.project_id}`}
                              </h3>

                              <p className="mt-1 text-[11px] text-slate-500">
                                {[
                                  project.customer_name,
                                  project.property_address,
                                  project.property_postal_code,
                                  project.property_city,
                                ]
                                  .filter(
                                    Boolean
                                  )
                                  .join(
                                    " · "
                                  ) ||
                                  "Ingen adresseinformasjon"}
                              </p>

                              <div className="mt-3 flex flex-wrap gap-2">
                                {project.start_date && (
                                  <span className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[10px] text-slate-400">
                                    Start:{" "}
                                    {formatDate(
                                      project.start_date
                                    )}
                                  </span>
                                )}

                                {project.deadline && (
                                  <span className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[10px] text-slate-400">
                                    Frist:{" "}
                                    {formatDate(
                                      project.deadline
                                    )}
                                  </span>
                                )}

                                {project.taklekkasjevakten_inquiry_id && (
                                  <span className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-300">
                                    TLV #
                                    {
                                      project.taklekkasjevakten_inquiry_id
                                    }
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-left lg:text-right">
                              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-600">
                                Rolle
                              </p>

                              <p className="mt-1 text-xs font-bold text-slate-300">
                                {projectRoleLabel(
                                  project.project_role
                                )}
                              </p>
                            </div>
                          </div>
                        </article>
                      )
                    )}
                  </div>
                ) : (
                  <EmptyState text="Ingen prosjekter registrert." />
                )}
              </SectionCard>

              {/* ==============================================
                  TIME HISTORY
                  ============================================== */}

              <SectionCard
                title="Timeregistrering"
                description="De siste registrerte timene for den ansatte."
                icon={
                  <Clock3 className="h-4 w-4" />
                }
              >
                {data
                  ?.time_entries
                  ?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[950px] text-left">
                      <thead>
                        <tr className="border-b border-slate-800 text-[9px] font-black uppercase tracking-[0.14em] text-slate-600">
                          <th className="pb-3 pr-4">
                            Dato
                          </th>

                          <th className="pb-3 pr-4">
                            Prosjekt
                          </th>

                          <th className="pb-3 pr-4">
                            Beskrivelse
                          </th>

                          <th className="pb-3 pr-4">
                            Fra / til
                          </th>

                          <th className="pb-3 pr-4">
                            Timer
                          </th>

                          <th className="pb-3 pr-4">
                            Fakturerbar
                          </th>

                          <th className="pb-3">
                            Godkjent
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {data.time_entries.map(
                          (
                            entry
                          ) => (
                            <tr
                              key={
                                entry.id
                              }
                              className="border-b border-slate-800/70 text-xs text-slate-300"
                            >
                              <td className="py-3 pr-4">
                                {formatDate(
                                  entry.work_date
                                )}
                              </td>

                              <td className="py-3 pr-4">
                                <p className="font-bold text-white">
                                  {entry.project_number ||
                                    `#${entry.project_id}`}
                                </p>

                                <p className="mt-0.5 text-[10px] text-slate-500">
                                  {entry.project_title ||
                                    ""}
                                </p>
                              </td>

                              <td className="max-w-md py-3 pr-4 text-slate-400">
                                {entry.description ||
                                  "—"}
                              </td>

                              <td className="py-3 pr-4 text-slate-500">
                                {entry.start_time ||
                                entry.end_time
                                  ? `${entry.start_time || "—"} – ${entry.end_time || "—"}`
                                  : "—"}
                              </td>

                              <td className="py-3 pr-4 font-black text-white">
                                {formatNumber(
                                  entry.hours,
                                  2
                                )}
                              </td>

                              <td className="py-3 pr-4">
                                {isEnabled(
                                  entry.billable
                                ) ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                ) : (
                                  <span className="text-slate-600">
                                    Nei
                                  </span>
                                )}
                              </td>

                              <td className="py-3">
                                {isEnabled(
                                  entry.approved
                                ) ? (
                                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                ) : (
                                  <span className="text-slate-600">
                                    Ikke
                                    godkjent
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState text="Ingen timer registrert." />
                )}
              </SectionCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}