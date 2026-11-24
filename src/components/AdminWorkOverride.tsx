import { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";

type WorkType = "service" | "vedlikehold" | "varig_utbedring";
const workTypes: Record<WorkType,string> = { service: "Service", vedlikehold: "Vedlikehold", varig_utbedring: "Varig utbedring" };
export type WorkOverride = { work_type: WorkType; started_on: string; completed_on: string; note?: string | null; recorded_at?: string };
type Result = { success?: boolean; message?: string; work?: WorkOverride | null; task?: { id: number; status: string } | null };
type Props = { inquiryId: number; onSaved?: (work: WorkOverride | null) => void };
export default function AdminWorkOverride({ inquiryId, onSaved }: Props) {
  const [work, setWork] = useState<WorkOverride | null>(null);
  const [type, setType] = useState<WorkType | "">("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [note, setNote] = useState("");
  const [task, setTask] = useState<Result["task"]>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [available, setAvailable] = useState(false);
  const [dirty, setDirty] = useState(false);
  const endpoint = apiUrl("/admin_work_override.php");
  const apply = (data: Result) => {
    setWork(data.work || null); setTask(data.task || null);
    setType(data.work?.work_type || "");
    setStart(data.work?.started_on || ""); setEnd(data.work?.completed_on || "");
    setNote(data.work?.note || ""); setDirty(false);
    onSaved?.(data.work || null);
  };
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true); setAvailable(false); setError(""); setNotice(""); setWork(null); setTask(null);
    void fetch(endpoint + "?inquiry_id=" + inquiryId, { credentials: "include", cache: "no-store", signal: controller.signal })
      .then(async response => {
        const data = await response.json() as Result;
        if (!response.ok || !data.success) throw new Error(data.message || "Kunne ikke hente administrativ utførelsesstatus.");
        if (!controller.signal.aborted) { apply(data); setAvailable(true); }
      }).catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Kunne ikke hente status."); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [inquiryId, endpoint]);
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Oslo" }).format(new Date());
  const validDates = Boolean(type && start && end && start <= end && end <= today);
  const submit = async (action: "save_dates" | "request_report2") => {
    if (!available || busy || (action === "save_dates" && !validDates) || (action === "request_report2" && (!work || dirty))) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(endpoint, {
        method: "POST", credentials: "include", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "save_dates" ? { action, inquiry_id: inquiryId, work_type: type, started_on: start, completed_on: end, note } : { action, inquiry_id: inquiryId })
      });
      const data = await response.json() as Result;
      if (!response.ok || !data.success) throw new Error(data.message || "Administrativ overstyring kunne ikke lagres.");
      apply(data); setNotice(data.message || "Lagret.");
    } catch (e) { setError(e instanceof Error ? e.message : "Operasjonen mislyktes."); }
    finally { setBusy(false); }
  };
  return <details className="mt-3 rounded-xl border border-amber-500/35 bg-amber-500/5 p-3" open={work ? undefined : true}>
    <summary className="cursor-pointer text-xs font-black text-amber-200">Administrativ overstyring</summary>
    <div className="mt-3 space-y-3">
      <p className="text-xs text-slate-300">Registrer faktiske arbeidsdatoer. Dette er ikke en teknisk sluttkontroll eller en kundegodkjenning.</p>
      {work && <p className="text-xs font-bold text-emerald-300">{workTypes[work.work_type]} utført: {work.started_on} – {work.completed_on}</p>}
      <label className="block text-xs text-slate-200">Faktisk utført arbeid
        <select value={type} disabled={!available || busy} onChange={e => {setType(e.target.value as WorkType | "");setDirty(true);}} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-2 text-white">
          <option value="">Velg arbeidstype</option>
          {Object.entries(workTypes).map(([value,label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="block text-xs text-slate-200">Faktisk oppstartsdato
        <input type="date" value={start} max={end || today} disabled={!available || busy} onChange={e => {setStart(e.target.value);setDirty(true);}} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-2 text-white"/>
      </label>
      <label className="block text-xs text-slate-200">Faktisk ferdigstillelsesdato
        <input type="date" value={end} min={start || undefined} max={today} disabled={!available || busy} onChange={e => {setEnd(e.target.value);setDirty(true);}} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-2 text-white"/>
      </label>
      <label className="block text-xs text-slate-200">Administrativ merknad
        <textarea rows={2} maxLength={1000} value={note} disabled={!available || busy} onChange={e => {setNote(e.target.value);setDirty(true);}} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-2 text-white"/>
      </label>
      <button type="button" disabled={!available || busy || !validDates || !dirty} onClick={() => void submit("save_dates")} className="w-full rounded-lg bg-emerald-400 p-2.5 text-xs font-black text-slate-950 disabled:opacity-40">Lagre faktiske utførelsesdatoer</button>
      {task && <p className="text-xs text-slate-300">Rapport 2 · Oppgave #{task.id} · {task.status}</p>}
      <button type="button" disabled={!available || busy || !work || dirty || task?.status === "open"} onClick={() => void submit("request_report2")} className="w-full rounded-lg bg-amber-400 p-2.5 text-xs font-black text-slate-950 disabled:opacity-40">Etterspør Rapport 2</button>
      {busy && <p role="status" className="text-xs text-slate-400">Henter eller lagrer …</p>}
      {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
      {notice && <p role="status" className="text-xs text-emerald-300">{notice}</p>}
    </div>
  </details>;
}
