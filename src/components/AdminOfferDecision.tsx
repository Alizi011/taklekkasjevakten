import { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";

type Offer = {
  id: number;
  offer_number?: string | null;
  status?: string | null;
  fixed_price?: number | string | null;
  calculated_ex_vat?: number | string | null;
  pricing_mode?: string | null;
};

export default function AdminOfferDecision({
  inquiryId, offer, onUpdated, organizationNumber,
}: {inquiryId: number; offer: Offer; onUpdated: () => Promise<unknown> | void; organizationNumber?: string | null}) {
  const [mode, setMode] = useState<"telephone" | "email" | "meeting">("telephone");
  const [person, setPerson] = useState("");
  const [personChoice, setPersonChoice] = useState("");
  const [representatives, setRepresentatives] = useState<Array<{name: string; role: string}>>([]);
  const [brregLoading, setBrregLoading] = useState(false);
  const [brregError, setBrregError] = useState("");
  const [orgNumber, setOrgNumber] = useState(String(organizationNumber || "").replace(/\D/g, ""));

  useEffect(() => {
    if (/^\d{9}$/.test(String(organizationNumber || "").replace(/\D/g, ""))) {
      setOrgNumber(String(organizationNumber).replace(/\D/g, ""));
      return;
    }
    const controller = new AbortController();
    void fetch(apiUrl(`/customer_profile.php?inquiry_id=${inquiryId}`), {credentials: "include", signal: controller.signal})
      .then(async response => {
        if (!response.ok) return;
        const result = await response.json();
        if (!controller.signal.aborted && result.success) {
          setOrgNumber(String(result.customer?.organization_number || "").replace(/\D/g, ""));
        }
      }).catch(() => {});
    return () => controller.abort();
  }, [inquiryId, organizationNumber]);

  useEffect(() => {
    const controller = new AbortController();
    setRepresentatives([]);
    setPersonChoice("");
    setPerson("");
    setBrregError("");
    if (!/^\d{9}$/.test(orgNumber)) {
      setBrregError("Organisasjonsnummer mangler. Velg annen person og dokumenter fullmakten.");
      return () => controller.abort();
    }
    setBrregLoading(true);
    void fetch(apiUrl(`/admin_brreg_roles.php?orgnr=${orgNumber}`), {credentials: "include", signal: controller.signal})
      .then(async response => {
        const result = await response.json();
        if (!response.ok || result.success !== true || !Array.isArray(result.people)) {
          throw new Error(result.message || "BRREG-oppslag feilet.");
        }
        if (!controller.signal.aborted) setRepresentatives(result.people);
      })
      .catch(error => {
        if (!controller.signal.aborted) setBrregError(error instanceof Error ? error.message : "BRREG-oppslag feilet.");
      })
      .finally(() => {if (!controller.signal.aborted) setBrregLoading(false);});
    return () => controller.abort();
  }, [orgNumber]);

  const [when, setWhen] = useState("");
  const [note, setNote] = useState("");
  const [noSeparateSignature, setNoSeparateSignature] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const price = Number(offer.fixed_price ?? offer.calculated_ex_vat);

  async function submit() {
    setBusy(true);
    setMessage("");
    try {
      const body = {
        action: "accept_external", inquiry_id: inquiryId, offer_id: Number(offer.id),
        customer_representative: person.trim(), channel: mode,
        accepted_at: when, evidence_note: note.trim(),
        separate_signature_not_required: noSeparateSignature,
      };
      const response = await fetch(apiUrl("/admin_offer_external_acceptance.php"), {
        method: "POST", credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error(result.message || "Handling avvist.");
      setMessage(noSeparateSignature
        ? "Aksept registrert. Arbeidet er frigitt dersom saken ikke er satt på pause."
        : "Aksept registrert. Eventuelt signeringskrav gjelder fortsatt.");
      await onUpdated();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kunne ikke lagre handlingen.");
    } finally { setBusy(false); }
  }

  if (!['publisert', 'akseptert'].includes(String(offer.status))) return null;
  return <div className="mt-4 space-y-3 rounded-xl border border-amber-500/40 bg-amber-950/20 p-3 text-xs text-slate-100">
    <p className="font-black text-amber-200">Administrativ godkjenning · {offer.offer_number || `Tilbud ${offer.id}`}</p>
    {offer.pricing_mode === "fixed" && Number.isFinite(price) && price > 0 &&
      <p>Tilbudsbeløp: {price.toLocaleString("nb-NO", {minimumFractionDigits: 2, maximumFractionDigits: 2})} kr eks. mva.</p>}
    {offer.status === "publisert" ? <>
      <p>Registrer bare en aksept som faktisk er mottatt fra kunden. Dette er ikke en digital signatur.</p>
      <label className="block">Akseptkanal
        <select value={mode} onChange={e => setMode(e.target.value as typeof mode)} className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2">
          <option value="telephone">Telefon</option><option value="email">E-post</option><option value="meeting">Møte</option>
        </select>
      </label>
      <label className="block">Person som aksepterte
        <select value={personChoice} onChange={e => {
          const value = e.target.value;
          setPersonChoice(value);
          setPerson(value === "__other__" ? "" : value);
        }} className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2">
          <option value="">{brregLoading ? "Henter representanter fra BRREG …" : "Velg person"}</option>
          {representatives.map((entry, index) =>
            <option key={`${entry.name}-${entry.role}-${index}`} value={entry.name}>
              {entry.name} – {entry.role}
            </option>
          )}
          <option value="__other__">Annen person med dokumentert fullmakt</option>
        </select>
      </label>
      {brregError && <p className="text-amber-200">{brregError}</p>}
      {personChoice === "__other__" && <label className="block">Navn på personen
        <input value={person} onChange={e => setPerson(e.target.value)} className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2" />
      </label>}
      <p className="text-[11px] text-slate-400">BRREG-rolle er ikke i seg selv dokumentasjon på signaturrett. Bekreft fullmakt og hvem som faktisk ga aksepten.</p>
      <label className="block">Dato og klokkeslett (norsk tid)
        <input type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2" />
      </label>
      <label className="block">Hva ble avtalt? Henvis til e-post eller samtalen.
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2" />
      </label>
      <label className="flex items-start gap-2 rounded-lg border border-slate-700 p-2">
        <input type="checkbox" checked={noSeparateSignature} onChange={e => setNoSeparateSignature(e.target.checked)} />
        <span>Jeg har kontrollert at dette tilbudet ikke krever separat signert arbeidsavtale. Arbeidet kan da frigjøres samtidig som aksepten registreres.</span>
      </label>
      <button type="button" disabled={busy || person.trim().length < 2 || note.trim().length < 10 || !when} onClick={() => void submit()}
        className="w-full rounded-lg bg-amber-500 p-2.5 font-bold text-slate-950 disabled:opacity-40">Registrer ekstern aksept</button>
    </> : <>
      <p className="rounded-lg border border-emerald-600/30 bg-emerald-950/20 p-3 text-emerald-200">
        Tilbudet er akseptert. Prosjektansvarlig kan gå videre når eventuelle krav til signering,
        godkjent oppstart og administrativ pause er oppfylt.
      </p>
    </>}
    {message && <p role="status" className="text-cyan-200">{message}</p>}
  </div>;
}
