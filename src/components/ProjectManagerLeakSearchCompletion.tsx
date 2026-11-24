import { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";

type Completion = {
  performed_on: string;
  recorded_at: string;
  recorded_by_employee_id: number;
};
type Result = {
  success?: boolean;
  completed?: boolean;
  completion?: Completion | null;
  message?: string;
};

type Props = {
  inquiryId: number;
  onStateChange: (state: "loading" | "not_completed" | "completed" | "error") => void;
};

/** Records only the original leak-search performance date, not report approval. */
export default function ProjectManagerLeakSearchCompletion({ inquiryId, onStateChange }: Props) {
  const [date, setDate] = useState("");
  const [showDate, setShowDate] = useState(false);
  const [saved, setSaved] = useState<Completion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [statusNote, setStatusNote] = useState("");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setSaved(null);
    setShowDate(false);
    setDate("");
    setError("");
    onStateChange("loading");
    const session = window.localStorage.getItem("taklekkasjevakten_project_manager_session");
    if (!session) {
      setError("Logg inn som prosjektansvarlig for å registrere utført lekkasjesøk.");
      setLoading(false);
      onStateChange("error");
      return () => controller.abort();
    }
    void fetch(apiUrl("/project_manager_leak_search_completion.php"), {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", session_token: session, inquiry_id: inquiryId })
    }).then(async response => {
      const data = await response.json() as Result;
      if (!response.ok || !data.success) throw new Error(data.message || "Kunne ikke lese status.");
      if (!active) return;
      setSaved(data.completion || null);
      onStateChange(data.completed ? "completed" : "not_completed");
    }).catch(e => {
      if (!active) return;
      setError(e instanceof Error ? e.message : "Kunne ikke lese status.");
      onStateChange("error");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [inquiryId, onStateChange]);

  const save = async () => {
    if (saving || !date) return;
    setSaving(true);
    setError("");
    setStatusNote("");
    try {
      const session = window.localStorage.getItem("taklekkasjevakten_project_manager_session");
      if (!session) throw new Error("Prosjektlederinnlogging kreves.");
      const response = await fetch(apiUrl("/project_manager_leak_search_completion.php"), {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", session_token: session,
          inquiry_id: inquiryId, performed_on: date })
      });
      const result = await response.json() as Result;
      if (!response.ok || !result.success || !result.completion) {
        throw new Error(result.message || "Kunne ikke registrere utførelsesdato.");
      }
      setSaved(result.completion);
      setShowDate(false);
      setStatusNote("Utførelsesdatoen er registrert. Sjekkliste og Rapport 1 påvirkes ikke.");
      onStateChange("completed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke registrere dato.");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value: string) => {
    const [y, m, d] = value.split("-");
    return y && m && d ? `${d}.${m}.${y}` : value;
  };
  return (
    <section aria-label="Status for utført lekkasjesøk"
      className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] p-5">
      <h3 className="text-sm font-black text-white">Status for lekkasjesøket</h3>
      {loading ? <p className="mt-2 text-xs text-slate-300">Kontrollerer registrert utførelse …</p>
      : saved ? <div className="mt-3 space-y-2">
        <p className="text-base font-black text-emerald-300">
          Lekkasjesøk utført · {formatDate(saved.performed_on)}
        </p>
        <p className="text-xs text-slate-300">
          Registrert {saved.recorded_at} av prosjektansvarlig.
          Sjekkliste og Rapport 1 behandles separat.
        </p>
      </div>
      : <div className="mt-3 space-y-3">
        <p className="text-xs text-slate-300">
          Dersom arbeidet allerede er utført, registrerer du den faktiske datoen her.
          Når datoen er lagret, skjules nye pris- og tidsforslag for det opprinnelige lekkasjesøket.
        </p>
        {!showDate ? (
          <button type="button" onClick={() => setShowDate(true)}
            className="rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-black text-slate-950">
            Lekkasjesøk utført
          </button>
        ) : <div className="space-y-3">
          <label className="block text-xs font-semibold text-white">
            Faktisk utførelsesdato
            <input type="date" required value={date} max={new Date().toLocaleDateString("en-CA")}
              onChange={e => setDate(e.target.value)}
              className="mt-2 block w-full max-w-xs rounded-lg border border-slate-600 bg-slate-950 p-2 text-white" />
          </label>
          <div className="flex gap-2">
            <button type="button" disabled={saving || !date} onClick={() => void save()}
              className="rounded-lg bg-emerald-400 px-4 py-2.5 text-xs font-black text-slate-950 disabled:opacity-40">
              {saving ? "Lagrer …" : "Bekreft utførelsesdato"}
            </button>
            <button type="button" onClick={() => { setShowDate(false); setError(""); }}
              className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-bold text-white">
              Avbryt
            </button>
          </div>
        </div>}
      </div>}
      {error && <p role="alert" className="mt-3 text-xs text-red-300">{error}</p>}
      {statusNote && <p role="status" className="mt-3 text-xs text-emerald-300">{statusNote}</p>}
    </section>
  );
}
