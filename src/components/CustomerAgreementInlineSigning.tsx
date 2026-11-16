import { useCallback, useEffect, useRef, useState } from "react";
import { apiUrl } from "../lib/api";
import { assertAgreementDocumentIdentity, verifyAgreementPdf } from "../lib/agreementDocumentIdentity";

const PERUN_SIGNING_ENDPOINT = "https://api.perun.no/api/agreement_signing_public.php";

type Stage = "ready" | "requesting" | "verify" | "document" | "completed";
type Props = {
  inquiryId: number;
  agreementId: number;
  expectedDocumentHash: string;
  sessionToken: string;
  signerName: string;
  previewMode: boolean;
  authorityVerified: boolean;
  autoStart?: boolean;
  onAutoStartHandled?: () => void;
  onFinished?: () => void;
};

async function parseJson(response: Response): Promise<Record<string, any>> {
  const data = await response.json().catch(() => null);
  if (!response.ok || !data || data.success !== true) {
    throw new Error(
      data && typeof data.message === "string"
        ? data.message
        : `Signeringsforespørselen feilet (${response.status}).`
    );
  }
  return data;
}

export default function CustomerAgreementInlineSigning({
  inquiryId, agreementId, expectedDocumentHash, sessionToken, signerName, previewMode,
  authorityVerified, autoStart = false, onAutoStartHandled, onFinished,
}: Props) {
  const [signingToken, setSigningToken] = useState("");
  const [stage, setStage] = useState<Stage>("ready");
  const [code, setCode] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [documentHash, setDocumentHash] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(!previewMode && authorityVerified && Boolean(sessionToken));
  const autoHandled = useRef(false);

  // Do not reuse a signing token across a different agreement/component instance.
  useEffect(() => () => {
    // Blob URLs must be revoked when no longer used.
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
  }, [pdfUrl]);

  const callPerun = useCallback(async (
    token: string, action: string, extra: Record<string, unknown> = {}
  ) => parseJson(await fetch(PERUN_SIGNING_ENDPOINT, {
    method: "POST",
    cache: "no-store",
    referrerPolicy: "no-referrer",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, action, ...extra }),
  })), []);

  const openDocument = useCallback(async (token: string) => {
    const info = await callPerun(token, "document_info");
    assertAgreementDocumentIdentity(info, agreementId, expectedDocumentHash);
    const response = await fetch(PERUN_SIGNING_ENDPOINT, {
      method: "POST",
      cache: "no-store",
      referrerPolicy: "no-referrer",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action: "document" }),
    });
    if (!response.ok) throw new Error("Kunne ikke hente den signeringsklare arbeidsavtalen.");
    const pdf = await response.blob();
    if (pdf.type !== "application/pdf") throw new Error("Serveren returnerte ikke en PDF.");
    await verifyAgreementPdf(pdf, info.document_sha256);
    const url = URL.createObjectURL(pdf);
    setPdfUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return url;
    });
    setDocumentHash(info.document_sha256);
    setStage("document");
  }, [agreementId, expectedDocumentHash, callPerun]);

  // Resume a server-held OTP challenge without another SMS. A signing bearer
  // token is returned only after that challenge has been verified.
  useEffect(() => {
    if (previewMode || !sessionToken || !authorityVerified) {
      setRestoring(false);
      return;
    }
    let cancelled = false;
    const restore = async () => {
      setRestoring(true);
      try {
        const data = await parseJson(await fetch(apiUrl("/customer_agreement_signing_inline.php"), {
          method: "POST", credentials: "include", cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "resume", inquiry_id: inquiryId,
            agreement_id: agreementId, session_token: sessionToken }),
        }));
        if (cancelled || data.resumed !== true) return;
        if (data.signing_stage === "verify") setStage("verify");
        if (data.signing_stage === "document" && typeof data.signing_token === "string") {
          if (!/^[a-f0-9]{64}$/.test(data.signing_token)) throw new Error("Ugyldig signeringsøkt.");
          setSigningToken(data.signing_token);
          setStage("document");
          await openDocument(data.signing_token);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Kunne ikke hente signeringsstatus.");
      } finally {
        if (!cancelled) setRestoring(false);
      }
    };
    void restore();
    return () => { cancelled = true; };
  }, [previewMode, inquiryId, agreementId, sessionToken, authorityVerified, openDocument]);

  const inlineCall = useCallback(async (action: string, extra: Record<string, unknown> = {}) =>
    parseJson(await fetch(apiUrl("/customer_agreement_signing_inline.php"), {
      method: "POST", credentials: "include", cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, inquiry_id: inquiryId, agreement_id: agreementId,
        session_token: sessionToken, ...extra }),
    })), [inquiryId, agreementId, sessionToken]);

  const start = useCallback(async () => {
    if (previewMode || busy || restoring || !sessionToken || !authorityVerified || signingToken) return;
    setBusy(true);
    setStage("requesting");
    setError("");
    try {
      const data = await inlineCall("start");
      if (data.signing_stage === "document" && typeof data.signing_token === "string") {
        setSigningToken(data.signing_token);
        await openDocument(data.signing_token);
      } else if (data.signing_stage === "verify") {
        setStage("verify");
      } else {
        throw new Error("Serveren opprettet ingen SMS-kodeforespørsel.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke sende SMS-kode.");
      setStage("ready");
    } finally {
      setBusy(false);
    }
  }, [previewMode, busy, restoring, sessionToken, authorityVerified, signingToken,
      inlineCall, openDocument]);

  useEffect(() => {
    if (!autoStart || previewMode || restoring || !authorityVerified || autoHandled.current) return;
    autoHandled.current = true;
    onAutoStartHandled?.();
    if (authorityVerified && !signingToken) void start();
  }, [autoStart, previewMode, restoring, authorityVerified, signingToken, onAutoStartHandled, start]);

  async function resendCode() {
    if (previewMode || busy || stage !== "verify") return;
    setBusy(true);
    setError("");
    try {
      await inlineCall("resend");
      setCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke sende ny SMS-kode.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    if (previewMode || busy || stage !== "verify" || !/^\d{6}$/.test(code)) return;
    setBusy(true);
    setError("");
    try {
      const data = await inlineCall("verify", { code });
      if (typeof data.signing_token !== "string" || !/^[a-f0-9]{64}$/.test(data.signing_token)) {
        throw new Error("SMS-bekreftelsen returnerte ingen gyldig signeringsøkt.");
      }
      setSigningToken(data.signing_token);
      setCode("");
      setStage("document");
      await openDocument(data.signing_token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "SMS-koden kunne ikke bekreftes.");
    } finally {
      setBusy(false);
    }
  }

  async function sign() {
    if (previewMode || busy || stage !== "document" || !accepted || !documentHash || !pdfUrl || documentHash !== expectedDocumentHash.toLowerCase()) return;
    setBusy(true);
    setError("");
    try {
      await callPerun(signingToken, "consent", {
        document_sha256: documentHash, accepted: true,
      });
      const response = await callPerun(signingToken, "sign", {
        document_sha256: documentHash,
      });
      setResult(response.result?.signing_complete
        ? "Alle parter har signert arbeidsavtalen."
        : "Din signatur er registrert. Avtalen venter på øvrige signatarer.");
      setSigningToken("");
      setStage("completed");
      onFinished?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Signeringen kunne ikke fullføres.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 space-y-3 border-t border-slate-700/70 pt-4" aria-label="Signer arbeidsavtalen">
      <h4 className="text-sm font-bold text-white">Signer arbeidsavtalen</h4>
      {previewMode ? (
        <p className="text-xs leading-5 text-slate-400">
          Signataren får SMS-kode og kan signere her i kundeportalen når avtalen er klar.
        </p>
      ) : !authorityVerified && stage !== "completed" ? (
        <p className="text-xs leading-5 text-slate-300" role="status">
          Signataren er registrert. Signaturretten og avtalen må være kontrollert før SMS-koden kan sendes.
        </p>
      ) : null}

      {restoring && <p role="status" className="text-xs text-slate-300">Gjenopptar signeringsøkten …</p>}
      {stage === "ready" && authorityVerified && !restoring && (
        <>
          <p className="text-xs leading-5 text-slate-300">
            Vi sender en engangskode til mobilnummeret som er registrert på {signerName}.
          </p>
          <button type="button" disabled={previewMode || busy || !sessionToken} onClick={() => void start()}
            className="w-full rounded-xl bg-amber-400 px-4 py-3 text-xs font-black text-slate-950 disabled:opacity-50">
            Send SMS-kode
          </button>
        </>
      )}
      {stage === "requesting" && <p role="status" className="text-xs text-slate-300">Sender SMS-kode …</p>}
      {stage === "verify" && (
        <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-xs leading-5 text-slate-300">Skriv inn den sekssifrede koden du mottok på SMS.</p>
          <input type="text" inputMode="numeric" autoComplete="one-time-code"
            maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            aria-label="Sekssifret SMS-kode" placeholder="6-sifret kode"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-base tracking-widest text-white" />
          <button type="button" disabled={previewMode || busy || !/^\d{6}$/.test(code)}
            onClick={() => void verifyCode()}
            className="w-full rounded-xl bg-amber-400 px-4 py-3 text-xs font-black text-slate-950 disabled:opacity-50">
            {busy ? "Kontrollerer …" : "Bekreft kode"}
          </button>
          <button type="button" disabled={previewMode || busy}
            onClick={() => void resendCode()}
            className="w-full rounded-xl border border-slate-600 px-4 py-2.5 text-xs font-semibold text-slate-200 disabled:opacity-50">
            Send ny kode (etter at den forrige er utløpt)
          </button>
        </div>
      )}
      {stage === "document" && (
        <div className="space-y-3">
          {pdfUrl ? (
            <>
              <iframe title="Arbeidsavtalen som skal signeres" src={pdfUrl}
                className="h-[65vh] min-h-[420px] w-full rounded-xl bg-white" />
              <p role="status" className="text-xs text-emerald-300">
                PDF-innholdet er kontrollert mot avtalens SHA-256.
              </p>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                className="inline-block text-xs font-semibold text-amber-300 underline">
                Åpne PDF i nytt vindu dersom den ikke vises her
              </a>
              <label className="flex items-start gap-2 text-xs leading-5 text-slate-200">
                <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="mt-1" />
                Jeg har lest arbeidsavtalen og samtykker til elektronisk signering.
              </label>
              <button type="button" disabled={previewMode || busy || !accepted}
                onClick={() => void sign()}
                className="w-full rounded-xl bg-amber-400 px-4 py-3 text-xs font-black text-slate-950 disabled:opacity-50">
                {busy ? "Signerer …" : "Signer arbeidsavtalen"}
              </button>
            </>
          ) : (
            <button type="button" disabled={busy || previewMode} onClick={() => {
              setBusy(true);
              void openDocument(signingToken).catch(e => setError(e instanceof Error ? e.message : "Kunne ikke hente PDF.")).finally(() => setBusy(false));
            }} className="rounded-xl border border-amber-500/40 px-4 py-3 text-xs font-bold text-amber-300 disabled:opacity-50">
              Åpne arbeidsavtalen for signering
            </button>
          )}
        </div>
      )}
      {stage === "completed" && <p role="status" className="text-xs font-semibold text-emerald-300">{result}</p>}
      {error && <p role="alert" className="text-xs leading-5 text-rose-300">{error}</p>}
    </div>
  );
}
