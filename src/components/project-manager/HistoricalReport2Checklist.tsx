import { useEffect, useState } from "react";
import { apiUrl } from "../../lib/api";
import ServiceCompletionWorkspace from "./ServiceCompletionWorkspace";
import type { WorkOverride } from "../AdminWorkOverride";

type Props = { inquiryId: number; address: string; adminPreview: boolean; onBack: () => void; onFinished: () => void };
export default function HistoricalReport2Checklist({ inquiryId, address, adminPreview, onBack, onFinished }: Props) {
  const [work,setWork] = useState<WorkOverride|null>(null);
  const [reportText,setReportText] = useState("");
  const [ready,setReady] = useState(false);
  const [draft,setDraft] = useState("");
  const [sending,setSending] = useState(false);
  const [notice,setNotice] = useState("");
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    setLoading(true); setError(""); setWork(null);
    void (async () => {
      try {
        const res = adminPreview
          ? await fetch(apiUrl("/admin_work_override.php?inquiry_id="+inquiryId),{credentials:"include",cache:"no-store",signal})
          : await fetch(apiUrl("/project_manager_work_override.php"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({inquiry_id:inquiryId,action:"status",session_token:window.localStorage.getItem("taklekkasjevakten_project_manager_session")||""}),signal});
        const data = await res.json();
        if (!res.ok || !data.success || !data.work) throw new Error(data.message || "Administrator må registrere faktiske arbeidsdatoer først.");
        const reportRes = await fetch(apiUrl("/reports.php?inquiry_id="+inquiryId),{credentials:"include",cache:"no-store",signal});
        const reportData = await reportRes.json();
        if (!reportRes.ok || !reportData.success) throw new Error(reportData.message || "Kunne ikke hente rapportgrunnlaget.");
        if (!signal.aborted) {
          setWork(data.work);
          setReportText(reportData.report?.admin_final || reportData.report?.ai_draft || "");
          const [completionRes,report2Res]=await Promise.all([
            fetch(apiUrl("/work_completion.php?inquiry_id="+inquiryId),{credentials:"omit",cache:"no-store",signal}),
            fetch(apiUrl("/completion_reports.php?inquiry_id="+inquiryId),{credentials:"include",cache:"no-store",signal})
          ]);
          const completion=await completionRes.json();
          const report2=await report2Res.json();
          if (!completionRes.ok || !completion.success || !report2Res.ok || !report2.success) throw new Error("Kunne ikke hente kontroll- og rapportstatus.");
          if (!signal.aborted) {
            setReady(completion.completion?.status==="arbeid_ferdig");
            setDraft(report2.report?.ai_draft || "");
          }
        }
      } catch(e) { if (!signal.aborted) setError(e instanceof Error ? e.message : "Kunne ikke hente kontrollisten."); }
      finally { if (!signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  },[inquiryId,adminPreview]);
  const submit = async () => {
    if (adminPreview || sending || !ready || !draft.trim()) return;
    setSending(true); setNotice(""); setError("");
    try {
      const res=await fetch(apiUrl("/project_manager_work_override.php"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({inquiry_id:inquiryId,action:"submit_report2",draft,session_token:window.localStorage.getItem("taklekkasjevakten_project_manager_session")||""})});
      const data=await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Kunne ikke sende Rapport 2.");
      setNotice("Rapport 2 er sendt til administrator.");
      onFinished();
    } catch(e) {setNotice(e instanceof Error ? e.message : "Innsending feilet.");}
    finally {setSending(false);}
  };
  return <main className="min-h-screen bg-[#211612] p-4 text-white sm:p-6">
    <div className="mx-auto max-w-5xl space-y-4">
      <button type="button" onClick={onBack} className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-bold">Tilbake til oppdrag</button>
      <h1 className="text-lg font-black">Kontrolliste for Rapport 2 · Sak #{inquiryId}</h1>
      <p className="text-sm text-slate-300">{address}</p>
      {work && <p className="text-sm text-emerald-300">Utført arbeid: {work.work_type} · {work.started_on} – {work.completed_on}</p>}
      {loading && <p role="status">Henter kontrollgrunnlaget …</p>}
      {error && <p role="alert" className="text-rose-300">{error}</p>}
      {work && !loading && !error && <ServiceCompletionWorkspace inquiryId={inquiryId} reportText={reportText} historicalWork={work} readOnly={adminPreview} onFinished={adminPreview ? undefined : () => setReady(true)}/>}
      {!adminPreview && ready && !loading && !error && <section className="space-y-3 rounded-xl border border-emerald-500/30 p-4">
        <h2 className="font-bold">Rapport 2 – utførelsesrapport</h2>
        <p className="text-xs text-slate-300">Kontrollisten er ferdigstilt. Beskriv kun dokumentert arbeid og eventuelle begrensninger. Eksisterende rapportutkast beholdes.</p>
        <textarea value={draft} onChange={e=>setDraft(e.target.value)} rows={12} className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm" placeholder="Rapporttekst"/>
        <button type="button" disabled={sending || !draft.trim()} onClick={()=>void submit()} className="rounded-lg bg-emerald-400 p-3 text-xs font-bold text-slate-950 disabled:opacity-40">Send Rapport 2 til administrator</button>
        {notice && <p role="status">{notice}</p>}
      </section>}
    </div>
  </main>;
}
