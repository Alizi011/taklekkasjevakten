import { useState } from "react";
import { apiUrl } from "../lib/api";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { CoreCaseStatusView } from "./CoreCaseStatusBadge";
import { annualControlPreview, closurePreviewDate, closureStatuses, maintenanceChoices, validateClosureDraft } from "../lib/caseClosureDraft";

type Props = {
  inquiryId: number;
  coreStatus: CoreCaseStatusView;
  offers: readonly { id: number; offer_number?: string | null; status: string }[];
  pendingAdminSignature: boolean;
};

/** Admin-only case view. Local preparation; no unverified write API is invoked. */
export default function CaseClosureControl({ inquiryId, coreStatus, offers, pendingAdminSignature }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("completed");
  const [maintenance, setMaintenance] = useState("");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [invoiceConfirmed, setInvoiceConfirmed] = useState(false);
  const [saved, setSaved] = useState(false);
  const notifyCompletion = status === "completed" || status === "closed";
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [previewDate, setPreviewDate] = useState(closurePreviewDate);
  const outstandingOffers = offers.filter((offer) => ["utkast", "publisert"].includes(offer.status));
  const errors = validateClosureDraft(status, maintenance, note);
  const existingClosure = coreStatus.state === "available" && closureStatuses.some((item) => item.value === coreStatus.status);
  const fieldId = `case-closure-${inquiryId}`;
  const dateLabel = (value: string | null) => value ? value.split("-").reverse().join(".") : "Må beregnes i Core";

  const submitClosure = async () => {
    if (
      saving || saved ||
      !confirmed || (notifyCompletion && !invoiceConfirmed) ||
      existingClosure ||
      coreStatus.state !== "available" ||
      errors.length > 0
    ) return;

    setSaving(true);
    setSaveError("");

    try {
      const response = await fetch(
        apiUrl("/admin_case_closure.php"),
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inquiry_id: inquiryId,
            status,
            maintenance,
            note: note.trim(),
            invoice_confirmed: notifyCompletion && invoiceConfirmed
          })
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok || result?.success !== true) {
        throw new Error(
          result?.message ||
          `Lagring feilet (HTTP ${response.status}).`
        );
      }

      setSaved(true);
      const warning = Array.isArray(result.notification_warnings) ? result.notification_warnings.join("\n") : "";
      if (warning) { setSaveError("Saken er avsluttet. Varsler krever oppfølging:\n"+warning); return; }
      window.location.reload();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Kunne ikke lagre avslutningen."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <Dialog.Root open={open} onOpenChange={(value) => { if (saving) return; if (!value && saved) { window.location.reload(); return; } if (value) setPreviewDate(closurePreviewDate()); setOpen(value); }}>
        <Dialog.Trigger asChild>
          <button type="button" className="w-full rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-200 hover:bg-rose-500/20">Avslutt sak</button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[120] bg-black/80" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[121] max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-700 bg-[#171020] p-5 text-white shadow-xl"
            onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <Dialog.Title className="text-lg font-bold">Avslutt sak #{inquiryId}</Dialog.Title>
              <Dialog.Close asChild><button type="button" aria-label="Lukk avslutningsdialog" className="rounded-lg p-2 hover:bg-slate-800"><X className="h-5 w-5" /></button></Dialog.Close>
            </div>
            <Dialog.Description className="mt-2 text-xs text-slate-300">Velg avslutning og videre oppfølging. Registrer begrunnelse og bekreft avslutningen.</Dialog.Description>
                        {saveError && (
              <p role="alert" className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-100">
                {saveError}
              </p>
            )}
            <p className="mt-4 text-xs text-slate-300">
              Avslutningen registreres i Core. Eksisterende tilbud,
              rapporter, fakturaer og avtaler beholdes.
            </p>
            <form className="mt-4 space-y-4" onSubmit={(event) => { event.preventDefault(); void submitClosure(); }}>
              <p className="text-xs text-slate-300">Nåværende hovedstatus (Core): {coreStatus.state === "available" ? coreStatus.status : "Ukjent/utilgjengelig"}</p>
              {existingClosure && <p role="status" className="text-xs text-amber-200">Core viser allerede en avslutningsstatus. Saken skal ikke avsluttes på nytt.</p>}
              <label htmlFor={`${fieldId}-status`} className="block text-xs font-bold">Avslutningsstatus
                <select id={`${fieldId}-status`} required value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm">
                  <option value="">Velg status</option>
                  {closureStatuses.map((item) => <option key={item.value} value={item.value}>{item.label} ({item.value})</option>)}
                </select>
              </label>
              <label htmlFor={`${fieldId}-maintenance`} className="block text-xs font-bold">Årlig kontroll og vedlikehold
                <select id={`${fieldId}-maintenance`} required value={maintenance} onChange={(event) => setMaintenance(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm">
                  <option value="">Velg oppfølging</option>
                  {maintenanceChoices.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              {maintenance === "offer" && <div className="space-y-2 text-xs text-slate-300">
                <p>Dette er et tilbud om vedlikehold, ikke en akseptert avtale. Ingen plan aktiveres og ingen melding sendes.</p>
                <p>Eksempel hvis saken avsluttes i dag ({dateLabel(previewDate)}): første kontroll {dateLabel(annualControlPreview(previewDate, 1))}, neste {dateLabel(annualControlPreview(previewDate, 2))}. Core må bruke faktisk lagret avslutningsdato.</p>
              </div>}
              {maintenance === "existing" && <p className="text-xs text-slate-300">Eksisterende plan må kontrolleres mot riktig kunde og eiendom i Core og gjenbrukes. Ingen ny plan eller syklus opprettes her.</p>}
              <div role="status" className="space-y-2 rounded-xl border border-amber-500/30 p-3 text-xs text-amber-100">
                {outstandingOffers.length > 0 && <p>Uavklarte tilbud: {outstandingOffers.map((offer) => `${offer.offer_number || `#${offer.id}`} (${offer.status})`).join(", ")}.</p>}
                {pendingAdminSignature && <p>Det finnes arbeidsavtale som venter på administratorsignatur.</p>}
                <p>Fullstendig kontroll av arbeidsavtaler, arbeidsoppgaver og eksisterende vedlikeholdsplaner er ikke tilgjengelig her. Fravær av flere varsler betyr ikke at alt er avklart.</p>
              </div>
              <label htmlFor={`${fieldId}-note`} className="block text-xs font-bold">Avslutningsnotat
                <textarea id={`${fieldId}-note`} required value={note} onChange={(event) => setNote(event.target.value)} placeholder="Begrunn avslutningen og beskriv eventuell videre oppfølging" className="mt-2 min-h-28 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm" />
              </label>
              <label className="flex items-start gap-2 text-xs text-slate-200"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5" />Jeg har kontrollert status, uavklarte forhold og valg om videre oppfølging.</label>
              {notifyCompletion && <div className="space-y-2 rounded-xl border border-cyan-500/30 p-3 text-xs text-slate-200"><p className="font-bold text-cyan-200">Avslutningsvarsler</p><p>Kunden får SMS med takk, fakturainformasjon og personlig kundeportallenke (30 dager). Prosjektansvarlig får SMS og internt varsel. Betaling følges opp i Perun.</p><label className="flex items-start gap-2"><input type="checkbox" checked={invoiceConfirmed} onChange={e=>setInvoiceConfirmed(e.target.checked)} className="mt-0.5"/>Jeg bekrefter at arbeidet er ferdigstilt, relevante rapporter er publisert og faktura er sendt.</label></div>}
              {errors.length > 0 && <ul className="list-inside list-disc text-xs text-slate-400">{errors.map((error) => <li key={error}>{error}</li>)}</ul>}
              <div className="flex flex-wrap justify-end gap-2">
                <Dialog.Close asChild><button type="button" className="rounded-lg border border-slate-600 px-4 py-3 text-xs font-bold">{saved ? "Lukk og oppdater" : "Lukk uten lagring"}</button></Dialog.Close>
                <button
                  type="submit"
                  disabled={
                    saving || saved ||
                    !confirmed || (notifyCompletion && !invoiceConfirmed) ||
                    existingClosure ||
                    coreStatus.state !== "available" ||
                    errors.length > 0
                  }
                  className="rounded-lg bg-rose-600 px-4 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? "Avslutter og varsler…" : saved ? "Saken er avsluttet" : "Bekreft avslutning"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
