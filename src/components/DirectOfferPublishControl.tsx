import { useState } from "react";
import { apiUrl } from "../lib/api";

type Props = {
  offerId: number;
  offerNumber: string;
  title: string;
  amountLabel: string;
  pdfUrl: string;
  onPublished: () => Promise<void>;
};

export default function DirectOfferPublishControl({
  offerId,
  offerNumber,
  title,
  amountLabel,
  pdfUrl,
  onPublished,
}: Props) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function publish() {
    if (!checked || busy || !pdfUrl) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        apiUrl("/admin_direct_offer_publish.php"),
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offer_id: offerId }),
        }
      );

      const result = await response.json();

      if (
        !response.ok ||
        result.success !== true ||
        result.published !== true ||
        Number(result.offer_id) !== offerId ||
        result.offer_number !== offerNumber
      ) {
        throw new Error(
          result.message ||
            "Kunne ikke bekrefte at riktig tilbud ble publisert."
        );
      }

      setOpen(false);
      setChecked(false);

      try {
        await onPublished();
      } catch {
        setError(
          "Tilbudet er publisert, men tilbudsoversikten kunne ikke oppdateres. Last inn siden på nytt."
        );
        return;
      }

      if (result.notification_scheduled !== true) {
        setError(
          "Tilbudet er publisert, men registrering av kundevarsling er ikke bekreftet. Kontroller kommunikasjonsloggen."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Publisering mislyktes."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="space-y-2">
        <button
          type="button"
          disabled={!pdfUrl}
          onClick={() => {
            setChecked(false);
            setError("");
            setOpen(true);
          }}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-purple-600 px-4 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-50"
        >
          Kontroller og publiser
        </button>

        {error && (
          <p role="alert" className="text-xs text-rose-300">
            {error}
          </p>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Kontroller tilbud før publisering"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
        >
          <div className="w-full max-w-xl space-y-5 rounded-2xl border border-slate-700 bg-[#111827] p-6 shadow-2xl">
            <div>
              <h3 className="text-lg font-extrabold text-white">
                Kontroller og publiser
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Kontroller hvilket tilbud kunden skal motta.
              </p>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-700 p-4">
              <p className="text-sm font-bold text-cyan-200">
                {offerNumber}
              </p>
              <p className="text-sm text-white">{title}</p>
              <p className="text-base font-bold text-white">
                {amountLabel}
              </p>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-lg border border-cyan-500/40 px-4 py-2 text-xs font-bold text-cyan-200"
              >
                Åpne PDF for kontroll
              </a>
            </div>

            <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={checked}
                disabled={busy}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-1"
              />
              <span>
                Jeg har kontrollert PDF, arbeidsbeskrivelse, pris
                og tilbudsnummer og godkjenner publisering til kunden.
              </span>
            </label>

            <p className="text-xs leading-5 text-amber-200">
              Bekreftelse publiserer tilbudet og registrerer automatisk
              kundevarsling via SMS og e-post.
            </p>

            {error && (
              <p role="alert" className="text-xs text-rose-300">
                {error}
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-600 px-4 py-3 text-xs font-bold text-white disabled:opacity-50"
              >
                Avbryt
              </button>
              <button
                type="button"
                disabled={!checked || busy}
                onClick={() => void publish()}
                className="rounded-xl bg-purple-600 px-5 py-3 text-xs font-bold text-white disabled:opacity-40"
              >
                {busy ? "Publiserer …" : "Bekreft og publiser"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}