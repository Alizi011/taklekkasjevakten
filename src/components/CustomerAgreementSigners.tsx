import { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";

type Agreement = {
  id: number;
  agreement_number: string | null;
  status: string;
  document_sha256: string | null;
};

type Member = {
  id: number;
  full_name: string;
  organisation_role: string | null;
  status: string;
};

type Overview = {
  can_manage: boolean;
  agreements: Agreement[];
  members: Member[];
};

type Props = {
  inquiryId: number;
  sessionToken: string;
  previewMode: boolean;
};

export default function CustomerAgreementSigners({
  inquiryId,
  sessionToken,
  previewMode,
}: Props) {
  const [data, setData] = useState<Overview | null>(null);
  const [selectedAgreement, setSelectedAgreement] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [existing, setExisting] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [chairProposal, setChairProposal] = useState<string | null>(null);
  const [chairBusy, setChairBusy] = useState(false);
  const [chairProblem, setChairProblem] = useState("");
  const [showOtherSigners, setShowOtherSigners] = useState(false);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  async function openAgreementPdf(agreementId: number) {
    if (previewMode || !sessionToken || !agreementId || pdfBusy) return;

    setPdfBusy(true);
    setError("");

    try {
      const response = await fetch(
        apiUrl("/customer_agreement_document.php"),
        {
          method: "POST",
          credentials: "omit",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inquiry_id: inquiryId,
            agreement_id: agreementId,
            session_token: sessionToken,
          }),
        }
      );

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "Kunne ikke åpne arbeidsavtalen.");
      }

      const blob = await response.blob();
      if (!blob.type.includes("application/pdf")) {
        throw new Error("Serveren returnerte ikke en PDF.");
      }

      setPdfUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF-visningen feilet.");
    } finally {
      setPdfBusy(false);
    }
  }

  async function request(
    path: string,
    payload: Record<string, unknown>
  ) {
    const response = await fetch(apiUrl(path), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inquiry_id: inquiryId,
        session_token: sessionToken,
        ...payload,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Forespørselen feilet.");
    }

    return result;
  }

  async function load(showFeedback = false) {
    setBusy(true);
    setError("");

    try {
      const result = await request(
        "/customer_agreements_overview.php",
        { admin_preview: previewMode }
      );

      setData(result);

      if (showFeedback) {
        setMessage(
          previewMode
            ? "Forhåndsvisningen er oppdatert. Ingen endringer er utført."
            : result.can_manage
              ? "Avtale- og signatarstatus er oppdatert."
              : "Status er hentet. Denne innloggingen gir ikke tilgang til å administrere signatarer. Personlig hovedkontaktinnlogging kan være nødvendig."
        );
      }
      const first = result.agreements?.[0];
      setSelectedAgreement(first ? Number(first.id) : 0);
      setSelected([]);
      setShowOtherSigners(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke hente avtalene.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, [inquiryId, sessionToken, previewMode]);

  useEffect(() => {
    if (!selectedAgreement || !data || previewMode) {
      setExisting([]);
      return;
    }

    let cancelled = false;

    request("/customer_agreement_signers.php", {
      action: "list",
      agreement_id: selectedAgreement,
    }).then((result) => {
      if (!cancelled) {
        setExisting(
          (result.signers || []).map(
            (s: { full_name: string }) => s.full_name
          )
        );
      }
    }).catch((e) => {
      if (!cancelled) {
        setError(e instanceof Error ? e.message : "Kunne ikke hente signatarene.");
      }
    });

    return () => { cancelled = true; };
  }, [selectedAgreement, data, previewMode]);

  useEffect(() => {
    let cancelled = false;
    setChairProposal(null);
    setChairProblem("");

    const agreement = data?.agreements.find(
      a => Number(a.id) === selectedAgreement
    );

    if (previewMode || !agreement ||
        agreement.status !== "draft" ||
        !agreement.document_sha256) {
      return;
    }

    request("/customer_agreement_signers.php", {
      action: "chair_proposal",
      agreement_id: selectedAgreement,
    }).then(result => {
      if (!cancelled) {
        setChairProposal(result.proposed_signer?.full_name || null);
        if (!result.proposed_signer?.full_name) {
          setChairProblem("Ingen styreleder er foreslått. Kontakt oss dersom riktig signatar ikke vises.");
        }
      }
    }).catch(e => {
      if (!cancelled) {
        setChairProblem(
          e instanceof Error ? e.message : "Kunne ikke hente styreleder."
        );
      }
    });

    return () => { cancelled = true; };
  }, [selectedAgreement, data, previewMode]);

  async function confirmChair() {
    if (!chairProposal || !selectedAgreement || previewMode || chairBusy) return;

    setChairBusy(true);
    setError("");
    setMessage("");

    try {
      await request("/customer_agreement_signers.php", {
        action: "confirm_chair",
        agreement_id: selectedAgreement,
        confirmed_full_name: chairProposal,
        confirmed: true,
      });

      setExisting([chairProposal]);
      setChairProposal(null);
      setMessage(
        "Riktig signatar er registrert. Du får beskjed når avtalen er klar for sikker signering."
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Kunne ikke bekrefte signataren."
      );
    } finally {
      setChairBusy(false);
    }
  }

  async function register() {
    if (!selectedAgreement || selected.length === 0) return;

    if (!window.confirm(
      "Registrere de valgte personene som signatarer på arbeidsavtalen?"
    )) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await request("/customer_agreement_signers.php", {
        action: "register",
        agreement_id: selectedAgreement,
        member_ids: selected,
      });

      setMessage(
        "Signatarene er registrert. Signaturfullmakt må kontrolleres før invitasjon."
      );
      setSelected([]);
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Kunne ikke registrere signatarene."
      );
    } finally {
      setBusy(false);
    }
  }

  const agreement = data?.agreements.find(
    a => Number(a.id) === selectedAgreement
  );

  const available = (data?.members || []).filter(
    m => ["active", "invited"].includes(m.status)
  );

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-slate-100">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black">Signering av arbeidsavtale</h2>
          <p className="mt-1 text-xs text-slate-400">
            Les avtalen og kontroller hvem som skal signere. Vi følger opp signeringsinvitasjonen.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setMessage("");
            void load(true);
          }}
          disabled={busy}
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs disabled:opacity-50"
        >
          {busy ? "Oppdaterer …" : "Oppdater"}
        </button>
      </div>

      {busy && <p className="text-sm text-slate-400">Laster …</p>}
      {error && <p role="alert" className="my-2 text-sm text-red-300">{error}</p>}
      {message && <p role="status" className="my-2 text-sm text-amber-300">{message}</p>}

      {data && data.agreements.length === 0 && (
        <p className="text-sm text-slate-400">
          Ingen arbeidsavtale er opprettet ennå. Avtalen opprettes
          etter at et fastpristilbud er akseptert.
        </p>
      )}

      {data && data.agreements.length > 0 && (
        <>
          {data.agreements.length > 1 ? <label className="mb-4 block text-sm">
            Arbeidsavtale
            <select
              value={selectedAgreement}
              onChange={e => {
                setSelectedAgreement(Number(e.target.value));
                setSelected([]);
              }}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 p-3"
            >
              {data.agreements.map(a => (
                <option key={a.id} value={a.id}>
                  {a.agreement_number || `Avtale #${a.id}`} – {a.status}
                </option>
              ))}
            </select>
          </label> : (
            <p className="mb-4 text-sm font-semibold text-white">
              {agreement?.agreement_number || `Avtale #${agreement?.id || ""}`}
            </p>
          )}

          {agreement?.document_sha256 && (
            <button
              type="button"
              disabled={previewMode || pdfBusy}
              onClick={() => void openAgreementPdf(Number(agreement.id))}
              className="mb-5 w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pdfBusy ? "Åpner arbeidsavtalen …" : "Les arbeidsavtalen"}
            </button>
          )}

          {!previewMode && agreement?.status === "draft" &&
            agreement.document_sha256 && existing.length === 0 && (
            <div className="mb-5 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
              <h3 className="text-sm font-bold text-white">
                Kontroller signatar
              </h3>

              {chairProposal ? (
                <>
                  <p className="mt-3 text-base font-bold text-amber-300">
                    {chairProposal}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Foreslått signatar for avtalen
                  </p>
                  <p className="mt-3 text-xs leading-5 text-slate-300">
                    Kontroller at dette er riktig person. Signaturretten kontrolleres før invitasjonen sendes.
                  </p>
                  <button
                    type="button"
                    disabled={chairBusy}
                    onClick={() => void confirmChair()}
                    className="mt-4 w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50"
                  >
                    {chairBusy ? "Bekrefter …" : "Ja, dette er riktig signatar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChairProblem(
                        "Opplysningene stemmer ikke. Kontakt prosjektansvarlig slik at signataren kan korrigeres før signering."
                      );
                      setChairProposal(null);
                    }}
                    className="mt-2 w-full rounded-lg border border-slate-600 px-4 py-3 text-xs font-semibold text-slate-200"
                  >
                    Feil person – kontakt oss
                  </button>
                </>
              ) : (
                <p className="mt-3 text-xs text-slate-400">
                  {chairProblem || "Henter forslag til styreleder …"}
                </p>
              )}
            </div>
          )}

          {existing.length > 0 && (
            <p className="mb-3 text-sm text-amber-300">
              Signatar registrert: {existing.join(", ")}
            </p>
          )}

          {existing.length > 0 && agreement?.status !== "signed" && (
            <p className="mb-4 text-xs text-slate-300">
              Signataren er registrert. Når fullmakt og identitet er kontrollert, sendes signeringsinvitasjonen.
            </p>
          )}

          {!previewMode && data.can_manage && agreement?.status === "draft" &&
            Boolean(agreement.document_sha256) && existing.length === 0 && (
            <button type="button" onClick={() => setShowOtherSigners(value => !value)}
              className="mb-3 text-xs font-semibold text-amber-200 underline">
              {showOtherSigners ? "Skjul andre signatarvalg" : "Finner du ikke riktig signatar? Vis andre valg"}
            </button>
          )}

          {showOtherSigners && !previewMode && data.can_manage && agreement?.status === "draft" &&
            Boolean(agreement.document_sha256) && existing.length === 0 && (
          <div className="space-y-2">
            {available.map(member => (
              <label
                key={member.id}
                className="flex items-center gap-3 rounded-lg border border-slate-800 p-3"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(member.id)}
                  disabled={!data.can_manage || agreement?.status !== "draft" ||
                    !agreement.document_sha256 || existing.length > 0}
                  onChange={e =>
                    setSelected(old =>
                      e.target.checked
                        ? [...old, member.id]
                        : old.filter(id => id !== member.id)
                    )
                  }
                />
                <span className="text-sm">
                  {member.full_name}
                  <span className="ml-2 text-xs text-slate-400">
                    {member.organisation_role || "Registrert kontakt"}
                  </span>
                </span>
              </label>
            ))}
          </div>
          )}

          {showOtherSigners && data.can_manage && available.length === 0 && (
            <p className="mt-3 text-sm text-slate-400">
              Registrer styremedlemmer under «Styret og tilganger» først.
            </p>
          )}

          {previewMode && (
            <p className="mt-3 text-xs text-slate-400">
              Administratorforhåndsvisning – samme avtaleoversikt,
              men ingen invitasjoner eller signaturendringer sendes herfra.
            </p>
          )}

          {showOtherSigners && <button
            type="button"
            disabled={busy || !data.can_manage || selected.length === 0 ||
              agreement?.status !== "draft" ||
              !agreement.document_sha256 || existing.length > 0}
            onClick={() => void register()}
            className="mt-4 rounded-lg bg-amber-500 px-4 py-3 text-xs font-bold text-slate-950 disabled:opacity-40"
          >
            Registrer valgte signatarer
          </button>}
        </>
      )}
      {pdfUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Arbeidsavtale"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 p-3 sm:p-6"
        >
          <div className="flex h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-amber-500/40 bg-slate-950">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 p-4">
              <h3 className="font-bold text-white">Arbeidsavtale</h3>
              <button
                type="button"
                onClick={() => setPdfUrl("")}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-white"
              >
                Lukk
              </button>
            </div>
            <iframe
              title="Les hele arbeidsavtalen"
              src={pdfUrl}
              className="min-h-0 w-full flex-1 bg-white"
            />
            <div className="border-t border-slate-800 p-3">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-amber-300 underline"
              >
                Åpne PDF i eget vindu
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
