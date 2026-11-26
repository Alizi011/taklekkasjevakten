import { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";
import { FileText, RefreshCw } from "lucide-react";

type Allocation = { project_id:number; project_number:string|null; title:string; project_type:string|null; gross_amount:string };
type Invoice = { id:number; invoice_number:string|null; invoice_date:string|null; due_date:string|null; paid_date:string|null; total:string|null; balance:string|null; currency:string; status:string; stage_key:string|null; allocated_gross:string|null; allocations?:Allocation[]; has_external_allocations?:boolean; document_available:boolean };
type Result = { success:boolean; project_id:number; project_count?:number; invoices:Invoice[]; message?:string };
const statuses:Record<string,string>={draft:"Utkast",sent:"Sendt",partially_paid:"Delvis betalt",paid:"Betalt",overdue:"Forfalt",credited:"Kreditert",cancelled:"Annullert"};
const stages:Record<string,string>={lekkasjesok:"Lekkasjesøk",service:"Service",varig_utbedring:"Varig utbedring",takkontroll:"Takkontroll"};
const money=(value:string|null,currency:string)=>value===null?"Ikke registrert":new Intl.NumberFormat("nb-NO",{style:"currency",currency}).format(Number(value));
const date=(value:string|null)=>value?value.slice(0,10).split("-").reverse().join("."):"Ikke registrert";

export default function AdminCaseFinance({inquiryId}:{inquiryId:number}) {
  const [data,setData]=useState<Result|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [refresh,setRefresh]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    setLoading(true);setData(null);setError("");
    fetch(apiUrl("/admin_case_finance.php?inquiry_id="+encodeURIComponent(String(inquiryId))),{credentials:"include",cache:"no-store",signal:controller.signal})
      .then(async res=>{const body=await res.json();if(!res.ok||!body.success)throw new Error(body.message||"Kunne ikke hente fakturaer.");return body as Result;})
      .then(body=>{if(!controller.signal.aborted)setData(body);})
      .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Kunne ikke hente fakturaer.");})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[inquiryId,refresh]);
  return <section role="tabpanel" className="space-y-4">
    <div className="flex items-start justify-between gap-2"><div><h2 className="text-sm font-black text-white">Fakturering og økonomi</h2><p className="mt-1 text-xs text-slate-400">Perun Core {data?"· Prosjekt #"+data.project_id+(data.project_count&&data.project_count>1?" + "+(data.project_count-1)+" underprosjekt(er)":""):"· Direkte oppslag"}</p></div><button type="button" aria-label="Oppdater fakturaer" disabled={loading} onClick={()=>setRefresh(v=>v+1)} className="rounded-lg border border-slate-700 p-2 text-cyan-300 disabled:opacity-40"><RefreshCw className={"h-4 w-4 "+(loading?"animate-spin":"")}/></button></div>
    {loading&&<p className="text-xs text-slate-400">Henter fakturaer …</p>}
    {error&&<p role="alert" className="rounded-xl border border-rose-500/30 p-3 text-xs text-rose-200">{error}</p>}
    {data&&data.invoices.length===0&&<p className="rounded-xl border border-slate-700 p-3 text-xs text-slate-300">Ingen fakturaer registrert på saken.</p>}
    {data?.invoices.map(i=><article key={i.id} className="space-y-3 rounded-xl border border-slate-700/70 bg-slate-950/30 p-3">
      <div className="flex justify-between gap-2"><div className="min-w-0"><p className="text-xs font-bold text-white">Faktura {i.invoice_number||"#"+i.id}</p><p className="mt-1 text-[11px] text-slate-400">{i.stage_key?stages[i.stage_key]||i.stage_key:i.allocations?.length?"Prosjektfordeling i Perun":"Ingen etappekobling"}</p></div><span className={"text-xs font-bold "+(i.status==="paid"?"text-emerald-300":i.status==="overdue"?"text-rose-300":"text-amber-200")}>{statuses[i.status]||i.status}</span></div>
      <div className="grid grid-cols-2 gap-2"><div className="rounded-lg bg-slate-800/40 p-2"><p className="text-[10px] text-slate-400">Fakturabeløp</p><p className="mt-1 text-sm font-bold text-white">{money(i.total,i.currency)}</p></div><div className="rounded-lg bg-slate-800/40 p-2"><p className="text-[10px] text-slate-400">Utestående på faktura</p><p className="mt-1 text-sm font-bold text-white">{money(i.balance,i.currency)}</p></div></div>
      {Boolean(i.allocations?.length)&&<div className="space-y-2 border-t border-slate-700/60 pt-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Fordeling på arbeid / prosjekt</p>{i.allocations?.map(a=><div key={a.project_id} className="flex items-start justify-between gap-2 text-xs"><div className="min-w-0"><p className="font-semibold text-slate-200">{a.project_type==="lekkasjesok"?"Lekkasjesøk":a.title}</p><p className="mt-0.5 text-[10px] text-slate-500">{a.project_number||"#"+a.project_id}{a.project_type==="lekkasjesok"?"":" · Underprosjekt"}</p></div><span className="shrink-0 font-semibold text-white">{money(a.gross_amount,i.currency)}</span></div>)}<div className="flex justify-between gap-2 border-t border-slate-700/60 pt-2 text-xs font-bold text-emerald-300"><span>Sum fordelt til saken</span><span>{money(i.allocated_gross,i.currency)}</span></div>{i.has_external_allocations&&<p className="text-[11px] text-amber-200">Fakturaen omfatter også prosjekter utenfor denne saken. Utestående gjelder hele fakturaen.</p>}</div>}
      {!i.allocations?.length&&i.allocated_gross!==null&&<p className="text-xs text-slate-300">Registrert prosjektfordeling: {money(i.allocated_gross,i.currency)}</p>}
      <dl className="grid grid-cols-2 gap-2 text-xs"><dt className="text-slate-400">Fakturadato</dt><dd className="text-right text-slate-200">{date(i.invoice_date)}</dd><dt className="text-slate-400">Forfallsdato</dt><dd className="text-right text-slate-200">{date(i.due_date)}</dd>{i.paid_date&&<><dt className="text-slate-400">Betalingsdato</dt><dd className="text-right text-slate-200">{date(i.paid_date)}</dd></>}</dl>
      {i.document_available&&<a href={apiUrl("/admin_case_finance.php?inquiry_id="+inquiryId+"&invoice_id="+i.id+"&action=pdf")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-cyan-300 hover:underline"><FileText className="h-4 w-4"/>Åpne faktura (PDF)</a>}
    </article>)}
    <a href="https://perun.no/" target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-cyan-500/30 p-3 text-center text-xs font-bold text-cyan-200">Åpne Perun →</a><p className="text-[10px] leading-4 text-slate-500">Fakturering og betaling håndteres i Perun. Denne visningen endrer ingen økonomidata.</p>
  </section>;
}
