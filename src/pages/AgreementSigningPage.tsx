import AgreementSigningDemo from "./AgreementSigningDemo";
import { useEffect, useState } from "react";

const ENDPOINT =
  "https://api.perun.no/api/agreement_signing_public.php";

type Step = "request" | "verify" | "document" | "completed";

export default function AgreementSigningPage() {
  if (
    import.meta.env.DEV &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
    new URLSearchParams(window.location.search).get("demo") === "1"
  ) {
    return <AgreementSigningDemo />;
  }

  return <RealAgreementSigningPage />;
}

function RealAgreementSigningPage() {
  const [token] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || "";
  });

  const [step, setStep] = useState<Step>("request");
  const [code, setCode] = useState("");
  const [documentHash, setDocumentHash] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [agreementId, setAgreementId] = useState<number | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  useEffect(() => {
    if (token) {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }
  }, [token]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  async function call(
    action: string,
    extra: Record<string, unknown> = {}
  ) {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      referrerPolicy: "no-referrer",
      body: JSON.stringify({ action, token, ...extra }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(
        data.message || "Forespørselen kunne ikke fullføres."
      );
    }

    return response.json();
  }

  async function requestCode() {
    setBusy(true);
    setError("");
    try {
      await call("request_code");
      setStep("verify");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke sende kode.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setBusy(true);
    setError("");
    try {
      await call("verify_code", { code: code.trim() });

      const info = await call("document_info");

      if (!/^[a-f0-9]{64}$/.test(info.document_sha256)) {
        throw new Error("Dokumentkontrollen feilet.");
      }

      const pdfResponse = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        referrerPolicy: "no-referrer",
        body: JSON.stringify({ action: "document", token }),
      });

      if (!pdfResponse.ok) {
        throw new Error("Kunne ikke åpne arbeidsavtalen.");
      }

      const blob = await pdfResponse.blob();
      if (blob.type !== "application/pdf") {
        throw new Error("Serveren returnerte ikke en PDF.");
      }

      setPdfUrl(URL.createObjectURL(blob));
      setDocumentHash(info.document_sha256);
      setAgreementId(Number(info.agreement_id));
      setStep("document");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verifiseringen feilet.");
    } finally {
      setBusy(false);
    }
  }

  async function sign() {
    if (!accepted || !documentHash || !pdfUrl) return;
    setBusy(true);
    setError("");

    try {
      await call("consent", {
        document_sha256: documentHash,
        accepted: true,
      });

      const response = await call("sign", {
        document_sha256: documentHash,
      });

      setResult(
        response.result?.signing_complete
          ? "Alle parter har signert avtalen."
          : "Din signatur er registrert. Avtalen venter på øvrige signatarer."
      );
      setStep("completed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Signering mislyktes.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#071321] px-4 py-10 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="border-b border-slate-800 pb-5">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Taklekkasjevakten
          </p>
          <h1 className="mt-2 text-2xl font-black">
            Elektronisk signering av arbeidsavtale
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Bekreft identiteten din, les avtalen og signer.
          </p>
        </header>

        {!/^[a-f0-9]{64}$/.test(token) && (
          <p role="alert" className="text-red-300">
            Signeringslenken er ugyldig eller mangler.
          </p>
        )}

        {/^[a-f0-9]{64}$/.test(token) && step === "request" && (
          <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <h2 className="font-bold">1. Bekreft mobilnummer</h2>
            <p className="my-3 text-sm text-slate-400">
              Vi sender en engangskode til mobilnummeret som er
              registrert på signeringsinvitasjonen.
            </p>
            <button
              type="button"
              onClick={() => void requestCode()}
              disabled={busy}
              className="rounded-xl bg-amber-500 px-5 py-3 font-bold text-slate-950 disabled:opacity-50"
            >
              {busy ? "Sender …" : "Send SMS-kode"}
            </button>
          </section>
        )}

        {step === "verify" && (
          <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <h2 className="font-bold">2. Skriv inn SMS-koden</h2>
            <input
              aria-label="Sekssifret SMS-kode"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="6-sifret kode"
              className="my-4 block w-full max-w-xs rounded-xl border border-slate-700 bg-slate-900 p-3"
            />
            <button
              type="button"
              disabled={busy || !/^\d{6}$/.test(code)}
              onClick={() => void verifyCode()}
              className="rounded-xl bg-amber-500 px-5 py-3 font-bold text-slate-950 disabled:opacity-50"
            >
              {busy ? "Kontrollerer …" : "Bekreft kode"}
            </button>
          </section>
        )}

        {step === "document" && (
          <section className="space-y-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <h2 className="mb-3 text-lg font-bold">
                3. Les arbeidsavtalen
              </h2>
              {agreementId && (
                <p className="mb-3 text-xs text-slate-400">
                  Avtalereferanse: {agreementId}
                </p>
              )}
              <iframe
                title="Arbeidsavtale PDF"
                src={pdfUrl}
                className="h-[85vh] min-h-[700px] w-full rounded-lg bg-white"
              />
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm text-amber-400 underline"
              >
                Åpne PDF i eget vindu
              </a>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <h2 className="font-bold">4. Signer avtalen</h2>
              <label className="mt-4 flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={e => setAccepted(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  Jeg har lest arbeidsavtalen og samtykker til å
                  signere den elektronisk.
                </span>
              </label>
              <button
                type="button"
                disabled={busy || !accepted}
                onClick={() => void sign()}
                className="mt-5 rounded-xl bg-amber-500 px-6 py-3 font-bold text-slate-950 disabled:opacity-50"
              >
                {busy ? "Signerer …" : "Signer arbeidsavtalen"}
              </button>
            </div>
          </section>
        )}

        {step === "completed" && (
          <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <h2 className="text-xl font-bold">Signatur registrert</h2>
            <p className="mt-3 text-slate-300">{result}</p>
          </section>
        )}

        {error && (
          <p role="alert" className="rounded-xl border border-red-900 p-4 text-sm text-red-300">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
