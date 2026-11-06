import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiUrl } from "../../lib/api";

export type AgreementPlanningData = {
  start_date: string;
  estimated_duration: string;
};

type Proposal = {
  id: number;
  offer_number: string;
  proposed_start_date: string;
  estimated_duration: string;
  status: string;
  customer_response_note?: string | null;
};

type Props = {
  onSubmit: (data: AgreementPlanningData) => void | Promise<void>;
  inquiryId: number;
  offerNumber: string;
  saving?: boolean;
};

const SESSION_KEY = "taklekkasjevakten_project_manager_session";

const durationOptions = [
  "1 dag", "2 dager", "3 dager", "4 dager", "5 dager",
  "1 uke", "2 uker", "3 uker", "4 uker",
];

export default function AgreementPlanning({
  onSubmit,
  inquiryId,
  offerNumber,
  saving = false,
}: Props) {
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState("");

  const sessionToken =
    typeof window !== "undefined"
      ? window.localStorage.getItem(SESSION_KEY) || ""
      : "";

  const load = useCallback(async () => {
    if (!sessionToken || inquiryId <= 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        apiUrl("/project_manager_agreement_schedule.php"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "list",
            inquiry_id: inquiryId,
            session_token: sessionToken,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke hente datoforslag.");
      }

      const relevant = (Array.isArray(data.proposals)
        ? data.proposals
        : []) as Proposal[];

      setProposal(
        relevant.find((item) => item.offer_number === offerNumber) ?? null
      );
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke hente status.");
    } finally {
      setLoading(false);
    }
  }, [sessionToken, inquiryId, offerNumber]);

  useEffect(() => {
    void load();
  }, [load]);

  const locked = proposal?.status === "approved";
  const replacingPending = proposal?.status === "pending_customer";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!sessionToken || !startDate || !duration || saving || busy || locked) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      await onSubmit({
        start_date: startDate,
        estimated_duration: duration,
      });
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunne ikke sende datoforslaget."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="space-y-5 rounded-2xl border border-slate-700 bg-slate-900 p-5"
    >
      <div>
        <h3 className="text-lg font-bold text-white">Fastsett arbeidsdato</h3>
        <p className="mt-1 text-sm text-slate-400">
          Registrer faktisk oppstartsdato og forventet varighet.
          Datoen kan ligge tilbake i tid dersom arbeidet allerede har startet.
          Styreleder skal godkjenne datoen før avtalen opprettes.
        </p>
      </div>

      {loading && (
        <p className="text-sm text-slate-400">Henter avtalestatus …</p>
      )}

      {proposal && !loading && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-white">
          <p className="font-bold">
            Dato: {proposal.proposed_start_date}
          </p>
          <p className="mt-1">Varighet: {proposal.estimated_duration}</p>
          <p className="mt-2 text-amber-300">
            {proposal.status === "pending_customer"
              ? "Avventer styreleders godkjenning"
              : proposal.status === "approved"
                ? "Arbeidsdato godkjent"
                : proposal.status === "change_requested"
                  ? "Styreleder har bedt om endring"
                  : `Status: ${proposal.status}`}
          </p>
          {proposal.customer_response_note && (
            <p className="mt-2 text-slate-300">
              Kundens merknad: {proposal.customer_response_note}
            </p>
          )}
        </div>
      )}

      {!locked && !loading && (
        <>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-white">
              Faktisk eller planlagt oppstartsdato
            </span>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-3 text-white"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white">
              Forventet varighet
            </span>
            <select
              required
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-3 text-white"
            >
              <option value="">Velg varighet</option>
              {durationOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <p className="text-xs text-slate-400">
            Varigheten er et estimat. Datoen sendes til styreleder,
            ikke direkte til signering.
          </p>

          <button
            type="submit"
            disabled={saving || busy || !sessionToken || !startDate || !duration}
            className="w-full rounded-lg bg-amber-500 px-4 py-3 font-bold text-slate-950 disabled:opacity-50"
          >
            {saving || busy ? "Sender …" : replacingPending ? "Send korrigert dato til styreleder" : "Send dato til styreleder"}
          </button>

          {!sessionToken && (
            <p className="text-xs text-amber-300">
              Ordinær prosjektlederinnlogging kreves for innsending.
            </p>
          )}
        </>
      )}

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    </form>
  );
}
