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

export default function AgreementScheduleStatus({ inquiryId, offerNumber }: Props) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const token = window.localStorage.getItem(SESSION_KEY);
    if (!token || !inquiryId || !offerNumber) {
      setError("Kunne ikke hente avtalestatus.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(apiUrl("/project_manager_agreement_schedule.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          action: "list",
          inquiry_id: inquiryId,
          session_token: token
        })
      });

      const data = await response.json();

      if (!response.ok || data?.success !== true) {
        throw new Error(data?.message || "Kunne ikke hente avtalestatus.");
      }

      const matching = (Array.isArray(data.proposals) ? data.proposals : [])
        .filter((row: Proposal) => row.offer_number === offerNumber)
        .sort((a: Proposal, b: Proposal) => b.id - a.id);

      setProposal(matching[0] ?? null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke hente status.");
    } finally {
      setLoading(false);
    }
  }, [inquiryId, offerNumber]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-xs text-slate-400">Henter avtalestatus …</p>;
  }

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-amber-300">{error}</p>
        <button type="button" onClick={() => void load()}
          className="text-xs text-cyan-300 hover:underline">
          Prøv igjen
        </button>
      </div>
    );
  }

  if (!proposal) {
    return <p className="text-xs text-slate-300">Oppstartsdato er ikke registrert.</p>;
  }

  const status = proposal.status;

  const label =
    status === "pending_customer" ? "Avventer kundens bekreftelse" :
    status === "approved" ? "Oppstartsdato godkjent av kunden" :
    status === "change_requested" ? "Kunden ønsker endring" :
    status === "superseded" ? "Datoforslaget er erstattet" :
    status === "cancelled" ? "Datoforslaget er avlyst" :
    "Avtalestatus: " + status;

  return (
    <div className="space-y-2" aria-live="polite">
      <p className="text-sm font-bold text-white">{label}</p>
      <p className="text-xs text-slate-300">
        Oppstart: {proposal.proposed_start_date}
      </p>
      <p className="text-xs text-slate-300">
        Forventet varighet: {proposal.estimated_duration}
      </p>
      {status === "pending_customer" && (
        <p className="text-xs leading-5 text-slate-400">
          Kunden skal bekrefte oppstartsdatoen før arbeidsavtalen opprettes.
        </p>
      )}
      {status === "change_requested" && proposal.customer_response_note && (
        <p className="text-xs text-slate-300">
          Kundens merknad: {proposal.customer_response_note}
        </p>
      )}
    </div>
  );
}