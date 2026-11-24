import { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";

type Completion = { performed_on: string; recorded_at: string };
type Reply = { success?: boolean; completed?: boolean; completion?: Completion | null; message?: string };
type Status = "loading" | "not_completed" | "completed" | "error";

type Props = {
  inquiryId: number;
  onStateChange: (inquiryId: number, state: Status) => void;
};

/** Assigned project manager sees admin-attested dates but cannot change them. */
export default function ProjectManagerLeakSearchCompletion({ inquiryId, onStateChange }: Props) {
  const [completion, setCompletion] = useState<Completion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setCompletion(null);
    setError("");
    onStateChange(inquiryId, "loading");
    const token = window.localStorage.getItem("taklekkasjevakten_project_manager_session");
    if (!token) {
      setError("Prosjektlederinnlogging kreves.");
      setLoading(false);
      onStateChange(inquiryId, "error");
      return () => controller.abort();
    }
    void fetch(apiUrl("/project_manager_leak_search_completion.php"), {
      method: "POST", cache: "no-store", signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", inquiry_id: inquiryId, session_token: token })
    }).then(async response => {
      const result = await response.json() as Reply;
      if (!response.ok || !result.success) throw new Error(result.message || "Kunne ikke hente status.");
      if (!active) return;
      setCompletion(result.completion || null);
      onStateChange(inquiryId, result.completed ? "completed" : "not_completed");
    }).catch(err => {
      if (!active) return;
      setError(err instanceof Error ? err.message : "Kunne ikke hente status.");
      onStateChange(inquiryId, "error");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [inquiryId, onStateChange]);

  const format = (value: string) => {
    const [year, month, day] = value.split("-");
    return year && month && day ? `${day}.${month}.${year}` : value;
  };

  return (
    <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] p-4"
      aria-label="Status for lekkasjesøk">
      <h3 className="text-sm font-black text-white">Utførelsesstatus for lekkasjesøk</h3>
      {loading ? <p className="mt-2 text-xs text-slate-300">Henter status …</p>
        : completion ? <div className="mt-2 space-y-1">
          <p className="text-sm font-black text-emerald-300">
            Lekkasjesøk utført {format(completion.performed_on)}
          </p>
          <p className="text-xs text-slate-300">
            Registrert av administrator {completion.recorded_at}. Sjekkliste og Rapport 1 behandles separat.
          </p>
        </div>
        : !error ? <p className="mt-2 text-xs text-slate-300">
          Administrator har ennå ikke registrert utførelsesdatoen. Kontakt administrator dersom arbeidet er utført.
        </p> : null}
      {error && <p role="alert" className="mt-2 text-xs text-amber-300">{error}</p>}
    </section>
  );
}
