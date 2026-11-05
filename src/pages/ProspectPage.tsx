import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe2,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { apiUrl } from "../lib/api";
import MarketingCustomerList from "./MarketingCustomerList";

type MarketingSegment = "private" | "business" | "housing";

type Prospect = {
  id: number;
  organization_number: string;
  name: string;
  organization_type_code?: string | null;
  municipality_name?: string | null;
  city?: string | null;
  business_address?: string | null;
  postal_code?: string | null;
  prospect_status?: string | null;
  is_customer?: number | boolean;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  manager_name?: string | null;
  manager_group?: string | null;
  has_website: number;
  has_email: number;
  has_phone: number;
  discovery_attempted: number;
};

type ProspectStats = {
  total: number;
  with_website: number;
  without_website: number;
  with_email: number;
  with_phone: number;
  ready_for_contact: number;
};

type ProspectResponse = {
  success: boolean;
  prospects: Prospect[];
  stats: ProspectStats;
  municipalities: string[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
  };
  message?: string;
};

type DiscoveryStatus = {
  success: boolean;
  running: boolean;
  pid?: number | null;
  credit_empty?: boolean;
  last_exit_code?: number | null;
  log_tail?: string;
  started_at?: string | null;
  mode?: string | null;
  entity_id?: number | null;
  limit?: number | null;
  message?: string;
};

const emptyStats: ProspectStats = {
  total: 0,
  with_website: 0,
  without_website: 0,
  with_email: 0,
  with_phone: 0,
  ready_for_contact: 0,
};

export default function ProspectPage({
  segment = "housing",
}: {
  segment?: MarketingSegment;
}) {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [stats, setStats] = useState<ProspectStats>(emptyStats);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [municipality, setMunicipality] = useState("OSLO");
  const [websiteFilter, setWebsiteFilter] = useState<"all" | "yes" | "no">("all");
  const [contactFilter, setContactFilter] = useState<"all" | "email" | "phone" | "ready">("all");
  const [managerFilter, setManagerFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 50,
    total: 0,
    pages: 1,
  });
  const [discovery, setDiscovery] = useState<DiscoveryStatus>({
    success: true,
    running: false,
  });
  const [batchBusy, setBatchBusy] = useState(false);
  const [creditCheckBusy, setCreditCheckBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [sourceView, setSourceView] = useState<"customers" | "prospects">("customers");

  useEffect(() => {
    setSourceView("customers");
  }, [segment]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  const loadProspects = async () => {
    if (sourceView !== "prospects" || segment !== "housing") {
      setProspects([]);
      setStats(emptyStats);
      setMunicipalities([]);
      setPagination({
        page: 1,
        per_page: 50,
        total: 0,
        pages: 1,
      });
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: "50",
        municipality,
        website: websiteFilter,
        contact: contactFilter,
      });

      if (debouncedSearch) params.set("q", debouncedSearch);
      if (managerFilter.trim()) params.set("manager", managerFilter.trim());

      const res = await fetch(
        apiUrl(`/core/prospects.php?${params.toString()}`)
      );
      const data: ProspectResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke hente prospekter.");
      }

      setProspects(Array.isArray(data.prospects) ? data.prospects : []);
      setStats(data.stats || emptyStats);
      setMunicipalities(
        Array.isArray(data.municipalities) ? data.municipalities : []
      );
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
        err instanceof Error ? err.message : "Kunne ikke hente prospekter."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadDiscoveryStatus = async () => {
    try {
      const res = await fetch(apiUrl("/core/prospect_discovery.php"));
      const data: DiscoveryStatus = await res.json();

      if (res.ok && data.success) {
        const wasRunning = discovery.running;
        setDiscovery(data);

        if (wasRunning && !data.running) {
          setBatchBusy(false);
          await loadProspects();
        }
      }
    } catch (err) {
      console.error("Kunne ikke hente discovery-status:", err);
    }
  };

  useEffect(() => {
    loadProspects();
  }, [
    page,
    debouncedSearch,
    municipality,
    websiteFilter,
    contactFilter,
    managerFilter,
    segment,
    sourceView,
  ]);

  useEffect(() => {
    if (sourceView === "prospects" && segment === "housing") {
      loadDiscoveryStatus();
    }
  }, [segment, sourceView]);

  useEffect(() => {
    if (!discovery.running) return;

    const timer = window.setInterval(() => {
      loadDiscoveryStatus();
    }, 4000);

    return () => window.clearInterval(timer);
  }, [discovery.running]);

  const checkBraveCredit = async () => {
    setCreditCheckBusy(true);
    setMessage("");

    try {
      const res = await fetch(apiUrl("/core/prospect_discovery.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check_credit",
        }),
      });

      const data: DiscoveryStatus = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Kunne ikke kontrollere Brave-kreditt."
        );
      }

      setDiscovery((current) => ({
        ...current,
        ...data,
      }));

      setMessage(
        data.credit_empty
          ? "Brave-kreditten er fortsatt brukt opp."
          : "Brave-kreditt er tilgjengelig. Søket kan fortsette."
      );
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Kunne ikke kontrollere Brave-kreditt."
      );
    } finally {
      setCreditCheckBusy(false);
    }
  };

  const startDiscovery = async () => {
    setMessage("");
    setBatchBusy(true);

    try {
      const res = await fetch(apiUrl("/core/prospect_discovery.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "batch",
          limit: 250,
        }),
      });

      const data: DiscoveryStatus = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke starte søket.");
      }

      setDiscovery(data);
      setMessage(
        "Søket er startet. Du kan arbeide videre mens det kjører."
      );
    } catch (err) {
      setBatchBusy(false);
      setMessage(
        err instanceof Error
          ? err.message
          : "Kunne ikke starte søket."
      );
    }
  };

  const segmentLabel =
    segment === "private"
      ? "Private kunder"
      : segment === "business"
        ? "Bedrifter"
        : "Sameier / borettslag";

  const prospectSourceUnavailable = segment !== "housing";

  const segmentDescription =
    segment === "private"
      ? "Eksisterende privatkunder fra perun_core, med kontaktinformasjon og historikk."
      : segment === "business"
        ? "Eksisterende bedriftskunder fra perun_core, kombinert med nye prospekter når datakilden kobles på."
        : "Eksisterende borettslag/sameier fra perun_core og nye BRREG-prospekter holdes adskilt.";

  const statsCards = useMemo(
    () => [
      {
        label: "Prospekter",
        value: stats.total,
        detail: "Oslo og Akershus",
      },
      {
        label: "Har hjemmeside",
        value: stats.with_website,
        detail: "BRREG eller verifisert web",
      },
      {
        label: "Mangler hjemmeside",
        value: stats.without_website,
        detail: "Kan undersøkes videre",
      },
      {
        label: "Har e-post",
        value: stats.with_email,
        detail: "Minst én registrert adresse",
      },
      {
        label: "Kontaktklare",
        value: stats.ready_for_contact,
        detail: "Hjemmeside + e-post",
      },
    ],
    [stats]
  );

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
        <div className="flex flex-col gap-4 border-b border-slate-800/80 px-5 py-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <h3 className="text-base font-black text-white">
                Markedsføring · {segmentLabel}
              </h3>
            </div>
            <p className="mt-1 max-w-3xl text-[11px] leading-5 text-slate-500">
              {segmentDescription} Kontaktinformasjon og særlig e-postadresser
              berikes gradvis uten å overskrive originale kildedata.
            </p>
          </div>

          <button
            type="button"
            onClick={startDiscovery}
            disabled={sourceView !== "prospects" || prospectSourceUnavailable || discovery.running || batchBusy || discovery.credit_empty}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5B800] px-5 py-3 text-xs font-black text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {discovery.running || batchBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {discovery.credit_empty
              ? "Brave-kreditt tom"
              : discovery.running
                ? "Søk pågår…"
                : "Fortsett søk"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-800/80 px-5 py-3">
          <button
            type="button"
            onClick={() => setSourceView("customers")}
            className={`rounded-xl border px-4 py-2 text-[10px] font-black transition ${
              sourceView === "customers"
                ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                : "border-slate-800 bg-slate-950/40 text-slate-500 hover:text-slate-300"
            }`}
          >
            Eksisterende kunder
          </button>

          <button
            type="button"
            onClick={() => setSourceView("prospects")}
            className={`rounded-xl border px-4 py-2 text-[10px] font-black transition ${
              sourceView === "prospects"
                ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
                : "border-slate-800 bg-slate-950/40 text-slate-500 hover:text-slate-300"
            }`}
          >
            Nye prospekter
          </button>
        </div>

        {sourceView === "prospects" && prospectSourceUnavailable && (
          <div className="flex items-start gap-3 border-b border-slate-800 bg-slate-950/30 px-5 py-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <div>
              <p className="text-xs font-black text-slate-300">
                {segmentLabel} er klargjort som målgruppe
              </p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                Datakilden kobles på senere. Sameier / borettslag bruker allerede
                BRREG- og webberikelsen vi har bygget.
              </p>
            </div>
          </div>
        )}

        {sourceView === "prospects" && discovery.credit_empty && !discovery.running && (
          <div className="flex flex-col gap-3 border-b border-amber-500/15 bg-amber-500/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div>
                <p className="text-xs font-black text-amber-300">
                  Brave-kreditten er brukt opp
                </p>
                <p className="mt-1 text-[11px] leading-5 text-slate-400">
                  «Fortsett søk» er deaktivert til Brave bekrefter at kreditt er tilgjengelig igjen.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={checkBraveCredit}
              disabled={creditCheckBusy}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 px-4 py-2 text-[10px] font-black text-amber-300 transition hover:bg-amber-500/10 disabled:opacity-50"
            >
              {creditCheckBusy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Sjekk Brave-kreditt
            </button>
          </div>
        )}

        {sourceView === "prospects" && discovery.running && (
          <div className="flex items-start gap-3 border-b border-blue-500/15 bg-blue-500/5 px-5 py-4">
            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-blue-400" />
            <div>
              <p className="text-xs font-black text-blue-300">
                Discovery kjører på VPS
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {discovery.mode === "entity"
                  ? `Undersøker prospekt #${discovery.entity_id}.`
                  : `Batch på inntil ${discovery.limit || 250} prospekter.`}
              </p>
            </div>
          </div>
        )}

        {message && (
          <div className="border-b border-slate-800/80 px-5 py-3 text-[11px] font-bold text-slate-300">
            {message}
          </div>
        )}

        {sourceView === "prospects" && (
        <div className="grid grid-cols-2 gap-px bg-slate-800/70 md:grid-cols-3 xl:grid-cols-5">
          {statsCards.map((card) => (
            <div key={card.label} className="bg-[#0b1725] px-5 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {Number(card.value || 0).toLocaleString("nb-NO")}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">{card.detail}</p>
            </div>
          ))}
        </div>
        )}
      </section>

      {sourceView === "customers" ? (
        <MarketingCustomerList segment={segment} />
      ) : prospectSourceUnavailable ? (
        <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320] px-6 py-12 text-center">
          <Building2 className="mx-auto h-8 w-8 text-slate-700" />
          <h4 className="mt-4 text-sm font-black text-white">
            Nye prospekter · {segmentLabel}
          </h4>
          <p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-slate-500">
            Eksisterende kunder er allerede koblet inn. Prospektkilden for denne
            målgruppen kobles på separat senere.
          </p>
        </section>
      ) : (
        <>
      <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(280px,1.4fr)_220px_190px_190px_220px]">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Søk navn, org.nr. eller sted…"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-amber-500/40"
            />
          </label>

          <select
            value={municipality}
            onChange={(e) => {
              setMunicipality(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2.5 text-xs font-bold text-slate-300 outline-none"
          >
            <option value="alle">Alle kommuner</option>
            {municipalities.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={websiteFilter}
            onChange={(e) => {
              setWebsiteFilter(e.target.value as "all" | "yes" | "no");
              setPage(1);
            }}
            className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2.5 text-xs font-bold text-slate-300 outline-none"
          >
            <option value="all">Alle nettsider</option>
            <option value="yes">Har hjemmeside</option>
            <option value="no">Mangler hjemmeside</option>
          </select>

          <select
            value={contactFilter}
            onChange={(e) => {
              setContactFilter(
                e.target.value as "all" | "email" | "phone" | "ready"
              );
              setPage(1);
            }}
            className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2.5 text-xs font-bold text-slate-300 outline-none"
          >
            <option value="all">All kontaktstatus</option>
            <option value="email">Har e-post</option>
            <option value="phone">Har telefon</option>
            <option value="ready">Kontaktklar</option>
          </select>

          <input
            value={managerFilter}
            onChange={(e) => {
              setManagerFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Forvalter, f.eks. OBOS"
            className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-600 focus:border-amber-500/40"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
          </div>
        ) : error ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 px-5 text-center">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <p className="text-xs font-bold text-red-300">{error}</p>
            <button
              type="button"
              onClick={loadProspects}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300"
            >
              Prøv igjen
            </button>
          </div>
        ) : prospects.length === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center px-5 text-center text-xs text-slate-500">
            Ingen prospekter matcher filtrene.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left">
              <thead className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Virksomhet</th>
                  <th className="px-4 py-3">Kommune</th>
                  <th className="px-4 py-3">Forvalter</th>
                  <th className="px-4 py-3">Hjemmeside</th>
                  <th className="px-4 py-3">Kontakt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {prospects.map((prospect) => {
                  return (
                    <tr
                      key={prospect.id}
                      className="transition hover:bg-slate-900/30"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-slate-500">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-[300px] truncate text-xs font-black text-white">
                              {prospect.name}
                            </p>
                            <p className="mt-1 font-mono text-[10px] text-slate-500">
                              {prospect.organization_number}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs font-bold text-slate-300">
                          {prospect.municipality_name || prospect.city || "—"}
                        </p>
                        <p className="mt-1 max-w-[180px] truncate text-[10px] text-slate-600">
                          {prospect.business_address || ""}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="max-w-[220px] truncate text-xs font-bold text-slate-300">
                          {prospect.manager_name || "—"}
                        </p>
                        {prospect.manager_group && (
                          <span className="mt-1 inline-flex rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[9px] font-black text-purple-300">
                            {prospect.manager_group}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {prospect.website ? (
                          <a
                            href={prospect.website}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex max-w-[220px] items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300"
                          >
                            <Globe2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">
                              {prospect.website.replace(/^https?:\/\//i, "")}
                            </span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-600">Mangler</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Mail
                              className={`h-3.5 w-3.5 ${
                                prospect.has_email
                                  ? "text-emerald-400"
                                  : "text-slate-700"
                              }`}
                            />
                            <span className="max-w-[220px] truncate text-[11px] text-slate-400">
                              {prospect.email || "Ingen e-post"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone
                              className={`h-3.5 w-3.5 ${
                                prospect.has_phone
                                  ? "text-emerald-400"
                                  : "text-slate-700"
                              }`}
                            />
                            <span className="text-[11px] text-slate-400">
                              {prospect.phone || "Ingen telefon"}
                            </span>
                          </div>
                        </div>
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
            Viser {prospects.length} av{" "}
            {pagination.total.toLocaleString("nb-NO")} treff.
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
        </>
      )}
    </div>
  );
}
