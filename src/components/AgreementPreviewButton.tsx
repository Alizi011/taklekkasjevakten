import { useEffect, useRef, useState } from "react";
import { FileCheck2, X } from "lucide-react";
import { apiUrl } from "../lib/api";
import { loadStoredAgreement, verifyAgreementPdf } from "../lib/agreementDocumentIdentity";
import CustomerAgreementPdfViewer from "./CustomerAgreementPdfViewer";

type Offer = {
  id: number;
  offer_number?: string | null;
  title?: string | null;
  status?: string | null;
  pricing_mode?: string | null;
};

type RevisionProof = { preview_token: string; agreement_id: number; current_document_id: number; current_document_sha256: string; document_sha256: string; offer_number: string; start_date: string; estimated_duration: string };

type Props = {
  onAgreementUpdated?: () => void;
  offer: Offer;
  inquiryId?: number;
  customerName?: string;
  address?: string;
  customerOrgNumber?: string | null;
  customerPostalAddress?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerContact?: string | null;
};

export default function AgreementPreviewButton({ offer, inquiryId, onAgreementUpdated }: Props) {
  const previewRequestRef = useRef<AbortController | null>(null);
  const [mode, setMode] = useState<"preview" | "revision">("preview");
  const [revisionProof, setRevisionProof] = useState<RevisionProof | null>(null);
  const [revisionConfirmed, setRevisionConfirmed] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");
  const [revisionResult, setRevisionResult] = useState("");
  const [savingRevision, setSavingRevision] = useState(false);
  const [open, setOpen] = useState(false);
  const [storedOpen, setStoredOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  useEffect(() => {
    previewRequestRef.current?.abort();
    setOpen(false);
    setMode("preview"); setRevisionProof(null); setRevisionResult(""); setSavingRevision(false);
    setStoredOpen(false);
    setPdfUrl("");
    setError("");
    setLoading(false);
    return () => previewRequestRef.current?.abort();
  }, [offer.id, inquiryId]);

  function closePreview() {
    if (savingRevision) return;
    previewRequestRef.current?.abort();
    setOpen(false);
    setPdfUrl("");
  }

  if (offer.pricing_mode !== "fixed") return null;

  async function preview() {
    setMode("preview"); setRevisionProof(null); setRevisionResult("");
    previewRequestRef.current?.abort();
    const controller = new AbortController();
    previewRequestRef.current = controller;
    setOpen(true);
    setLoading(true);
    setError("");
    setPdfUrl("");

    try {
      const response = await fetch(
        apiUrl(
          `/admin_agreement_v2_preview.php?offer_id=${encodeURIComponent(offer.id)}`
        ),
        { credentials: "include", cache: "no-store", signal: controller.signal }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${data.message || "Kunne ikke hente arbeidsavtalen."}`);
      }

      const blob = await response.blob();

      if (!blob.type.includes("application/pdf")) {
        throw new Error("Serveren returnerte ikke en PDF.");
      }

      if (controller.signal.aborted) return;
      setPdfUrl(URL.createObjectURL(blob));
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Forhåndsvisningen feilet.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  async function revisionJson(body: Record<string, unknown>) {
    const response = await fetch(apiUrl("/admin_customer_agreement_document.php"), {
      method: "POST", credentials: "include", cache: "no-store",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (!response.headers.get("Content-Type")?.includes("application/json")) {
      throw new Error("Oppdateringsfunksjonen er ikke installert i API-et. Ingen oppdatering er utført.");
    }
    const result = await response.json();
    if (!response.ok || result.success !== true) throw new Error(result.message || "Avtaleoppdateringen feilet.");
    return result;
  }

  async function prepareRevision() {
    previewRequestRef.current?.abort();
    const controller = new AbortController(); previewRequestRef.current = controller;
    setMode("revision"); setOpen(true); setLoading(true); setError(""); setPdfUrl("");
    setRevisionProof(null); setRevisionResult(""); setRevisionConfirmed(false); setRevisionReason("");
    try {
      if (!inquiryId) throw new Error("Sakstilknytning mangler.");
      const agreement = await loadStoredAgreement({ inquiryId, expectedTlvOfferId: offer.id,
        previewMode: true, sessionToken: "", signal: controller.signal });
      const documentId = Number(agreement.document_id);
      if (!Number.isSafeInteger(documentId) || documentId < 1) throw new Error("Gjeldende dokument-ID mangler. API-et må oppdateres før avtalen kan revideres.");
      const proof = await revisionJson({ action: "revision_prepare", inquiry_id: inquiryId,
        agreement_id: Number(agreement.id), tlv_offer_id: offer.id, expected_document_id: documentId,
        expected_document_sha256: agreement.document_sha256 });
      if (controller.signal.aborted) return;
      if (Number(proof.agreement_id) !== Number(agreement.id) || Number(proof.current_document_id) !== documentId
        || proof.current_document_sha256 !== agreement.document_sha256
        || typeof proof.preview_token !== "string" || !/^[a-f0-9]{64}$/.test(proof.preview_token)
        || typeof proof.document_sha256 !== "string" || !/^[a-f0-9]{64}$/.test(proof.document_sha256)) {
        throw new Error("Forhåndsvisningens dokumentidentitet stemmer ikke.");
      }
      const response = await fetch(apiUrl("/admin_customer_agreement_document.php"), {
        method: "POST", credentials: "include", cache: "no-store", signal: controller.signal,
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "revision_document",
          inquiry_id: inquiryId, agreement_id: Number(agreement.id), preview_token: proof.preview_token }),
      });
      if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(result.message || "Kunne ikke vise revisjonen."); }
      const blob = await response.blob(); await verifyAgreementPdf(blob, proof.document_sha256);
      if (controller.signal.aborted) return;
      setRevisionProof(proof as RevisionProof); setPdfUrl(URL.createObjectURL(blob));
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Kunne ikke klargjøre avtaleoppdatering.");
    } finally { if (!controller.signal.aborted) setLoading(false); }
  }

  async function commitRevision() {
    if (!revisionProof || !revisionConfirmed || !revisionReason.trim() || savingRevision || !pdfUrl || !inquiryId) return;
    const proof = revisionProof; const request = previewRequestRef.current;
    setSavingRevision(true); setError("");
    try {
      const response = await revisionJson({ action: "revision_commit", inquiry_id: inquiryId,
        agreement_id: Number(proof.agreement_id), preview_token: proof.preview_token, confirmed: true,
        expected_document_id: Number(proof.current_document_id), expected_document_sha256: proof.current_document_sha256,
        document_sha256: proof.document_sha256, reason: revisionReason.trim() });
      if (request?.signal.aborted) return;
      const result = response.result;
      if (Number(result?.agreement_id) !== Number(proof.agreement_id) || !Number.isSafeInteger(Number(result?.document_id))
        || Number(result.document_id) < 1 || result.document_sha256 !== proof.document_sha256
        || Number(result.previous_document_id) !== Number(proof.current_document_id)) throw new Error("Oppdateringssvaret har feil dokumentidentitet. Kontroller lagret avtale før ny handling.");
      setRevisionResult(`Avtale ${proof.agreement_id} er oppdatert til dokument ${result.document_id}. Gammel PDF er bevart. Ingen kundevarsler er sendt.`);
      setStoredOpen(false); onAgreementUpdated?.();
    } catch (e) {
      if (!request?.signal.aborted) setError((e instanceof Error ? e.message : "Oppdateringsstatus er ukjent.") + " Ved nettverksfeil kan samme bekreftelse prøves på nytt uten ny dokumentversjon.");
    } finally { if (!request?.signal.aborted) setSavingRevision(false); }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void preview()}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 text-xs font-bold text-amber-200 hover:bg-amber-500/20"
      >
        <FileCheck2 className="h-4 w-4" />
        Forhåndsvis avtale
      </button>

      {Number.isSafeInteger(inquiryId) && Number(inquiryId) > 0 && (
        <button type="button" onClick={() => setStoredOpen(true)} className="inline-flex h-10 items-center justify-center rounded-xl border border-cyan-500/40 px-4 text-xs font-bold text-cyan-200 hover:bg-cyan-500/10">Les lagret arbeidsavtale</button>
      )}
      {Number.isSafeInteger(inquiryId) && Number(inquiryId) > 0 && offer.status === "akseptert" && (
        <button type="button" onClick={() => void prepareRevision()} disabled={savingRevision}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-amber-500/40 px-4 text-xs font-bold text-amber-200 disabled:opacity-40">Oppdater avtale</button>
      )}
      {storedOpen && inquiryId && (
        <CustomerAgreementPdfViewer inquiryId={inquiryId} expectedTlvOfferId={offer.id} sessionToken="" previewMode onClose={() => setStoredOpen(false)} />
      )}

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 p-3 sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Forhåndsvisning av arbeidsavtale"
            className="flex h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-white"
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-800 px-5 py-3">
              <div>
                <p className="text-xs font-bold text-amber-300">
                  {mode === "revision" ? "KONTROLLER NY DOKUMENTVERSJON – KREVER BEKREFTELSE" : "KUN FORHÅNDSVISNING – INGEN AKSEPT ELLER SIGNERING"}
                </p>
                <h2 className="mt-1 font-bold">
                  {offer.offer_number || `Tilbud #${offer.id}`}
                </h2>
              </div>
              <button
                type="button"
                onClick={closePreview}
                disabled={savingRevision}
                aria-label="Lukk"
                className="rounded-lg p-2 hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1">
              {loading ? (
                <p className="p-6 text-sm">Genererer arbeidsavtalen …</p>
              ) : pdfUrl ? (
                <iframe
                  title="Arbeidsavtale med pristilbud"
                  src={pdfUrl}
                  className="h-full w-full bg-white"
                />
              ) : error ? (
                <p role="alert" className="p-6 text-sm text-red-300">
                  {error}
                </p>
              ) : null}
            </div>
            {mode === "revision" && revisionProof && !revisionResult && (
              <div className="max-h-[40vh] space-y-3 overflow-y-auto border-t border-slate-700 p-4 text-sm">
                <p>{revisionProof.offer_number} · Godkjent oppstart {revisionProof.start_date} · {revisionProof.estimated_duration}</p>
                <p className="text-xs text-slate-400">Avtale {revisionProof.agreement_id}, gjeldende dokument {revisionProof.current_document_id}. Samme forhåndsviste PDF lagres som ny versjon; gammel PDF beholdes.</p>
                <label className="block">Begrunnelse for oppdatering
                  <textarea aria-label="Begrunnelse for avtaleoppdatering" value={revisionReason} maxLength={1000} rows={2}
                    onChange={e => setRevisionReason(e.target.value)} disabled={savingRevision}
                    className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 p-2" />
                </label>
                <label className="flex items-start gap-2"><input type="checkbox" checked={revisionConfirmed} disabled={savingRevision}
                  onChange={e => setRevisionConfirmed(e.target.checked)} />Jeg har kontrollert PDF, tilbudsrevisjon, beløp og oppstart. Jeg bekrefter oppdatering av den eksisterende usignerte avtalen.</label>
                <button type="button" onClick={() => void commitRevision()} disabled={savingRevision || !revisionConfirmed || !revisionReason.trim() || !pdfUrl}
                  className="rounded-lg bg-amber-400 px-4 py-2 font-bold text-slate-950 disabled:opacity-40">
                  {savingRevision ? "Oppdaterer …" : "Bekreft og oppdater avtale"}
                </button>
              </div>
            )}
            {revisionResult && <p role="status" className="border-t border-slate-700 p-4 text-sm text-emerald-300">{revisionResult}</p>}
          </div>
        </div>
      )}
    </>
  );
}

