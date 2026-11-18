import { useCallback, useEffect, useState } from "react";
import { Building2, Plus, RefreshCw } from "lucide-react";
import { apiUrl } from "../lib/api";

// Administrative relations only. Never grants a customer portal session.
type CoreCustomer = { id: number; name: string; organization_number?: string | null; customer_type?: string };
type Association = { id: number; core_customer_id: number; relationship_role: string; access_scope: string; status: string; access_note?: string | null; customer?: CoreCustomer | null };
const BASE = apiUrl("/admin_case_organizations.php");
const ROLES = [
  ["orderer", "Bestiller"], ["property_owner", "Eiendomseier / sameie"],
  ["property_manager", "Vaktmester / forvalter"],
  ["invoice_recipient", "Fakturamottaker (tilknytning)"], ["other", "Annen rolle"],
] as const;
const SCOPES = [
  ["overview", "Saksoversikt"],
  ["shared_documents", "Saksoversikt og frigitte dokumenter"],
  ["commercial", "Kommersiell tilgang (kun registrert, ikke aktivert i portal)"],
] as const;
const roleLabel = (value: string) => ROLES.find(x => x[0] === value)?.[1] || value;
const scopeLabel = (value: string) => SCOPES.find(x => x[0] === value)?.[1] || value;
export default function AdminCaseOrganizations({ inquiryId }: { inquiryId: number }) {
  const [rows, setRows] = useState<Association[]>([]);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<CoreCustomer[]>([]);
  const [picked, setPicked] = useState<CoreCustomer | null>(null);
  const [role, setRole] = useState("property_manager");
  const [scope, setScope] = useState("overview");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const request = useCallback(async (params: URLSearchParams | Record<string, unknown>) => {
    const isGet = params instanceof URLSearchParams;
    const response = await fetch(isGet ? BASE + "?" + params.toString() : BASE, {
      method: isGet ? "GET" : "POST",
      credentials: "include",
      cache: "no-store",
      ...(isGet ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) }),
    });
    const json = await response.json().catch(() => null);
    if (!response.ok || json?.success !== true) throw new Error(json?.message || "Kunne ikke behandle forespørselen.");
    return json;
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const result = await request(new URLSearchParams({ action: "list", inquiry_id: String(inquiryId) }));
      setRows(Array.isArray(result.organisations) ? result.organisations : []);
      setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Kunne ikke hente tilknytninger."); }
    finally { setLoading(false); }
  }, [inquiryId, request]);

  useEffect(() => { void reload(); }, [reload]);

  const search = async () => {
    if (query.trim().length < 2) return;
    setError("");
    setPicked(null);
    setBusy(true);
    try {
      const result = await request(new URLSearchParams({ action: "search_customers", q: query.trim() }));
      setMatches(Array.isArray(result.customers) ? result.customers : []);
    } catch (e) { setError(e instanceof Error ? e.message : "Søk mislyktes."); }
    finally { setBusy(false); }
  };

  const link = async () => {
    if (!picked) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await request({
        action: "link", inquiry_id: inquiryId, core_customer_id: picked.id,
        relationship_role: role, access_scope: scope, access_note: note.trim(),
      });
      setNotice(result.message || "Virksomheten er knyttet til saken.");
      setPicked(null); setMatches([]); setQuery(""); setNote("");
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Lagring mislyktes."); }
    finally { setBusy(false); }
  };

  const setStatus = async (row: Association, status: "active" | "revoked") => {
    if (!window.confirm(status === "revoked"
      ? "Trekke tilbake virksomhetstilknytningen? Saksdata blir ikke slettet."
      : "Godkjenne virksomhetstilknytningen? Dette gir IKKE automatisk personinnlogging.")) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await request({ action: "set_status", inquiry_id: inquiryId, link_id: row.id, status });
      setNotice(result.message || "Oppdatert.");
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Kunne ikke oppdatere."); }
    finally { setBusy(false); }
  };

  const control = "w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white";
  return (
    <section className="mb-5 rounded-2xl border border-slate-700 bg-[#182031] p-4 text-white" aria-label="Tilknyttede virksomheter">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="flex items-center gap-2 text-lg font-bold"><Building2 size={19}/> Tilknyttede virksomheter</h2>
          <p className="mt-1 text-xs text-slate-300">Flere bestillere, sameier og forvaltere på én sak. Gir ikke automatisk portaltilgang eller endrer fakturamottaker.</p></div>
        <button type="button" onClick={() => void reload()} disabled={busy || loading}
          className="flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-2 text-xs"><RefreshCw size={14}/> Oppdater</button>
      </div>
      {error && <p role="alert" className="mb-3 rounded bg-red-950 p-3 text-sm text-red-200">{error}</p>}
      {notice && <p role="status" className="mb-3 rounded bg-slate-800 p-3 text-sm text-emerald-300">{notice}</p>}
      {loading && <p className="mb-2 text-xs text-slate-300">Henter tilknytninger …</p>}
      <div className="mb-4 space-y-2">
        {rows.length === 0 && !loading && <p className="text-sm text-slate-400">Ingen ekstra virksomheter knyttet til saken.</p>}
        {rows.map(row => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-600 p-3">
          <div><p className="text-sm font-semibold">{row.customer?.name || ("Core-kunde #" + row.core_customer_id)}</p>
            <p className="text-xs text-slate-300">{roleLabel(row.relationship_role)} · {scopeLabel(row.access_scope)} · {row.status === "active" ? "Aktiv kobling" : row.status === "revoked" ? "Tilbakekalt" : "Venter på godkjenning"}</p>
            {row.access_note && <p className="mt-1 text-xs text-slate-400">{row.access_note}</p>}</div>
          <div className="flex gap-2">
            {row.status !== "active" && <button disabled={busy} onClick={() => void setStatus(row, "active")}
              className="rounded-lg border border-emerald-600 px-3 py-2 text-xs">Godkjenn</button>}
            {row.status !== "revoked" && <button disabled={busy} onClick={() => void setStatus(row, "revoked")}
              className="rounded-lg border border-red-700 px-3 py-2 text-xs">Tilbakekall</button>}
          </div>
        </div>)}
      </div>
      <h3 className="mb-2 text-sm font-bold">Tilknytt en virksomhet</h3>
      <div className="flex flex-wrap gap-2">
        <input className={control + " min-w-[180px] flex-1"} placeholder="Søk kundenavn eller org.nr." value={query}
          onChange={e => { setQuery(e.target.value); setPicked(null); setMatches([]); }}
          onKeyDown={e => { if (e.key === "Enter") void search(); }} />
        <button type="button" disabled={busy || query.trim().length < 2} onClick={() => void search()}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950">Søk</button>
      </div>
      {matches.length > 0 && <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-600">
        {matches.map(customer => <button type="button" key={customer.id}
          onClick={() => { setPicked(customer); setMatches([]); }}
          className="block w-full border-b border-slate-700 px-3 py-2 text-left text-sm hover:bg-slate-700">
          {customer.name} <span className="text-xs text-slate-400">{customer.organization_number || ""} · #{customer.id}</span>
        </button>)}
      </div>}
      {picked && <div className="mt-3 space-y-3 rounded-xl border border-amber-600/40 p-3">
        <p className="text-sm font-semibold">Valgt: {picked.name}</p>
        <div className="grid gap-2 md:grid-cols-2">
          <label className="text-xs">Rolle
            <select value={role} onChange={e => setRole(e.target.value)} className={control + " mt-1"}>
              {ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-xs">Registrert tilgangsnivå
            <select value={scope} onChange={e => setScope(e.target.value)} className={control + " mt-1"}>
              {SCOPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
        <label className="block text-xs">Merknad
          <input maxLength={500} className={control + " mt-1"} value={note} onChange={e => setNote(e.target.value)}
            placeholder="Eksempel: Forvalter for sameiet, bestilt per telefon" />
        </label>
        <button disabled={busy} type="button" onClick={() => void link()}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">
          <Plus size={16}/> Lagre sakstilknytning
        </button>
      </div>}
    </section>
  );
}
