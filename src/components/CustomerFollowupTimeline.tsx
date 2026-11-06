import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, FileText } from "lucide-react";
import { apiUrl } from "../lib/api";

type Proposal = { id: number; version_no: number; status: string; proposed_start_date: string; estimated_duration: string };
type Agreement = { id: number; status: string; document_sha256: string | null };
type Props = { inquiryId: number; sessionToken: string; offerAccepted: boolean; report2Published?: boolean; refreshKey?: number; previewMode?: boolean; onOpenAgreement: () => void };

const labels = ["Oppfølgingstilbud", "Bekreft oppstart", "Arbeidsavtale", "Signering", "Utførelse", "Rapport 2"];

export default function CustomerFollowupTimeline({ inquiryId, sessionToken, offerAccepted, report2Published = false, refreshKey = 0, previewMode = false, onOpenAgreement }: Props) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!offerAccepted || (!previewMode && !sessionToken) || inquiryId <= 0) {
      setProposal(null);
      setAgreement(null);
      return;
    }

    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError("");
      setAgreement(null);
      try {
        // Date approval is independent of signing status. A failure in the
        // agreement overview must not hide a successful date approval.
        const scheduleResponse = await fetch(
          apiUrl(previewMode ? "/admin_agreement_schedule_read.php" : "/customer_agreement_schedule.php"),
          {
            method: "POST",
            credentials: previewMode ? "include" : "omit",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            signal: controller.signal,
            body: JSON.stringify(previewMode
              ? { inquiry_id: inquiryId }
              : { action: "list", inquiry_id: inquiryId, session_token: sessionToken }),
          }
        );
        const scheduleData = await scheduleResponse.json();
        if (!scheduleResponse.ok || scheduleData.success !== true) {
          throw new Error(scheduleData.message || "Kunne ikke hente datostatus.");
        }
        const rows = (Array.isArray(scheduleData.proposals) ? scheduleData.proposals : []) as Proposal[];
        if (!controller.signal.aborted) {
          setProposal([...rows].sort((a, b) => b.version_no - a.version_no || b.id - a.id)[0] || null);
        }

        // This existing endpoint reads the agreement status from Perun Core.
        // It does not modify signers, invitations or customer permissions.
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
          // The API orders newest agreements first.
          setAgreement((Array.isArray(agreementData.agreements) ? agreementData.agreements[0] : null) || null);
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          setError(e instanceof Error ? e.message : "Kunne ikke hente avtalestatus.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [offerAccepted, previewMode, sessionToken, inquiryId, refreshKey, reloadCount]);

  // Recheck on return from the separate SMS signing page.
  useEffect(() => {
    if (!offerAccepted) return;
    const refreshOnFocus = () => setReloadCount(count => count + 1);
    window.addEventListener("focus", refreshOnFocus);
    return () => window.removeEventListener("focus", refreshOnFocus);
  }, [offerAccepted]);

  if (!offerAccepted) return null;

  const approved = proposal?.status === "approved";
  const documentReady = Boolean(agreement?.document_sha256);
  const signingStarted = agreement?.status === "sent_for_signature" || agreement?.status === "partially_signed";
  const signed = agreement?.status === "signed";
  const signingReady = agreement?.status === "ready_for_signature";
  const current = signed ? 4 : signingStarted || signingReady ? 3 : documentReady ? 2 : approved ? 2 : 1;
  const doneSteps = new Set([
    0,
    ...(approved ? [1] : []),
    ...(documentReady ? [2] : []),
    ...(signed ? [3] : []),
    ...(report2Published ? [5] : []),
  ]);

  const heading = report2Published ? "Rapport 2 publisert"
    : signed ? "Arbeidsavtalen er ferdig signert"
    : agreement?.status === "partially_signed" ? "Kundens signering er registrert – avventer øvrige signatarer"
    : agreement?.status === "sent_for_signature" ? "Avtalen er sendt til signering"
    : signingReady ? "Arbeidsavtalen er klar for signering"
    : documentReady ? "Arbeidsavtalen er opprettet"
    : approved ? "Oppstartsdato godkjent – avtalen klargjøres"
    : "Avventer bekreftelse av oppstart";

  const summary = proposal
    ? `${proposal.proposed_start_date} · ${proposal.estimated_duration}`
    : "Oppstart og varighet må kontrolleres";

  return (
    <div className="border-t border-slate-800/80 px-6 py-7 md:px-8" aria-label="Videre tiltak">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-300">Fase 2 · Videre utbedring</p>
          <h3 className="mt-1 text-base font-extrabold text-white">Arbeidsavtale og utbedring</h3>
        </div>
        <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold text-emerald-300">Tilbud akseptert</span>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-[690px] items-start">
          {labels.map((label, index) => {
            const done = doneSteps.has(index);
            const active = index === current && !report2Published;
            return (
              <div key={label} className="flex min-w-0 flex-1 items-start">
                <div className="flex min-w-0 flex-1 flex-col items-center text-center">
                  <span className={`grid h-9 w-9 place-items-center rounded-full border text-xs font-black ${done ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" : active ? "border-amber-400/60 bg-amber-500/15 text-amber-200 ring-4 ring-amber-500/5" : "border-slate-700 bg-slate-950 text-slate-500"}`}>{done ? <CheckCircle2 className="h-4 w-4" /> : active ? <Clock3 className="h-4 w-4" /> : index + 1}</span>
                  <p className={`mt-2 text-[10px] font-extrabold ${done ? "text-emerald-300" : active ? "text-amber-200" : "text-slate-500"}`}>{label}</p>
                </div>
                {index < labels.length - 1 && <div className={`mt-[18px] h-px flex-1 ${done ? "bg-emerald-500/35" : "bg-slate-800"}`} />}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700/70 bg-slate-950/45 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <div>
            <p className="text-sm font-bold text-white">{heading}</p>
            <p className="mt-1 text-xs text-slate-300">{loading ? "Henter avtale- og signeringsstatus …" : summary}</p>
            {error && <p role="alert" className="mt-1 text-xs text-amber-300">{error}</p>}
          </div>
        </div>
        {!previewMode && !report2Published && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setReloadCount(count => count + 1)} disabled={loading} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 disabled:opacity-50">
              {loading ? "Oppdaterer …" : "Oppdater status"}
            </button>
            <button type="button" onClick={onOpenAgreement} className="rounded-lg border border-amber-500/30 px-3 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/10">
              {documentReady ? "Se arbeidsavtalen" : approved ? "Se avtalestatus" : "Åpne datobekreftelse"}
            </button>
          </div>
        )
      </div>
      <p className="mt-3 text-[11px] text-slate-500">
        Signeringsstatus hentes fra Perun Core. Utførelse er ikke automatisk markert fullført.
      </p>
    </div>
  );
}
