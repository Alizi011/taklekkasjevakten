import { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";

type BoardMember = { name: string; role: string; role_code?: string };
type BrregResponse = {
  success: boolean;
  orgnr?: string;
  company_name?: string;
  organisation_form?: string;
  checked_at?: string;
  board_members?: BoardMember[];
  roles?: Record<string, unknown>;
  signing?: Record<string, unknown>;
  cached?: boolean;
  cache_saved?: boolean;
  manual_contract_review_required?: boolean;
  message?: string;
  source?: { roles: string; signing: string };
};

type SigningCombination = { names: string[]; code: string; id: string };

function visibleText(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function roleItems(raw: Record<string, unknown> | undefined): BoardMember[] {
  if (!raw || !Array.isArray(raw.rollegrupper)) return [];
  const members: BoardMember[] = [];
  for (const group of raw.rollegrupper) {
    const g = record(group);
    if (!g || record(g.type)?.kode !== "STYR") continue;
    for (const item of Array.isArray(g.roller) ? g.roller : []) {
      const r = record(item);
      if (!r) continue;
      const roleType = record(r.type);
      const name = record(record(r.person)?.navn);
      const fullName = [name?.fornavn, name?.mellomnavn, name?.etternavn]
        .map(visibleText).filter(Boolean).join(" ");
      if (fullName) members.push({
        name: fullName,
        role: visibleText(roleType?.beskrivelse),
        role_code: visibleText(roleType?.kode),
      });
    }
  }
  return members;
}

function signingDetails(raw: Record<string, unknown> | undefined): {
  text: string;
  combinations: SigningCombination[];
  jointBoard: boolean;
} {
  const ground = record(raw?.signeringsGrunnlag);
  const roles = record(ground?.signaturProkuraRoller);
  const text = visibleText(roles?.signaturProkuraFritekst).trim();
  const source = record(raw?.signeringsKombinasjon);
  const list = Array.isArray(source?.kombinasjon) ? source.kombinasjon : [];
  const seen = new Set<string>();
  const combinations: SigningCombination[] = [];
  let jointBoard = false;

  for (const item of list) {
    const entry = record(item);
    if (!entry) continue;
    const code = visibleText(entry.kode);
    if (code === "STYR") {
      jointBoard = true;
      continue;
    }
    const persons = Array.isArray(entry.personRolleKombinasjon)
      ? entry.personRolleKombinasjon : [];
    const names = persons.map((person: unknown) => visibleText(record(person)?.navn).trim())
      .filter((name: string) => name.length > 0);
    if (names.length === 0) continue;
    const key = [...names].sort((a, b) => a.localeCompare(b, "nb")).join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    combinations.push({ names, code, id: visibleText(entry.kombinasjonsId) });
  }
  return { text, combinations, jointBoard };
}

/** Administratorpanel: viser Core-cache umiddelbart og oppdaterer bare ved eksplisitt klikk. */
export default function BrregBoardAndSignature({ orgnr }: { orgnr?: string | null }) {
  const [data, setData] = useState<BrregResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const cleanOrg = (orgnr || "").replace(/\D/g, "");

  useEffect(() => {
    setData(null);
    setError("");
    if (!/^\d{9}$/.test(cleanOrg)) return;
    const controller = new AbortController();
    setBusy(true);
    void (async () => {
      try {
        const res = await fetch(apiUrl(`/tlv_brreg_board.php?orgnr=${cleanOrg}`), {
          credentials: "include", cache: "no-store", signal: controller.signal,
        });
        const json = await res.json() as BrregResponse;
        if (!res.ok || !json.success) throw new Error(json.message || "Kunne ikke lese BRREG-opplysningene.");
        if (!controller.signal.aborted) setData(json);
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "BRREG-oppslaget feilet.");
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    })();
    return () => controller.abort();
  }, [cleanOrg]);

  const refresh = async () => {
    if (!/^\d{9}$/.test(cleanOrg)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(apiUrl(`/tlv_brreg_board.php?orgnr=${cleanOrg}&refresh=1`), {
        credentials: "include", cache: "no-store",
      });
      const json = await res.json() as BrregResponse;
      if (!res.ok || !json.success) throw new Error(json.message || "Oppdatering fra BRREG feilet.");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Oppdatering fra BRREG feilet.");
    } finally { setBusy(false); }
  };

  const board = data?.board_members ?? roleItems(data?.roles);
  const signing = signingDetails(data?.signing);
  const checkedAt = data?.checked_at ? new Date(data.checked_at) : null;
  const formattedCheckedAt = checkedAt && !Number.isNaN(checkedAt.getTime())
    ? checkedAt.toLocaleString("nb-NO") : "ukjent";

  return (
    <section className="rounded-2xl border border-slate-700 bg-[#17111e] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white">Styre og signaturrett fra BRREG</h3>
          <p className="text-xs text-slate-400">Perun Core · organisasjonsnummer {cleanOrg || "mangler"}</p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={busy || !/^\d{9}$/.test(cleanOrg)}
          className="rounded-xl border border-cyan-500/40 px-4 py-2.5 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-40">
          {busy ? "Henter …" : "Oppdater fra BRREG"}
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      {data && <>
        <div className="rounded-xl bg-slate-900 p-4">
          <p className="font-bold text-white">{data.company_name}</p>
          <p className="text-xs text-slate-400">
            {data.organisation_form} · Sist kontrollert {formattedCheckedAt}
            {data.cached ? " · Lagret i Perun Core" : data.cache_saved ? " · Oppdatert i Perun Core" : " · Ikke lagret (ingen entydig Core-kunde)"}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-700 p-4 space-y-2">
            <p className="font-semibold text-white">Registrert styre</p>
            {board.length ? board.map((item, i) => <div key={`${item.name}-${i}`} className="border-t border-slate-800 pt-2 text-sm">
              <p className="text-white">{item.name}</p><p className="text-xs text-slate-400">{item.role}</p>
            </div>) : <p className="text-xs text-amber-200">Ingen styremedlemmer registrert i oppslaget.</p>}
          </div>
          <div className="rounded-xl border border-slate-700 p-4 space-y-3">
            <p className="font-semibold text-white">Registrert signaturrett</p>
            {signing.text ? (
              <p className="whitespace-pre-wrap text-sm font-semibold text-white">{signing.text}</p>
            ) : (
              <p className="text-sm text-amber-200">Ingen tekstlig signaturbestemmelse tilgjengelig fra dette oppslaget.</p>
            )}
            {signing.combinations.length > 0 && <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-300">Registrerte signeringskombinasjoner</p>
              {signing.combinations.map((combination, index) => (
                <div key={`${combination.code}-${combination.id}-${index}`}
                  className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2">
                  <p className="text-sm text-white">{combination.names.join(" + ")}</p>
                  <p className="text-xs text-slate-400">
                    {combination.names.length === 1 ? "Registrert alene" : "Registrert i fellesskap"}
                  </p>
                </div>
              ))}
            </div>}
            {signing.jointBoard && <p className="text-xs text-slate-400">
              BRREG oppgir også «Styret i fellesskap» som en egen kombinasjon.
            </p>}
            <p className="text-xs text-slate-400">
              Kilde: BRREG. Kontroller at bestemmelsen fortsatt gjelder ved avtaleinngåelse.
              Registrert signaturrett bekrefter ikke at et konkret tilbud er godkjent.
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-400">Kilder: <a className="underline" href={data.source?.roles} target="_blank" rel="noreferrer">Enhetsregisteret</a> · <a className="underline" href={data.source?.signing} target="_blank" rel="noreferrer">Fullmakttjenesten</a></p>
      </>}
    </section>
  );
}
