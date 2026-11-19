import { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";
import { Download, FileText, Loader2 } from "lucide-react";

export type CoreHistoricalDocument = {
  id: number;
  name: string;
  document_type: string;
  mime_type: string;
  created_at: string | null;
  document_date: string | null;
};
export function useHistoricalDocuments(projectId: number) {
  const [documents, setDocuments] = useState<CoreHistoricalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    void fetch(apiUrl(`/admin_historical_tlv_documents.php?project_id=${projectId}`), {
      credentials: "include", cache: "no-store", signal: controller.signal,
    }).then(async res => {
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.success !== true || !Array.isArray(data.documents)) {
        throw new Error(data?.message || "Kunne ikke hente dokumentoversikten.");
      }
      if (!controller.signal.aborted) setDocuments(data.documents);
    }).catch(err => {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Dokumentoversikt utilgjengelig.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [projectId]);
  return { documents, loading, error };
}
export function isHistoricalReport(item: CoreHistoricalDocument) {
  return /report|rapport/i.test(item.document_type);
}
function label(item: CoreHistoricalDocument) {
  if (isHistoricalReport(item)) return "Historisk rapport";
  if (/invoice|faktura|bilag/i.test(item.document_type)) return "Bilag / faktura";
  return "Prosjektdokument";
}
export default function HistoricalCoreDocuments({
  items, loading, error, mode
}: {
  items: CoreHistoricalDocument[];
  loading: boolean;
  error: string;
  mode: "reports" | "documents";
}) {
  const [busy, setBusy] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState("");
  const filtered = items.filter(item => mode === "reports" ? isHistoricalReport(item) : !isHistoricalReport(item));
  const openFile = async (item: CoreHistoricalDocument) => {
    if (busy !== null) return;
    setBusy(item.id); setDownloadError("");
    try {
      const res = await fetch(apiUrl(`/admin_historical_tlv_documents.php?document_id=${item.id}`), {
        credentials: "include", cache: "no-store",
      });
      if (!res.ok) throw new Error("Kunne ikke åpne PDF-dokumentet.");
      const blob = await res.blob();
      if (blob.type !== "application/pdf") throw new Error("Uventet filformat.");
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = item.name.toLowerCase().endsWith(".pdf") ? item.name : item.name + ".pdf";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : "Nedlasting feilet.");
    } finally { setBusy(null); }
  };
  return <div className="space-y-3 p-4">
    <div><h3 className="text-sm font-black text-white">{mode === "reports" ? "Historiske rapporter" : "Historiske dokumenter"}</h3>
      <p className="mt-1 text-xs text-slate-400">Originale PDF-filer fra Perun Core. Kun tilgjengelig for administrator; filene endres ikke.</p></div>
    {loading && <p className="flex items-center gap-2 text-xs text-slate-300"><Loader2 size={14} className="animate-spin"/> Henter dokumenter …</p>}
    {error && <p role="alert" className="text-xs text-amber-300">{error}</p>}
    {downloadError && <p role="alert" className="text-xs text-red-300">{downloadError}</p>}
    {!loading && !error && filtered.length === 0 && <p className="rounded-lg border border-white/10 p-4 text-xs text-slate-400">Ingen {mode === "reports" ? "historiske rapporter" : "andre PDF-dokumenter"} registrert på prosjektet.</p>}
    {filtered.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700/70 bg-slate-950/40 p-3">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <FileText className="mt-0.5 shrink-0 text-cyan-300" size={19}/>
        <div className="min-w-0"><p className="break-words text-sm font-semibold">{item.name}</p>
          <p className="mt-1 text-[11px] text-slate-400">{label(item)} · {item.document_date?.slice(0,10) || item.created_at?.slice(0,10) || "Dato mangler"} · PDF</p></div>
      </div>
      <button type="button" disabled={busy !== null} onClick={() => void openFile(item)}
        className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50">
        <Download size={15}/>{busy === item.id ? "Henter …" : "Last ned PDF"}
      </button>
    </div>)}
  </div>;
}
