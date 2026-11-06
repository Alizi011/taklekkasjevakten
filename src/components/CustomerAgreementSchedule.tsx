import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3 } from "lucide-react";

type Proposal = {
  id: number;
  version_no: number;
  proposed_start_date: string;
  estimated_duration: string;
  proposal_note: string | null;
  status: string;
  customer_response_note: string | null;
  created_at: string;
};
type Props = {
  inquiryId: number;
  sessionToken: string;
  endpoint: string;
  previewMode?: boolean;
  compact?: boolean;
  onAgreementCreated?: () => void;
  onStatusChange?: () => void;
  onOpenAgreement?: () => void;
};

const dateLabel = (value: string) => {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "long", year: "numeric" }).format(date);
};

export default function CustomerAgreementSchedule({ inquiryId, sessionToken, endpoint, previewMode = false, compact = false, onAgreementCreated, onStatusChange, onOpenAgreement }: Props) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [showChange, setShowChange] = useState(false);

  async function load() {
    if ((!previewMode && !sessionToken) || inquiryId <= 0) { setLoading(false); return; }
    setLoading(true);
    try {
      const response = await fetch(previewMode ? endpoint.replace(/customer_agreement_schedule\.php(?:\?.*)?$/, "admin_agreement_schedule_read.php") : endpoint, { method: "POST", credentials: previewMode ? "include" : "omit", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify(previewMode ? { inquiry_id: inquiryId } : { action: "list", inquiry_id: inquiryId, session_token: sessionToken }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Kunne ikke hente datoforslag.");
      const rows = (Array.isArray(data.proposals) ? data.proposals : []) as Proposal[];
      setProposals([...rows].sort((a, b) => b.version_no - a.version_no || b.id - a.id));
      setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Kunne ikke hente dato."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [inquiryId, sessionToken, endpoint, previewMode]);

  async function respond(action: "approve" | "request_change" | "retry_create", id: number) {
    if (saving || previewMode) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, inquiry_id: inquiryId, session_token: sessionToken, proposal_id: id, note }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Kunne ikke registrere svaret.");
      if (action === "request_change") {
        setMessage("Endringsønsket er sendt til prosjektansvarlig.");
        setShowChange(false);
      } else if (data.agreement_created === true && Number(data.agreement_id) > 0) {
        setMessage("Oppstart er bekreftet og arbeidsavtalen opprettet. Fortsett til signatarene.");
        onAgreementCreated?.();
      } else {
        setMessage("Oppstart er bekreftet. Arbeidsavtalen er ikke klar ennå. Du skal ikke bekrefte datoen på nytt.");
      }
      setNote("");
      await load();
      onStatusChange?.();
    } catch (e) { setError(e instanceof Error ? e.message : "Handlingen feilet."); }
    finally { setSaving(false); }
  }

  const latest = proposals[0];
  const approved = latest?.status === "approved";
  const wrapper = compact ? "mt-5 text-white" : "rounded-2xl border border-amber-500/30 bg-[#0b1422] p-5 text-white";

  return (
    <section className={wrapper} data-start-date-pending={latest?.status === "pending_customer" ? "true" : undefined} aria-label="Oppstartsdato og varighet">
      {!compact && <h2 className="text-lg font-bold">Godkjenn oppstartsdato</h2>}
      {loading ? (
        <p className="mt-3 text-xs text-slate-400">Henter oppstartsdato og varighet …</p>
      ) : !latest ? (
        <p className="mt-3 text-xs text-slate-400">Ingen oppstartsdato er registrert ennå.</p>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-700 bg-[#111f31] p-4">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Registrert oppstart</p><p className="mt-1 text-base font-extrabold text-white">{dateLabel(latest.proposed_start_date)}</p></div>
            </div>
            <div className="mt-3 flex items-start gap-3 border-t border-slate-700/70 pt-3">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Forventet varighet</p><p className="mt-1 text-sm font-bold text-white">{latest.estimated_duration}</p></div>
            </div>
          </div>
          {latest.proposal_note && <p className="text-xs leading-5 text-slate-400">{latest.proposal_note}</p>}
          {previewMode ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-amber-200">{latest.status === "pending_customer" ? "Avventer kundens bekreftelse" : approved ? "Oppstart og varighet er bekreftet av kunden" : latest.status === "change_requested" ? "Kunden har bedt om endring" : `Status: ${latest.status}`}</p>
              {latest.status === "pending_customer" && (
                <div className="space-y-3">
                  <p className="text-[11px] leading-5 text-slate-400">Se gjennom oppstartsdatoen og forventet varighet. Velg om tidspunktet passer, eller be om en endring. Deretter kan du gå videre til arbeidsavtalen.</p>
                  <button type="button" disabled title="Forhåndsvisning – kun kunden kan bekrefte datoen" className="w-full cursor-not-allowed rounded-xl bg-amber-400 px-3 py-3 text-xs font-black text-slate-950 opacity-80">Datoen passer</button>
                  <button type="button" disabled title="Forhåndsvisning – kun kunden kan be om endring" className="w-full cursor-not-allowed rounded-lg border border-slate-700 px-3 py-2.5 text-xs font-semibold text-slate-300 opacity-80">Be om endring</button>
                  <p className="text-[10px] text-slate-500">Forhåndsvisning: Kundens knapper vises, men kan ikke brukes av administrator.</p>
                </div>
              )}
            </div>
          ) : latest.status === "pending_customer" ? (
            <div className="space-y-3">
              <p className="text-[11px] leading-5 text-slate-400">Se gjennom oppstartsdatoen og forventet varighet. Velg om tidspunktet passer, eller be om en endring. Deretter kan du gå videre til arbeidsavtalen.</p>
              <button type="button" disabled={saving} onClick={() => void respond("approve", latest.id)} className="w-full rounded-xl bg-amber-400 px-3 py-3 text-xs font-black text-slate-950 hover:bg-amber-300 disabled:opacity-50">{saving ? "Lagrer …" : "Datoen passer"}</button>
              {!showChange ? (
                <button type="button" onClick={() => setShowChange(true)} className="w-full rounded-lg border border-slate-700 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:text-white">Be om endring</button>
              ) : (
                <div className="space-y-2"><textarea value={note} onChange={e => setNote(e.target.value)} maxLength={2000} rows={3} placeholder="Hva bør endres?" className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs text-white" /><div className="flex gap-2"><button type="button" disabled={saving || !note.trim()} onClick={() => void respond("request_change", latest.id)} className="rounded-lg bg-slate-200 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">Send endringsønske</button><button type="button" onClick={() => setShowChange(false)} className="px-3 py-2 text-xs text-slate-400">Avbryt</button></div></div>
              )}
            </div>
          ) : approved ? (
            <div className="space-y-3"><p className="flex items-start gap-2 text-xs font-bold text-emerald-300"><CheckCircle2 className="h-4 w-4 shrink-0" /> Oppstart og varighet bekreftet</p><button type="button" disabled={saving} onClick={() => void respond("retry_create", latest.id)} className="w-full rounded-lg border border-slate-600 px-3 py-2.5 text-xs text-slate-200 disabled:opacity-50">Kontroller arbeidsavtale</button>{onOpenAgreement && <button type="button" onClick={onOpenAgreement} className="w-full rounded-xl bg-amber-400 px-3 py-3 text-xs font-black text-slate-950">Gå videre til arbeidsavtalen</button>}</div>
          ) : <p className="text-xs text-amber-200">{latest.status === "change_requested" ? "Endring er etterspurt. Avventer nytt forslag." : `Status: ${latest.status}`}</p>}
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-xs text-rose-300">{error}</p>}
      {message && <p role="status" className="mt-3 text-xs text-emerald-300">{message}</p>}
    </section>
  );
}
