import { useEffect, useState } from "react";
import { CheckCircle2, Clock3 } from "lucide-react";
import { apiUrl } from "../lib/api";

type Proposal = { id: number; version_no: number; status: string; proposed_start_date: string; estimated_duration: string };
type Agreement = { id: number; status: string; document_sha256: string | null };
type Props = { inquiryId: number; sessionToken: string; offerAccepted: boolean; report2Published?: boolean; refreshKey?: number; previewMode?: boolean; onOpenAgreement: () => void };

const labels = ["Oppfølgingstilbud", "Bekreft oppstart", "Arbeidsavtale", "Signering", "Utførelse", "Rapport 2"];

export default function CustomerFollowupTimeline({ inquiryId, sessionToken, offerAccepted, report2Published = false, refreshKey = 0, previewMode = false, onOpenAgreement }: Props) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!offerAccepted || (!previewMode && !sessionToken) || inquiryId <= 0) {
      setProposal(null);
      setAgreement(null);
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setAgreement(null);
      try {
        const r = await fetch(apiUrl(previewMode ? "/admin_agreement_schedule_read.php" : "/customer_agreement_schedule.php"), { method: "POST", credentials: previewMode ? "include" : "omit", headers: { "Content-Type": "application/json" }, cache: "no-store", signal: controller.signal, body: JSON.stringify(previewMode ? { inquiry_id: inquiryId } : { action: "list", inquiry_id: inquiryId, session_token: sessionToken }) });
        const data = await r.json();
        if (!r.ok || data.success !== true) throw new Error(data.message || "Kunne ikke hente avtalestatus.");
        const rows = (Array.isArray(data.proposals) ? data.proposals : []) as Proposal[];
        if (!controller.signal.aborted) { setProposal([...rows].sort((a,b) => b.version_no-a.version_no || b.id-a.id)[0] || null); setError(""); }
        // Read-only Core agreement status, independent from date approval.
        try {
          const agreementResponse = await fetch(apiUrl("/customer_agreements_overview.php"), {
            method: "POST",
            credentials: previewMode ? "include" : "omit",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            signal: controller.signal,
            body: JSON.stringify(previewMode
              ? { inquiry_id: inquiryId, admin_preview: true }
              : { inquiry_id: inquiryId, session_token: sessionToken }),
          });
          const agreementData = await agreementResponse.json();
          if (!agreementResponse.ok || agreementData.success !== true) {
            throw new Error(agreementData.message || "Kunne ikke hente signeringsstatus.");
          }
          if (!controller.signal.aborted) {
            setAgreement((Array.isArray(agreementData.agreements) ? agreementData.agreements[0] : null) || null);
          }
        } catch (agreementError) {
          if (!controller.signal.aborted) {
            setError(agreementError instanceof Error ? agreementError.message : "Kunne ikke hente signeringsstatus.");
          }
        }
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Kunne ikke hente avtalestatus."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load();
    return () => controller.abort();
  }, [offerAccepted, previewMode, sessionToken, inquiryId, refreshKey, reloadCount]);
  useEffect(() => {
    if (!offerAccepted) return;
    const onReturn = () => setReloadCount(n => n + 1);
    window.addEventListener("focus", onReturn);
    return () => window.removeEventListener("focus", onReturn);
  }, [offerAccepted]);
  if (!offerAccepted) return null;
  const approved = proposal?.status === "approved";
  const documentReady = Boolean(agreement?.document_sha256);
  const signed = agreement?.status === "signed";
  const signingStarted = agreement?.status === "sent_for_signature" || agreement?.status === "partially_signed";
  const signingReady = agreement?.status === "ready_for_signature";
  const current = signed ? 4 : signingStarted || signingReady ? 3 : documentReady || approved ? 2 : 1;
  const summary = proposal
    ? `${new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "short" }).format(
        new Date(`${proposal.proposed_start_date.slice(0, 10)}T12:00:00`)
      )} · ${proposal.estimated_duration}`
    : "";
  return (
    <div className="min-w-0 rounded-b-2xl border border-t-0 border-slate-700/70 bg-slate-900/40 p-4" aria-label="Videre tiltak">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-300">Fase 2 · Videre utbedring</p>
          <h3 className="mt-1 text-base font-extrabold text-white">Arbeidsavtale og utbedring</h3>
        </div>
        <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold text-emerald-300">Tilbud akseptert</span>
      </div>
      <div className="relative min-w-0">
        <div className="relative grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3">
          {labels.map((label, index) => {
            const done = index === 0 || (index === 1 && approved) || (index === 2 && documentReady) || (index === 3 && signed) || (index === 5 && report2Published);
            const active = index === current && !report2Published;
            return (
              <div key={label} className="min-w-0">
                <div className="flex min-w-0 flex-1 flex-col items-center text-center">
                  <span className={`grid h-9 w-9 place-items-center rounded-full border text-xs font-black ${done ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" : active ? "border-amber-400/60 bg-amber-500/15 text-amber-200 ring-4 ring-amber-500/5" : "border-slate-700 bg-slate-950 text-slate-500"}`}>{done ? <CheckCircle2 className="h-4 w-4" /> : active ? <Clock3 className="h-4 w-4" /> : index + 1}</span>
                  <p className={`mt-2 text-[10px] font-extrabold ${done ? "text-emerald-300" : active ? "text-amber-200" : "text-slate-500"}`}>{label}</p>
                  {index === 1 && (
                    <div className="mt-2 space-y-1 text-center">
                      {approved && (
                        <p className="text-[10px] font-bold text-emerald-300">
                          Oppstart godkjent
                        </p>
                      )}
                      {loading ? (
                        <p className="text-[10px] text-slate-400">
                          Henter dato …
                        </p>
                      ) : proposal && (
                        <p className="text-[10px] leading-4 text-slate-300">
                          {summary}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {index < labels.length - 1 && <div className={`hidden mt-[18px] h-px flex-1 ${index === 0 || (index === 1 && approved) ? "bg-emerald-500/35" : "bg-slate-800"}`} />}
              </div>
            );
          })}
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-xs text-amber-300">
          {error}
        </p>
      )}

      <p className="mt-3 text-xs text-slate-300">
        {signed ? "Arbeidsavtalen er signert."
          : agreement?.status === "partially_signed" ? "Avtalen er delvis signert."
          : agreement?.status === "sent_for_signature" ? "Avtalen er sendt til signering."
          : signingReady ? "Arbeidsavtalen er klar for signering."
          : documentReady ? "Arbeidsavtalen er opprettet."
          : approved ? "Oppstart er godkjent; avtale og signering må kontrolleres."
          : "Avventer godkjenning av oppstart."}
      </p>
      {!previewMode && !report2Published && (
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" disabled={loading} onClick={() => setReloadCount(n => n + 1)}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-50">
            {loading ? "Oppdaterer …" : "Oppdater status"}
          </button>
          <button
            type="button"
            onClick={onOpenAgreement}
            className="rounded-lg border border-amber-500/30 px-3 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/10"
          >
            {documentReady ? "Se arbeidsavtale" : approved ? "Se avtalestatus" : "Åpne datobekreftelse"}
          </button>
        </div>
      )}

    </div>
  );
}
