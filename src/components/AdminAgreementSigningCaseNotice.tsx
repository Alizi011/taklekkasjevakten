import { useCallback, useEffect, useState } from "react";
import { BellRing, RefreshCw } from "lucide-react";
import { apiUrl } from "../lib/api";

type PendingTask = {
  inquiry_id: number;
  agreement_id: number;
  status: "awaiting_admin_signature";
  customer_signatures: number;
  contractor_signatures_remaining: number;
};

type PendingResponse = {
  success: boolean;
  pending_count?: number;
  items?: PendingTask[];
  message?: string;
};

type Props = {
  inquiryId: number;
  onOpenAgreement: () => void;
  onPendingChange?: (pending: boolean) => void;
};

/** Read-only administrator task signal. Does not sign, invite or change an agreement. */
export default function AdminAgreementSigningCaseNotice({ inquiryId, onOpenAgreement, onPendingChange }: Props) {
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(apiUrl("/admin_agreement_signing_inbox.php"), {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pending_admin" }),
        signal,
      });
      const data = (await response.json()) as PendingResponse;
      if (!response.ok || data.success !== true || !Array.isArray(data.items)) {
        throw new Error(data.message || "Kunne ikke hente signeringsoppgaver.");
      }
      const filtered = data.items.filter(task => task.inquiry_id === inquiryId && task.status === "awaiting_admin_signature");
      if (!signal?.aborted) {
        setTasks(filtered);
        onPendingChange?.(filtered.length > 0);
      }
    } catch (cause) {
      if (!signal?.aborted) {
        setTasks([]);
        onPendingChange?.(false);
        setError(cause instanceof Error ? cause.message : "Signeringsstatus er utilgjengelig.");
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [inquiryId, onPendingChange]);

  useEffect(() => {
    const controller = new AbortController();
    void reload(controller.signal);
    return () => controller.abort();
  }, [reload]);

  // Refresh whenever administrator returns to the tab; manual refresh is always available.
  useEffect(() => {
    const onFocus = () => { void reload(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [reload]);

  if (!tasks.length && !error) return null;
  return (
    <section aria-label="Avtaler som venter på Perun AS" className="rounded-2xl border border-amber-500/40 bg-amber-500/[0.07] p-4" role="region">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
          <div className="space-y-1">
            <h2 className="text-sm font-black text-amber-200">{error ? "Signeringsstatus kan ikke hentes" : "Kunden har signert – Perun AS må signere"}</h2>
            {error ? (
              <p role="alert" className="text-xs text-amber-100">{error}</p>
            ) : (
              <p className="text-xs text-slate-200">
                {tasks.length === 1 ? `Arbeidsavtale #${tasks[0].agreement_id}` : `${tasks.length} arbeidsavtaler`} venter på leverandørens signatur.
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!error && <button type="button" onClick={onOpenAgreement} className="rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-300">Åpne avtaleoppfølging</button>}
          <button type="button" disabled={loading} onClick={() => { void reload(); }} className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/40 px-3 py-2.5 text-xs font-semibold text-amber-100 disabled:opacity-50">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />Oppdater
          </button>
        </div>
      </div>
    </section>
  );
}
