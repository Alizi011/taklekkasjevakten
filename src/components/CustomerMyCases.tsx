import { useState } from "react";
import { FolderOpen, X, ChevronRight, Loader2 } from "lucide-react";
import { apiUrl } from "../lib/api";

type CustomerCase = {
  id: number;
  customer_name?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  inquiry_type?: string;
  status?: string;
  created_at?: string;
};

type Props = {
  inquiryId: number;
  previewMode?: boolean;
  onPreviewCase?: (inquiryId: number) => void;
};

const SESSION_KEY = "taklekkasjevakten_customer_session";

// ALLE_BESTILLINGER_SIMPLE_V1
export default function CustomerMyCases({
  inquiryId,
  previewMode = false,
  onPreviewCase,
}: Props) {
  const [open, setOpen] = useState(false);
  const [cases, setCases] = useState<CustomerCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function request(action: string, extra = {}) {
    const token = window.localStorage.getItem(SESSION_KEY);
    if (!previewMode && !token) throw new Error("Kundeinnlogging mangler.");

    const response = await fetch(apiUrl(previewMode ? "/admin_customer_my_cases.php" : "/customer_my_cases.php"), {
      method: "POST",
      cache: "no-store", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(previewMode ? { inquiry_id: inquiryId } : {
        action,
        inquiry_id: inquiryId,
        session_token: token,
        ...extra,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || data?.success !== true) {
      throw new Error(data?.message || "Forespørselen kunne ikke fullføres.");
    }
    return data;
  }

  async function showCases() {
    setOpen(true);
    setLoading(true);
    setError("");
    try {

      const result = await request("list");
      setCases(Array.isArray(result.cases) ? result.cases : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke hente saker.");
    } finally {
      setLoading(false);
    }
  }

  async function openCase(targetId: number) {
    if (targetId === inquiryId) {
      setOpen(false);
      return;
    }

    if (previewMode) {
      if (!onPreviewCase) {
        setError("Kunne ikke åpne forhåndsvisning av saken.");
        return;
      }
      setOpen(false);
      onPreviewCase(targetId);
      return;
    }

    setSwitching(targetId);
    setError("");
    try {
      const result = await request("switch", {
        target_inquiry_id: targetId,
      });

      if (!result.session_token ||
          Number(result.inquiry_id) !== targetId) {
        throw new Error("Kunne ikke bekrefte ny kundeøkt.");
      }

      window.localStorage.setItem(SESSION_KEY, result.session_token);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke åpne saken.");
      setSwitching(null);
    }
  }

  return (
    <>
      <div className="shrink-0">
        <button
          type="button"
          onClick={() => void showCases()}
          className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs font-bold text-amber-200 hover:bg-amber-500/20"
        >
          <FolderOpen className="h-4 w-4" />
          Alle bestillinger
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Alle bestillinger"
          className="fixed right-3 top-[112px] z-[150] max-h-[70vh] w-[min(92vw,440px)] overflow-y-auto rounded-2xl border border-slate-700 bg-[#101c2e] shadow-2xl sm:right-6"
        >
          <section className="w-full p-4">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white">Alle bestillinger</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Velg et oppdrag for å åpne tilbud, avtaler,
                  dokumenter og meldinger.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Lukk saksoversikten"
                className="rounded-lg border border-slate-700 p-2 text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loading && (
              <p className="flex items-center gap-2 text-sm text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Henter dine oppdrag …
              </p>
            )}

            {error && (
              <p role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                {error}
              </p>
            )}

            {!loading && cases.length === 0 && !error && (
              <p className="text-sm text-slate-400">
                Ingen saker er tilgjengelige.
              </p>
            )}

            <div className="space-y-3">
              {cases.map(item => {
                const current = Number(item.id) === inquiryId;
                return (
                  <article
                    key={item.id}
                    className={`rounded-xl border p-4 ${
                      current
                        ? "border-amber-500/50 bg-amber-500/10"
                        : "border-slate-700 bg-slate-900/60"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-white">
                          Sak #{item.id} · {item.address || "Adresse ikke oppgitt"}
                        </p>
                        <p className="mt-1 text-xs text-slate-300">
                          {[item.postal_code, item.city].filter(Boolean).join(" ")}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                          {item.inquiry_type || "Oppdrag"} · Status: {item.status || "Ukjent"}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={switching !== null}
                        onClick={() => void openCase(Number(item.id))}
                        className="rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 disabled:opacity-50"
                      >
                        {switching === Number(item.id)
                          ? "Åpner …"
                          : current ? "Valgt sak" : "Se oppdrag"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </>
  );
}