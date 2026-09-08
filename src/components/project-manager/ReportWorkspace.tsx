import {
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Save,
  Send,
  Sparkles,
} from "lucide-react";

export type ReportStatus =
  | "utkast"
  | "sendt_til_admin"
  | "under_gjennomgang"
  | "returnert_til_prosjektansvarlig"
  | "godkjent"
  | "publisert";

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
}

function statusLabel(status?: ReportStatus) {
  switch (status) {
    case "utkast":
      return "Rapportutkast";
    case "sendt_til_admin":
      return "Sendt til admin";
    case "under_gjennomgang":
      return "Under admin-gjennomgang";
    case "returnert_til_prosjektansvarlig":
      return "Returnert fra admin";
    case "godkjent":
      return "Godkjent";
    case "publisert":
      return "Publisert til kunde";
    default:
      return "Ikke startet";
  }
}

export default function ReportWorkspace({
  report,
  draft,
  onDraftChange,
  loading = false,
  generatingAi = false,
  saving = false,
  generatingPdf = false,
  sending = false,
  error,
  message,
  onGenerateAi,
  onSave,
  onGeneratePdf,
  onSendToAdmin,
  onOpenPdf,
}: ReportWorkspaceProps) {
  const locked =
    report?.status === "sendt_til_admin" ||
    report?.status === "under_gjennomgang" ||
    report?.status === "godkjent" ||
    report?.status === "publisert";

  return (
    <section className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-5 md:p-6">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-black text-white">
              Rapport
            </h3>
          </div>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">
            Generer et førsteutkast med AI, korriger manuelt og send til admin for kvalitetssikring.
          </p>
        </div>

        <span className="inline-flex self-start rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-[10px] font-black text-slate-300">
          {statusLabel(report?.status)}
        </span>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
          {message}
        </div>
      )}

      {report?.admin_notes && (
        <div className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/[0.05] p-4">
          <p className="text-[9px] font-black uppercase tracking-wider text-amber-300">
            Tilbakemelding fra admin
          </p>
          <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-300">
            {report.admin_notes}
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-xs text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Henter rapport...
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-col justify-between gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 text-violet-300" />
              <div>
                <p className="text-xs font-black text-white">
                  AI-assistent
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  AI lager utkast fra registrerte funn og dokumentasjon. Du har full redigeringskontroll.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onGenerateAi}
              disabled={generatingAi || locked}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-xs font-black text-white hover:bg-violet-400 disabled:opacity-40"
            >
              {generatingAi ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generer rapportutkast
            </button>
          </div>

          <textarea
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            readOnly={locked}
            rows={22}
            placeholder="Rapportteksten vises her..."
            className="mt-4 w-full resize-y rounded-2xl border border-slate-800 bg-[#08111d] p-4 text-sm leading-6 text-slate-200 outline-none focus:border-amber-500/50 read-only:cursor-default read-only:opacity-80"
          />

          <div className="mt-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onSave}
                disabled={saving || locked}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-extrabold text-slate-200 hover:bg-slate-800 disabled:opacity-40"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Lagre
              </button>

              <button
                type="button"
                onClick={onGeneratePdf}
                disabled={generatingPdf || !draft.trim()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-extrabold text-slate-200 hover:bg-slate-800 disabled:opacity-40"
              >
                {generatingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Generer PDF
              </button>

              {report?.pdf_url && onOpenPdf && (
                <button
                  type="button"
                  onClick={onOpenPdf}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-xs font-extrabold text-emerald-300"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Kontroller PDF
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onSendToAdmin}
              disabled={
                sending ||
                !report?.pdf_url ||
                report?.status === "sendt_til_admin" ||
                report?.status === "under_gjennomgang" ||
                report?.status === "godkjent" ||
                report?.status === "publisert"
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5B800] px-5 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-400 disabled:opacity-40"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send til admin
            </button>
          </div>
        </>
      )}
    </section>
  );
}