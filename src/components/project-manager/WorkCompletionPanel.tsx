import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Save,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { apiUrl } from "../../lib/api";

interface CompletionData {
  id: number;
  inquiry_id: number;
  work_type: "service" | "varig_utbedring";
  completed_at?: string | null;
  completed_by_employee_id?: number | null;
  completed_by_name?: string | null;
  work_summary?: string | null;
  additional_work?: string | null;
  deviations?: string | null;
  warranty_years?: number | string | null;
  warranty_start_date?: string | null;
  warranty_notes?: string | null;
  status?: string | null;
}

interface CompletionItem {
  id?: number;
  title: string;
  description?: string | null;
  item_status?: "ikke_vurdert" | "utfort" | "delvis_utfort" | "ikke_utfort";
  comment?: string | null;
}

interface CompletionControls {
  agreed_scope_completed?: number | boolean | null;
  visual_control_completed?: number | boolean | null;
  functional_control_completed?: number | boolean | null;
  functional_control_not_applicable?: number | boolean | null;
  documentation_completed?: number | boolean | null;
  site_cleaned?: number | boolean | null;
  deviations_found?: number | boolean | null;
  deviations_details?: string | null;
  unforeseen_conditions?: number | boolean | null;
  unforeseen_conditions_details?: string | null;
  work_changed_from_offer?: number | boolean | null;
  work_changed_details?: string | null;
  further_action_recommended?: number | boolean | null;
  further_action_details?: string | null;
}

interface Props {
  inquiryId: number;
  workType: "service" | "varig_utbedring";
  employeeId?: number | null;
  employeeName?: string | null;
  initialWorkSummary?: string;
}

const asBool = (value: unknown) => Boolean(Number(value));

export default function WorkCompletionPanel({
  inquiryId,
  workType,
  employeeId = null,
  employeeName = null,
  initialWorkSummary = "",
}: Props) {
  const [completion, setCompletion] = useState<CompletionData | null>(null);
  const [items, setItems] = useState<CompletionItem[]>([]);
  const [controls, setControls] = useState<CompletionControls>({});

  const [workSummary, setWorkSummary] = useState(initialWorkSummary);
  const [additionalWork, setAdditionalWork] = useState("");
  const [deviations, setDeviations] = useState("");
  const [warrantyStartDate, setWarrantyStartDate] = useState("");
  const [warrantyNotes, setWarrantyNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchCompletion = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        apiUrl(`/work_completion.php?inquiry_id=${inquiryId}`)
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke hente ferdigstillingen.");
      }

      const nextCompletion: CompletionData | null = data.completion || null;
      const nextControls: CompletionControls = data.controls || {};

      setCompletion(nextCompletion);
      setItems(Array.isArray(data.items) ? data.items : []);
      setControls(nextControls);

      setWorkSummary(
        nextCompletion?.work_summary || initialWorkSummary || ""
      );
      setAdditionalWork(nextCompletion?.additional_work || "");
      setDeviations(nextCompletion?.deviations || "");
      setWarrantyStartDate(nextCompletion?.warranty_start_date || "");
      setWarrantyNotes(nextCompletion?.warranty_notes || "");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kunne ikke hente ferdigstillingen."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletion();
  }, [inquiryId]);

  const saveMain = async (status: "utkast" | "arbeid_ferdig") => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const completedAt =
        status === "arbeid_ferdig"
          ? new Date().toISOString().slice(0, 19).replace("T", " ")
          : completion?.completed_at || null;

      const startDate =
        warrantyStartDate ||
        (status === "arbeid_ferdig"
          ? new Date().toISOString().slice(0, 10)
          : "");

      const res = await fetch(apiUrl("/work_completion.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_completion",
          completion_id: completion?.id || null,
          inquiry_id: inquiryId,
          work_type: workType,
          completed_at: completedAt,
          completed_by_employee_id: employeeId,
          completed_by_name: employeeName,
          work_summary: workSummary,
          additional_work: additionalWork,
          deviations,
          warranty_years: 5,
          warranty_start_date: startDate || null,
          warranty_notes: warrantyNotes,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke lagre ferdigstillingen.");
      }

      const completionId = Number(data.completion_id || completion?.id || 0);

      if (!completionId) {
        throw new Error("Mangler completion_id etter lagring.");
      }

      const controlsRes = await fetch(apiUrl("/work_completion.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_controls",
          completion_id: completionId,
          ...controls,
        }),
      });

      const controlsData = await controlsRes.json();

      if (!controlsRes.ok || !controlsData.success) {
        throw new Error(
          controlsData.message || "Kunne ikke lagre kontrollpunktene."
        );
      }

      setMessage(
        status === "arbeid_ferdig"
          ? "Arbeidet er markert som ferdig og kontrollen er lagret."
          : "Utkastet er lagret."
      );

      await fetchCompletion();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kunne ikke lagre ferdigstillingen."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleControl = (key: keyof CompletionControls) => {
    setControls((prev) => ({
      ...prev,
      [key]: !asBool(prev[key]),
    }));
  };

  const coreControlKeys: (keyof CompletionControls)[] = [
    "agreed_scope_completed",
    "visual_control_completed",
    "documentation_completed",
    "site_cleaned",
  ];

  const requiredControlsComplete = coreControlKeys.every((key) =>
    asBool(controls[key])
  );

  return (
    <section className="rounded-3xl border border-emerald-500/25 bg-[#0b0f17] p-5 md:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-800/80 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
            <Wrench className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-400">
              Ferdigstilling av arbeid
            </p>
            <h3 className="mt-1 text-lg font-black text-white">
              Kontroll før sluttrapport
            </h3>
            <p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-400">
              Registrer hva som er utført, gjennomfør sluttkontroll og bekreft
              5 års garanti før utbedringsrapporten opprettes.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-[10px] font-bold text-slate-400">
            {completion?.status === "arbeid_ferdig"
              ? "Arbeid ferdig"
              : "Utkast"}
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2 text-[10px] font-black text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            5 års garanti
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-xs text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
          Henter ferdigstilling...
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
              {message}
            </div>
          )}

          {items.length > 0 && (
            <div>
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-blue-400" />
                <h4 className="text-xs font-black text-white">
                  Tiltak i ferdigstillingen
                </h4>
              </div>

              <div className="mt-3 space-y-2">
                {items.map((item, index) => (
                  <div
                    key={item.id || `${item.title}-${index}`}
                    className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/45 p-3"
                  >
                    <CheckCircle2
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        item.item_status === "utfort"
                          ? "text-emerald-400"
                          : "text-slate-600"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200">
                        {item.title}
                      </p>
                      {item.comment && (
                        <p className="mt-1 text-[10px] leading-4 text-slate-500">
                          {item.comment}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Utført arbeid
            </label>
            <textarea
              value={workSummary}
              onChange={(e) => setWorkSummary(e.target.value)}
              rows={4}
              placeholder="Beskriv arbeidet som faktisk er utført..."
              className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-5 text-white outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Tilleggsarbeid
              </label>
              <textarea
                value={additionalWork}
                onChange={(e) => setAdditionalWork(e.target.value)}
                rows={3}
                placeholder="Eventuelt arbeid utover avtalt omfang..."
                className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-5 text-white outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Avvik / merknader
              </label>
              <textarea
                value={deviations}
                onChange={(e) => setDeviations(e.target.value)}
                rows={3}
                placeholder="Registrer eventuelle avvik eller merknader..."
                className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-5 text-white outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black text-white">
              Kontroll etter utført arbeid
            </h4>
            <p className="mt-1 text-[10px] text-slate-500">
              Bekreft kontrollpunktene før arbeidet markeres ferdig.
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {[
                ["agreed_scope_completed", "Avtalte tiltak er utført"],
                ["visual_control_completed", "Visuell sluttkontroll er gjennomført"],
                ["documentation_completed", "Dokumentasjonen er komplett"],
                ["site_cleaned", "Arbeidsområdet er ferdigstilt og ryddet"],
              ].map(([key, label]) => {
                const typedKey = key as keyof CompletionControls;
                const checked = asBool(controls[typedKey]);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleControl(typedKey)}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                      checked
                        ? "border-emerald-500/30 bg-emerald-500/[0.07]"
                        : "border-slate-800 bg-slate-950/45"
                    }`}
                  >
                    <div
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg border ${
                        checked
                          ? "border-emerald-500/30 bg-emerald-500/10"
                          : "border-slate-700 bg-slate-900"
                      }`}
                    >
                      {checked && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-slate-300">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-white">
                  5 års garanti på utført arbeid
                </h4>
                <p className="mt-1 text-[10px] leading-4 text-slate-500">
                  Garantidato settes til ferdigstillelsesdato når arbeidet
                  markeres som ferdig.
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-[180px_1fr]">
                  <input
                    type="date"
                    value={warrantyStartDate}
                    onChange={(e) => setWarrantyStartDate(e.target.value)}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500/50"
                  />
                  <input
                    value={warrantyNotes}
                    onChange={(e) => setWarrantyNotes(e.target.value)}
                    placeholder="Eventuelle garantimerknader / forbehold..."
                    className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {!requiredControlsComplete && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3 text-[10px] leading-4 text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Alle fire kontrollpunktene må bekreftes før arbeidet kan markeres
              som ferdig.
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-slate-800/80 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => saveMain("utkast")}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs font-black text-slate-300 transition hover:border-slate-600 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Lagre utkast
            </button>

            <button
              type="button"
              onClick={() => saveMain("arbeid_ferdig")}
              disabled={saving || !requiredControlsComplete || !workSummary.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCircle2 className="h-4 w-4" />
              Marker arbeid ferdig
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
