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

  async function load() {
    setBusy(true);
    setError("");

    try {
      const result = await request(
        "/customer_agreements_overview.php",
        { admin_preview: previewMode }
      );

      setData(result);
      const first = result.agreements?.[0];
      setSelectedAgreement(first ? Number(first.id) : 0);
      setSelected([]);
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
    if (!selectedAgreement || !data?.can_manage) {
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
  }, [selectedAgreement, data?.can_manage]);

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
            Velg kundens signatarer. Marina Alizi signerer etter kunden.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs"
        >
          Oppdater
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
          <label className="mb-4 block text-sm">
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
          </label>

          {existing.length > 0 && (
            <p className="mb-3 text-sm text-amber-300">
              Registrerte signatarer: {existing.join(", ")}
            </p>
          )}

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

          {data.can_manage && available.length === 0 && (
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

          <button
            type="button"
            disabled={busy || !data.can_manage || selected.length === 0 ||
              agreement?.status !== "draft" ||
              !agreement.document_sha256 || existing.length > 0}
            onClick={() => void register()}
            className="mt-4 rounded-lg bg-amber-500 px-4 py-3 text-xs font-bold text-slate-950 disabled:opacity-40"
          >
            Registrer valgte signatarer
          </button>
        </>
      )}
    </section>
  );
}
