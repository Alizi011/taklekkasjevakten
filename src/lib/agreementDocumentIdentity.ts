export type AgreementProposal = { id: number; offer_id: number | string; status: string; version_no: number };
export type StoredAgreement = { document_id?: number | string | null; id: number | string; offer_id: number | string; tlv_offer_reference?: string | null; agreement_number: string | null; document_sha256: string | null };

// Existing schedule/overview contract. Never substitute a newer agreement from another offer.
export function resolveStoredAgreement(
  proposals: readonly AgreementProposal[],
  agreements: readonly StoredAgreement[],
  expectedTlvOfferId?: number,
): StoredAgreement {
  if (expectedTlvOfferId !== undefined && (!Number.isSafeInteger(expectedTlvOfferId) || expectedTlvOfferId <= 0)) {
    throw new Error("Ugyldig tilbudstilknytning for arbeidsavtalen.");
  }
  const latestByOffer = new Map<number, AgreementProposal>();
  for (const proposal of proposals) {
    const offerId = Number(proposal.offer_id);
    if (!Number.isSafeInteger(offerId) || offerId <= 0) continue;
    const previous = latestByOffer.get(offerId);
    if (!previous || Number(proposal.version_no) > Number(previous.version_no)) latestByOffer.set(offerId, proposal);
  }
  const approvedOfferIds = [...latestByOffer.entries()]
    .filter(([, proposal]) => proposal.status === "approved")
    .map(([offerId]) => offerId);
  if (!approvedOfferIds.length) throw new Error("Ingen godkjent oppstartsdato er knyttet til den valgte arbeidsavtalen.");
  let candidates = agreements;
  if (expectedTlvOfferId !== undefined) {
    // offer_id is a Core ID. Never compare it numerically to a TLV offer ID.
    // The reviewed overview patch exposes the exact Core source_reference.
    const tlvId = (agreement: StoredAgreement) => {
      const reference = agreement.tlv_offer_reference;
      if (typeof reference !== "string" || !/^offer:[1-9][0-9]*$/.test(reference)) return null;
      const id = Number(reference.slice(6));
      return Number.isSafeInteger(id) ? id : null;
    };
    const mapped = agreements.filter((agreement) => tlvId(agreement) !== null);
    if (agreements.length && !mapped.length) throw new Error("TLV-tilbudskoblingen mangler i avtaleoversikten. Riktig avtale kan ikke bekreftes.");
    candidates = mapped.filter((agreement) => tlvId(agreement) === expectedTlvOfferId);
    if (new Set(candidates.map((agreement) => Number(agreement.offer_id))).size > 1) {
      throw new Error("TLV-tilbudet har flere Core-koblinger. Riktig avtale kan ikke bekreftes.");
    }
  }
  const matching = candidates.filter((agreement) => approvedOfferIds.includes(Number(agreement.offer_id)));
  if (matching.length > 1) throw new Error("Flere godkjente tilbud har arbeidsavtaler. Velg riktig avtale fra avtaleoversikten.");
  if (!matching.length) throw new Error("Arbeidsavtalen for godkjent oppstart er ikke opprettet ennå.");
  const agreement = matching[0];
  if (!Number.isSafeInteger(Number(agreement.id)) || Number(agreement.id) <= 0) throw new Error("Arbeidsavtalens identitet kunne ikke bekreftes.");
  if (typeof agreement.document_sha256 !== "string" || !/^[a-f0-9]{64}$/i.test(agreement.document_sha256)) {
    throw new Error("Arbeidsavtalen finnes, men PDF-dokumentet er ikke klart.");
  }
  return agreement;
}

// Same byte-level check for stored PDF reading and signing. No rendering or persistence.
export async function verifyAgreementPdf(pdf: Blob, expectedHash: string): Promise<void> {
  if (pdf.type.toLowerCase().split(";")[0].trim() !== "application/pdf") throw new Error("Serveren returnerte ikke en PDF.");
  if (typeof expectedHash !== "string" || !/^[a-f0-9]{64}$/i.test(expectedHash)) throw new Error("Avtaledokumentets identitet kunne ikke bekreftes.");
  if (!globalThis.crypto?.subtle) throw new Error("Nettleseren kan ikke kontrollere dokumentet sikkert. Bruk en oppdatert nettleser over HTTPS.");
  const digest = await globalThis.crypto.subtle.digest("SHA-256", await pdf.arrayBuffer());
  const actualHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  if (actualHash !== expectedHash.toLowerCase()) throw new Error("PDF-en samsvarer ikke med arbeidsavtalens dokumenthash. Dokumentet kan ikke brukes.");
}

// Bind signing metadata to the exact PDF version already read by the customer.
export function assertAgreementDocumentIdentity(info: { agreement_id?: unknown; document_sha256?: unknown }, agreementId: number, expectedHash: string): void {
  if (!Number.isSafeInteger(agreementId) || agreementId <= 0 || Number(info.agreement_id) !== agreementId ||
      typeof info.document_sha256 !== "string" || !/^[a-f0-9]{64}$/.test(info.document_sha256)) {
    throw new Error("Dokumentet samsvarer ikke med valgt arbeidsavtale.");
  }
  if (typeof expectedHash !== "string" || !/^[a-f0-9]{64}$/i.test(expectedHash) || info.document_sha256 !== expectedHash.toLowerCase()) {
    throw new Error("Arbeidsavtalens dokumentversjon er endret. Åpne og kontroller arbeidsavtalen på nytt før signering.");
  }
}

import { apiUrl } from "./api";

// Shared metadata lookup for the existing viewer and unsigned revision control.
// This never generates or updates a document.
export async function loadStoredAgreement(options: {
  inquiryId: number; expectedTlvOfferId?: number; sessionToken: string;
  previewMode: boolean; signal?: AbortSignal;
}): Promise<StoredAgreement> {
  const { inquiryId, expectedTlvOfferId, sessionToken, previewMode, signal } = options;
  if (!Number.isSafeInteger(inquiryId) || inquiryId <= 0) throw new Error("Ugyldig sak.");
  if (!previewMode && !sessionToken) throw new Error("Kundeinnlogging kreves.");
  async function post(path: string, body: Record<string, unknown>, credentials: RequestCredentials) {
    signal?.throwIfAborted();
    const response = await fetch(apiUrl(path), { method: "POST", credentials, cache: "no-store", signal,
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    signal?.throwIfAborted();
    if (!response.ok || result.success !== true) throw new Error(result.message || "Kunne ikke hente arbeidsavtalen.");
    return result;
  }
  const schedule = await post(previewMode ? "/admin_agreement_schedule_read.php" : "/customer_agreement_schedule.php",
    previewMode ? { inquiry_id: inquiryId } : { action: "list", inquiry_id: inquiryId, session_token: sessionToken }, previewMode ? "include" : "omit");
  const overview = await post("/customer_agreements_overview.php",
    { inquiry_id: inquiryId, ...(previewMode ? { admin_preview: true } : { session_token: sessionToken }) }, "include");
  return resolveStoredAgreement(Array.isArray(schedule.proposals) ? schedule.proposals : [],
    Array.isArray(overview.agreements) ? overview.agreements : [], expectedTlvOfferId);
}

export function assertStoredDocumentResponse(response: Response, agreement: StoredAgreement): void {
  if (agreement.document_id === null || agreement.document_id === undefined) return;
  const id = Number(agreement.document_id);
  if (!Number.isSafeInteger(id) || id <= 0 || Number(response.headers.get("X-Document-Id")) !== id
    || Number(response.headers.get("X-Agreement-Id")) !== Number(agreement.id)
    || response.headers.get("X-Document-SHA256")?.toLowerCase() !== agreement.document_sha256?.toLowerCase()) {
    throw new Error("Dokument-ID eller versjon samsvarer ikke med gjeldende arbeidsavtale. Åpne avtalen på nytt.");
  }
}
