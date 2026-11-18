import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, FilePlus2, Plus, Search, X } from "lucide-react";
import { apiUrl } from "../lib/api";

export type OfferCaseChoice = {
  id: number | string;
  customer_name?: string | null;
  customerName?: string | null;
  address?: string | null;
  city?: string | null;
  status?: string | null;
};
export type CoreOfferCustomer = {
  id: number;
  name: string;
  customer_type?: string | null;
  organization_number?: string | null;
  city?: string | null;
};
type Props = {
  open: boolean;
  inquiries: OfferCaseChoice[];
  onClose: () => void;
  onChoose: (id: number) => void;
  onCoreCustomer: (customer: CoreOfferCustomer) => void;
  onNewCase: () => void;
};
export default function NewPriceOfferChooser({ open, inquiries, onClose, onChoose, onCoreCustomer, onNewCase }: Props) {
  const [query, setQuery] = useState("");
  const [core, setCore] = useState<CoreOfferCustomer[]>([]);
  const [loadingCore, setLoadingCore] = useState(false);
  const [coreError, setCoreError] = useState("");
  const [mode, setMode] = useState<"core" | "cases">("core");
  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("nb-NO");
    return inquiries.filter(item => {
      const status = String(item.status || "").toLowerCase();
      if (["avsluttet", "tilbud_avvist"].includes(status)) return false;
      return !q || [String(item.id), item.customer_name, item.customerName, item.address, item.city]
        .some(value => String(value || "").toLocaleLowerCase("nb-NO").includes(q));
    }).slice(0, 30);
  }, [inquiries, query]);

  useEffect(() => {
    if (!open || mode !== "core") return;
    const q = query.trim();
    if (q.length < 2) { setCore([]); setLoadingCore(false); setCoreError(""); return; }
    const controller = new AbortController();
    setLoadingCore(true);
    setCoreError("");
    const timer = window.setTimeout(() => {
      const qs = new URLSearchParams({ action: "search_customers", q });
      void fetch(apiUrl("/admin_case_organizations.php") + "?" + qs.toString(), {
        method: "GET", credentials: "include", cache: "no-store", signal: controller.signal,
      }).then(async response => {
        const data = await response.json().catch(() => null);
        if (!response.ok || data?.success !== true || !Array.isArray(data.customers)) {
          throw new Error(data?.message || "Kunne ikke søke i Perun Core.");
        }
        if (!controller.signal.aborted) setCore(data.customers);
      }).catch(err => {
        if (!controller.signal.aborted) { setCore([]); setCoreError(err instanceof Error ? err.message : "Søk feilet."); }
      }).finally(() => { if (!controller.signal.aborted) setLoadingCore(false); });
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [open, mode, query]);

  if (!open) return null;
  return <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-label="Nytt pristilbud">
    <div className="w-full max-w-2xl rounded-2xl border border-[#7d4257] bg-[#25121f] p-5 text-white shadow-2xl">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div><h2 className="flex items-center gap-2 text-xl font-black"><FilePlus2 size={22}/> Nytt pristilbud</h2>
          <p className="mt-1 text-xs text-slate-300">Velg en kunde fra Perun Core eller en eksisterende TLV-sak. Ingen tilbud sendes automatisk.</p></div>
        <button type="button" onClick={onClose} aria-label="Lukk" className="rounded-lg border border-white/15 p-2"><X size={17}/></button>
      </div>
      <button type="button" onClick={onNewCase}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 py-3 text-sm font-bold hover:bg-rose-600">
        <Plus size={17}/> Ny kunde eller nytt oppdrag
      </button>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <button type="button" aria-pressed={mode === "core"} onClick={() => { setMode("core"); setQuery(""); }}
          className={`rounded-xl border px-3 py-2.5 text-xs font-bold ${mode === "core" ? "border-rose-400 bg-rose-900/40" : "border-white/10"}`}>Alle kunder · Perun Core</button>
        <button type="button" aria-pressed={mode === "cases"} onClick={() => { setMode("cases"); setQuery(""); }}
          className={`rounded-xl border px-3 py-2.5 text-xs font-bold ${mode === "cases" ? "border-rose-400 bg-rose-900/40" : "border-white/10"}`}>Eksisterende TLV-saker</button>
      </div>
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-3 text-slate-400"/>
        <input value={query} onChange={e => setQuery(e.target.value)}
          aria-label={mode === "core" ? "Søk i hele Perun Core kunderegister" : "Søk eksisterende TLV-oppdrag"}
          placeholder={mode === "core" ? "Søk navn, organisasjonsnummer eller Core-kunde-ID" : "Søk etter kunde, adresse eller saksnummer"}
          className="w-full rounded-xl border border-[#714152] bg-[#180b15] py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-rose-400"/>
      </div>
      <div className="max-h-[45vh] space-y-2 overflow-y-auto" aria-live="polite">
        {mode === "core" ? <>
          {query.trim().length < 2 && <p className="p-4 text-sm text-slate-300">Skriv minst to tegn for å søke blant alle aktive Core-kunder.</p>}
          {loadingCore && <p className="p-4 text-sm text-slate-300">Søker i Perun Core …</p>}
          {coreError && <p role="alert" className="rounded-lg bg-red-950/60 p-3 text-sm text-red-200">{coreError}</p>}
          {!loadingCore && !coreError && query.trim().length >= 2 && core.length === 0 && <p className="p-4 text-sm text-slate-300">Ingen Core-kunder funnet.</p>}
          {!loadingCore && core.map(customer => <button type="button" key={customer.id} onClick={() => onCoreCustomer(customer)}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#351b29] px-4 py-3 text-left hover:border-rose-400/60">
            <div className="flex min-w-0 items-center gap-3"><Building2 size={18} className="shrink-0 text-amber-300"/>
              <div className="min-w-0"><p className="truncate text-sm font-bold">{customer.name}</p>
                <p className="mt-1 truncate text-xs text-slate-300">{customer.organization_number ? "Org.nr. " + customer.organization_number + " · " : ""}Core #{customer.id}{customer.city ? " · " + customer.city : ""}</p>
              </div>
            </div>
            <ArrowRight size={17} className="shrink-0 text-amber-300"/>
          </button>)}
          {core.length >= 50 && <p className="p-2 text-xs text-amber-200">Viser de første 50 treffene. Skriv et mer presist søk for å finne kunden.</p>}
        </> : <>
          {results.length === 0 && <p className="p-4 text-sm text-slate-300">Ingen samsvarende TLV-saker.</p>}
          {results.map(item => <button type="button" key={item.id} onClick={() => onChoose(Number(item.id))}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#351b29] px-4 py-3 text-left hover:border-rose-400/60">
            <div className="min-w-0"><p className="truncate text-sm font-bold">Sak #{item.id} · {item.customer_name || item.customerName || "Ukjent kunde"}</p>
              <p className="mt-1 truncate text-xs text-slate-300">{[item.address,item.city].filter(Boolean).join(", ") || "Adresse ikke oppgitt"}</p></div>
            <ArrowRight size={17} className="shrink-0 text-amber-300"/>
          </button>)}
        </>}
      </div>
    </div>
  </div>;
}
