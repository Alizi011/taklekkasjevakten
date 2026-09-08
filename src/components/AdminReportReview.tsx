import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  FileText,
  Loader2,
  Save,
  Send,
  ShieldCheck,
  AlertTriangle,
  Eye,
  RotateCcw,
  MessageSquareText,
} from "lucide-react";
import { apiUrl, apiAssetUrl } from "../lib/api";
export type ReportStatus =
  | "utkast"
  | "sendt_til_admin"
  | "under_gjennomgang"
  | "returnert_til_prosjektansvarlig"
  | "godkjent"
  | "publisert";

export interface ReportData {
  id: number;
  inquiry_id: number;
  ai_draft: string | null;
  admin_final: string | null;
  admin_notes?: string | null;
  pdf_url?: string | null;
  status: ReportStatus;
  created_at?: string | null;
  submitted_at?: string | null;
  returned_at?: string | null;
  approved_at?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
}

interface AdminReportReviewProps {
  inquiryId: number;
}

function statusLabel(status?: ReportStatus) {
  switch (status) {
    case "utkast":
      return "Utkast hos feltteam";
    case "sendt_til_admin":
      return "Sendt til admin";
    case "under_gjennomgang":
      return "Under gjennomgang";
    case "returnert_til_prosjektansvarlig":
      return "Returnert til prosjektansvarlig";
    case "godkjent":
      return "Godkjent";
    case "publisert":
      return "Publisert til kunde";
    default:
      return "Ingen rapport";
  }
}

function statusClass(status?: ReportStatus) {
  switch (status) {
    case "sendt_til_admin":
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    case "under_gjennomgang":
      return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    case "returnert_til_prosjektansvarlig":
      return "bg-red-500/10 text-red-400 border-red-500/30";
    case "godkjent":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    case "publisert":
      return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
    case "utkast":
      return "bg-slate-800 text-slate-300 border-slate-700";
    default:
      return "bg-slate-900 text-slate-500 border-slate-800";
  }
}

export default function AdminReportReview({
  inquiryId,
}: AdminReportReviewProps) {
  const [report, setReport] = useState<ReportData | null>(null);
  const [adminText, setAdminText] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [returning, setReturning] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const editable = useMemo(
    () =>
      report?.status === "sendt_til_admin" ||
      report?.status === "under_gjennomgang" ||
      report?.status === "godkjent",
    [report?.status]
  );

  const fetchReport = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(apiUrl(`/reports.php?inquiry_id=${inquiryId}`));
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke hente rapporten.");
      }

      const nextReport: ReportData | null = data.report || null;
      setReport(nextReport);

      if (nextReport) {
        setAdminText(nextReport.admin_final || nextReport.ai_draft || "");
        setAdminNotes(nextReport.admin_notes || "");
      } else {
        setAdminText("");
        setAdminNotes("");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunne ikke hente rapporten."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (inquiryId > 0) {
      fetchReport();
    }
  }, [inquiryId]);

  const updateReport = async (
    payload: Record<string, unknown>,
    successMessage: string
  ) => {
    const res = await fetch(apiUrl("/reports.php"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inquiry_id: inquiryId,
        ...payload,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Kunne ikke oppdatere rapporten.");
    }

    const nextReport: ReportData = data.report;
    setReport(nextReport);
    setAdminText(nextReport.admin_final || nextReport.ai_draft || "");
    setAdminNotes(nextReport.admin_notes || "");
    setMessage(successMessage);
  };

  const handleSave = async () => {
    if (!report || !adminText.trim()) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await updateReport(
        {
          admin_final: adminText,
          status:
            report.status === "sendt_til_admin"
              ? "under_gjennomgang"
              : report.status,
        },
        "Admins sluttversjon er lagret."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunne ikke lagre rapporten."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReturnToProjectManager = async () => {
    if (!report || !adminNotes.trim()) {
      setError("Skriv en kommentar før rapporten returneres.");
      return;
    }

    const confirmed = window.confirm(
      "Returnere rapporten til prosjektansvarlig for korrigering?"
    );

    if (!confirmed) return;

    setReturning(true);
    setError("");
    setMessage("");

    try {
      await updateReport(
        {
          admin_final: adminText,
          admin_notes: adminNotes,
          status: "returnert_til_prosjektansvarlig",
        },
        "Rapporten er returnert til prosjektansvarlig med kommentar."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kunne ikke returnere rapporten."
      );
    } finally {
      setReturning(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (!report || !adminText.trim()) return;

    setGeneratingPdf(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        apiUrl(`/generate_report_pdf.php?inquiry_id=${inquiryId}`),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inquiry_id: inquiryId,
            admin_final: adminText,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success || !data.pdf_url) {
        throw new Error(
          data.message || "Kunne ikke generere PDF-forhåndsvisning."
        );
      }

      await updateReport(
        {
          admin_final: adminText,
          pdf_url: data.pdf_url,
        },
        "PDF-forhåndsvisning er generert."
      );

      window.open(apiAssetUrl(data.pdf_url), "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kunne ikke generere PDF-forhåndsvisning."
      );
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleApprove = async () => {
    if (!report || !adminText.trim()) return;

    setApproving(true);
    setError("");
    setMessage("");

    try {
      await updateReport(
        {
          admin_final: adminText,
          status: "godkjent",
        },
        "Rapporten er godkjent. Den er ennå ikke publisert til kunden."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunne ikke godkjenne rapporten."
      );
    } finally {
      setApproving(false);
    }
  };

  const handlePublish = async () => {
    if (!report || !adminText.trim()) return;

    if (report.status !== "godkjent") {
      setError("Rapporten må godkjennes før den kan publiseres.");
      return;
    }

    if (!report.pdf_url) {
      setError("Generer og kontroller PDF-en før rapporten publiseres.");
      return;
    }

    const confirmed = window.confirm(
      "Publisere denne rapporten til kunden nå? Kunden vil få tilgang til denne sluttversjonen."
    );

    if (!confirmed) return;

    setPublishing(true);
    setError("");
    setMessage("");

    try {
      await updateReport(
        {
          admin_final: adminText,
          pdf_url: report.pdf_url,
          status: "publisert",
        },
        "Rapporten er publisert og kan nå gjøres tilgjengelig i kundeportalen."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunne ikke publisere rapporten."
      );
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-[#F5B800]" />
          Henter rapportstatus...
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-extrabold text-white">
              Rapport til gjennomgang
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Feltteamet har ikke sendt inn noe rapportutkast ennå.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const notReadyForAdmin =
    report.status === "utkast" ||
    report.status === "returnert_til_prosjektansvarlig";

  return (
    <section className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#F5B800]" />
            Rapport til gjennomgang
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Feltteamets AI-utkast kvalitetssikres og sluttredigeres av admin før
            publisering til kunden.
          </p>
        </div>

        <span
          className={`inline-flex px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase border ${statusClass(
            report.status
          )}`}
        >
          {statusLabel(report.status)}
        </span>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-xs text-red-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-xs text-emerald-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          {message}
        </div>
      )}

      {notReadyForAdmin ? (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs text-slate-300 font-bold">
            {report.status === "returnert_til_prosjektansvarlig"
              ? "Rapporten er returnert til prosjektansvarlig."
              : "Rapportutkast finnes, men er ikke sendt til admin ennå."}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {report.status === "returnert_til_prosjektansvarlig"
              ? "Prosjektansvarlig må korrigere rapporten og sende den inn på nytt før admin kan fortsette."
              : "Prosjektansvarlig må først kvalitetssikre og sende utkastet fra feltportalen."}
          </p>
          {report.status === "returnert_til_prosjektansvarlig" &&
            report.admin_notes && (
              <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                <strong className="block mb-1">Admins kommentar</strong>
                {report.admin_notes}
              </div>
            )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-2">
                Feltteamets AI-utkast
              </label>
              <div className="min-h-[420px] max-h-[650px] overflow-y-auto whitespace-pre-wrap bg-slate-950 border border-slate-800 rounded-2xl p-5 text-xs leading-6 text-slate-400">
                {report.ai_draft || "Ingen AI-tekst lagret."}
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider font-extrabold text-amber-400 mb-2">
                Admins sluttversjon
              </label>
              <textarea
                value={adminText}
                onChange={(e) => setAdminText(e.target.value)}
                readOnly={!editable || report.status === "publisert"}
                className="w-full min-h-[420px] max-h-[650px] bg-slate-950 border border-amber-500/30 rounded-2xl p-5 text-xs leading-6 text-slate-200 resize-y outline-none focus:border-amber-500 read-only:opacity-80"
              />
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-2 flex items-center gap-2">
              <MessageSquareText className="w-4 h-4" />
              Kommentar til prosjektansvarlig
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              readOnly={report.status === "publisert"}
              placeholder="Brukes ved retur til prosjektansvarlig..."
              className="w-full min-h-[110px] bg-[#0b0f17] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 resize-y outline-none focus:border-amber-500 read-only:opacity-70"
            />
          </div>

          {report.pdf_url && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold text-cyan-300">
                  PDF-forhåndsvisning er klar
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Kontroller PDF-en før publisering til kunden.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  window.open(
                    report.pdf_url ? apiAssetUrl(report.pdf_url) : "",
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
                className="px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-extrabold flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Åpne PDF
              </button>
            </div>
          )}

          {report.status === "publisert" ? (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-4 py-3 text-xs text-cyan-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Rapporten er publisert til kunden og er låst i adminvisningen.
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 sm:justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !adminText.trim()}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-extrabold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Lagre endringer
              </button>

              <button
                type="button"
                onClick={handleReturnToProjectManager}
                disabled={returning || !adminNotes.trim()}
                className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-extrabold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {returning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                Returner til prosjektansvarlig
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={approving || !adminText.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {approving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                Godkjenn
              </button>

              <button
                type="button"
                onClick={handleGeneratePdf}
                disabled={generatingPdf || !adminText.trim()}
                className="px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-extrabold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {generatingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {report.pdf_url ? "Generer PDF på nytt" : "Forhåndsvis PDF"}
              </button>

              <button
                type="button"
                onClick={handlePublish}
                disabled={
                  publishing ||
                  !adminText.trim() ||
                  report.status !== "godkjent" ||
                  !report.pdf_url
                }
                className="px-5 py-2.5 rounded-xl bg-[#F5B800] hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {publishing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Publiser til kunde
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}