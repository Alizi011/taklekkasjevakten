import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../lib/api";
import { CheckCircle2, Circle, Clock3, FileCheck2, RefreshCw } from "lucide-react";

type Proposal = {
  id: number;
  version_no: number;
  proposed_start_date: string;
  estimated_duration: string;
  status: string;
  customer_response_note?: string | null;
};
type Agreement = { id: number; agreement_number?: string | null; status: string; offer_id?: number | null; created_at?: string };

const agreementLabels: Record<string, string> = {
  draft: "Arbeidsavtale er opprettet som utkast",
  ready_for_signature: "Arbeidsavtale klar for signering",
  sent_for_signature: "Arbeidsavtale sendt til signering",
  partially_signed: "Arbeidsavtale delvis signert",
  signed: "Arbeidsavtale ferdig signert",
  cancelled: "Arbeidsavtale kansellert",
};

export default function AdminAgreementProgress({ inquiryId }: { inquiryId: number }) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [agreementAvailable, setAgreementAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderResult, setReminderResult] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    setAgreementAvailable(false);
    try {
      const response = await fetch(apiUrl("/admin_agreement_schedule_read.php"), {
        method: "POST", credentials: "include", cache: "no-store",
        headers: { "Content-Type": "application/json" }, signal,
        body: JSON.stringify({ inquiry_id: inquiryId }),
      });
      const data = await response.json();
      if (!response.ok || data?.success !== true || !Array.isArray(data.proposals)) {
        throw new Error(data?.message || "Kunne ikke hente datoplanleggingen.");
      }
      if (!signal?.aborted) setProposals(data.proposals);
      // Eksisterende administrator-forhåndsvisning er kun lesing. Feil her må
      // aldri feiltolkes som at ingen arbeidsavtale er opprettet.
      try {
        const agreementResponse = await fetch(apiUrl("/customer_agreements_overview.php"), {
          method: "POST", credentials: "include", cache: "no-store",
          headers: { "Content-Type": "application/json" }, signal,
          body: JSON.stringify({ inquiry_id: inquiryId, admin_preview: true }),
        });
        const agreementData = await agreementResponse.json();
        if (agreementResponse.ok && agreementData?.success === true && Array.isArray(agreementData.agreements)) {
          if (!signal?.aborted) {
            setAgreements(agreementData.agreements);
            setAgreementAvailable(true);
          }
        }
      } catch { /* Avtalestatus kan vises som utilgjengelig uten å skjule datostatus. */ }
    } catch (e) {
      if (!signal?.aborted) setError(e instanceof Error ? e.message : "Kunne ikke hente status.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [inquiryId]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const sendDateReminder = async () => {
    if (!proposal || proposal.status !== "pending_customer" || sendingReminder) return;

    if (!window.confirm(
      "Send SMS til kontakttelefonen registrert på saken med påminnelse om å godkjenne arbeidsdato?"
    )) return;

    setSendingReminder(true);
    setReminderResult("");

    try {
      const response = await fetch(apiUrl("/admin_agreement_date_reminder.php"), {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiry_id: inquiryId,
          proposal_id: proposal.id
        })
      });

      const data = await response.json();

      if (!response.ok || data?.success !== true) {
        throw new Error(data?.message || "Kunne ikke sende SMS.");
      }

      setReminderResult("Påminnelsen er sendt på SMS.");
    } catch (error) {
      setReminderResult(
        error instanceof Error ? error.message : "SMS-utsending feilet."
      );
    } finally {
      setSendingReminder(false);
    }
  };

  const proposal = [...proposals].sort((a,b) =>
    Number(b.version_no) - Number(a.version_no) || Number(b.id) - Number(a.id)
  )[0];
  const agreement = [...agreements].sort((a,b) => Number(b.id) - Number(a.id))[0];
  const pending = proposal?.status === "pending_customer";
  const approved = proposal?.status === "approved";
  const isSigned = agreement?.status === "signed";
  const dateReady = approved || Boolean(agreement);
  const title = agreement ? (agreementLabels[agreement.status] || `Arbeidsavtale: ${agreement.status}`) :
    pending ? "Avventer kundens godkjenning av arbeidsdato" :
    approved ? "Arbeidsdato godkjent – avtaleopprettelse gjenstår" :
    proposal?.status === "change_requested" ? "Kunden har bedt om justering av dato" :
    proposal ? `Datoforslag: ${proposal.status}` : "Arbeidsdato er ikke registrert";

  return (
    <div className="space-y-4 border-t border-white/10 pt-4" aria-live="polite">
      {loading ? <p className="text-xs text-slate-400">Henter avtaleoppfølging …</p> : error ?
        <p role="alert" className="text-xs text-amber-300">{error}</p> : <>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-wide text-cyan-300">Avtalens fremdrift</p>
            <div className="flex items-center gap-2 text-xs text-emerald-300"><CheckCircle2 className="h-4 w-4 shrink-0" />Pristilbud akseptert</div>
            <div className={`flex items-center gap-2 text-xs ${dateReady ? "text-emerald-300" : "text-amber-200"}`}>
              {dateReady ? <CheckCircle2 className="h-4 w-4 shrink-0"/> : <Clock3 className="h-4 w-4 shrink-0"/>}
              {dateReady ? "Arbeidsplan godkjent" : "Godkjenning av arbeidsplan gjenstår"}
            </div>
            <div className={`flex items-center gap-2 text-xs ${isSigned ? "text-emerald-300" : "text-slate-400"}`}>
              {isSigned ? <CheckCircle2 className="h-4 w-4 shrink-0"/> : agreement ? <FileCheck2 className="h-4 w-4 shrink-0"/> : <Circle className="h-4 w-4 shrink-0"/>}
              {isSigned ? "Arbeidsavtale signert" : agreement ? (agreementLabels[agreement.status] || "Avtalestatus under behandling") : "Arbeidsavtale og signering gjenstår"}
            </div>
          </div>
          <div className="rounded-xl border border-slate-700/70 bg-slate-950/50 p-3 space-y-2">
            <p className="text-xs font-bold text-amber-200">{title}</p>
            {proposal && <p className="text-xs text-slate-200">Registrert oppstart: {proposal.proposed_start_date} · Varighet: {proposal.estimated_duration}</p>}
            {proposal?.status === "change_requested" && proposal.customer_response_note && <p className="text-xs text-slate-300">Kundens merknad: {proposal.customer_response_note}</p>}
            {agreement?.agreement_number && <p className="text-xs text-slate-300">Avtale: {agreement.agreement_number}</p>}
            {!agreementAvailable && <p className="text-[11px] text-slate-500">Signeringsstatus kunne ikke bekreftes fra avtale-API-et.</p>}
          </div>
          {pending && !agreement && agreementAvailable && (
            <div className="space-y-2">
              <button
                type="button"
                disabled={loading || sendingReminder}
                onClick={() => void sendDateReminder()}
                className="w-full rounded-xl border border-amber-400/50 bg-amber-400/15 px-3 py-3 text-xs font-black text-amber-100 hover:bg-amber-400/25 disabled:opacity-50"
              >
                {sendingReminder
                  ? "Sender påminnelse ..."
                  : "Send påminnelse om godkjenning av arbeidsdato"}
              </button>

              <p className="text-[11px] text-slate-400">
                Kunden får SMS med personlig kundeportallenke.
                Når arbeidsdatoen er godkjent, klargjøres arbeidsavtalen for elektronisk signering.
              </p>

              {reminderResult && (
                <p role="status" className="text-xs text-amber-200">
                  {reminderResult}
                </p>
              )}
            </div>
          )}
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.05] p-3 space-y-1">
            <p className="text-xs font-bold text-cyan-200">Neste handling</p>
            <p className="text-[11px] leading-5 text-slate-300">{isSigned ? "Ingen signeringspåminnelse nødvendig." :
              agreement?.status === "sent_for_signature" || agreement?.status === "partially_signed" ?
              "Følg opp utestående signatarer. Påminnelse aktiveres når sikker utsending er koblet til avtalen." :
              pending ? "Kunden må gjennomgå arbeidsplanen i kundeportalen. Påminnelsesutsending er ennå ikke aktivert." :
              approved ? "Følg opp avtaleopprettelse i eksisterende arbeidsflyt." :
              agreement ? "Følg opp avtalen i eksisterende arbeidsflyt." : "Kontroller arbeidsplanleggingen."}</p>
          </div>
        </>}
      <button type="button" onClick={() => void load()} disabled={loading}
        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-300 hover:underline disabled:opacity-50">
        <RefreshCw className="h-3.5 w-3.5" /> Oppdater status
      </button>
    </div>
  );
}
