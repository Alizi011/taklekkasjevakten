import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  FileText,
  History,
  Sparkles,
  Building2,
  MapPin,
  BriefcaseBusiness,
  CircleHelp,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { apiUrl } from "../lib/api";

type SourceSystem = "auto" | "tripletex" | "entre_worker";
type ImportType =
  | "mixed"
  | "customers"
  | "employees"
  | "projects"
  | "time_entries"
  | "documents";

interface ImportResponse {
  success?: boolean;
  message?: string;
  batch_id?: number;
  total_records?: number;
  status?: string;
  matched_records?: number;
  duplicate_records?: number;
  error_records?: number;
  pending_records?: number;
}

interface ImportBatch {
  id: number | string;
  source_system: string;
  import_type: string;
  file_name?: string | null;
  file_size?: number | string | null;
  status: string;
  total_records?: number | string;
  matched_records?: number | string;
  duplicate_records?: number | string;
  error_records?: number | string;
  created_at?: string | null;
}

interface ImportRecord {
  id: number | string;
  external_id?: string | null;
  external_number?: string | null;
  status: string;
  raw_data?: Record<string, unknown> | null;
}


type SmartMatchStatus = "existing" | "extend_existing" | "new" | "review";
type SmartReviewStatus = "pending" | "approved" | "rejected" | "applied";

interface SmartImportItem {
  id: number;
  item_index: number;
  item_type:
    | "customer"
    | "property"
    | "project"
    | "invoice"
    | "offer"
    | "employee"
    | "time_entry"
    | "document"
    | "note"
    | "unknown";
  display_name?: string | null;
  extracted: Record<string, unknown>;
  match_status: SmartMatchStatus;
  matched_table?: string | null;
  matched_id?: number | null;
  matched_name?: string | null;
  confidence: number;
  recommendation_code?: string | null;
  recommendation_text?: string | null;
  action_payload?: Record<string, unknown> | null;
  review_status: SmartReviewStatus;
}

interface SmartImportResult {
  success: boolean;
  batch_id?: number;
  status?: string;
  message?: string;
  summary?: {
    document_summary?: string;
    detected_categories?: string[];
    item_count?: number;
    existing_count?: number;
    extend_count?: number;
    new_count?: number;
    review_count?: number;
  };
  items?: SmartImportItem[];
}

interface SmartApplyResponse {
  success: boolean;
  batch_id?: number;
  message?: string;
  applied_count?: number;
  skipped_count?: number;
  error_count?: number;
  results?: Array<{
    item_id: number;
    item_type: string;
    status: "applied" | "skipped" | "error";
    message?: string;
    matched_table?: string | null;
    matched_id?: number | null;
    matched_name?: string | null;
  }>;
}

interface SmartStatusResponse extends SmartImportResult {
  status?: string;
  error_message?: string | null;
}


interface SmartHistoryBatch {
  id: number;
  file_name: string;
  mime_type?: string | null;
  file_size?: number | null;
  source_hint?: string | null;
  ai_model?: string | null;
  status: string;
  summary?: {
    document_summary?: string;
    detected_categories?: string[];
    item_count?: number;
    existing_count?: number;
    extend_count?: number;
    new_count?: number;
    review_count?: number;
  } | null;
  error_message?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  items?: SmartImportItem[];
}

interface SmartHistoryResponse {
  success: boolean;
  message?: string;
  batches?: SmartHistoryBatch[];
  issues?: SmartImportItem[];
}

interface DataImportPageProps {
  activeView?: "new" | "history" | "issues";
}

const sourceLabels: Record<SourceSystem, string> = {
  auto: "Automatisk / blandet kilde",
  tripletex: "Tripletex",
  entre_worker: "Entré Worker",
};

const importTypeLabels: Record<ImportType, string> = {
  mixed: "Blandede data · AI analyserer",
  customers: "Kunder",
  employees: "Ansatte",
  projects: "Prosjekter",
  time_entries: "Timer",
  documents: "Dokumenter",
};

export default function DataImportPage({ activeView = "new" }: DataImportPageProps) {
  const [sourceSystem, setSourceSystem] = useState<SourceSystem>("auto");
  const [importType, setImportType] = useState<ImportType>("mixed");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [openBatchId, setOpenBatchId] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewRecords, setPreviewRecords] = useState<ImportRecord[]>([]);
  const [previewError, setPreviewError] = useState("");
  const [matchingBatchId, setMatchingBatchId] = useState<number | null>(null);
  const [matchMessage, setMatchMessage] = useState("");
  const [smartResult, setSmartResult] = useState<SmartImportResult | null>(null);
  const [smartDecisionBusyId, setSmartDecisionBusyId] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [smartHistory, setSmartHistory] = useState<SmartHistoryBatch[]>([]);
  const [smartIssues, setSmartIssues] = useState<SmartImportItem[]>([]);
  const [smartHistoryLoading, setSmartHistoryLoading] = useState(false);
  const [smartHistoryError, setSmartHistoryError] = useState("");
  const [smartApplyBusy, setSmartApplyBusy] = useState(false);
  const [smartApplyMessage, setSmartApplyMessage] = useState("");
  const [smartAnalyzingBatchId, setSmartAnalyzingBatchId] = useState<number | null>(null);
  const [smartAnalysisStatus, setSmartAnalysisStatus] = useState("");

  const readJsonResponse = async <T,>(response: Response): Promise<T> => {
    const raw = await response.text();

    if (!raw.trim()) {
      throw new Error(
        `Serveren svarte uten JSON-data (HTTP ${response.status}).`
      );
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      throw new Error(
        `Serveren svarte med ugyldig JSON (HTTP ${response.status}).`
      );
    }
  };

  const fileSize = useMemo(() => {
    if (!file) return "";
    const mb = file.size / (1024 * 1024);
    return mb < 1
      ? `${Math.max(1, Math.round(file.size / 1024))} KB`
      : `${mb.toFixed(1)} MB`;
  }, [file]);

  const loadSmartHistory = async () => {
    setSmartHistoryLoading(true);
    setSmartHistoryError("");

    try {
      const response = await fetch(
        apiUrl("/core-import/intelligent_history.php?include_items=1")
      );
      const data = await readJsonResponse<SmartHistoryResponse>(response);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Kunne ikke hente intelligent importhistorikk."
        );
      }

      setSmartHistory(Array.isArray(data.batches) ? data.batches : []);
      setSmartIssues(Array.isArray(data.issues) ? data.issues : []);
    } catch (error) {
      setSmartHistoryError(
        error instanceof Error
          ? error.message
          : "Kunne ikke hente intelligent importhistorikk."
      );
    } finally {
      setSmartHistoryLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await fetch(apiUrl("/core-import/history.php"));
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke hente importhistorikk.");
      }

      setBatches(Array.isArray(data.batches) ? data.batches : []);
    } catch (error) {
      setHistoryError(
        error instanceof Error ? error.message : "Kunne ikke hente importhistorikk."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    loadSmartHistory();
  }, []);

  useEffect(() => {
    if (activeView === "history" || activeView === "issues") {
      loadHistory();
      loadSmartHistory();
    }
  }, [activeView]);

  const loadPreview = async (batchId: number) => {
    if (openBatchId === batchId) {
      setOpenBatchId(null);
      setPreviewRecords([]);
      setPreviewError("");
      return;
    }

    setOpenBatchId(batchId);
    setPreviewLoading(true);
    setPreviewRecords([]);
    setPreviewError("");

    try {
      const response = await fetch(
        apiUrl(`/core-import/preview.php?batch_id=${batchId}`)
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke hente importdetaljer.");
      }

      setPreviewRecords(Array.isArray(data.records) ? data.records : []);
    } catch (error) {
      setPreviewError(
        error instanceof Error ? error.message : "Kunne ikke hente importdetaljer."
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const runMatch = async (batchId: number) => {
    setMatchingBatchId(batchId);
    setMatchMessage("");

    try {
      const response = await fetch(apiUrl("/core-import/match.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: batchId }),
      });

      const data: ImportResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Matching feilet.");
      }

      setMatchMessage(
        `Analyse fullført: ${Number(data.matched_records || 0)} matchet, ` +
        `${Number(data.pending_records || 0)} ny(e), ` +
        `${Number(data.duplicate_records || 0)} duplikat(er), ` +
        `${Number(data.error_records || 0)} feil.`
      );

      await loadHistory();

      // Reload preview without toggling it closed.
      setPreviewLoading(true);
      setPreviewError("");

      const previewResponse = await fetch(
        apiUrl(`/core-import/preview.php?batch_id=${batchId}`)
      );
      const previewData = await previewResponse.json();

      if (!previewResponse.ok || !previewData.success) {
        throw new Error(previewData.message || "Kunne ikke oppdatere visningen.");
      }

      setOpenBatchId(batchId);
      setPreviewRecords(
        Array.isArray(previewData.records) ? previewData.records : []
      );
    } catch (error) {
      setMatchMessage(
        error instanceof Error ? error.message : "Matching av importen feilet."
      );
    } finally {
      setPreviewLoading(false);
      setMatchingBatchId(null);
    }
  };

  const handleSelectedFile = (selected: File | null) => {
    if (!selected) return;

    const extension = selected.name.split(".").pop()?.toLowerCase() || "";
    const allowed = ["pdf", "csv", "json", "txt", "xlsx", "docx"];

    if (!allowed.includes(extension)) {
      setMessage(
        "Filtypen støttes ikke. Bruk PDF, CSV, JSON, TXT, XLSX eller DOCX."
      );
      setFile(null);
      return;
    }

    setFile(selected);
    setMessage("");
    setResult(null);
    setSmartResult(null);
  };

  const resetFile = () => {
    setFile(null);
    setMessage("");
    setResult(null);
    setSmartResult(null);
  };

  const waitForSmartAnalysis = async (
    batchId: number
  ): Promise<SmartImportResult> => {
    const startedAt = Date.now();
    const maxWaitMs = 10 * 60 * 1000;

    setSmartAnalyzingBatchId(batchId);

    try {
      while (Date.now() - startedAt < maxWaitMs) {
        const response = await fetch(
          apiUrl(
            `/core-import/intelligent_status.php?batch_id=${batchId}&_=${Date.now()}`
          ),
          { cache: "no-store" }
        );

        const data = await readJsonResponse<SmartStatusResponse>(response);

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Kunne ikke hente analysestatus."
          );
        }

        const status = String(data.status || "");

        setSmartAnalysisStatus(
          status === "uploaded"
            ? "Filen er lastet opp…"
            : status === "extracting"
              ? "Leser og trekker ut data fra filen…"
              : status === "analyzing"
                ? "AI analyserer og sammenligner mot perun_core…"
                : status === "review"
                  ? "Analysen er ferdig."
                  : status === "completed"
                    ? "Importen er ferdig."
                    : status === "failed"
                      ? "Analysen feilet."
                      : "Behandler importen…"
        );

        if (status === "review" || status === "completed") {
          return data;
        }

        if (status === "failed") {
          throw new Error(
            data.error_message ||
              data.message ||
              "Den intelligente analysen feilet."
          );
        }

        await new Promise((resolve) =>
          window.setTimeout(resolve, 2000)
        );
      }

      throw new Error(
        "Analysen kjører fortsatt, men nettleseren sluttet å vente etter 10 minutter. Du kan finne importen i Importhistorikk."
      );
    } finally {
      setSmartAnalyzingBatchId(null);
    }
  };

  const uploadToStaging = async () => {
    if (!file) {
      setMessage("Velg en fil først.");
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const useIntelligentImport =
      sourceSystem === "auto" ||
      importType === "mixed" ||
      extension !== "csv";

    setBusy(true);
    setMessage("");
    setResult(null);
    setSmartResult(null);

    try {
      if (useIntelligentImport) {
        const form = new FormData();
        form.append("file", file);
        form.append("source_hint", sourceSystem);

        setSmartAnalysisStatus("Laster opp filen…");

        const uploadResponse = await fetch(
          apiUrl("/core-import/intelligent_upload.php"),
          {
            method: "POST",
            body: form,
          }
        );

        const uploadData =
          await readJsonResponse<SmartImportResult>(uploadResponse);

        if (
          !uploadResponse.ok ||
          !uploadData.success ||
          !uploadData.batch_id
        ) {
          throw new Error(
            uploadData.message || "Filopplastingen feilet."
          );
        }

        const batchId = Number(uploadData.batch_id);

        setMessage(
          `Import #${batchId} er lastet opp. Starter intelligent analyse…`
        );
        setFile(null);
        setSmartAnalysisStatus("Starter analysen…");

        const startResponse = await fetch(
          apiUrl("/core-import/intelligent_analyze.php"),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ batch_id: batchId }),
          }
        );

        const startData =
          await readJsonResponse<SmartStatusResponse>(startResponse);

        if (!startResponse.ok || !startData.success) {
          throw new Error(
            startData.message || "Kunne ikke starte analysen."
          );
        }

        const finalData = await waitForSmartAnalysis(batchId);

        setSmartResult(finalData);
        setSmartAnalysisStatus("");
        setMessage(
          `Analyse #${batchId}: ${Number(
            finalData.summary?.item_count || 0
          )} funn klare til kontroll.`
        );

        await loadSmartHistory();
        return;
      }

      const form = new FormData();
      form.append("source_system", sourceSystem);
      form.append("import_type", importType);
      form.append("file", file);

      const response = await fetch(apiUrl("/core-import/upload.php"), {
        method: "POST",
        body: form,
      });

      const data: ImportResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Import-API svarte med en feil.");
      }

      if (!data.batch_id) {
        throw new Error("Importen mangler batch_id.");
      }

      const parseResponse = await fetch(apiUrl("/core-import/parse.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: data.batch_id }),
      });

      const parseData: ImportResponse = await parseResponse.json();

      if (!parseResponse.ok || !parseData.success) {
        throw new Error(
          parseData.message ||
            `Filen ble lastet opp som import #${data.batch_id}, men parsing feilet.`
        );
      }

      setResult(parseData);
      setMessage(
        `Import #${data.batch_id} er lest inn og klar til kontroll. ${Number(
          parseData.total_records || 0
        )} rad(er) funnet.`
      );
      setFile(null);
      await loadHistory();
      await loadPreview(Number(data.batch_id));
    } catch (error) {
      setSmartAnalysisStatus("");
      setMessage(
        error instanceof Error
          ? error.message
          : "Kunne ikke analysere importfilen."
      );
    } finally {
      setBusy(false);
    }
  };

  const applyApprovedItems = async (batchId: number) => {
    if (!batchId || smartApplyBusy) return;

    const confirmed = window.confirm(
      "Utføre alle godkjente endringer i perun_core? Nye kunder, eiendommer og prosjekter vil da bli opprettet i masterdata."
    );

    if (!confirmed) return;

    setSmartApplyBusy(true);
    setSmartApplyMessage("");

    try {
      const response = await fetch(
        apiUrl("/core-import/intelligent_apply.php"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batch_id: batchId }),
        }
      );

      const data = await readJsonResponse<SmartApplyResponse>(response);

      if (!response.ok && response.status !== 207) {
        throw new Error(
          data.message || "Kunne ikke gjennomføre godkjent import."
        );
      }

      setSmartApplyMessage(
        `${data.message || "Import behandlet"} ` +
          `${Number(data.applied_count || 0)} gjennomført, ` +
          `${Number(data.skipped_count || 0)} hoppet over, ` +
          `${Number(data.error_count || 0)} feil.`
      );

      if (smartResult?.batch_id === batchId && smartResult.items) {
        const appliedIds = new Set(
          (data.results || [])
            .filter((result) => result.status === "applied")
            .map((result) => Number(result.item_id))
        );

        setSmartResult((current) => {
          if (!current?.items) return current;

          return {
            ...current,
            status:
              Number(data.error_count || 0) === 0
                ? "completed"
                : current.status,
            items: current.items.map((item) =>
              appliedIds.has(Number(item.id))
                ? { ...item, review_status: "applied" }
                : item
            ),
          };
        });
      }

      await loadHistory();
      await loadSmartHistory();
    } catch (error) {
      setSmartApplyMessage(
        error instanceof Error
          ? error.message
          : "Kunne ikke gjennomføre godkjent import."
      );
    } finally {
      setSmartApplyBusy(false);
    }
  };

  const setSmartDecision = async (
    itemId: number,
    decision: "approved" | "rejected"
  ) => {
    setSmartDecisionBusyId(itemId);

    try {
      const response = await fetch(
        apiUrl("/core-import/intelligent_decision.php"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item_id: itemId,
            decision,
          }),
        }
      );

      const data = await readJsonResponse<{ success?: boolean; message?: string }>(response);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Kunne ikke lagre beslutningen."
        );
      }

      setSmartResult((current) => {
        if (!current?.items) return current;

        return {
          ...current,
          items: current.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  review_status: decision,
                }
              : item
          ),
        };
      });

      setSmartIssues((current) =>
        current.map((item) =>
          item.id === itemId
            ? { ...item, review_status: decision }
            : item
        )
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Kunne ikke lagre beslutningen."
      );
    } finally {
      setSmartDecisionBusyId(null);
    }
  };

  if (activeView === "history") {
    const rows = [
      ...smartHistory.map((batch) => ({
        key: `ai-${batch.id}`,
        type: "AI",
        file: batch.file_name,
        date: batch.created_at,
        status: batch.status,
        total: Number(batch.summary?.item_count || 0),
        matched: Number(batch.summary?.existing_count || 0),
        issues: Number(batch.summary?.review_count || 0),
        note: batch.summary?.document_summary || "",
        error: batch.error_message || "",
        batchId: batch.id,
        approvedCount: Number(
          (batch.items || []).filter(
            (item) => item.review_status === "approved"
          ).length
        ),
      })),
      ...batches.map((batch) => ({
        key: `classic-${batch.id}`,
        type: "Klassisk",
        file: batch.file_name || "Ukjent fil",
        date: batch.created_at,
        status: batch.status,
        total: Number(batch.total_records || 0),
        matched: Number(batch.matched_records || 0),
        issues:
          Number(batch.duplicate_records || 0) +
          Number(batch.error_records || 0),
        note:
          sourceLabels[batch.source_system as SourceSystem] ||
          batch.source_system,
        error: "",
        batchId: null as number | null,
        approvedCount: 0,
      })),
    ].sort((a, b) =>
      String(b.date || "").localeCompare(String(a.date || ""))
    );

    return (
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-300" />
                <h3 className="text-base font-black text-white">
                  Importhistorikk
                </h3>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Historikk fra både ordinær dataimport og intelligent AI-import.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                loadHistory();
                loadSmartHistory();
              }}
              disabled={historyLoading || smartHistoryLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-[10px] font-black text-slate-300 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  historyLoading || smartHistoryLoading ? "animate-spin" : ""
                }`}
              />
              Oppdater
            </button>
          </div>
        </section>

        {(historyError || smartHistoryError) && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3 text-xs text-red-300">
            {historyError || smartHistoryError}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
          <div className="divide-y divide-slate-800/70">
            {rows.length === 0 ? (
              <div className="p-5 text-xs text-slate-500">
                Ingen importhistorikk registrert.
              </div>
            ) : (
              rows.map((row) => (
                <div
                  key={row.key}
                  className="grid gap-4 px-5 py-4 md:grid-cols-[90px_minmax(0,1fr)_160px_130px_90px_90px_90px]"
                >
                  <div>
                    <span
                      className={`rounded-md border px-2 py-1 text-[9px] font-black ${
                        row.type === "AI"
                          ? "border-violet-500/20 bg-violet-500/10 text-violet-300"
                          : "border-blue-500/20 bg-blue-500/10 text-blue-300"
                      }`}
                    >
                      {row.type}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-xs font-black text-white">
                      {row.file}
                    </div>
                    <div className="mt-1 truncate text-[10px] text-slate-600">
                      {row.note || "—"}
                    </div>
                    {row.error && (
                      <div className="mt-1 text-[10px] text-red-300">
                        {row.error}
                      </div>
                    )}
                    {row.batchId && row.approvedCount > 0 && (
                      <button
                        type="button"
                        onClick={() => applyApprovedItems(Number(row.batchId))}
                        disabled={smartApplyBusy}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-[9px] font-black text-emerald-300 disabled:opacity-50"
                      >
                        {smartApplyBusy && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                        Utfør {row.approvedCount} godkjent(e)
                      </button>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400">
                    {row.date
                      ? new Date(row.date).toLocaleString("nb-NO")
                      : "—"}
                  </div>

                  <div className="text-[10px] font-black text-amber-300">
                    {row.status === "review"
                      ? "Klar til kontroll"
                      : row.status}
                  </div>

                  <div>
                    <div className="text-[9px] text-slate-600">Funn</div>
                    <div className="text-xs font-black text-white">
                      {row.total}
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] text-slate-600">Matchet</div>
                    <div className="text-xs font-black text-blue-300">
                      {row.matched}
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] text-slate-600">Avvik</div>
                    <div
                      className={`text-xs font-black ${
                        row.issues > 0 ? "text-red-300" : "text-slate-500"
                      }`}
                    >
                      {row.issues}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    );
  }

  if (activeView === "issues") {
    const classicIssues = batches.filter(
      (batch) =>
        Number(batch.error_records || 0) > 0 ||
        Number(batch.duplicate_records || 0) > 0
    );

    const aiIssues = smartIssues.filter(
      (item) =>
        item.match_status === "review" ||
        item.match_status === "extend_existing"
    );

    return (
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-300" />
            <h3 className="text-base font-black text-white">Feil / avvik</h3>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Usikre matcher, avvikende opplysninger, duplikater og importfeil
            som krever kontroll.
          </p>
        </section>

        {(historyError || smartHistoryError) && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3 text-xs text-red-300">
            {historyError || smartHistoryError}
          </div>
        )}

        <section className="space-y-3">
          {aiIssues.map((item) => (
            <div
              key={`ai-${item.id}`}
              className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-white">
                      {item.display_name || item.item_type}
                    </span>
                    <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-black text-amber-300">
                      {item.match_status === "extend_existing"
                        ? "Utvid eksisterende"
                        : "Krever kontroll"}
                    </span>
                    <span className="text-[9px] font-bold text-slate-600">
                      {Math.round(Number(item.confidence || 0) * 100)} %
                    </span>
                  </div>

                  {item.matched_name && (
                    <div className="mt-2 text-[10px] text-blue-300">
                      Mulig treff: {item.matched_name}
                    </div>
                  )}

                  <p className="mt-2 max-w-4xl text-[11px] leading-5 text-slate-400">
                    {item.recommendation_text || "Krever manuell kontroll."}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  {item.review_status === "approved" ? (
                    <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[10px] font-black text-emerald-300">
                      Godkjent
                    </span>
                  ) : item.review_status === "rejected" ? (
                    <span className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[10px] font-black text-slate-400">
                      Ignorert
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setSmartDecision(item.id, "rejected")}
                        disabled={smartDecisionBusyId === item.id}
                        className="rounded-lg border border-slate-700 px-3 py-2 text-[10px] font-black text-slate-400 disabled:opacity-50"
                      >
                        Ignorer
                      </button>
                      <button
                        type="button"
                        onClick={() => setSmartDecision(item.id, "approved")}
                        disabled={smartDecisionBusyId === item.id}
                        className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[10px] font-black text-emerald-300 disabled:opacity-50"
                      >
                        Godkjenn forslag
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {classicIssues.map((batch) => (
            <div
              key={`classic-${batch.id}`}
              className="rounded-2xl border border-red-500/15 bg-[#0d1320] p-4"
            >
              <div className="text-xs font-black text-white">
                #{batch.id} · {batch.file_name || "Ukjent fil"}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                {Number(batch.duplicate_records || 0) > 0 && (
                  <span className="rounded-md border border-orange-500/20 bg-orange-500/10 px-2 py-1 font-black text-orange-300">
                    {Number(batch.duplicate_records || 0)} duplikater
                  </span>
                )}
                {Number(batch.error_records || 0) > 0 && (
                  <span className="rounded-md border border-red-500/20 bg-red-500/10 px-2 py-1 font-black text-red-300">
                    {Number(batch.error_records || 0)} feil
                  </span>
                )}
              </div>
            </div>
          ))}

          {aiIssues.length === 0 &&
            classicIssues.length === 0 &&
            !historyLoading &&
            !smartHistoryLoading && (
              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] p-5 text-xs text-emerald-300">
                Ingen feil eller avvik som krever behandling.
              </div>
            )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-[#F5B800]" />
              <h3 className="text-base font-black text-white">Historisk dataimport</h3>
            </div>
            <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">
              Last opp PDF, CSV, JSON, XLSX, DOCX eller tekst. Ved blandede filer identifiserer systemet kunder, eiendommer, prosjekter og øvrige data, sammenligner mot perun_core og foreslår hva som bør opprettes eller utvides. Ingenting skrives til masterdata før kontroll.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2 text-[10px] font-bold text-emerald-300">
            perun_core · staging
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320]">
          <div className="border-b border-slate-800/70 px-5 py-4">
            <h3 className="text-sm font-black text-white">Ny import</h3>
            <p className="mt-1 text-[11px] text-slate-500">Velg kilde, datatype og fil.</p>
          </div>

          <div className="space-y-5 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">Kildesystem</span>
                <select
                  value={sourceSystem}
                  onChange={(e) => setSourceSystem(e.target.value as SourceSystem)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-xs font-bold text-white outline-none focus:border-amber-500/60"
                >
                  <option value="auto">Automatisk / blandet kilde</option>
                  <option value="tripletex">Tripletex</option>
                  <option value="entre_worker">Entré Worker</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">Datatype</span>
                <select
                  value={importType}
                  onChange={(e) => setImportType(e.target.value as ImportType)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-xs font-bold text-white outline-none focus:border-amber-500/60"
                >
                  <option value="mixed">Blandede data · AI analyserer</option>
                  <option value="customers">Kunder</option>
                  <option value="employees">Ansatte</option>
                  <option value="projects">Prosjekter</option>
                  <option value="time_entries">Timer</option>
                  <option value="documents">Dokumenter</option>
                </select>
              </label>
            </div>

            {!file ? (
              <label
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(false);
                  handleSelectedFile(e.dataTransfer.files?.[0] || null);
                }}
                className={`flex min-h-[210px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center transition ${
                  dragActive
                    ? "border-amber-400 bg-amber-500/[0.08]"
                    : "border-slate-700 bg-slate-950/50 hover:border-amber-500/50 hover:bg-amber-500/[0.025]"
                }`}
              >
                <Upload className="mb-3 h-7 w-7 text-amber-300" />
                <div className="text-sm font-black text-white">Slipp fil her eller velg fil</div>
                <div className="mt-1 text-[11px] text-slate-500">PDF · CSV · JSON · TXT · XLSX · DOCX</div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.csv,.json,.txt,.xlsx,.docx"
                  onChange={(e) => {
                    handleSelectedFile(e.target.files?.[0] || null);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-300">
                      {file.name.toLowerCase().endsWith(".pdf") ? (
                        <FileText className="h-5 w-5" />
                      ) : (
                        <FileSpreadsheet className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-black text-white">{file.name}</div>
                      <div className="mt-1 text-[10px] text-slate-500">
                        {fileSize} · {sourceLabels[sourceSystem]} · {importTypeLabels[importType]}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={resetFile}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 text-slate-500 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                    title="Fjern fil"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3">
              <div className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <p className="text-[11px] leading-5 text-slate-400">
                  Blandede filer analyseres først. Systemet viser <span className="font-bold text-white">hva som finnes fra før</span>, <span className="font-bold text-white">hva som er nytt</span> og <span className="font-bold text-white">anbefalt handling</span>. Godkjenning og endelig import er separate steg.
                </p>
              </div>
            </div>

            {message && (
              <div className={`rounded-xl border px-3 py-3 text-xs ${result?.success || smartResult?.success ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300" : "border-red-500/20 bg-red-500/[0.06] text-red-300"}`}>
                {message}
              </div>
            )}

            {smartAnalyzingBatchId !== null && (
              <div className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.06] px-4 py-3 text-xs text-blue-200">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-300" />
                <div>
                  <div className="font-black">
                    Analyserer import #{smartAnalyzingBatchId}
                  </div>
                  <div className="mt-0.5 text-[10px] text-blue-300/70">
                    {smartAnalysisStatus || "Behandler filen…"}
                  </div>
                </div>
              </div>
            )}

            {smartResult?.summary && (
              <div className="space-y-4 rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-300">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">
                      Intelligent analyse
                    </div>
                    <div className="mt-1 text-[11px] leading-5 text-slate-400">
                      {smartResult.summary.document_summary || "Analysen er klar."}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {[
                    ["Funn", smartResult.summary.item_count || 0],
                    ["Finnes", smartResult.summary.existing_count || 0],
                    ["Utvid", smartResult.summary.extend_count || 0],
                    ["Nytt", smartResult.summary.new_count || 0],
                    ["Kontroll", smartResult.summary.review_count || 0],
                  ].map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2"
                    >
                      <div className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-600">
                        {label}
                      </div>
                      <div className="mt-1 text-lg font-black text-white">
                        {Number(value)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  {(smartResult.items || []).map((item) => {
                    const Icon =
                      item.item_type === "customer"
                        ? Building2
                        : item.item_type === "property"
                          ? MapPin
                          : item.item_type === "project"
                            ? BriefcaseBusiness
                            : CircleHelp;

                    const statusClass =
                      item.match_status === "existing"
                        ? "border-blue-500/20 bg-blue-500/10 text-blue-300"
                        : item.match_status === "extend_existing"
                          ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                          : item.match_status === "new"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                            : "border-violet-500/20 bg-violet-500/10 text-violet-300";

                    const statusText =
                      item.match_status === "existing"
                        ? "Finnes fra før"
                        : item.match_status === "extend_existing"
                          ? "Utvid eksisterende"
                          : item.match_status === "new"
                            ? "Ny informasjon"
                            : "Krever kontroll";

                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-800 bg-[#0d1320] p-3"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex min-w-0 gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-slate-400">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-black text-white">
                                  {item.display_name || item.item_type}
                                </span>
                                <span
                                  className={`rounded-md border px-2 py-0.5 text-[9px] font-black ${statusClass}`}
                                >
                                  {statusText}
                                </span>
                                <span className="text-[9px] font-bold text-slate-600">
                                  {Math.round(Number(item.confidence || 0) * 100)} %
                                </span>
                              </div>

                              {item.matched_name && (
                                <div className="mt-1 text-[10px] text-blue-300">
                                  Matchet mot: {item.matched_name}
                                </div>
                              )}

                              <div className="mt-2 text-[11px] leading-5 text-slate-400">
                                {item.recommendation_text}
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            {item.review_status === "approved" ? (
                              <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[10px] font-black text-emerald-300">
                                Godkjent for import
                              </span>
                            ) : item.review_status === "rejected" ? (
                              <span className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[10px] font-black text-slate-400">
                                Ignorert
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setSmartDecision(item.id, "rejected")}
                                  disabled={smartDecisionBusyId === item.id}
                                  className="rounded-lg border border-slate-700 px-3 py-2 text-[10px] font-black text-slate-400 hover:text-white disabled:opacity-50"
                                >
                                  Ignorer
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSmartDecision(item.id, "approved")}
                                  disabled={smartDecisionBusyId === item.id}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[10px] font-black text-emerald-300 hover:bg-emerald-500/15 disabled:opacity-50"
                                >
                                  {smartDecisionBusyId === item.id && (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  )}
                                  Godkjenn forslag
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-[10px] font-black text-white">
                      Klar for masterimport
                    </div>
                    <div className="mt-1 text-[10px] leading-5 text-slate-500">
                      Kun forslag du har godkjent blir behandlet. Motstridende eksisterende kundedata overskrives ikke automatisk.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      smartResult.batch_id &&
                      applyApprovedItems(Number(smartResult.batch_id))
                    }
                    disabled={
                      smartApplyBusy ||
                      !smartResult.batch_id ||
                      !(smartResult.items || []).some(
                        (item) => item.review_status === "approved"
                      )
                    }
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-[10px] font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {smartApplyBusy && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    Utfør godkjente endringer
                  </button>
                </div>

                {smartApplyMessage && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-[10px] leading-5 text-slate-300">
                    {smartApplyMessage}
                  </div>
                )}

                <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-[10px] leading-5 text-slate-500">
                  Nye kunder blir ordinære poster i perun_core og vises dermed i kunderegisteret. Eiendommer og prosjekter kobles til samme kundeprofil når relasjonen er sikker.
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={uploadToStaging}
                disabled={!file || busy}
                className="inline-flex items-center gap-2 rounded-xl bg-[#F5B800] px-4 py-3 text-xs font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Analyser fil
              </button>
            </div>
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              <h3 className="text-sm font-black text-white">Importrekkefølge</h3>
            </div>

            <div className="mt-4 space-y-2 text-[11px]">
              {["Ansatte","Kunder","Eiendommer","Prosjekter","Prosjektmedlemmer","Oppgaver og timer","Dokumenter og bilder","Tilbud / ordre / faktura"].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-800/70 bg-slate-950/50 px-3 py-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-black text-amber-300">{index + 1}</span>
                  <span className="font-bold text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-blue-300" />
                <h3 className="text-sm font-black text-white">Importhistorikk</h3>
              </div>
              <button
                type="button"
                onClick={loadHistory}
                disabled={historyLoading}
                className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:text-white disabled:opacity-50"
                title="Oppdater"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${historyLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {historyError && (
              <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3 text-[11px] text-red-300">
                {historyError}
              </div>
            )}

            <div className="mt-4 space-y-2">
              {batches.length === 0 && !historyLoading ? (
                <p className="text-[11px] text-slate-500">Ingen importer registrert ennå.</p>
              ) : (
                batches.map((batch) => {
                  const batchId = Number(batch.id);
                  const isOpen = openBatchId === batchId;

                  return (
                    <div key={batchId} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/50">
                      <button
                        type="button"
                        onClick={() => loadPreview(batchId)}
                        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-[11px] font-black text-white">
                            #{batchId} · {batch.file_name || "Ukjent fil"}
                          </div>
                          <div className="mt-1 text-[10px] text-slate-500">
                            {sourceLabels[batch.source_system as SourceSystem] || batch.source_system} · {importTypeLabels[batch.import_type as ImportType] || batch.import_type} · {Number(batch.total_records || 0)} rad(er)
                          </div>
                          <div className="mt-1 text-[10px] font-bold text-amber-300">
                            {batch.status === "review" ? "Klar til kontroll" : batch.status}
                          </div>
                        </div>
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="border-t border-slate-800 px-3 py-3">
                          <div className="mb-3 flex flex-col gap-3 rounded-lg border border-slate-800 bg-[#0d1320] p-3">
                            <div className="grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-4">
                              <div className="rounded-lg bg-slate-950/70 px-2 py-2">
                                <div className="text-slate-500">Totalt</div>
                                <div className="mt-0.5 font-black text-white">
                                  {Number(batch.total_records || 0)}
                                </div>
                              </div>
                              <div className="rounded-lg bg-slate-950/70 px-2 py-2">
                                <div className="text-slate-500">Matchet</div>
                                <div className="mt-0.5 font-black text-blue-300">
                                  {Number(batch.matched_records || 0)}
                                </div>
                              </div>
                              <div className="rounded-lg bg-slate-950/70 px-2 py-2">
                                <div className="text-slate-500">Duplikater</div>
                                <div className="mt-0.5 font-black text-orange-300">
                                  {Number(batch.duplicate_records || 0)}
                                </div>
                              </div>
                              <div className="rounded-lg bg-slate-950/70 px-2 py-2">
                                <div className="text-slate-500">Feil</div>
                                <div className="mt-0.5 font-black text-red-300">
                                  {Number(batch.error_records || 0)}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div className="text-[10px] text-slate-500">
                                Nye rader = totalt minus matchet, duplikater og feil.
                              </div>

                              <button
                                type="button"
                                onClick={() => runMatch(batchId)}
                                disabled={matchingBatchId === batchId}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] font-black text-amber-300 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {matchingBatchId === batchId ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-3.5 w-3.5" />
                                )}
                                Analyser / match
                              </button>
                            </div>

                            {matchMessage && (
                              <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-[10px] text-slate-300">
                                {matchMessage}
                              </div>
                            )}
                          </div>

                          {previewLoading ? (
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Henter innhold...
                            </div>
                          ) : previewError ? (
                            <div className="text-[11px] text-red-300">{previewError}</div>
                          ) : previewRecords.length === 0 ? (
                            <div className="text-[11px] text-slate-500">Ingen staging-rader.</div>
                          ) : (
                            <div className="space-y-2">
                              {previewRecords.slice(0, 25).map((record) => (
                                <div key={String(record.id)} className="rounded-lg border border-slate-800 bg-[#0d1320] px-3 py-2">
                                  <div className="text-[10px] font-black text-white">
                                    {record.external_number || record.external_id || "Uten eksternt nummer"}
                                  </div>
                                  <div className="mt-1 truncate text-[10px] text-slate-500">
                                    {String(
                                      record.raw_data?.title ??
                                      record.raw_data?.name ??
                                      record.raw_data?.customer_name ??
                                      "—"
                                    )}
                                  </div>
                                  <div className="mt-1">
                                    <span
                                      className={`inline-flex rounded-md border px-2 py-0.5 text-[9px] font-black ${
                                        record.status === "matched"
                                          ? "border-blue-500/20 bg-blue-500/10 text-blue-300"
                                          : record.status === "duplicate"
                                            ? "border-orange-500/20 bg-orange-500/10 text-orange-300"
                                            : record.status === "error"
                                              ? "border-red-500/20 bg-red-500/10 text-red-300"
                                              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                      }`}
                                    >
                                      {record.status === "matched"
                                        ? "Matchet"
                                        : record.status === "duplicate"
                                          ? "Duplikat"
                                          : record.status === "error"
                                            ? "Feil"
                                            : "Ny"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {previewRecords.length > 25 && (
                                <div className="text-[10px] text-slate-500">
                                  Viser 25 av {previewRecords.length} rader.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-violet-300" />
              <h3 className="text-sm font-black text-white">Kilder</h3>
            </div>
            <div className="mt-3 text-[11px] leading-5 text-slate-500">
              Tripletex og Entré Worker holdes som separate kildesystemer. Matchende personer, kunder og prosjekter kan senere kobles til én intern entitet via external_references.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
