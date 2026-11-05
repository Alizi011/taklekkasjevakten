import { useState } from "react";
import {
  CheckCircle2, Download, FileText, Loader2, Save, Send,
  Sparkles, ShieldCheck, RotateCcw, Eye, LockKeyhole, AlertTriangle,
} from "lucide-react";

export type ReportStatus =
  | "utkast" | "sendt_til_admin" | "under_gjennomgang"
  | "returnert_til_prosjektansvarlig" | "godkjent" | "publisert";
export type ApprovalState = "editing" | "awaiting_pm" | "awaiting_admin" | "approved" | "published" | "returned";

export interface ReportWorkspaceReport {
  id: number;
  inquiry_id: number;
  ai_draft: string | null;
  admin_final: string | null;
  admin_notes?: string | null;
  pdf_url?: string | null;
  status: ReportStatus;
  updated_at?: string | null;
}

interface ReportWorkspaceProps {
  report: ReportWorkspaceReport | null;
  draft: string;
  onDraftChange: (value: string) => void;
  loading?: boolean;
  generatingAi?: boolean;
  saving?: boolean;
  generatingPdf?: boolean;
  sending?: boolean;
  error?: string;
  message?: string;
  onGenerateAi: () => void;
  onSave: () => void;
  onGeneratePdf: () => void;
  onSendToAdmin: () => void;
  onOpenPdf?: () => void;
  // Status og handlinger skal leveres av autorisert workflow-API, aldri TLV-status alene.
  approvalState?: ApprovalState | null;
  approvalLoading?: boolean;
  approvalError?: string;
  approvalBusy?: boolean;
  approvedPdfUrl?: string | null;
  onOpenApprovalPdf?: () => void;
  onApprove?: () => Promise<void> | void;
  onReturn?: (comment: string) => Promise<void> | void;
}

const statusText: Record<ReportStatus, string> = {
  utkast: "Utkast", sendt_til_admin: "Sendt til administrator",
  under_gjennomgang: "Under administrativ gjennomgang",
  returnert_til_prosjektansvarlig: "Returnert for korrigering",
  godkjent: "Sluttgodkjent", publisert: "Publisert",
};

export default function ReportWorkspace(props: ReportWorkspaceProps) {
  const {
    report, draft, onDraftChange, loading = false, generatingAi = false,
    saving = false, generatingPdf = false, sending = false,
    error, message, onGenerateAi, onSave, onGeneratePdf, onSendToAdmin, onOpenPdf,
    approvalState, approvalLoading = false, approvalError, approvalBusy = false,
    approvedPdfUrl, onOpenApprovalPdf, onApprove, onReturn,
  } = props;
  const [returnComment, setReturnComment] = useState("");
  const [showReturn, setShowReturn] = useState(false);
  const awaitingMe = approvalState === "awaiting_pm";
  const editingAllowed = report?.status === "utkast" || report?.status === "returnert_til_prosjektansvarlig";
  const draftLocked = !editingAllowed;
  const workflowLabel = awaitingMe ? "Krever din godkjenning"
    : approvalState === "awaiting_admin" ? "Faglig godkjent – hos administrator"
    : approvalState === "approved" ? "Sluttgodkjent"
    : approvalState === "published" ? "Publisert"
    : approvalState === "returned" ? "Returnert for korrigering"
    : "Ingen ny godkjenningsoppgave";

  return (
    <div className="space-y-5">
      <section className={`rounded-3xl border p-5 md:p-6 ${awaitingMe ? "border-amber-500/50 bg-amber-500/[0.05]" : "border-slate-800 bg-[#0b0f17]"}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">Rapport 1 · Faglig kontroll</p>
            <h3 className="mt-2 flex items-center gap-2 text-lg font-black text-white"><ShieldCheck className="h-5 w-5"/> {workflowLabel}</h3>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">
              {awaitingMe
                ? "Administrator har sendt sin rapportversjon til deg. Les den ferdige PDF-en, og godkjenn faglig eller returner med kommentar."
                : "Når administrator sender en ferdig rapport til faglig godkjenning, vises oppgaven her."}
            </p>
          </div>
          {approvalLoading && <Loader2 className="h-5 w-5 animate-spin text-amber-400"/>}
        </div>
        {approvalError && <p role="alert" className="mt-3 flex gap-2 text-xs text-red-300"><AlertTriangle className="h-4 w-4"/>{approvalError}</p>}
        {awaitingMe && (
          <div className="mt-5 space-y-3 border-t border-amber-500/20 pt-4">
            <p className="text-xs font-bold text-white">Rapporten er låst for redigering mens du vurderer den.</p>
            <div className="flex flex-wrap gap-2">
              {onOpenApprovalPdf && (
                <button type="button" onClick={onOpenApprovalPdf} className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-xs font-bold text-white">
                  <Eye className="h-4 w-4"/> Se rapporten som skal godkjennes
                </button>
              )}
              {!onOpenApprovalPdf && approvedPdfUrl && (
                <a href={approvedPdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-xs font-bold text-white">
                  <Eye className="h-4 w-4"/> Åpne rapport
                </a>
              )}
              <button type="button" onClick={() => void onApprove?.()} disabled={approvalBusy || !onApprove || !(onOpenApprovalPdf || approvedPdfUrl)} className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40">
                <CheckCircle2 className="h-4 w-4"/> Godkjenn faglig
              </button>
              <button type="button" onClick={() => setShowReturn(v => !v)} disabled={approvalBusy || !onReturn} className="flex items-center gap-2 rounded-xl border border-red-500/40 px-4 py-2.5 text-xs font-bold text-red-300 disabled:opacity-40">
                <RotateCcw className="h-4 w-4"/> Returner med kommentar
              </button>
            </div>
            {showReturn && <div className="space-y-2">
              <textarea rows={3} value={returnComment} onChange={e => setReturnComment(e.target.value)} placeholder="Beskriv konkret hva administrator må korrigere" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white"/>
              <button type="button" disabled={approvalBusy || !returnComment.trim()} onClick={() => { void onReturn?.(returnComment.trim()); }} className="rounded-xl bg-red-800 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40">Send retur til administrator</button>
            </div>}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="flex items-center gap-2 text-base font-black text-white"><FileText className="h-5 w-5 text-amber-400"/> Feltutkast og rapportgrunnlag</h3>
            <p className="mt-1 text-[11px] text-slate-500">Denne delen brukes til å utarbeide og sende ditt opprinnelige utkast til administrator.</p>
          </div>
          <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-[10px] font-bold text-slate-300">{report ? statusText[report.status] : "Ikke startet"}</span>
        </div>
        {error && <p role="alert" className="mt-4 text-xs text-red-300">{error}</p>}
        {message && <p className="mt-4 text-xs text-emerald-300">{message}</p>}
        {report?.admin_notes && <div className="mt-4 rounded-xl border border-amber-500/25 p-4"><p className="text-xs font-black text-amber-300">Kommentar fra administrator</p><p className="mt-2 whitespace-pre-wrap text-xs text-slate-300">{report.admin_notes}</p></div>}
        {loading ? <div className="flex items-center gap-2 py-12 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin"/> Henter rapport...</div> : <>
          {draftLocked ? <p className="mt-4 flex items-center gap-2 text-xs text-slate-400"><LockKeyhole className="h-4 w-4"/> Feltutkastet er skrivebeskyttet i denne fasen.</p> :
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-4">
            <p className="flex items-center gap-2 text-xs text-slate-300"><Sparkles className="h-4 w-4 text-violet-300"/> AI kan lage et førsteutkast som du kontrollerer.</p>
            <button type="button" onClick={onGenerateAi} disabled={generatingAi} className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40">{generatingAi ? "Genererer…" : "Generer AI-utkast"}</button>
          </div>}
          <textarea rows={12} value={draft} onChange={e => onDraftChange(e.target.value)} readOnly={draftLocked} placeholder="Rapportutkastet vises her..." className="mt-4 w-full rounded-2xl border border-slate-800 bg-[#08111d] p-4 text-xs leading-6 text-slate-200 read-only:opacity-70"/>
          <div className="mt-4 flex flex-wrap gap-2">
            {editingAllowed && <>
              <button type="button" onClick={onSave} disabled={saving} className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40"><Save className="h-4 w-4"/> Lagre</button>
              <button type="button" onClick={onGeneratePdf} disabled={generatingPdf || !draft.trim()} className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40"><Download className="h-4 w-4"/> Generer utkast-PDF</button>
              <button type="button" onClick={onSendToAdmin} disabled={sending || !report?.pdf_url} className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950 disabled:opacity-40"><Send className="h-4 w-4"/> Send utkast til admin</button>
            </>}
            {report?.pdf_url && onOpenPdf && <button type="button" onClick={onOpenPdf} className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-200"><Eye className="h-4 w-4"/> Se tidligere PDF</button>}
          </div>
        </>}
      </section>
    </div>
  );
}
