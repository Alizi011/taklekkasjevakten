import { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";

type WorkType = "service" | "vedlikehold" | "varig_utbedring";
const workTypes: Record<WorkType,string> = { service: "Service", vedlikehold: "Vedlikehold", varig_utbedring: "Varig utbedring" };
export type WorkOverride = { work_type: WorkType; started_on: string; completed_on: string; note?: string | null; recorded_at?: string };
export type PhoneAcceptance = { accepted_on: string | null; received_by: string; scope: string; note?: string | null; recorded_at: string };
export const phoneScopeLabels: Record<string,string> = { lekkasjesok:"Lekkasjesøk", service:"Service", vedlikehold:"Vedlikehold", varig_utbedring:"Varig utbedring", lekkasjesok_og_service:"Lekkasjesøk og service" };
type Result = { acceptance?: PhoneAcceptance | null; success?: boolean; message?: string; work?: WorkOverride | null; task?: { id: number; status: string } | null };
type Props = { compact?: boolean; onOpenOverride?: () => void; directWork?: boolean; inquiryId: number; projectManagerName?: string | null; onSaved?: (work: WorkOverride | null) => void; onAcceptance?: (value: PhoneAcceptance | null) => void };
export default function AdminWorkOverride({ compact = false, onOpenOverride, directWork = false, inquiryId, projectManagerName, onSaved, onAcceptance }: Props) {
  const [acceptance,setAcceptance]=useState<PhoneAcceptance|null>(null);
  const [scope,setScope]=useState("");
  const [receiverOverride,setReceiverOverride]=useState<string | null>(null);
  const receiver = receiverOverride ?? projectManagerName?.trim() ?? "";
  const [acceptDate,setAcceptDate]=useState("");
  const [acceptNote,setAcceptNote]=useState("");
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
    setType(data.work?.work_type || (directWork ? "vedlikehold" : ""));
    setStart(data.work?.started_on || ""); setEnd(data.work?.completed_on || "");
    setNote(data.work?.note || ""); setDirty(false);
    onSaved?.(data.work || null);
    setAcceptance(data.acceptance || null);
    setScope(data.acceptance?.scope || "");
    setReceiverOverride(data.acceptance?.received_by || null);
    setAcceptDate(data.acceptance?.accepted_on || "");
    setAcceptNote(data.acceptance?.note || "");
    onAcceptance?.(data.acceptance || null);
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
  const submit = async (action: "save_dates" | "request_report2_checklist") => {
    if (!available || busy || (action === "save_dates" && !validDates) || (action === "request_report2_checklist" && (!work || dirty))) return;
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
  const saveAcceptance = async () => {
    if (!available || busy || !scope || !receiver.trim()) return;
    setBusy(true);setError("");setNotice("");
    try {
      const res=await fetch(endpoint,{method:"POST",credentials:"include",cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"save_phone_acceptance",inquiry_id:inquiryId,scope,received_by:receiver,accepted_on:acceptDate||null,note:acceptNote})});
      const data=await res.json() as Result;
      if (!res.ok||!data.success) throw new Error(data.message||"Kunne ikke lagre muntlig aksept.");
      setAcceptance(data.acceptance||null);onAcceptance?.(data.acceptance||null);
      setNotice(data.message||"Muntlig aksept registrert.");
    } catch(e) {setError(e instanceof Error?e.message:"Lagring feilet.");}
    finally {setBusy(false);}
  };
  const taskStatus = task?.status;
  const taskLabel = taskStatus === "open" ? "Etterspurt – avventer prosjektansvarlig" : taskStatus === "in_progress" ? "Kontrolliste under arbeid" : taskStatus === "completed" || taskStatus === "done" ? "Kontrollisteoppgaven er fullført" : taskStatus ? "Oppgavestatus: " + taskStatus : "";
  return <>
    {(task || (!available && !busy && error)) && <div className="mt-3 rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-3" role="status">
      <p className="text-xs font-bold text-cyan-200">Forespørsel om Rapport 2</p>
      <p className="mt-1 text-xs text-slate-200">{busy ? "Henter forespørselsstatus …" : !available ? "Forespørselsstatus utilgjengelig" : task ? taskLabel : "Ingen registrert kontrollisteforespørsel funnet"}</p>
      {available && task && <p className="mt-1 text-[11px] text-slate-400">Oppgave #{task.id}{projectManagerName ? " · Prosjektansvarlig: " + projectManagerName : ""}</p>}
      {available && task && (taskStatus === "completed" || taskStatus === "done") && <p className="mt-1 text-[11px] text-slate-400">Fullført oppgave er ikke det samme som godkjent eller publisert rapport.</p>}
      {!available && !busy && error && <p className="mt-1 text-xs text-rose-300">{error}</p>}
    </div>}
    {compact && (directWork || work || task) && <button type="button" onClick={onOpenOverride} className="mt-3 text-xs font-bold text-amber-200 hover:underline">Registrer arbeid / følg opp Rapport 2 →</button>}
    <details id={`work-registration-${inquiryId}`} className={compact ? "hidden" : "mt-3 rounded-xl border border-amber-500/35 bg-amber-500/5 p-3"} data-testid="admin-work-override">
    <summary className="cursor-pointer text-xs font-black text-amber-200">{directWork ? "Registrer utført arbeid / etterspør Rapport 2" : "Administrativ overstyring"}</summary>
    <div className="mt-3 space-y-3">
      {!directWork && <div className="space-y-2 border-b border-slate-700 pb-3">
        <h4 className="text-xs font-bold text-white">Muntlig kundeaksept</h4>
        <p className="text-xs text-slate-300">Registrer tidligere telefonaksept. Oppretter ikke tilbud eller signatur.</p>
        {acceptance && <p className="text-xs text-emerald-300">Registrert: {phoneScopeLabels[acceptance.scope]} · mottatt av {acceptance.received_by}</p>}
        <label className="block text-xs">Hva kunden aksepterte<select value={scope} onChange={e=>setScope(e.target.value)} disabled={!available||busy} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-2"><option value="">Velg</option>{Object.entries(phoneScopeLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
        <label className="block text-xs">Mottatt av<input value={receiver} maxLength={150} onChange={e=>setReceiverOverride(e.target.value)} disabled={!available||busy} placeholder="Navn på mottaker dersom prosjektansvarlig ikke er tildelt" className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-2"/></label>
        <label className="block text-xs">Dato for aksept (hvis kjent)<input type="date" value={acceptDate} max={today} onChange={e=>setAcceptDate(e.target.value)} disabled={!available||busy} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-2"/></label>
        <label className="block text-xs">Merknad<textarea value={acceptNote} maxLength={1000} onChange={e=>setAcceptNote(e.target.value)} disabled={!available||busy} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-2"/></label>
        <button type="button" onClick={()=>void saveAcceptance()} disabled={!available||busy||!scope||!receiver.trim()} className="w-full rounded-lg border border-emerald-500/40 p-2 text-xs font-bold text-emerald-200 disabled:opacity-40">Registrer muntlig kundeaksept</button>
      </div>}
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
      {task && <p className="text-xs text-slate-300">Kontrolliste for Rapport 2 · Oppgave #{task.id} · {task.status}</p>}
      <button type="button" disabled={!available || busy || !work || dirty || task?.status === "open"} onClick={() => void submit("request_report2_checklist")} className="w-full rounded-lg bg-amber-400 p-2.5 text-xs font-black text-slate-950 disabled:opacity-40">Etterspør kontrolliste for Rapport 2</button>
      {busy && <p role="status" className="text-xs text-slate-400">Henter eller lagrer …</p>}
      {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
      {notice && <p role="status" className="text-xs text-emerald-300">{notice}</p>}
    </div>
  </details>
  </>;
}
