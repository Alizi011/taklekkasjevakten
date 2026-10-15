import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Send, ShieldCheck } from "lucide-react";
import { apiUrl } from "../lib/api";

type State = "editing" | "awaiting_pm" | "awaiting_admin" | "returned" | "approved" | "published";
type Status = { success: boolean; state: State; report_id: number; assigned_project_manager_id?: number; content_unchanged?: boolean; workflow?: { return_comment?: string }; message?: string };
const labels: Record<State, string> = {
  editing: "Arbeid hos administrator", awaiting_pm: "Venter på prosjektansvarlig",
  awaiting_admin: "Faglig godkjent – venter på administrator", returned: "Returnert fra prosjektansvarlig",
  approved: "Sluttgodkjent – klargjør publisering", published: "Publisert til kunde"
};

/** Rapport 1: ingen redigering av PDF-mal, eller direkte statusoppdatering via reports.php. */
export default function ReportApprovalWorkflow({ inquiryId, reportId, dirty, pdfUrl, onUpdated, onState }: {
  inquiryId: number; reportId: number; dirty: boolean; pdfUrl?: string | null; onUpdated?: () => void; onState?: (state: State) => void;
}) {
  const [data, setData] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      const response = await fetch(apiUrl("/tlv_report_approval_workflow.php"), {
        method: "POST", credentials: "include", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", inquiry_id: inquiryId }),
      });
      const json = (await response.json()) as Status;
      if (!response.ok || !json.success) throw new Error(json.message || "Kunne ikke hente godkjenningsstatus.");
      setData(json.report_id === reportId ? json : null);
      if (json.report_id === reportId) onState?.(json.state);
      if (json.report_id !== reportId) throw new Error("Rapportversjonen ble endret. Last siden på nytt.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Kunne ikke hente godkjenningsstatus."); }
  }, [inquiryId, reportId]);
  useEffect(() => { void load(); }, [load]);
  const act = async (action: "submit" | "admin_approve" | "publish") => {
    if (dirty || busy || !data || data.report_id !== reportId) return;
    if (action === "publish" && !window.confirm("Publiser denne sluttgodkjente rapporten til kunden?")) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const res = await fetch(apiUrl("/tlv_report_approval_workflow.php"), {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, inquiry_id: inquiryId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Handlingen ble avvist.");
      setNotice("Godkjenningsflyten er oppdatert.");
      await load(); onUpdated?.();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Handlingen feilet."); }
    finally { setBusy(false); }
  };
  const state = data?.state;
  return <section className="rounded-2xl border border-amber-500/25 bg-[#0b0f17] p-5 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-[10px] font-black uppercase tracking-wide text-amber-300">Rapport 1 · Godkjenningsflyt</p>
        <h3 className="mt-1 text-sm font-extrabold text-white">{state ? labels[state] : "Henter godkjenningsstatus"}</h3></div>
      <button type="button" onClick={() => void load()} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300">Oppdater status</button>
    </div>
    {data?.workflow?.return_comment && <p className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 text-xs text-orange-200 whitespace-pre-wrap">Tilbakemelding: {data.workflow.return_comment}</p>}
    {dirty && <p className="text-xs text-amber-300">Lagre alle rapportendringer før innsending eller godkjenning.</p>}
    {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
    {notice && <p className="text-xs text-emerald-300">{notice}</p>}
    <div className="flex flex-wrap gap-2">
      {(state === "editing" || state === "returned") && <button type="button" onClick={() => void act("submit")} disabled={busy || dirty}
        className="flex items-center gap-2 rounded-xl bg-[#F5B800] px-4 py-2.5 text-xs font-black text-slate-950 disabled:opacity-40"><Send size={15}/> Send til prosjektansvarlig</button>}
      {state === "awaiting_admin" && <button type="button" onClick={() => void act("admin_approve")} disabled={busy || dirty || !data?.content_unchanged}
        className="flex items-center gap-2 rounded-xl border border-emerald-500/40 px-4 py-2.5 text-xs font-bold text-emerald-300 disabled:opacity-40"><ShieldCheck size={15}/> Sluttgodkjenn</button>}
      {state === "approved" && <button type="button" onClick={() => void act("publish")} disabled={busy || dirty || !pdfUrl || !data?.content_unchanged}
        className="flex items-center gap-2 rounded-xl bg-[#F5B800] px-4 py-2.5 text-xs font-black text-slate-950 disabled:opacity-40"><CheckCircle2 size={15}/> Publiser til kunde</button>}
      {busy && <Loader2 size={18} className="animate-spin text-amber-300"/>}
    </div>
    {state === "approved" && <p className="text-[11px] text-slate-400">Endelig PDF må være generert etter sluttgodkjenning. Serveren kontrollerer dokumentets fingeravtrykk før publisering.</p>}
  </section>;
}
