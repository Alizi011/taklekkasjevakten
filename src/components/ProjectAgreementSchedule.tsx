import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../lib/api";

type Proposal = {
  offer_id?: number;
  id: number;
  version_no: number;
  proposed_start_date: string;
  estimated_duration: string;
  proposal_note: string | null;
  status: string;
  customer_response_note: string | null;
};

type Props = {
  inquiryId: number;
  tlvOfferId: number;
  offerNumber?: string | null;
};

const SESSION_KEY = "taklekkasjevakten_project_manager_session";

export default function ProjectAgreementSchedule({
  inquiryId,
  tlvOfferId,
  offerNumber,
}: Props) {
  const [items, setItems] = useState<Proposal[]>([]);
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("5 dager");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const token = window.localStorage.getItem(SESSION_KEY);
    if (!token) {
      setLoading(false);
      setError("Prosjektlederinnlogging kreves.");
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
            session_token: token,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke hente datoforslag.");
      }
      setItems(Array.isArray(data.proposals) ? data.proposals : []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke hente datoforslag.");
    } finally {
      setLoading(false);
    }
  }, [inquiryId]);

  useEffect(() => {
    void load();
  }, [load]);

  const current = items.find((item) => item.offer_id === undefined)
    ?? items[0];

  const locked = current?.status === "pending_customer"
    || current?.status === "approved";

  async function submit() {
    const token = window.localStorage.getItem(SESSION_KEY);

    if (!token || saving || locked) return;
    if (!startDate) {
      setError("Velg faktisk oppstartsdato.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        apiUrl("/project_manager_agreement_schedule.php"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "propose",
            inquiry_id: inquiryId,
            tlv_offer_id: tlvOfferId,
            session_token: token,
            start_date: startDate,
            duration,
            note,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke lagre datoforslaget.");
      }

      setMessage("Datoforslaget er registrert og avventer styreleders godkjenning.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registreringen feilet.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-amber-500/30 bg-[#0b1422] p-5 text-white space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-amber-300">
          Arbeidsavtale · {offerNumber || `Tilbud ${tlvOfferId}`}
        </p>
        <h3 className="mt-1 text-lg font-bold">Fastsett arbeidsdato</h3>
        <p className="mt-2 text-sm text-slate-400">
          Registrer faktisk oppstart, også dersom arbeidet allerede er påbegynt.
          Styreleder må godkjenne datoen før arbeidsavtalen opprettes.
        </p>
      </div>

      {loading && <p className="text-sm">Henter status …</p>}

      {current && !loading && (
        <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-4 text-sm">
          <p className="font-semibold">
            Siste forslag: {current.proposed_start_date}
          </p>
          <p className="mt-1 text-slate-300">
            Varighet: {current.estimated_duration}
          </p>
          <p className="mt-2 text-amber-300">
            {current.status === "approved"
              ? "Godkjent av kunden"
              : current.status === "pending_customer"
              ? "Avventer kundens godkjenning"
              : current.status === "change_requested"
              ? "Kunden har bedt om endring"
              : current.status}
          </p>
          {current.customer_response_note && (
            <p className="mt-2 text-slate-300">
              Kundens merknad: {current.customer_response_note}
            </p>
          )}
        </div>
      )}

      {!locked && !loading && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Faktisk oppstartsdato
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white"
            />
          </label>
          <label className="text-sm">
            Forventet varighet
            <input
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="5 dager eller 3 uker"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Merknad
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="For eksempel: Arbeidet ble allerede påbegynt"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="button"
              disabled={saving || !startDate || !duration.trim()}
              onClick={() => void submit()}
              className="rounded-lg bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50"
            >
              {saving ? "Registrerer …" : "Send dato til godkjenning"}
            </button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
    </section>
  );
}
