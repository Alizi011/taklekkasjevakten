import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../lib/api";

type Task = {
  id: number;
  title: string;
  status: string;
  description?: string | null;
  created_at?: string | null;
  assigned_employee_id?: number | null;
};
type TaskResponse = {
  success: boolean;
  message?: string;
  created?: boolean;
  task?: Task | null;
  project_id?: number;
  project_manager_id?: number;
};

// Admin-only: actual manager is resolved and validated by the server.
// No direct project ID or employee assignment is accepted from the browser.
export default function AdminRetrospectiveChecklistTask({ inquiryId }: { inquiryId: number }) {
  const [task, setTask] = useState<Task | null>(null);
  const [workDate, setWorkDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [managerId, setManagerId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!Number.isInteger(inquiryId) || inquiryId <= 0) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        apiUrl(`/admin_retrospective_checklist_task.php?inquiry_id=${encodeURIComponent(String(inquiryId))}`),
        { credentials: "include", cache: "no-store" }
      );
      const data = await response.json() as TaskResponse;
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke hente etterregistreringsoppgave.");
      }
      setTask(data.task || null);
      setManagerId(Number(data.project_manager_id || 0) || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke hente oppgave.");
    } finally {
      setLoading(false);
    }
  }, [inquiryId]);

  useEffect(() => {
    setTask(null);
    setMessage("");
    setError("");
    void refresh();
  }, [refresh]);

  const createTask = async () => {
    if (saving || task) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(apiUrl("/admin_retrospective_checklist_task.php"), {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inquiry_id: inquiryId, work_date: workDate, reason: reason.trim() })
      });
      const data = await response.json() as TaskResponse;
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke opprette etterregistreringsoppgave.");
      }
      setTask(data.task || null);
      setMessage(data.created
        ? "Etterregistreringsoppgaven er tildelt prosjektansvarlig."
        : "Etterregistreringsoppgaven finnes allerede.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke opprette oppgaven.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4 rounded-xl border border-amber-500/35 bg-amber-500/[0.04] p-4"
      aria-label="Etterregistrering av sjekkliste">
      <div>
        <h4 className="text-sm font-black text-white">Fullfør manglende sjekkliste</h4>
        <p className="mt-1 text-xs leading-5 text-slate-300">
          Tildel prosjektansvarlig oppgaven med å fylle ut den eksisterende sjekklisten. Allerede lagrede punkter og vedlegg beholdes.
        </p>
      </div>
      {loading ? <p className="text-xs text-slate-300">Kontrollerer eksisterende oppgaver …</p> :
        task ? (
          <div className="space-y-2 rounded-lg border border-emerald-500/30 bg-slate-950/50 p-3">
            <p className="text-xs font-black text-emerald-300">Oppgave #{task.id} · {task.status}</p>
            <p className="text-xs font-semibold text-white">{task.title}</p>
            <p className="whitespace-pre-wrap text-xs leading-5 text-slate-300">{task.description}</p>
            <p className="text-[11px] text-slate-400">
              Prosjektansvarlig (Core-ID): {task.assigned_employee_id ?? managerId ?? "ikke registrert"}
              {task.created_at ? ` · Opprettet ${task.created_at}` : ""}
            </p>
            <p className="text-[11px] text-slate-400">Oppgaven ligger i prosjektlederportalen. Opprettelse her endrer ikke rapportstatus eller tidligere sjekkliste.</p>
          </div>
        ) : !error ? (
          <div className="grid gap-3">
            <label className="space-y-1 text-xs font-semibold text-white">
              Dato for utført arbeid (valgfritt)
              <input type="date" value={workDate} onChange={e => setWorkDate(e.target.value)}
                max={new Date().toLocaleDateString("en-CA")}
                className="block w-full max-w-xs rounded-lg border border-slate-600 bg-slate-950 p-2 text-white"/>
            </label>
            <label className="space-y-1 text-xs font-semibold text-white">
              Merknad til prosjektansvarlig (valgfritt)
              <textarea value={reason} onChange={e => setReason(e.target.value)}
                rows={3} maxLength={2000}
                placeholder="For eksempel: Sjekklisten mangler etter tidligere utført lekkasjesøk. Bruk eksisterende bilder og arbeidsnotater."
                className="block w-full rounded-lg border border-slate-600 bg-slate-950 p-3 text-white"/>
            </label>
            <p className="text-[11px] text-amber-200">
              Oppgaven opprettes med dagens dato. Dersom arbeidsdatoen er ukjent, kan prosjektansvarlig avklare den når sjekklisten fylles ut.
            </p>
            <button type="button" onClick={() => void createTask()}
              disabled={saving}
              className="w-fit rounded-lg bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950 disabled:opacity-40">
              {saving ? "Tildeler …" : "Tildel etterregistrering"}
            </button>
          </div>
        ) : null}
      {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
      {message && <p role="status" className="text-xs text-emerald-300">{message}</p>}
      {error && <button type="button" onClick={() => void refresh()}
        className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-bold text-white">Prøv igjen</button>}
    </section>
  );
}
