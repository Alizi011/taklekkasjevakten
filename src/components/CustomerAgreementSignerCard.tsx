import { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";
import CustomerAgreementInlineSigning from "./CustomerAgreementInlineSigning";

type Signer = {
  id: number;
  party?: string;
  full_name: string;
  status?: string;
  authority_verified_at?: string | null;
  invitation_status?: string | null;
};

type Props = {
  inquiryId: number;
  agreementId: number | null;
  expectedDocumentHash: string | null;
  sessionToken: string;
  previewMode: boolean;
};

export default function CustomerAgreementSignerCard({
  inquiryId, agreementId, expectedDocumentHash, sessionToken, previewMode,
}: Props) {
  const [signers, setSigners] = useState<Signer[]>([]);
  const [proposedName, setProposedName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);
  const [inlineAutoStart, setInlineAutoStart] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setSigners([]);
    setProposedName("");
    setMessage("");
    setError("");
    if (!agreementId) { setLoading(false); return () => controller.abort(); }
    if (!previewMode && !sessionToken) {
      setLoading(false);
      setError("Kundeinnlogging kreves for å bekrefte signatar.");
      return () => controller.abort();
    }
    setLoading(true);
    const post = async (path: string, payload: Record<string, unknown>) => {
      const response = await fetch(apiUrl(path), {
        method: "POST", credentials: "include", cache: "no-store",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) {
        throw new Error(result.message || "Kunne ikke hente signataropplysninger.");
      }
      return result;
    };
    const load = async () => {
      try {
        let rows: Signer[];
        if (previewMode) {
          const result = await post("/admin_agreement_signing_control.php", {
            action: "list", inquiry_id: inquiryId, agreement_id: agreementId,
          });
          rows = (Array.isArray(result.signers) ? result.signers : [])
            .filter((item: Signer) => item.party === "customer");
        } else {
          const result = await post("/customer_agreement_signers.php", {
            action: "list", inquiry_id: inquiryId,
            agreement_id: agreementId, session_token: sessionToken,
          });
          rows = Array.isArray(result.signers) ? result.signers : [];
        }
        if (controller.signal.aborted) return;
        setSigners(rows);
        // Admin leser reelle BRREG-data, uten kundetoken eller skriveoperasjoner.
        if (previewMode && rows.length === 0) {
          const result = await post("/customer_board_candidates.php", {
            inquiry_id: inquiryId,
            admin_preview: true,
          });

          const board = Array.isArray(result.board_members)
            ? result.board_members : [];

          const members = Array.isArray(result.members)
            ? result.members : [];

          const chairs = board.filter(
            (person: { role_code?: string }) =>
              person.role_code === "LEDE"
          );

          const contacts = members.filter(
            (member: { access_role?: string; status?: string }) =>
              member.access_role === "customer_admin" &&
              member.status !== "revoked"
          );

          if (chairs.length !== 1 || contacts.length !== 1) {
            throw new Error(
              "Styreleder eller hovedkontakt er ikke entydig registrert."
            );
          }

          const chairName = String(chairs[0].name || "").trim();
          const contactName = String(contacts[0].full_name || "").trim();
          const contactEmail = String(contacts[0].email || "").trim();

          const normalize = (value: string) =>
            value.toLocaleLowerCase("nb-NO")
              .trim()
              .replace(/\s+/g, " ");

          const chairParts = normalize(chairName).split(" ");
          const contactParts = normalize(contactName).split(" ");

          const matching =
            chairParts.length >= 2 &&
            contactParts.length >= 2 &&
            chairParts[0] === contactParts[0] &&
            chairParts[chairParts.length - 1] ===
              contactParts[contactParts.length - 1];

          const validEmail =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail);

          if (!matching || !validEmail) {
            throw new Error(
              "Styreleder og hovedkontakt samsvarer ikke. Kontroller kundeopplysningene."
            );
          }

          if (!controller.signal.aborted) {
            setProposedName(chairName);
          }
        }
        if (!previewMode && rows.length === 0) {
          const proposed = await post("/customer_agreement_signers.php", {
            action: "chair_proposal", inquiry_id: inquiryId,
            agreement_id: agreementId, session_token: sessionToken,
          });
          if (!controller.signal.aborted) {
            setProposedName(proposed.proposed_signer?.full_name || "");
          }
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          setError(e instanceof Error ? e.message : "Kunne ikke hente signatarstatus.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [agreementId, inquiryId, previewMode, sessionToken, revision]);

  async function confirmSigner() {
    if (!agreementId || previewMode || !proposedName || saving || signers.length) return;
    if (!window.confirm(`Bekrefte ${proposedName} som foreslått signatar på arbeidsavtalen?`)) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(apiUrl("/customer_agreement_signers.php"), {
        method: "POST", credentials: "include", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm_chair", inquiry_id: inquiryId,
          agreement_id: agreementId, session_token: sessionToken,
          confirmed_full_name: proposedName, confirmed: true,
        }),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) {
        throw new Error(result.message || "Kunne ikke bekrefte signataren.");
      }
      setMessage("Signataren er registrert. Signaturretten kontrolleres før invitasjonen sendes.");
      setInlineAutoStart(true);
      setRevision(value => value + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registreringen mislyktes.");
    } finally {
      setSaving(false);
    }
  }

  const signer = signers[0];
  const signed = Boolean(signer && signer.status === "signed");
  const invited = Boolean(signer?.invitation_status);
  const verified = Boolean(signer?.authority_verified_at);
  const status = signed ? "Signert" : invited ? "Invitasjon sendt" : verified
    ? "Signaturrett kontrollert" : signer ? "Avventer kontroll" : "Avventer signatar";

  return (
    <section className="min-w-0 space-y-4" aria-label="Signering av arbeidsavtale">
      <div>
        <h4 className="text-sm font-black text-white">Hvem skal signere avtalen?</h4>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Kontroller hvem som skal signere på vegne av virksomheten.
        </p>
      </div>

      {loading && (
        <p role="status" className="text-xs text-slate-400">Henter signataropplysninger …</p>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs leading-5 text-rose-200">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs leading-5 text-emerald-200">
          {message}
        </p>
      )}

      {!agreementId && !loading && (
        <p className="text-xs leading-5 text-slate-400">
          Signatarvalget blir tilgjengelig når arbeidsavtalen er klar.
        </p>
      )}

      {!loading && agreementId && signer && (
        <div className="space-y-2 rounded-xl border border-slate-700/70 bg-slate-900/50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Registrert signatar</p>
          <p className="break-words text-sm font-bold text-white">{signer.full_name}</p>
          <p role="status" className="text-xs font-semibold text-amber-300">{status}</p>
          <p className="text-xs leading-5 text-slate-400">
            {signed ? "Arbeidsavtalen er signert." : invited
              ? "Invitasjon til signering er sendt." : verified
                ? "Signaturretten er kontrollert. Invitasjon sendes når den er klar."
                : "Signataren er registrert. Vi kontrollerer signaturretten før invitasjon sendes."}
          </p>
        </div>
      )}

      {!loading && agreementId && !signer && proposedName && (
        <div className="space-y-3 rounded-xl border border-slate-700/70 bg-slate-900/50 p-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Foreslått signatar · styreleder
            </p>
            <p className="mt-2 break-words text-base font-bold text-white">{proposedName}</p>
            <p className="mt-1 text-[11px] text-slate-400">Opplysninger fra Brønnøysundregistrene</p>
          </div>
          <p className="text-xs leading-5 text-slate-200">
            Stemmer det at denne personen skal signere arbeidsavtalen?
          </p>
          <button
            type="button"
            disabled={saving || previewMode}
            onClick={() => void confirmSigner()}
            title={previewMode ? "Kun kunden kan bekrefte signatar" : undefined}
            className="w-full rounded-xl bg-amber-400 px-3 py-3 text-xs font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {saving ? "Bekrefter …" : "Ja, opplysningene stemmer"}
          </button>
          <p className="text-xs leading-5 text-slate-400">
            Stemmer ikke opplysningene? Kontakt prosjektansvarlig.
          </p>
        </div>
      )}

      {!loading && agreementId && !signer && !proposedName && !error && (
        <p className="text-xs leading-5 text-slate-400">
          Signatar er ikke avklart ennå. Kontakt prosjektansvarlig hvis opplysningene må oppdateres.
        </p>
      )}

      {!loading && agreementId && !signer && proposedName && (
        <p className="text-[11px] leading-5 text-slate-500">
          {previewMode
            ? "Forhåndsvisning: Bekreftelsen kan bare utføres i kundens innloggede portal."
            : "Etter bekreftelse kontrollerer vi signaturretten før engangskoden sendes på SMS."}
        </p>
      )}
      {!loading && agreementId && expectedDocumentHash && signer && signer.status !== "signed" && (
        <CustomerAgreementInlineSigning
          key={`${inquiryId}:${agreementId}:${expectedDocumentHash}`}
          inquiryId={inquiryId}
          agreementId={agreementId}
          expectedDocumentHash={expectedDocumentHash}
          sessionToken={sessionToken}
          signerName={signer.full_name}
          previewMode={previewMode}
          authorityVerified={Boolean(signer.authority_verified_at)}
          autoStart={inlineAutoStart}
          onAutoStartHandled={() => setInlineAutoStart(false)}
          onFinished={() => {
            setInlineAutoStart(false);
            setRevision(value => value + 1);
          }}
        />
      )}
    </section>
  );
}
