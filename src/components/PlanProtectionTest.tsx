import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw
} from "lucide-react";
import { apiUrl } from "../lib/api";

type Excerpt = {
  line?: number;
  text?: string;
};

type DocumentResult = {
  url?: string;
  excerpts?: Excerpt[];
  error?: string;
  supersession_notice_detected?: boolean;
};

type LayerResult = {
  checked?: boolean;
  features?: unknown[];
};

type PlanResponse = {
  success?: boolean;
  message?: string;
  inquiry_id?: number;
  project_id?: number;
  address?: string;
  checked_at?: string;
  source?: string;
  status?: string;
  plan_data?: {
    plan_ids?: Array<number | string>;
    documents?: Record<string, DocumentResult>;
    layers?: Record<string, LayerResult>;
    errors?: string[];
  };
};

export default function PlanProtectionTest({
  inquiryId
}: {
  inquiryId: number;
}) {
  const [data, setData] = useState<PlanResponse | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");
    setData(null);
    setHttpStatus(null);

    const url = new URL(apiUrl("/tlv_plan_protection_bridge.php"));
    url.searchParams.set("inquiry_id", String(inquiryId));

    fetch(url.toString(), {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      signal: controller.signal
    })
      .then(async (response) => {
        const body = await response.json() as PlanResponse;

        if (controller.signal.aborted) return;

        setHttpStatus(response.status);

        if (!response.ok || !body.success) {
          throw new Error(
            body.message ||
            `Planopplysninger kunne ikke hentes (HTTP ${response.status}).`
          );
        }

        setData(body);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Kunne ikke hente planopplysninger."
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [inquiryId, retry]);

  const plan = data?.plan_data;
  const ids = plan?.plan_ids || [];
  const documents = plan?.documents || {};
  const layers = plan?.layers || {};

  const sourceErrors = plan?.errors || [];

  const documentEntries = Object.entries(documents);

  const preservationLayers = [
    "RBBEVARINGOMRAADE",
    "RPANGITTHENSYNSONE_2",
    "RPBESTEMMELSEOMRAADE_2",
    "RPBAANDLEGGINGSONE_2"
  ];

  const preservationFindings = preservationLayers.flatMap((name) => {
    const layer = layers[name];
    if (!layer?.checked) return [];
    const count = Array.isArray(layer.features)
      ? layer.features.length
      : 0;
    return count > 0 ? [{ name, count }] : [];
  });

  const hasSupersessionNotice = documentEntries.some(
    ([, document]) =>
      document.supersession_notice_detected ||
      (document.excerpts || []).some((excerpt) =>
        /helt eller delvis opphevet|opphevet som følge av/i.test(
          excerpt.text || ""
        )
      )
  );

  return (
    <section className="mt-4 space-y-4 rounded-2xl border border-slate-700 bg-[#191421] p-5 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-cyan-300" />
          <div>
            <h3 className="text-base font-bold">
              Reguleringsplan og bestemmelser
            </h3>
            <p className="text-xs text-slate-400">
              Dokumenterte planopplysninger fra Perun Core
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRetry((value) => value + 1)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-xs font-bold disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Hent planopplysninger
        </button>
      </div>

      {loading && (
        <p className="flex items-center gap-2 text-sm text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          Henter offentlige planopplysninger …
        </p>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
          <p className="flex items-center gap-2 font-semibold text-rose-200">
            <AlertTriangle className="h-4 w-4" />
            Planopplysninger er ikke tilgjengelige
          </p>
          <p className="mt-2 text-sm text-slate-300">{error}</p>
          {httpStatus === 401 && (
            <p className="mt-2 text-xs text-amber-200">
              Administratorøkten ble ikke godkjent av plan-API-et.
              Eksisterende kulturminnekontroll påvirkes ikke.
            </p>
          )}
        </div>
      )}

      {data && (
        <>
          <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-300">
              Registrerte reguleringsplaner
            </p>

            <p className="mt-2 text-lg font-extrabold text-white">
              {ids.length
                ? ids.join(", ")
                : "Ingen planobjekter returnert"}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              {data.address || `Sak ${inquiryId}`}
              {" · "}
              Core-prosjekt {data.project_id ?? "ukjent"}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Hentet: {data.checked_at || "Tidspunkt mangler"}
            </p>
          </div>

          {hasSupersessionNotice && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <p className="flex items-center gap-2 font-bold text-amber-200">
                <AlertTriangle className="h-4 w-4" />
                Merknad om opphevet plan
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                Et offentlig plandokument opplyser at planen
                er helt eller delvis opphevet. Bestemmelsene
                presenteres nedenfor som dokumentfunn, ikke som
                bekreftede gjeldende krav.
              </p>
            </div>
          )}

          {preservationFindings.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 p-4">
              <p className="font-bold text-amber-200">
                Registrerte planområder med mulige vernehensyn
              </p>
              {preservationFindings.map((finding) => (
                <p key={finding.name} className="mt-2 text-sm">
                  {finding.name}: {finding.count} treff
                </p>
              ))}
              <p className="mt-2 text-xs text-slate-400">
                Karttreff er registrerte planobjekter. Gjeldende
                rettsvirkning må bygge på tilhørende bestemmelser.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-bold text-white">
              Offisielle reguleringsbestemmelser
            </h4>

            {documentEntries.length === 0 && (
              <p className="text-sm text-slate-400">
                Ingen bestemmelsesdokumenter ble returnert.
              </p>
            )}

            {documentEntries.map(([planId, document]) => {
              const excerpts = Array.isArray(document.excerpts)
                ? document.excerpts
                : [];

              const validUrl =
                typeof document.url === "string" &&
                /^https:\/\/innsyn\.pbe\.oslo\.kommune\.no\//i.test(document.url);

              return (
                <div
                  key={planId}
                  className="rounded-xl border border-slate-700 bg-slate-950/40 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-white">
                      Plan {planId}
                    </p>

                    {validUrl && (
                      <a
                        href={document.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-cyan-300 underline"
                      >
                        Åpne bestemmelsesdokument
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  {document.error && (
                    <p className="mt-3 text-sm text-rose-300">
                      Dokumentfeil: {document.error}
                    </p>
                  )}

                  {excerpts.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-bold uppercase text-slate-400">
                        Relevante dokumentutdrag
                      </p>

                      {excerpts.map((excerpt, index) => (
                        <div
                          key={`${planId}-${excerpt.line ?? index}-${index}`}
                          className="rounded-lg border border-slate-800 p-3"
                        >
                          <p className="text-sm leading-6 text-slate-200">
                            {excerpt.text || "Tomt utdrag"}
                          </p>
                          {excerpt.line !== undefined && (
                            <p className="mt-1 text-xs text-slate-500">
                              Tekstlinje {excerpt.line}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : !document.error ? (
                    <p className="mt-3 text-sm text-slate-400">
                      Ingen relevante tekstutdrag identifisert.
                      Åpne dokumentet for fullstendige bestemmelser.
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-300" />
              <p className="font-semibold">Dokumentasjonsgrunnlag</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Planopplysningene er hentet fra offentlige kilder.
              Tekstutdrag dokumenterer hva dokumentene inneholder,
              men fastslår ikke alene om bestemmelsene fortsatt
              gjelder eller hvordan de påvirker det konkrete tiltaket.
            </p>
          </div>

          {sourceErrors.length > 0 && (
            <div className="rounded-xl border border-amber-500/25 p-4">
              <p className="font-bold text-amber-200">
                Kilder som ikke kunne leses
              </p>
              {sourceErrors.map((item, index) => (
                <p key={`${index}-${item}`} className="mt-2 text-xs">
                  {item}
                </p>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}