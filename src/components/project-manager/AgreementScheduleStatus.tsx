import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../../lib/api";

type Proposal = {
  id: number;
  offer_number?: string;
  proposed_start_date: string;
  estimated_duration: string;
  status: string;
  customer_response_note?: string | null;
};

type Props = {
  inquiryId: number;
  offerNumber: string;
};

const SESSION_KEY = "taklekkasjevakten_project_manager_session";

export default function AgreementScheduleStatus({
  inquiryId,
  offerNumber,
}: Props) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [person, setPerson] = useState("");
  const [confirmedAt, setConfirmedAt] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const token = window.localStorage.getItem(SESSION_KEY);

    if (!token || !inquiryId || !offerNumber) {
      setError("Prosjektlederinnlogging eller tilbudsnummer mangler.");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        apiUrl("/project_manager_agreement_schedule.php"),
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "list",
            inquiry_id: inquiryId,
            session_token: token,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.success !== true) {
        throw new Error(data.message || "Kunne ikke hente datostatus.");
      }

      const matching = (Array.isArray(data.proposals) ? data.proposals : [])
        .filter((row: Proposal) => row.offer_number === offerNumber)
        .sort((a: Proposal, b: Proposal) => b.id - a.id);

      setProposal(matching[0] ?? null);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunne ikke hente datostatus."
      );
    } finally {
      setLoading(false);
    }
  }, [inquiryId, offerNumber]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmByPhone() {
    if (
      busy ||
      proposal?.status !== "pending_customer" ||
      person.trim().length < 2 ||
      note.trim().length < 10 ||
      !confirmedAt
    ) {
      return;
    }

    const token = window.localStorage.getItem(SESSION_KEY);
    if (!token) {
      setError("Prosjektlederøkten er utløpt. Logg inn på nytt.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        apiUrl("/project_manager_agreement_schedule.php"),
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "approve_by_phone",
            inquiry_id: inquiryId,
            session_token: token,
            proposal_id: proposal.id,
            customer_representative: person.trim(),
            confirmed_at: confirmedAt,
            evidence_note: note.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.success !== true) {
        throw new Error(
          data.message || "Telefonbekreftelsen kunne ikke lagres."
        );
      }

      setFormOpen(false);
      setPerson("");
      setConfirmedAt("");
      setNote("");
      setMessage(
        data.message || "Oppstartsdato er bekreftet via telefon."
      );

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Telefonbekreftelsen kunne ikke lagres."
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-xs text-slate-400">Henter avtalestatus …</p>;
  }

  if (error && !proposal) {
    return (
      <div className="space-y-2">
        <p role="alert" className="text-xs text-amber-300">{error}</p>
        <button type="button" onClick={() => void load()}
          className="text-xs text-cyan-300">
          Prøv igjen
        </button>
      </div>
    );
  }

  if (!proposal) {
    return (
      <p className="text-xs text-slate-300">
        Oppstartsdato er ikke registrert for dette tilbudet.
      </p>
    );
  }

  const status = proposal.status;
  const label =
    status === "pending_customer" ? "Avventer kundens bekreftelse" :
    status === "approved" ? "Oppstartsdato godkjent" :
    status === "change_requested" ? "Kunden ønsker endring" :
    status === "superseded" ? "Datoforslaget er erstattet" :
    status === "cancelled" ? "Datoforslaget er avlyst" :
    "Avtalestatus: " + status;

  return (
    <div className="space-y-3" aria-live="polite">
      <p className="text-sm font-bold text-white">{label}</p>

      <p className="text-xs text-slate-300">
        Oppstart: {proposal.proposed_start_date}
      </p>

      <p className="text-xs text-slate-300">
        Forventet varighet: {proposal.estimated_duration}
      </p>

      {status === "approved" && proposal.customer_response_note && (
        <p className="whitespace-pre-wrap text-xs text-emerald-200">
          {proposal.customer_response_note}
        </p>
      )}

      {status === "change_requested" && proposal.customer_response_note && (
        <p className="whitespace-pre-wrap text-xs text-slate-300">
          Kundens merknad: {proposal.customer_response_note}
        </p>
      )}

      {status === "pending_customer" && (
        <>
          <p className="text-xs leading-5 text-slate-400">
            Kunden kan bekrefte oppstartsdatoen digitalt eller via telefon.
            Dette er ikke signering av arbeidsavtalen.
          </p>

          {!formOpen ? (
            <button type="button" onClick={() => setFormOpen(true)}
              className="w-full rounded-lg border border-amber-500/50 bg-amber-500/15 px-4 py-3 text-xs font-bold text-amber-200">
              Bekreft oppstartsdato via telefon
            </button>
          ) : (
            <div className="space-y-3 rounded-xl border border-amber-500/30 bg-slate-950/50 p-3">
              <p className="text-xs font-bold text-white">
                Telefonisk bekreftelse av {proposal.proposed_start_date}
              </p>

              <label className="block text-xs text-slate-200">
                Navn på personen som bekreftet
                <input value={person}
                  maxLength={150}
                  onChange={e => setPerson(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-white" />
              </label>

              <label className="block text-xs text-slate-200">
                Dato og klokkeslett for samtalen (norsk tid)
                <input type="datetime-local" value={confirmedAt}
                  onChange={e => setConfirmedAt(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-white" />
              </label>

              <label className="block text-xs text-slate-200">
                Samtalenotat – dokumenter hva kunden bekreftet
                <textarea value={note} rows={3} maxLength={1200}
                  onChange={e => setNote(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-white" />
              </label>

              <p className="text-[11px] text-slate-400">
                Bekreftelsen gjelder kun oppstartsdatoen og erstatter ikke
                nødvendig signering av arbeidsavtalen.
              </p>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void confirmByPhone()}
                  disabled={busy || person.trim().length < 2 ||
                    note.trim().length < 10 || !confirmedAt}
                  className="rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 disabled:opacity-40">
                  {busy ? "Lagrer …" : "Registrer telefonbekreftelse"}
                </button>
                <button type="button" disabled={busy}
                  onClick={() => setFormOpen(false)}
                  className="rounded-lg border border-slate-600 px-4 py-2.5 text-xs text-slate-200">
                  Avbryt
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
      {message && <p role="status" className="text-xs text-emerald-300">{message}</p>}
    </div>
  );
}