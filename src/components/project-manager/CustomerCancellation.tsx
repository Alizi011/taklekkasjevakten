import { useState } from "react";
import { CalendarX2, Loader2, Phone } from "lucide-react";
import { apiUrl } from "@/lib/api";

type Props = {
  inquiryId: number;
  scheduleId: number;
  scheduledDate: string;
  onSaved: () => Promise<void>;
};

export default function CustomerCancellation({ inquiryId, scheduleId, scheduledDate, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [cancelledOn, setCancelledOn] = useState(scheduledDate);
  const [reason, setReason] = useState("Kunden avbestilte per telefon");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })();

  const submit = async () => {
    if (saving || saved || !cancelledOn || cancelledOn > today || !reason.trim()) return;
    if (!window.confirm("Registrere at kunden avbestilte denne avtalen per telefon? Tilbudet beholdes og ingen SMS sendes.")) return;
    setSaving(true);
    setMessage("");
    try {
      const token = window.localStorage.getItem("taklekkasjevakten_project_manager_session");
      if (!token) throw new Error("Prosjektleder må logge inn på nytt.");
      const response = await fetch(apiUrl("/project_manager_customer_cancel.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_token: token, inquiry_id: inquiryId, schedule_id: scheduleId, cancelled_on: cancelledOn, reason: reason.trim() }),
      });
      const data = await response.json();
      if (!response.ok || data.success !== true) throw new Error(data.message || "Avbestillingen kunne ikke registreres.");
      setSaved(true);
      setMessage("Telefonisk avbestilling registrert. Tilbudet er uendret.");
      try { await onSaved(); } catch { setMessage("Avbestillingen er registrert. Oppdater siden for å se ny status."); }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kunne ikke registrere avbestillingen.");
    } finally { setSaving(false); }
  };

  return (
    <section className="rounded-2xl border border-slate-700 bg-[#211612] p-4 sm:p-5" aria-label="Telefonisk avbestilling">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Phone className="h-4 w-4 text-amber-300" /> Kunde avbestilte per telefon?</h3>
          <p className="mt-1 text-xs text-slate-300">Registrer avbestilling av avtalt tidspunkt. Oppdraget og aksepterte tilbud beholdes.</p>
        </div>
        {!saved && <button type="button" onClick={() => setOpen(v => !v)} className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-200 hover:bg-amber-500/15">{open ? "Lukk" : "Registrer avbestilling"}</button>}
      </div>
      {open && !saved && <div className="mt-4 space-y-3 border-t border-slate-700 pt-4">
        <label className="block text-xs text-slate-200">Dato kunden avbestilte
          <input type="date" value={cancelledOn} max={today} onChange={e => setCancelledOn(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white [color-scheme:dark] sm:max-w-xs" />
        </label>
        <label className="block text-xs text-slate-200">Begrunnelse / internt notat
          <textarea value={reason} maxLength={1000} onChange={e => setReason(e.target.value)} rows={2} className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        </label>
        {cancelledOn === scheduledDate && <p className="text-xs text-amber-200">Avbestilling samme dag som avtalt oppdrag.</p>}
        <button type="button" disabled={saving || !cancelledOn || cancelledOn > today || !reason.trim()} onClick={() => void submit()} className="inline-flex items-center gap-2 rounded-xl bg-[#ff951a] px-4 py-2.5 text-xs font-black text-slate-950 disabled:opacity-40">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarX2 className="h-4 w-4" />} Bekreft avbestilling</button>
      </div>}
      {message && <p role="status" className={`mt-3 rounded-lg border px-3 py-2 text-xs ${saved ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-amber-500/30 bg-amber-500/10 text-amber-200"}`}>{message}</p>}
    </section>
  );
}
