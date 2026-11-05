import { useState, type FormEvent } from "react";

type Props = {
  inquiryId: number;
  memberId: number;
  endpoint: string;
  onSuccess: (token: string, inquiryId: number) => Promise<void>;
};

export default function CustomerMemberActivation({
  inquiryId,
  memberId,
  endpoint,
  onSuccess,
}: Props) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function requestCode(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_code",
          inquiry_id: inquiryId,
          member_id: memberId,
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke sende kode.");
      }

      if (!data.verification_id) {
        setError(
          "Kontroller at invitasjonen er aktiv og at e-postadressen er riktig."
        );
        return;
      }

      setVerificationId(String(data.verification_id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunne ikke sende kode."
      );
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_code",
          inquiry_id: inquiryId,
          verification_id: verificationId,
          code: code.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.session_token) {
        throw new Error(data.message || "Ugyldig engangskode.");
      }

      await onSuccess(String(data.session_token), inquiryId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunne ikke bekrefte koden."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070a11] px-4 text-white">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-7 shadow-2xl">
        <h1 className="text-xl font-black">Aktiver personlig tilgang</h1>
        <p className="mt-2 text-sm text-slate-400">
          Bekreft medlemskapet med engangskode sendt til
          mobilnummeret som er registrert for deg.
        </p>

        {!verificationId ? (
          <form onSubmit={requestCode} className="mt-6 space-y-4">
            <label className="block text-sm">
              E-postadresse
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-amber-500 p-3 font-bold text-slate-950 disabled:opacity-50"
            >
              {busy ? "Sender …" : "Send engangskode"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="mt-6 space-y-4">
            <label className="block text-sm">
              Sekssifret SMS-kode
              <input
                type="text"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="[0-9]{6}"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-center tracking-widest"
              />
            </label>

            <button
              type="submit"
              disabled={busy || !/^\d{6}$/.test(code)}
              className="w-full rounded-xl bg-amber-500 p-3 font-bold text-slate-950 disabled:opacity-50"
            >
              {busy ? "Bekrefter …" : "Bekreft og åpne portalen"}
            </button>
          </form>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-300">
            {error}
          </p>
        )}

        <p className="mt-5 text-xs text-slate-500">
          Personlig tilgang gir ikke automatisk signaturrett.
        </p>
      </section>
    </main>
  );
}
