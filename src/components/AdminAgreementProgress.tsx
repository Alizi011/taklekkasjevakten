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

  type AgreementSigner = {
    id: number;
    party: "customer" | "contractor";
    full_name: string;
    email: string;
    status: string;
    authority_basis: string | null;
    authority_verified_at: string | null;
    invitation_status?: "pending" | "verified" | null;
  };

  const [signers, setSigners] = useState<AgreementSigner[]>([]);
  const [signingError, setSigningError] = useState("");
  const [signingMessage, setSigningMessage] = useState("");
  const [signingBusy, setSigningBusy] = useState(false);
  const [authorityBasis, setAuthorityBasis] = useState<Record<number, string>>({});
  const [reviewedSigner, setReviewedSigner] = useState<number | null>(null);
  const [signingPhones, setSigningPhones] = useState<Record<number, string>>({});
  const [checkedPhoneSigner, setCheckedPhoneSigner] = useState<number | null>(null);
  const [sentSignerIds, setSentSignerIds] = useState<number[]>([]);

  // TLV_ADMIN_CUSTOMER_ACCESS_STATUS_V1
  type CustomerMemberStatus = {
    id: number;
    full_name: string;
    email: string;
    phone: string;
    access_role: string;
    organisation_role?: string;
    status: string;
    identity_verified_at?: string | null;
    authority_verified_at?: string | null;
    invitation_sent_at?: string | null;
  };

  const [customerMembers, setCustomerMembers] = useState<CustomerMemberStatus[]>([]);
  const [customerAccessLoading, setCustomerAccessLoading] = useState(true);
  const [customerAccessError, setCustomerAccessError] = useState("");

  // Kun lesing av BRREG-cache: dette dokumenterer representasjonsgrunnlag,
  // men gir aldri innlogging, identitetsverifisering eller signeringsrett.
  type BoardEntry = { name: string; role: string; role_code?: string };
  type BrregEvidence = {
    board: BoardEntry[];
    soleSigners: string[];
    checkedAt: string | null;
  };
  const [brregEvidence, setBrregEvidence] = useState<BrregEvidence | null>(null);
  const [brregError, setBrregError] = useState("");

  const normalizePersonName = (name: string) =>
    name.normalize("NFKC").trim().replace(/\\s+/g, " ").toLocaleLowerCase("nb-NO");

  const brregForMember = (name: string) => {
    if (!brregEvidence) return null;
    const normalized = normalizePersonName(name);
    const person = brregEvidence.board.find(p => normalizePersonName(p.name) === normalized);
    if (!person) return null;
    const isChair = /styreleder|styrets leder/i.test(person.role) ||
      ["LEDE", "STYRLE"].includes(String(person.role_code || "").toUpperCase());
    const signsAlone = brregEvidence.soleSigners.some(n => normalizePersonName(n) === normalized);
    return { isChair, signsAlone, checkedAt: brregEvidence.checkedAt };
  };

  // TLV_ADMIN_PREPARE_ACCESS_UI_V1
  const [recoveryMemberId, setRecoveryMemberId] = useState<number | null>(null);
  const [recoveryName, setRecoveryName] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryPhone, setRecoveryPhone] = useState("");
  const [recoveryReason, setRecoveryReason] = useState("");
  const [recoveryReviewed, setRecoveryReviewed] = useState(false);
  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");

  const loadCustomerAccess = useCallback(async (signal?: AbortSignal) => {
    setCustomerAccessLoading(true);
    setCustomerAccessError("");

    try {
      const response = await fetch(apiUrl("/customer_board_candidates.php"), {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({
          inquiry_id: inquiryId,
          session_token: "",
          admin_preview: true,
        }),
      });

      const data = await response.json();

      if (!response.ok || data?.success !== true || !Array.isArray(data.members)) {
        throw new Error(data?.message || "Kunne ikke hente kundetilgang.");
      }

      if (!signal?.aborted) {
        setCustomerMembers(data.members);
      }
    } catch (error) {
      if (!signal?.aborted) {
        setCustomerMembers([]);
        setCustomerAccessError(
          error instanceof Error ? error.message : "Kunne ikke hente kundetilgang."
        );
      }
    } finally {
      if (!signal?.aborted) {
        setCustomerAccessLoading(false);
      }
    }
  }, [inquiryId]);

  useEffect(() => {
    const controller = new AbortController();
    void loadCustomerAccess(controller.signal);
    return () => controller.abort();
  }, [loadCustomerAccess]);

  // Gjenbruk samme lagrede BRREG-oppslag som styrevisningen, uten refresh=1.
  useEffect(() => {
    const controller = new AbortController();
    setBrregEvidence(null);
    setBrregError("");
    void (async () => {
      try {
        const customerRes = await fetch(apiUrl(`/customer_profile.php?inquiry_id=${inquiryId}`), {
          credentials: "include", cache: "no-store", signal: controller.signal,
        });
        if (!customerRes.ok) throw new Error("Kundeprofil ikke tilgjengelig");
        const customerData = await customerRes.json();
        if (customerData?.success !== true) throw new Error("Kundeprofil ikke tilgjengelig");
        const orgnr = String(customerData?.customer?.organization_number || "").replace(/\\D/g, "");
        if (!/^\\d{9}$/.test(orgnr)) return;

        const response = await fetch(apiUrl(`/tlv_brreg_board.php?orgnr=${orgnr}`), {
          credentials: "include", cache: "no-store", signal: controller.signal,
        });
        if (!response.ok) throw new Error("BRREG-data ikke tilgjengelige");
        const data = await response.json();
        if (data?.success !== true) throw new Error("BRREG-data ikke tilgjengelige");

        const toRecord = (v: unknown): Record<string, any> | null =>
          v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, any> : null;

        const board: BoardEntry[] = Array.isArray(data.board_members)
          ? data.board_members.filter((item: unknown) => {
              const entry = toRecord(item);
              return typeof entry?.name === "string" && typeof entry?.role === "string";
            }).map((item: BoardEntry) => ({ name: item.name, role: item.role, role_code: item.role_code }))
          : [];

        // BRREG kan returnere rå rollegrupper selv om board_members mangler.
        if (!board.length) {
          const groups = toRecord(data.roles)?.rollegrupper;
          for (const rawGroup of Array.isArray(groups) ? groups : []) {
            const group = toRecord(rawGroup);
            if (toRecord(group?.type)?.kode !== "STYR") continue;
            for (const rawRole of Array.isArray(group?.roller) ? group.roller : []) {
              const role = toRecord(rawRole);
              const roleType = toRecord(role?.type);
              const personName = toRecord(toRecord(role?.person)?.navn);
              const name = [personName?.fornavn, personName?.mellomnavn, personName?.etternavn]
                .filter((x): x is string => typeof x === "string" && x.length > 0).join(" ");
              if (name) board.push({
                name, role: String(roleType?.beskrivelse || ""), role_code: String(roleType?.kode || ""),
              });
            }
          }
        }

        const combinationList = toRecord(toRecord(data.signing)?.signeringsKombinasjon)?.kombinasjon;
        const soleSigners: string[] = [];
        for (const rawCombination of Array.isArray(combinationList) ? combinationList : []) {
          const combination = toRecord(rawCombination);
          const entries = combination?.personRolleKombinasjon;
          const names = (Array.isArray(entries) ? entries : [])
            .map((entry: unknown) => toRecord(entry)?.navn)
            .filter((name: unknown): name is string => typeof name === "string" && name.trim().length > 0);
          if (names.length === 1) soleSigners.push(names[0]);
        }

        if (!controller.signal.aborted) {
          setBrregEvidence({ board, soleSigners, checkedAt: typeof data.checked_at === "string" ? data.checked_at : null });
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          setBrregError(e instanceof Error ? e.message : "BRREG-data ikke tilgjengelige");
        }
      }
    })();
    return () => controller.abort();
  }, [inquiryId]);

  const openRecovery = (member: CustomerMemberStatus) => {
    setRecoveryMemberId(member.id);
    setRecoveryName(member.full_name || "");
    setRecoveryEmail(member.email || "");
    setRecoveryPhone(member.phone || "");
    setRecoveryReason("");
    setRecoveryReviewed(false);
    setRecoveryError("");
    setRecoveryMessage("");
  };

  const prepareExistingAdmin = async () => {
    if (!recoveryMemberId || !recoveryReviewed || recoveryBusy) return;

    if (recoveryReason.trim().length < 8 ||
        recoveryReason.trim().length > 500 ||
        !recoveryName.trim() ||
        !recoveryEmail.trim() ||
        !recoveryPhone.trim()) {
      setRecoveryError("Kontroller kontaktopplysningene og skriv en begrunnelse på 8–500 tegn.");
      return;
    }

    if (!window.confirm(
      "Klargjøre eksisterende kundeadministrator for personlig aktivering? Medlemsstatus endres fra pending til invited. Ingen SMS sendes."
    )) return;

    setRecoveryBusy(true);
    setRecoveryError("");
    setRecoveryMessage("");

    try {
      const response = await fetch(
        apiUrl("/admin_customer_admin_bootstrap.php"),
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "prepare_existing_admin",
            inquiry_id: inquiryId,
            member_id: recoveryMemberId,
            full_name: recoveryName.trim(),
            email: recoveryEmail.trim(),
            phone: recoveryPhone.trim(),
            review_reason: recoveryReason.trim(),
            contact_reviewed: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data?.success !== true) {
        throw new Error(data?.message || "Klargjøringen mislyktes.");
      }

      setRecoveryMessage(
        "Kundetilgangen er klargjort for invitasjon. Ingen SMS er sendt."
      );
      setRecoveryMemberId(null);
      setRecoveryReviewed(false);
      setRecoveryReason("");

      await loadCustomerAccess();
    } catch (error) {
      setRecoveryError(
        error instanceof Error ? error.message : "Klargjøringen mislyktes."
      );
    } finally {
      setRecoveryBusy(false);
    }
  };

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

          const latestAgreement = [...agreementData.agreements]
            .sort((a: Agreement, b: Agreement) => Number(b.id) - Number(a.id))[0];

          if (latestAgreement) {
            try {
              const signerResponse = await fetch(
                apiUrl("/admin_agreement_signing_control.php"),
                {
                  method: "POST",
                  credentials: "include",
                  cache: "no-store",
                  headers: { "Content-Type": "application/json" },
                  signal,
                  body: JSON.stringify({
                    action: "list",
                    inquiry_id: inquiryId,
                    agreement_id: Number(latestAgreement.id),
                  }),
                }
              );
              const signerData = await signerResponse.json();
              if (!signerResponse.ok || signerData?.success !== true) {
                throw new Error(signerData?.message || "Kunne ikke hente signatarstatus.");
              }
              if (!signal?.aborted) {
                setSigners(Array.isArray(signerData.signers) ? signerData.signers : []);
                setSigningError("");
              }
            } catch (signerError) {
              if (!signal?.aborted) {
                setSigners([]);
                setSigningError(
                  signerError instanceof Error
                    ? signerError.message
                    : "Kunne ikke hente signatarstatus."
                );
              }
            }
          } else if (!signal?.aborted) {
            setSigners([]);
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

  const runSigningAction = async (
    action: "verify_authority" | "activate" | "send_invitation",
    agreementId: number,
    signerId?: number
  ) => {
    if (signingBusy) return;

    if (action === "verify_authority" && signerId) {
      if (reviewedSigner !== signerId ||
          (authorityBasis[signerId] || "").trim().length < 12) return;

      if (!window.confirm(
        "Bekrefter du at signatarens fullmakt er kontrollert mot dokumentert grunnlag?"
      )) return;
    }

    if (action === "activate" && !window.confirm(
      "Klargjøre arbeidsavtalen for elektronisk signering?"
    )) return;

    if (action === "send_invitation" && signerId) {
      if (checkedPhoneSigner !== signerId) return;
      if (!window.confirm(
        "Sende signeringslenke til det kontrollerte mobilnummeret?"
      )) return;
    }

    setSigningBusy(true);
    setSigningError("");
    setSigningMessage("");

    try {
      const payload: Record<string, unknown> = {
        action,
        inquiry_id: inquiryId,
        agreement_id: agreementId,
      };

      if (action === "verify_authority") {
        payload.signer_id = signerId;
        payload.authority_basis = (authorityBasis[signerId!] || "").trim();
        payload.authority_reviewed = true;
      }

      if (action === "send_invitation") {
        payload.signer_id = signerId;
        payload.phone = (signingPhones[signerId!] || "").trim();
        payload.phone_checked = true;
      }

      const response = await fetch(
        apiUrl("/admin_agreement_signing_control.php"),
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok || result?.success !== true) {
        throw new Error(result?.message || "Handlingen mislyktes.");
      }

      if (action === "send_invitation" && signerId) {
        setSentSignerIds(old => [...new Set([...old, signerId])]);
      }

      setSigningMessage(result.message || "Handlingen er fullført.");
      setReviewedSigner(null);
      setCheckedPhoneSigner(null);
      await load();
    } catch (e) {
      setSigningError(
        e instanceof Error ? e.message : "Handlingen mislyktes."
      );
    } finally {
      setSigningBusy(false);
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
      <section className="space-y-2 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-3">
        <p className="text-[10px] font-black uppercase tracking-wide text-cyan-300">
          Kundetilgang og aktivering
        </p>

        {recoveryError && (
          <p role="alert" className="text-xs text-red-300">{recoveryError}</p>
        )}

        {recoveryMessage && (
          <p role="status" className="text-xs text-emerald-300">{recoveryMessage}</p>
        )}

        {customerAccessLoading ? (
          <p className="text-xs text-slate-400">Henter medlemsstatus …</p>
        ) : customerAccessError ? (
          <p role="alert" className="text-xs text-amber-300">
            Medlemsstatus er utilgjengelig: {customerAccessError}
          </p>
        ) : customerMembers.filter(m => m.access_role === "customer_admin").length === 0 ? (
          <p className="text-xs text-amber-300">
            Ingen kundeadministrator er registrert i medlemsoversikten.
          </p>
        ) : (
          <div className="space-y-3">
            {customerMembers
              .filter(m => m.access_role === "customer_admin")
              .map(member => (
                <div key={member.id} className="space-y-1 rounded-lg border border-slate-700/70 bg-slate-950/50 p-3 text-xs">
                  <p className="font-bold text-white">
                    {member.full_name || member.organisation_role || "Kundeadministrator"} · Medlem {member.id}
                  </p>
                  {(() => {
                    const evidence = brregForMember(member.full_name || "");
                    return evidence ? (
                      <div className="space-y-1 rounded-lg border border-cyan-500/25 bg-cyan-500/[0.05] p-2 text-slate-200">
                        <p>BRREG: {evidence.isChair ? "Registrert styreleder" : "Registrert styremedlem"}</p>
                        <p>Signaturrett: {evidence.signsAlone
                          ? "Registrert alene i BRREG"
                          : "Ikke bekreftet som alene-signatar fra registrerte personkombinasjoner"}</p>
                        <p className="text-[11px] text-slate-400">
                          {evidence.checkedAt ? `Oppslag kontrollert: ${evidence.checkedAt}. ` : ""}
                          Navnesamsvar er kun dokumentasjon. Signaturrett og identitet må fortsatt
                          bekreftes i den serverstyrte avtaleprosessen.
                        </p>
                      </div>
                    ) : brregError ? (
                      <p className="text-[11px] text-slate-400">BRREG-status utilgjengelig for denne visningen.</p>
                    ) : (
                      <p className="text-[11px] text-slate-400">Ingen bekreftet personkobling til BRREG i denne visningen.</p>
                    );
                  })()}
                  <p className={member.status === "active" ? "text-emerald-300" : "text-amber-300"}>
                    Medlemsstatus: {member.status}
                  </p>
                  <p className="text-slate-300">
                    Identitet: {member.identity_verified_at ? "Verifisering registrert" : "Ikke verifisert"}
                  </p>
                  <p className="text-slate-300">
                    Fullmakt: {member.authority_verified_at ? "Verifisering registrert" : "Ikke verifisert"}
                  </p>
                  <p className="text-slate-300">
                    Invitasjon: {member.invitation_sent_at ? "Utsendelsesforsøk registrert" : "Ingen utsendelse registrert"}
                  </p>

                  {member.status === "pending" && (
                    <p className="mt-2 font-semibold text-amber-200">
                      Personlig tilgang må klargjøres og aktiveres før kunden kan bruke medlemsfunksjonene.
                    </p>
                  )}

                  {member.status === "pending" && (
                    <div className="mt-3 space-y-3 border-t border-slate-700 pt-3">
                      {recoveryMemberId !== member.id ? (
                        <button
                          type="button"
                          disabled={recoveryBusy}
                          onClick={() => openRecovery(member)}
                          className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-200 disabled:opacity-50"
                        >
                          Kontroller og klargjør kundetilgang
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <p className="font-bold text-white">
                            Kontroller registrert hovedkontakt
                          </p>

                          <label className="block space-y-1">
                            <span>Navn</span>
                            <input
                              type="text"
                              value={recoveryName}
                              onChange={e => {
                                setRecoveryName(e.target.value);
                                setRecoveryReviewed(false);
                              }}
                              className="w-full rounded-lg border border-slate-600 bg-slate-900 p-2 text-white"
                            />
                          </label>

                          <label className="block space-y-1">
                            <span>E-post</span>
                            <input
                              type="email"
                              value={recoveryEmail}
                              onChange={e => {
                                setRecoveryEmail(e.target.value);
                                setRecoveryReviewed(false);
                              }}
                              className="w-full rounded-lg border border-slate-600 bg-slate-900 p-2 text-white"
                            />
                          </label>

                          <label className="block space-y-1">
                            <span>Mobilnummer</span>
                            <input
                              type="tel"
                              value={recoveryPhone}
                              onChange={e => {
                                setRecoveryPhone(e.target.value);
                                setRecoveryReviewed(false);
                              }}
                              className="w-full rounded-lg border border-slate-600 bg-slate-900 p-2 text-white"
                            />
                          </label>

                          <label className="block space-y-1">
                            <span>Begrunnelse for klargjøring</span>
                            <textarea
                              value={recoveryReason}
                              onChange={e => setRecoveryReason(e.target.value)}
                              maxLength={500}
                              rows={3}
                              placeholder="Beskriv hvordan kontaktopplysningene er kontrollert."
                              className="w-full rounded-lg border border-slate-600 bg-slate-900 p-2 text-white"
                            />
                          </label>

                          <label className="flex items-start gap-2 text-slate-200">
                            <input
                              type="checkbox"
                              checked={recoveryReviewed}
                              onChange={e => setRecoveryReviewed(e.target.checked)}
                              className="mt-0.5"
                            />
                            <span>
                              Jeg bekrefter at registrert mottaker og
                              kontaktopplysningene er kontrollert.
                            </span>
                          </label>

                          <p className="text-amber-200">
                            Klargjøring endrer kun status til invited.
                            Ingen SMS, identitetsverifisering eller
                            fullmaktstildeling utføres.
                          </p>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={
                                recoveryBusy ||
                                !recoveryReviewed ||
                                recoveryReason.trim().length < 8
                              }
                              onClick={() => void prepareExistingAdmin()}
                              className="rounded-lg bg-amber-400 px-3 py-2 font-bold text-slate-950 disabled:opacity-40"
                            >
                              {recoveryBusy ? "Klargjør …" : "Bekreft klargjøring"}
                            </button>

                            <button
                              type="button"
                              disabled={recoveryBusy}
                              onClick={() => {
                                setRecoveryMemberId(null);
                                setRecoveryReviewed(false);
                                setRecoveryReason("");
                                setRecoveryError("");
                              }}
                              className="rounded-lg border border-slate-600 px-3 py-2 text-slate-200 disabled:opacity-40"
                            >
                              Avbryt
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {member.status === "active" &&
                    member.organisation_role?.trim().toLowerCase() !== "styreleder" && (
                    <p className="mt-2 text-amber-200">
                      Registrert rolle er ikke styreleder. Bekreftelse av oppstart krever særskilt verifisert styrelederfullmakt.
                    </p>
                  )}
                </div>
              ))}
          </div>
        )}
      </section>

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
          {agreement && agreementAvailable && (
            <section className="space-y-4 rounded-xl border border-amber-500/30 bg-slate-950/60 p-4">
              <h3 className="text-sm font-black text-amber-200">
                Signering av arbeidsavtale
              </h3>

              {signingError && (
                <p role="alert" className="text-xs text-red-300">{signingError}</p>
              )}
              {signingMessage && (
                <p role="status" className="text-xs text-emerald-300">{signingMessage}</p>
              )}

              {signers.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Ingen signatarer er registrert på avtalen ennå.
                </p>
              ) : (
                <div className="space-y-4">
                  {signers.map(signer => (
                    <div
                      key={signer.id}
                      className="space-y-3 rounded-lg border border-slate-700 bg-slate-900/60 p-3"
                    >
                      <p className="text-sm font-bold text-white">
                        {signer.full_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {signer.party === "customer" ? "Kundens signatar" : "Perun AS"}
                        {" · "}Status: {signer.status}
                      </p>

                      {signer.invitation_status && (
                        <p className="text-xs font-semibold text-emerald-300">
                          Aktiv signeringsinvitasjon – {signer.invitation_status === "verified"
                            ? "SMS-kode bekreftet"
                            : "venter på signatar"}
                        </p>
                      )}

                      {signer.authority_verified_at ? (
                        <p className="text-xs text-emerald-300">
                          Signaturfullmakt kontrollert
                          {signer.authority_basis ? ` – ${signer.authority_basis}` : ""}
                        </p>
                      ) : agreement.status === "draft" && signer.status === "pending" ? (
                        <div className="space-y-2">
                          <label className="block text-xs text-slate-300">
                            Dokumentert grunnlag for signaturrett
                            <textarea
                              rows={2}
                              maxLength={255}
                              value={authorityBasis[signer.id] || ""}
                              onChange={e => {
                                setAuthorityBasis(old => ({
                                  ...old,
                                  [signer.id]: e.target.value
                                }));
                                setReviewedSigner(null);
                              }}
                              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-2 text-white"
                              placeholder="Beskriv kontrollen av signaturfullmakten"
                            />
                          </label>
                          <label className="flex items-start gap-2 text-xs text-slate-300">
                            <input
                              type="checkbox"
                              checked={reviewedSigner === signer.id}
                              onChange={e => setReviewedSigner(e.target.checked ? signer.id : null)}
                            />
                            Jeg har kontrollert signaturretten.
                          </label>
                          <button
                            type="button"
                            disabled={signingBusy || reviewedSigner !== signer.id ||
                              (authorityBasis[signer.id] || "").trim().length < 12}
                            onClick={() => void runSigningAction("verify_authority", agreement.id, signer.id)}
                            className="rounded-lg border border-amber-500/50 px-3 py-2 text-xs font-bold text-amber-200 disabled:opacity-40"
                          >
                            Godkjenn signaturfullmakt
                          </button>
                        </div>
                      ) : null}

                      {signer.authority_verified_at &&
                        ["ready_for_signature", "sent_for_signature", "partially_signed"].includes(agreement.status) &&
                        signer.status === "pending" && (
                        <div className="space-y-2">
                          <label className="block text-xs text-slate-300">
                            Signatarens mobilnummer
                            <input
                              type="tel"
                              value={signingPhones[signer.id] || ""}
                              onChange={e => {
                                setSigningPhones(old => ({...old, [signer.id]: e.target.value}));
                                setCheckedPhoneSigner(null);
                              }}
                              placeholder="Mobilnummer"
                              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-2 text-white"
                            />
                          </label>
                          <label className="flex items-start gap-2 text-xs text-slate-300">
                            <input
                              type="checkbox"
                              checked={checkedPhoneSigner === signer.id}
                              onChange={e => setCheckedPhoneSigner(e.target.checked ? signer.id : null)}
                            />
                            Jeg har kontrollert at nummeret tilhører denne signataren.
                          </label>
                          <button
                            type="button"
                            disabled={signingBusy || Boolean(signer.invitation_status) || sentSignerIds.includes(signer.id) ||
                              checkedPhoneSigner !== signer.id ||
                              !/^\+?[0-9 ]{8,18}$/.test((signingPhones[signer.id] || "").trim())}
                            onClick={() => void runSigningAction("send_invitation", agreement.id, signer.id)}
                            className="w-full rounded-xl bg-amber-400 px-3 py-3 text-xs font-black text-slate-950 disabled:opacity-40"
                          >
                            {signer.invitation_status || sentSignerIds.includes(signer.id)
                              ? "Invitasjon sendt"
                              : "Send signeringsinvitasjon"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {agreement.status === "draft" &&
                    signers.some(s => s.party === "customer") &&
                    signers.some(s => s.party === "contractor") &&
                    signers.every(s => Boolean(s.authority_verified_at)) && (
                    <button
                      type="button"
                      disabled={signingBusy}
                      onClick={() => void runSigningAction("activate", agreement.id)}
                      className="w-full rounded-xl bg-emerald-600 px-3 py-3 text-xs font-black text-white disabled:opacity-40"
                    >
                      Klargjør arbeidsavtalen for signering
                    </button>
                  )}
                </div>
              )}
            </section>
          )}
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
      <button type="button" onClick={() => { void load(); void loadCustomerAccess(); }} disabled={loading || customerAccessLoading}
        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-300 hover:underline disabled:opacity-50">
        <RefreshCw className="h-3.5 w-3.5" /> Oppdater status
      </button>
    </div>
  );
}
