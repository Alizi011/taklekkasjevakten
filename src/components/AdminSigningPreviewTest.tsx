import { useState } from "react";

const TEST_CODE = "482913";
type Step = "signer" | "sms" | "document" | "done";

/** Admin-only UI walkthrough. No live SMS, signing API, or Core records. */
export default function AdminSigningPreviewTest() {
  const [expanded, setExpanded] = useState(false);
  const [step, setStep] = useState<Step>("signer");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [documentOpened, setDocumentOpened] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const reset = () => {
    setStep("signer"); setCode(""); setError(""); setDocumentOpened(false); setAccepted(false);
  };
  return (
    <section aria-label="Intern signeringstest" className="mb-5 rounded-xl border border-cyan-500/50 bg-slate-900 p-4 text-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm">Test kundens signeringsprosess</h3>
          <p className="mt-1 text-xs text-slate-300">Administratortest · simulering · ingen SMS sendes og ingen signatur lagres</p>
        </div>
        <button type="button" className="rounded-lg border border-cyan-400 px-3 py-2 text-xs text-cyan-200" onClick={() => { if (expanded) reset(); setExpanded(!expanded); }}>
          {expanded ? "Lukk" : "Start test"}
        </button>
      </div>
      {expanded && (
        <div className="mt-4 border-t border-slate-600 pt-4 space-y-3">
          <p className="text-xs text-cyan-300">{step === "signer" ? "Trinn 1 av 4" : step === "sms" ? "Trinn 2 av 4" : step === "document" ? "Trinn 3 av 4" : "Trinn 4 av 4"}</p>
          {step === "signer" && <>
            <h4 className="font-semibold">1. Bekreft signatar</h4>
            <p className="text-sm">Testsignatar (ikke en virkelig kunde). Ingen personidentitet blir verifisert i denne simuleringen.</p>
            <button className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-bold text-slate-950" onClick={() => setStep("sms")}>Bekreft testperson</button>
          </>}
          {step === "sms" && <>
            <h4 className="font-semibold">2. SMS-kode (simulert)</h4>
            <p className="text-xs text-slate-300">Ingen SMS sendes. Skriv testkoden <strong>{TEST_CODE}</strong>.</p>
            <input aria-label="Simulert SMS-kode" className="w-full max-w-56 rounded border border-slate-500 bg-slate-800 p-2" inputMode="numeric" maxLength={6} value={code} onChange={e => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }} />
            <button className="block rounded-lg bg-amber-400 px-3 py-2 text-sm font-bold text-slate-950" onClick={() => { if (code === TEST_CODE) { setStep("document"); setError(""); } else { setError("Testkoden stemmer ikke."); } }}>Bekreft testkode</button>
            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
          </>}
          {step === "document" && <>
            <h4 className="font-semibold">3. Les PDF og bekreft</h4>
            <p className="text-xs text-slate-300">Dette er et separat dokument merket TEST – IKKE BINDENDE. Ingen faktisk arbeidsavtale vises.</p>
            <iframe title="Ikke-bindende testavtale" src="/signeringstest-ikke-bindende.pdf" className="h-80 w-full rounded border border-slate-500 bg-white" onLoad={() => setDocumentOpened(true)} />
            <a href="/signeringstest-ikke-bindende.pdf" target="_blank" rel="noopener noreferrer" className="block text-xs underline text-cyan-200" onClick={() => setDocumentOpened(true)}>Åpne PDF i nytt vindu</a>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} /> Jeg har lest testdokumentet og forstår at testen ikke er bindende.</label>
            <button disabled={!documentOpened || !accepted} className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-bold text-slate-950 disabled:opacity-40" onClick={() => setStep("done")}>4. Simuler signering</button>
          </>}
          {step === "done" && <>
            <h4 className="font-semibold text-emerald-300">4. Simulering fullført</h4>
            <p className="text-sm">Kundereisen ble vist. Ingen SMS, juridisk signatur, testkvittering eller databasepost er opprettet.</p>
            <button className="rounded-lg border border-slate-500 px-3 py-2 text-sm" onClick={reset}>Start testen på nytt</button>
          </>}
        </div>
      )}
    </section>
  );
}
