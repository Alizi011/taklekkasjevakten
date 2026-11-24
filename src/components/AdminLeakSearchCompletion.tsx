import { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";
import AdminRetrospectiveChecklistTask from "./AdminRetrospectiveChecklistTask";

type Completion = { performed_on: string; recorded_at: string };
type ResponseBody = {
  success?: boolean; completed?: boolean; completion?: Completion | null; message?: string
};

/** Admin workflow: attest original leak-search date, then request original checklist. */
export default function AdminLeakSearchCompletion({ inquiryId }: { inquiryId: number }) {
  const [completion, setCompletion] = useState<Completion | null>(null);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showChecklistRequest, setShowChecklistRequest] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setCompletion(null);
    setShowChecklistRequest(false);
    setError("");
    setNotice("");
    void fetch(apiUrl(`/admin_leak_search_completion.php?inquiry_id=${encodeURIComponent(String(inquiryId))}`), {
      credentials: "include", cache: "no-store", signal: controller.signal
    }).then(async response => {
      const body = await response.json() as ResponseBody;
      if (!response.ok || !body.success) throw new Error(body.message || "Kunne ikke lese utførelsesstatus.");
      if (active) setCompletion(body.completion || null);
    }).catch(err => {
      if (active) setError(err instanceof Error ? err.message : "Kunne ikke lese utførelsesstatus.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [inquiryId]);

  const register = async () => {
    if (saving || !date || completion) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(apiUrl("/admin_leak_search_completion.php"), {
        method: "POST", credentials: "include", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inquiry_id: inquiryId, performed_on: date })
      });
      const body = await response.json() as ResponseBody;
      if (!response.ok || !body.success || !body.completion) {
        throw new Error(body.message || "Kunne ikke registrere dato.");
      }
      setCompletion(body.completion);
      setNotice("Lekkasjesøket er registrert som utført. Du kan nå etterspørre sjekklisten.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke lagre utførelsesdato.");
    } finally { setSaving(false); }
  };

  const format = (value: string) => {
    const [year, month, day] = value.split("-");
    return year && month && day ? `${day}.${month}.${year}` : value;
  };

  return (
    <section className="space-y-4 rounded-xl border border-emerald-500/35 bg-emerald-500/[0.04] p-4"
      aria-label="Registrering av utført lekkasjesøk">
      <div>
        <h3 className="text-sm font-black text-white">Lekkasjesøk – utførelse og sjekkliste</h3>
        <p className="mt-1 text-xs text-slate-300">
          Administrator registrerer faktisk utførelsesdato. Deretter kan sjekklisten etterspørres fra prosjektansvarlig.
          Registrering her endrer ikke tilbud, avtaler eller Rapport 1.
        </p>
      </div>
      {loading ? <p className="text-xs text-slate-400">Henter status …</p> :
        completion ? (
          <div className="space-y-3">
            <p className="text-sm font-black text-emerald-300">
              Lekkasjesøk utført {format(completion.performed_on)}
            </p>
            <p className="text-xs text-slate-400">Registrert {completion.recorded_at} · administrator</p>
            <button type="button" onClick={() => setShowChecklistRequest(v => !v)}
              className="rounded-lg bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950">
              {showChecklistRequest ? "Skjul etterspørsel" : "Etterspør sjekkliste"}
            </button>
            {showChecklistRequest && <AdminRetrospectiveChecklistTask inquiryId={inquiryId}/>}
          </div>
        ) : !error ? (
          <div className="space-y-3">
            <label className="block max-w-sm text-xs font-semibold text-white">
              Faktisk dato lekkasjesøket ble utført
              <input type="date" value={date} max={new Date().toLocaleDateString("en-CA")}
                onChange={event => setDate(event.target.value)}
                className="mt-2 block w-full rounded-lg border border-slate-600 bg-slate-950 p-2.5 text-white"/>
            </label>
            <button type="button" onClick={() => void register()} disabled={!date || saving}
              className="rounded-lg bg-emerald-400 px-4 py-2.5 text-xs font-black text-slate-950 disabled:opacity-40">
              {saving ? "Lagrer …" : "Registrer lekkasjesøk utført"}
            </button>
          </div>
        ) : null}
      {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
      {notice && <p role="status" className="text-xs text-emerald-300">{notice}</p>}
    </section>
  );
}
