import { useEffect, useRef, useState } from "react";
import { apiUrl } from "../lib/api";
import { loadStoredAgreement, assertStoredDocumentResponse, verifyAgreementPdf } from "../lib/agreementDocumentIdentity";

type Props = {
  inquiryId: number;
  expectedTlvOfferId?: number;
  sessionToken: string;
  previewMode: boolean;
  onClose: () => void;
  compactPreview?: boolean;
  onAgreementResolved?: (agreementId: number | null, documentSha256?: string, documentId?: number) => void;
};

export default function CustomerAgreementPdfViewer({
  inquiryId,
  expectedTlvOfferId,
  sessionToken,
  previewMode,
  onClose,
  compactPreview = false,
  onAgreementResolved,
}: Props) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [agreementNumber, setAgreementNumber] = useState("");
  const resolvedCallbackRef = useRef(onAgreementResolved);
  resolvedCallbackRef.current = onAgreementResolved;

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = "";
    setLoading(true);
    setError("");
    setUrl("");
    setAgreementNumber("");
    resolvedCallbackRef.current?.(null);

    async function post(
      path: string,
      payload: Record<string, unknown>,
      credentials: RequestCredentials
    ) {
      const response = await fetch(apiUrl(path), {
        method: "POST",
        credentials,
        cache: "no-store",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      return response;
    }

    async function load() {
      try {
        if (!previewMode && !sessionToken) {
          throw new Error("Kundeinnlogging kreves.");
        }

        const agreement = await loadStoredAgreement({ inquiryId, expectedTlvOfferId, sessionToken,
          previewMode, signal: controller.signal });

        const pdfResponse = await post(
          previewMode
            ? "/admin_customer_agreement_document.php"
            : "/customer_agreement_document.php",
          {
            inquiry_id: inquiryId,
            agreement_id: Number(agreement.id),
            ...(!previewMode
              ? { session_token: sessionToken }
              : {}),
          },
          previewMode ? "include" : "omit"
        );

        if (!pdfResponse.ok) {
          const result = await pdfResponse.json().catch(() => ({}));
          throw new Error(
            result.message || "Kunne ikke åpne arbeidsavtalen."
          );
        }

        assertStoredDocumentResponse(pdfResponse, agreement);
        const blob = await pdfResponse.blob();

        if (!blob.type.includes("application/pdf")) {
          throw new Error("Serveren returnerte ikke en PDF.");
        }

        await verifyAgreementPdf(blob, agreement.document_sha256!);
        if (controller.signal.aborted) return;

        objectUrl = URL.createObjectURL(blob);
        if (agreement.document_id != null) {
          resolvedCallbackRef.current?.(Number(agreement.id), agreement.document_sha256!.toLowerCase(), Number(agreement.document_id));
        } else {
          resolvedCallbackRef.current?.(Number(agreement.id), agreement.document_sha256!.toLowerCase());
        }
        setAgreementNumber(
          agreement.agreement_number || `Avtale #${agreement.id}`
        );
        setUrl(objectUrl);
      } catch (e) {
        if (!controller.signal.aborted) {
          setError(
            e instanceof Error ? e.message : "Kunne ikke åpne avtalen."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [inquiryId, expectedTlvOfferId, sessionToken, previewMode]);

  if (compactPreview) {
    return (
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
        {loading && (
          <div role="status" className="flex h-64 items-center justify-center p-4 text-center text-xs text-slate-400">
            Henter forhåndsvisning av arbeidsavtalen …
          </div>
        )}

        {error && (
          <div role="alert" className="flex min-h-32 items-center justify-center p-4 text-center text-xs text-amber-200">
            {error}
          </div>
        )}

        {url && (
          <div className="relative h-64 overflow-hidden bg-white">
            <iframe
              title="Forhåndsvisning av arbeidsavtalens første side"
              src={`${url}#page=1&toolbar=0&navpanes=0&scrollbar=0`}
              className="h-full w-full border-0 bg-white pointer-events-none"
              tabIndex={-1}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Arbeidsavtale"
      className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/95 p-3 sm:p-6"
    >
      <div className="flex h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-amber-500/40 bg-slate-950 text-white">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 p-4">
          <div>
            <h2 className="font-black">Arbeidsavtale</h2>
            <p className="mt-1 text-xs text-slate-400">
              {agreementNumber ||
                (previewMode
                  ? "Administratorforhåndsvisning – kun lesing"
                  : "Les arbeidsavtalen")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-bold"
          >
            Lukk
          </button>
        </div>

        {loading && (
          <div role="status" className="flex flex-1 items-center justify-center p-6">
            Henter riktig arbeidsavtale …
          </div>
        )}

        {error && (
          <div role="alert" className="flex flex-1 items-center justify-center p-6 text-center text-sm text-rose-300">
            {error}
          </div>
        )}

        {url && (
          <>
            <iframe
              title="Arbeidsavtale PDF"
              src={url}
              className="min-h-0 w-full flex-1 bg-white"
            />
            <div className="border-t border-slate-800 p-3 text-right">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-amber-300 underline"
              >
                Åpne PDF i eget vindu
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}