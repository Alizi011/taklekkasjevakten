import { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";

type StageKey = "lekkasjesok" | "varig_utbedring" | "service" | "takkontroll";
type InvoiceDoc = {
  document_id: number;
  original_name: string;
  created_at: string;
};
type StageData = {
  invoiced: boolean;
  documents: InvoiceDoc[];
};
type ApiPayload = {
  success: boolean;
  message?: string;
  project_id?: number;
  document_id?: number;
  document?: { id: number };
  stages?: Partial<Record<StageKey, StageData>>;
};

const stageNames: Record<StageKey, string> = {
  lekkasjesok: "Lekkasjesøk",
  varig_utbedring: "Varig utbedring",
  service: "Service / midlertidig utbedring",
  takkontroll: "Takkontroll"
};

const BRIDGE = apiUrl("/tlv_invoice_bridge.php");

async function readJson(response: Response): Promise<ApiPayload> {
  const raw = await response.text();
  let data: ApiPayload;

  try {
    data = JSON.parse(raw) as ApiPayload;
  } catch {
    throw new Error(`Ugyldig serversvar (HTTP ${response.status}).`);
  }

  if (!response.ok || !data.success) {
    throw new Error(
      data.message ||
      (response.status === 401 || response.status === 403
        ? "Du har ikke tilgang til fakturaadministrasjon."
        : `HTTP ${response.status}`)
    );
  }

  return data;
}

export default function StageInvoicing({
  inquiryId,
  stageKey
}: {
  inquiryId: number;
  stageKey: StageKey;
}) {
  const [projectId, setProjectId] = useState<number | null>(null);
  const [stage, setStage] = useState<StageData>({
    invoiced: false,
    documents: []
  });
  const [file, setFile] = useState<File | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const result = await readJson(
      await fetch(
        `${BRIDGE}?action=status&inquiry_id=${encodeURIComponent(inquiryId)}`,
        { credentials: "include", cache: "no-store" }
      )
    );

    setProjectId(result.project_id ?? null);
    setStage(result.stages?.[stageKey] ?? {
      invoiced: false,
      documents: []
    });
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setProjectId(null);
    setError("");
    setMessage("");

    void (async () => {
      try {
        const result = await readJson(
          await fetch(
            `${BRIDGE}?action=status&inquiry_id=${encodeURIComponent(inquiryId)}`,
            { credentials: "include", cache: "no-store" }
          )
        );

        if (active) {
          setProjectId(result.project_id ?? null);
          setStage(result.stages?.[stageKey] ?? {
            invoiced: false,
            documents: []
          });
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "Kunne ikke hente fakturastatus.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [inquiryId, stageKey]);

  async function upload() {
    if (!file || !projectId || busy) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Velg en fakturakopi i PDF-format.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const body = new FormData();
      body.append("project_id", String(projectId));
      body.append("kind", "invoice");
      body.append(
        "description",
        `TLV sak ${inquiryId} – ${stageNames[stageKey]} – fakturakopi`
      );
      body.append("file", file);

      const uploaded = await readJson(
        await fetch(`${BRIDGE}?action=upload`, {
          method: "POST",
          credentials: "include",
          body
        })
      );

      const documentId = Number(
        uploaded.document?.id ?? uploaded.document_id ?? 0
      );

      if (!documentId) {
        throw new Error(
          "Filen er mottatt, men dokument-ID mangler. Kontroller Core før nytt forsøk."
        );
      }

      await readJson(
        await fetch(`${BRIDGE}?action=link`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inquiry_id: inquiryId,
            stage_key: stageKey,
            document_id: documentId
          })
        })
      );

      await load();
      setFile(null);
      setMessage("Fakturakopi registrert i Perun Core.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke lagre fakturakopien.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 border-t border-white/10 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">Fakturert</span>
          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
            loading || error
              ? "border-amber-500/30 text-amber-200"
              : stage.invoiced
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-slate-600 bg-slate-800/60 text-slate-200"
          }`}>
            {loading ? "Kontrollerer" : error ? "Ukjent" : stage.invoiced ? "Ja" : "Nei"}
          </span>
        </div>

        {!loading && !stage.invoiced && (
          <button
            type="button"
            onClick={() => setShowUpload(value => !value)}
            className="rounded-lg border border-amber-500/40 px-3 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/10"
          >
            {showUpload ? "Lukk" : "Registrer faktura"}
          </button>
        )}
      </div>

      {stage.documents.map(doc => (
        <p key={doc.document_id} className="mt-2 break-words text-xs text-emerald-300">
          Fakturakopi: {doc.original_name}
        </p>
      ))}

      {showUpload && !stage.invoiced && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-slate-700/70 bg-slate-950/50 p-3">
          <input
            type="file"
            accept=".pdf,application/pdf"
            aria-label="Velg fakturakopi"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="min-w-0 max-w-full text-xs text-slate-300"
          />
          <button
            type="button"
            disabled={!file || !projectId || busy}
            onClick={() => void upload()}
            className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-40"
          >
            {busy ? "Lagrer…" : "Last opp PDF"}
          </button>
        </div>
      )}

      {error && <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}
      {message && <p role="status" className="mt-2 text-xs text-emerald-300">{message}</p>}
    </div>
  );
}