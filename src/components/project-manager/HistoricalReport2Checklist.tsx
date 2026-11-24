import { useEffect, useState } from "react";
import { apiUrl } from "../../lib/api";
import ServiceCompletionWorkspace from "./ServiceCompletionWorkspace";
import type { WorkOverride } from "../AdminWorkOverride";

type Props = { inquiryId: number; address: string; adminPreview: boolean; onBack: () => void; onFinished: () => void };
export default function HistoricalReport2Checklist({ inquiryId, address, adminPreview, onBack, onFinished }: Props) {
  const [work,setWork] = useState<WorkOverride|null>(null);
  const [reportText,setReportText] = useState("");
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
        }
      } catch(e) { if (!signal.aborted) setError(e instanceof Error ? e.message : "Kunne ikke hente kontrollisten."); }
      finally { if (!signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  },[inquiryId,adminPreview]);
  return <main className="min-h-screen bg-[#211612] p-4 text-white sm:p-6">
    <div className="mx-auto max-w-5xl space-y-4">
      <button type="button" onClick={onBack} className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-bold">Tilbake til oppdrag</button>
      <h1 className="text-lg font-black">Kontrolliste for Rapport 2 · Sak #{inquiryId}</h1>
      <p className="text-sm text-slate-300">{address}</p>
      {work && <p className="text-sm text-emerald-300">Utført arbeid: {work.work_type} · {work.started_on} – {work.completed_on}</p>}
      {loading && <p role="status">Henter kontrollgrunnlaget …</p>}
      {error && <p role="alert" className="text-rose-300">{error}</p>}
      {work && !loading && !error && <ServiceCompletionWorkspace inquiryId={inquiryId} reportText={reportText} historicalWork={work} readOnly={adminPreview} onFinished={adminPreview ? undefined : onFinished}/>}
    </div>
  </main>;
}
