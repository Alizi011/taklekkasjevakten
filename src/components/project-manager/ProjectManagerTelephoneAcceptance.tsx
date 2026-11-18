import { useEffect, useState } from "react";
import { apiUrl } from "../../lib/api";

type Offer = {
  id: number;
  offer_number?: string | null;
  status: string;
  title?: string | null;
};

export default function ProjectManagerTelephoneAcceptance({
  inquiryId,
}: {
  inquiryId: number;
}) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selected, setSelected] = useState("");
  const [person, setPerson] = useState("");
  const [acceptedAt, setAcceptedAt] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setSelected("");
    setOffers([]);

    void fetch(
      apiUrl(`/offers.php?inquiry_id=${inquiryId}&all=1`),
      { credentials: "include", cache: "no-store" }
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || data.success !== true || !Array.isArray(data.offers)) {
          throw new Error(data.message || "Kunne ikke hente tilbud.");
        }
        if (!cancelled) {
          setOffers(
            data.offers.filter(
              (offer: Offer) => offer.status === "publisert"
            )
          );
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Kunne ikke hente tilbud.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [inquiryId]);

  async function registerAcceptance() {
    if (busy || !selected || person.trim().length < 2 ||
        note.trim().length < 10 || !acceptedAt) return;

    const token = window.localStorage.getItem(
      "taklekkasjevakten_project_manager_session"
    );

    if (!token) {
      setError("Prosjektlederøkten mangler. Logg inn på nytt.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        apiUrl("/admin_offer_external_acceptance.php"),
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "accept_external",
            project_manager_session_token: token,
            inquiry_id: inquiryId,
            offer_id: Number(selected),
            customer_representative: person.trim(),
            channel: "telephone",
            accepted_at: acceptedAt,
            evidence_note: note.trim(),
            separate_signature_not_required: false,
          }),
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok || result?.success !== true) {
        throw new Error(
          result?.message || `Registrering feilet (HTTP ${response.status}).`
        );
      }

      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunne ikke registrere aksept."
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;
  if (offers.length === 0 && !error) return null;

  return (
    <section className="rounded-2xl border border-amber-500/30 bg-amber-950/10 p-5 space-y-3">
      <h3 className="text-sm font-black text-amber-300">
        Registrer telefonisk aksept
      </h3>
      <p className="text-xs text-slate-300">
        Brukes kun når kunden faktisk har akseptert tilbudet per telefon.
        Dette er ikke en digital signatur og frigir ikke arbeid uten signeringskrav.
      </p>

      <label className="block text-xs">
        Publisert tilbud
        <select value={selected} onChange={e => setSelected(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-3">
          <option value="">Velg tilbud</option>
          {offers.map(offer => (
            <option key={offer.id} value={offer.id}>
              {offer.offer_number || `Tilbud #${offer.id}`} – {offer.title || "Tilbud"}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-xs">
        Personen som aksepterte
        <input value={person} onChange={e => setPerson(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-3" />
      </label>

      <label className="block text-xs">
        Dato og klokkeslett for aksept (norsk tid)
        <input type="datetime-local" value={acceptedAt}
          onChange={e => setAcceptedAt(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-3" />
      </label>

      <label className="block text-xs">
        Hva ble avtalt? Dokumenter samtalen og representantens fullmakt.
        <textarea value={note} onChange={e => setNote(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-3" />
      </label>

      {error && <p role="alert" className="text-xs text-red-300">{error}</p>}

      <button type="button" onClick={() => void registerAcceptance()}
        disabled={busy || !selected || person.trim().length < 2 ||
          note.trim().length < 10 || !acceptedAt}
        className="w-full rounded-lg bg-amber-500 px-4 py-3 text-xs font-black text-slate-950 disabled:opacity-40">
        {busy ? "Registrerer aksept…" : "Bekreft telefonisk aksept"}
      </button>
    </section>
  );
}