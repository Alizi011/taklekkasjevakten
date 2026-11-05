import { useEffect, useState } from "react";
import { AlertTriangle, FileText, ExternalLink, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { apiUrl } from "../lib/api";

type Candidate = { layer?: string; feature_id?: string; attributes?: Record<string, unknown>; address_match?: boolean; geometry_contains_point?: boolean };
type LookupResult = {
  success?: boolean; message?: string; checked_at?: string; property_address?: string;
  direct_matches?: Candidate[]; parent_matches?: Candidate[]; warnings?: string[];
  cache?: { source?: string; checked_at?: string; stale?: boolean; refresh_failed?: boolean };
};
const url = apiUrl("/tlv_heritage_lookup_bridge.php");
const asText = (v: unknown) => typeof v === "string" || typeof v === "number" ? String(v) : "";
const codeMap: Record<string, { label: string; explanation: string; action: string }> = {
  KOM: { label: "Kommunalt listeført", explanation: "Registrert som kulturhistorisk verneverdig av kommunen. Listeføring er ikke i seg selv fredning eller et generelt forbud mot endringer.", action: "Dokumenter eksisterende uttrykk. Ved synlige endringer i tak, pipe, beslag eller fasade må gjeldende reguleringsbestemmelser og eventuell søknadsplikt kontrolleres før utførelse." },
  AUT: { label: "Automatisk fredet", explanation: "Registreringen angir automatisk fredning etter kulturminneloven.", action: "Ikke gjennomfør inngrep som kan påvirke kulturminnet før omfang og eventuelt krav til tillatelse eller dispensasjon er avklart med rett kulturminnemyndighet." },
  VED: { label: "Vedtaksfredet", explanation: "Registreringen angir fredning ved særskilt vedtak.", action: "Les fredningsvedtaket og avklar tiltak og materialbruk med kulturminnemyndigheten før inngrep." },
  FOR: { label: "Forskriftsfredet", explanation: "Registreringen angir fredning gjennom forskrift.", action: "Kontroller forskriften og avklar om arbeidet krever samtykke eller dispensasjon." },
  PBL: { label: "Vern etter plan- og bygningsloven", explanation: "Registreringen viser planbasert bevaring.", action: "Les reguleringsplanens bestemmelser om eksteriør, materialer og tiltak før utførelse." },
};
const formatDate = (raw?: string) => raw ? raw.replace("T", " ").replace(/\s*UTC$/, " UTC").slice(0, 23) : "Ukjent";

export default function HeritageMaterialReview({ inquiryId, address }: { inquiryId: number; address: string }) {
  const [data, setData] = useState<LookupResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setData(null); setError(""); setLoaded(false); setBusy(true);
    const u = new URL(url);
    u.searchParams.set("inquiry_id", String(inquiryId));
    // No refresh: Core returns the saved lookup without contacting WFS.
    fetch(u.toString(), { credentials: "include", cache: "no-store", signal: controller.signal })
      .then(async response => {
        const body: LookupResult = await response.json();
        if (!response.ok || !body.success) throw new Error(body.message || `HTTP ${response.status}`);
        if (!cancelled) setData(body);
      })
      .catch(e => { if (!cancelled && !controller.signal.aborted) setError(e instanceof Error ? e.message : "Kunne ikke hente vernestatus."); })
      .finally(() => { if (!cancelled) { setBusy(false); setLoaded(true); } });
    return () => { cancelled = true; controller.abort(); };
  }, [inquiryId]);

  const refresh = async () => {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const u = new URL(url);
      u.searchParams.set("inquiry_id", String(inquiryId));
      u.searchParams.set("refresh", "1");
      const response = await fetch(u.toString(), { credentials: "include", cache: "no-store" });
      const body: LookupResult = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || `HTTP ${response.status}`);
      setData(body);
    } catch (e) { setError(e instanceof Error ? e.message : "Oppdateringen mislyktes."); }
    finally { setBusy(false); setLoaded(true); }
  };
  const direct = Array.isArray(data?.direct_matches) ? data.direct_matches : [];
  const unique = direct.filter((c, i, arr) => arr.findIndex(x => asText(x.attributes?.kulturminneId || x.feature_id) === asText(c.attributes?.kulturminneId || c.feature_id)) === i);
  const primary = unique.find(c => c.layer === "app:Enkeltminne") || unique[0];
  const code = asText(primary?.attributes?.vernetype).toUpperCase();
  const info = codeMap[code];
  const warning = Array.isArray(data?.warnings) && data.warnings.length > 0;
  const checkedAt = data?.cache?.checked_at || data?.checked_at;
  const source = asText(primary?.attributes?.linkKulturminnesøk) || asText(primary?.attributes?.linkAskeladden);
  const sourceSafe = /^https:\/\/(kulturminnesok\.no|www\.kulturminnesok\.no|askeladden\.ra\.no)\//i.test(source);

  return <section className="mt-5 rounded-2xl border border-slate-700 bg-[#1b101d] p-5 space-y-4" aria-label="Vernestatus og veiledning">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-5 w-5 text-amber-300"/><div><h3 className="font-bold text-white">Vernestatus</h3><p className="text-xs text-slate-300">{address}</p></div></div>
      <button type="button" onClick={() => void refresh()} disabled={busy} className="flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm text-white disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4"/>}Oppdater kontroll</button>
    </div>
    {busy && <p className="text-sm text-slate-300">Henter vernestatus …</p>}
    {error && <p role="alert" className="flex gap-2 text-sm text-rose-300"><AlertTriangle className="h-4 w-4 shrink-0"/>{error}{data && " Tidligere registrering vises fortsatt nedenfor."}</p>}
    {data && <>
      {data.cache?.source === "saved_previous_lookup" && <p className="text-xs text-amber-200">Lagret registerkontroll – ikke et nytt oppslag{data.cache.refresh_failed ? ". Ny kontroll mislyktes." : "."}</p>}
      <div className="rounded-xl border border-amber-500/30 p-4 space-y-2">
        <p className="text-lg font-bold text-white">{primary ? (info?.label || `Registrert vernetype ${code || "ukjent"}`) : warning ? "Uavklart – delvis kontroll" : "Ingen direkte registrering funnet"}</p>
        <p className="text-sm text-slate-300">{primary ? `Kode: ${code || "ikke oppgitt"} · Kulturminne-ID: ${asText(primary.attributes?.kulturminneId || primary.feature_id)}` : "Ingen eksakt adresseregistrering i det undersøkte oppslaget. Dette dokumenterer ikke at bygningen er uten vern."}</p>
        <p className="text-xs text-slate-400">Kontrollert: {formatDate(checkedAt)}</p>
        {sourceSafe && <a href={source} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-cyan-300 underline">Åpne offisiell registrering <ExternalLink className="h-3 w-3"/></a>}
      </div>
      {/* HERITAGE_DECISION_VIEW_V2 */}
      <section className="rounded-xl border border-slate-700 bg-slate-950/30 p-4 space-y-4">
        <div>
          <h4 className="text-base font-bold text-white">
            Beslutningsgrunnlag for arbeidet
          </h4>
          <p className="mt-1 text-xs text-slate-400">
            Registrerte forhold og deres betydning for valg av tiltak.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-300">
              Dokumentert
            </p>

            <p className="text-sm leading-6 text-slate-100">
              {code === "KOM"
                ? "Kommunal listeføring dokumenterer kulturhistorisk verneverdi. Registreringen er ikke i seg selv et fredningsvedtak eller et generelt forbud mot vedlikehold."
                : primary
                  ? info?.explanation ||
                    `Registrert vernetype ${code || "ukjent"}. Den offisielle registreringen er dokumentert.`
                  : warning
                    ? "Registerkontrollen har merknader og gir ikke et entydig resultat."
                    : "Ingen direkte treff i det undersøkte kulturminneregisteret. Dette dokumenterer ikke fravær av annet vern."}
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-200">
              Betydning for tiltaket
            </p>

            <p className="text-sm leading-6 text-slate-100">
              {code === "KOM"
                ? "KOM-registreringen alene fastsetter ikke et forbud mot vanlig vedlikehold. Om takform, materialer eller utseende kan endres, må avgjøres ut fra gjeldende bestemmelser og det konkrete tiltaket."
                : primary
                  ? "Eventuelle begrensninger for det planlagte arbeidet må knyttes til registreringens rettsvirkning og gjeldende bestemmelser."
                  : "Det kan ikke trekkes en konklusjon om begrensninger for tiltaket fra dette registeroppslaget alene."}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
          <div>
            <p className="text-sm font-bold text-white">
              Gjeldende reguleringsbestemmelser
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Se fanen «Reguleringsplan og bestemmelser» for planfunn
              og dokumentasjon. Historiske eller opphevede bestemmelser
              skal ikke behandles som gjeldende krav.
            </p>
          </div>
        </div>

        {warning && (
          <div className="rounded-xl border border-amber-500/25 p-3">
            <p className="text-xs font-bold text-amber-200">
              Merknader fra registerkontrollen
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-300">
              {data?.warnings?.map((item, index) => (
                <li key={`${index}-${item}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </>}
    {!busy && loaded && !data && !error && <p className="text-sm text-slate-300">Ingen kontroll tilgjengelig.</p>}
    <p className="text-xs text-slate-400">Lagrede kontroller hentes fra Perun Core. Bare «Oppdater kontroll» starter et nytt registeroppslag.</p>
  </section>;
}
