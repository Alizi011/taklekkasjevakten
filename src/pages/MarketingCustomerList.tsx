import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  UserRound,
} from "lucide-react";
import { apiUrl } from "../lib/api";

export type MarketingSegment = "private" | "business" | "housing";

type MarketingCustomer = {
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
  project_count?: number;
  property_count?: number;
  latest_project_at?: string | null;
  has_email?: boolean;
  has_phone?: boolean;
};

type MarketingCustomerResponse = {
  success: boolean;
  message?: string;
  customers?: MarketingCustomer[];
  stats?: {
    total?: number;
    with_email?: number;
    with_phone?: number;
  };
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
  };
};

export default function MarketingCustomerList({
  segment,
}: {
  segment: MarketingSegment;
}) {
  const [customers, setCustomers] = useState<MarketingCustomer[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    with_email: 0,
    with_phone: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 50,
    total: 0,
    pages: 1,
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [emailFilter, setEmailFilter] = useState<"all" | "yes" | "no">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [segment, emailFilter]);

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        segment,
        page: String(page),
        per_page: "50",
        email: emailFilter,
      });

      if (debouncedSearch) {
        params.set("q", debouncedSearch);
      }

      const res = await fetch(
        apiUrl(`/core/marketing_customers.php?${params.toString()}`)
      );
      const data: MarketingCustomerResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Kunne ikke hente eksisterende kunder."
        );
      }

      setCustomers(Array.isArray(data.customers) ? data.customers : []);
      setStats({
        total: Number(data.stats?.total || 0),
        with_email: Number(data.stats?.with_email || 0),
        with_phone: Number(data.stats?.with_phone || 0),
      });
      setPagination(
        data.pagination || {
          page: 1,
          per_page: 50,
          total: 0,
          pages: 1,
        }
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kunne ikke hente eksisterende kunder."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [segment, page, debouncedSearch, emailFilter]);

  const segmentLabel =
    segment === "private"
      ? "privatkunder"
      : segment === "business"
        ? "bedriftskunder"
        : "borettslag / sameier";

  const cards = useMemo(
    () => [
      ["Eksisterende kunder", stats.total],
      ["Har e-post", stats.with_email],
      ["Har telefon", stats.with_phone],
      ["Uten e-post", Math.max(0, stats.total - stats.with_email)],
    ],
    [stats]
  );

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-slate-800/80 bg-[#0d1320] px-4 py-4"
          >
            <div className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-600">
              {label}
            </div>
            <div className="mt-2 text-2xl font-black text-white">
              {Number(value).toLocaleString("nb-NO")}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(280px,1fr)_200px]">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Søk blant ${segmentLabel}…`}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-amber-500/40"
            />
          </label>

          <select
            value={emailFilter}
            onChange={(e) =>
              setEmailFilter(e.target.value as "all" | "yes" | "no")
            }
            className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2.5 text-xs font-bold text-slate-300 outline-none"
          >
            <option value="all">Alle e-poststatuser</option>
            <option value="yes">Har e-post</option>
            <option value="no">Mangler e-post</option>
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
          </div>
        ) : error ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-5 text-center">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <p className="text-xs font-bold text-red-300">{error}</p>
            <button
              type="button"
              onClick={load}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300"
            >
              Prøv igjen
            </button>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex min-h-[220px] items-center justify-center p-5 text-center text-xs text-slate-500">
            Ingen eksisterende kunder matcher filtrene.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left">
              <thead className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Kunde</th>
                  <th className="px-4 py-3">Kontakt</th>
                  <th className="px-4 py-3">Sted</th>
                  <th className="px-4 py-3">Historikk</th>
                  <th className="px-4 py-3">Kontaktgrunnlag</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/70">
                {customers.map((customer) => {
                  const Icon =
                    segment === "private" ? UserRound : Building2;

                  return (
                    <tr
                      key={customer.id}
                      className="transition hover:bg-slate-900/30"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-slate-500">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="max-w-[280px] truncate text-xs font-black text-white">
                              {customer.name || `Kunde #${customer.id}`}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-2 text-[9px] text-slate-600">
                              <span>Core #{customer.id}</span>
                              {customer.customer_number && (
                                <span>{customer.customer_number}</span>
                              )}
                              {customer.organization_number && (
                                <span>Org. {customer.organization_number}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Mail
                              className={`h-3.5 w-3.5 ${
                                customer.has_email
                                  ? "text-emerald-400"
                                  : "text-slate-700"
                              }`}
                            />
                            <span className="max-w-[230px] truncate text-[11px] text-slate-300">
                              {customer.email || "Ingen e-post"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone
                              className={`h-3.5 w-3.5 ${
                                customer.has_phone
                                  ? "text-emerald-400"
                                  : "text-slate-700"
                              }`}
                            />
                            <span className="text-[11px] text-slate-400">
                              {customer.phone || "Ingen telefon"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 text-slate-600" />
                          <div>
                            <p className="max-w-[220px] truncate text-[11px] font-bold text-slate-300">
                              {customer.address || "Adresse mangler"}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-600">
                              {[customer.postal_code, customer.city]
                                .filter(Boolean)
                                .join(" ") || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-[11px] font-bold text-slate-300">
                          {Number(customer.project_count || 0)} prosjekt(er)
                        </p>
                        <p className="mt-1 text-[10px] text-slate-600">
                          {Number(customer.property_count || 0)} eiendom(mer)
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        {customer.has_email ? (
                          <span className="inline-flex rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black text-emerald-300">
                            Har e-post
                          </span>
                        ) : customer.has_phone ? (
                          <span className="inline-flex rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[9px] font-black text-blue-300">
                            Kun telefon
                          </span>
                        ) : (
                          <span className="inline-flex rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[9px] font-black text-slate-500">
                            Mangler kontaktinfo
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-800/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] text-slate-500">
            Viser {customers.length} av{" "}
            {pagination.total.toLocaleString("nb-NO")} kunder.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-400 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-[10px] font-black text-slate-400">
              Side {pagination.page} / {Math.max(1, pagination.pages)}
            </span>
            <button
              type="button"
              disabled={page >= pagination.pages}
              onClick={() =>
                setPage((current) =>
                  Math.min(pagination.pages, current + 1)
                )
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-400 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-[10px] leading-5 text-slate-500">
        Listen viser eksisterende kunder og kontaktinformasjon fra perun_core.
        Dette er kontaktgrunnlaget; utsendelsesregler og reservasjoner bør
        kontrolleres før en faktisk kampanje sendes.
      </div>
    </div>
  );
}
