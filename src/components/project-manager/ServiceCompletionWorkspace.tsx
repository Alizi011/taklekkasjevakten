import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileAudio,
  Loader2,
  Save,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { apiAssetUrl, apiUrl } from "../../lib/api";

type ItemStatus = "ikke_vurdert" | "utfort" | "delvis_utfort" | "ikke_utfort";
type ResultStatus =
  | "ikke_vurdert"
  | "utbedret"
  | "delvis_utbedret"
  | "ikke_utbedret"
  | "erstattet";
type ResultTg = "ikke_vurdert" | "TG0" | "TG1" | "TG2" | "TG3";

interface WorkItem {
  id?: number;
  source_checklist_item_id?: string | null;
  title: string;
  description?: string | null;
  item_status: ItemStatus;
  result_status?: ResultStatus;
  result_tg?: ResultTg;
  comment?: string | null;
}

interface WorkDocumentation {
  id: number;
  inquiry_id: number;
  checklist_item_id?: string | null;
  documentation_phase?: number | null;
  work_completion_item_id?: number | null;
  photo_url?: string | null;
  audio_url?: string | null;
  audio_transcript?: string | null;
  caption_text?: string | null;
  created_at?: string | null;
}

interface ChecklistRow {
  id: number | string;
  item_title?: string | null;
  status?: string | null;
  notes?: string | null;
  comment?: string | null;
}


interface CompletionData {
  id: number;
  status?: string | null;
  work_summary?: string | null;
  warranty_start_date?: string | null;
  warranty_notes?: string | null;
}

interface Controls {
  agreed_scope_completed?: number | boolean | null;
  visual_control_completed?: number | boolean | null;
  documentation_completed?: number | boolean | null;
  site_cleaned?: number | boolean | null;
}

interface Props {
  inquiryId: number;
  reportText?: string | null;
  employeeId?: number | null;
  employeeName?: string | null;
  onFinished?: () => void;
}

const boolValue = (value: unknown) => Boolean(Number(value));

function normalizeWorkItem(item: WorkItem): WorkItem {
  let resultStatus = item.result_status || "ikke_vurdert";
  let resultTg = item.result_tg || "ikke_vurdert";

  if (item.item_status === "utfort") {
    if (resultStatus === "ikke_vurdert") resultStatus = "utbedret";
    if (resultTg === "ikke_vurdert") {
      resultTg = resultStatus === "erstattet" ? "TG0" : "TG1";
    }
  }

  if (item.item_status === "delvis_utfort") {
    if (resultStatus === "ikke_vurdert") resultStatus = "delvis_utbedret";
    if (resultTg === "ikke_vurdert") resultTg = "TG2";
  }

  if (item.item_status === "ikke_utfort") {
    if (resultStatus === "ikke_vurdert") resultStatus = "ikke_utbedret";
    if (resultTg === "ikke_vurdert") resultTg = "TG3";
  }

  if (resultStatus === "erstattet" && resultTg === "ikke_vurdert") {
    resultTg = "TG0";
  }

  return {
    ...item,
    result_status: resultStatus,
    result_tg: resultTg,
  };
}

function extractRecommendedItems(source?: string | null): string[] {
  const text = String(source || "").replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const heading =
    /(?:^|\n)\s*(?:#+\s*)?(?:\d+[\.\)]?\s*)?(ANBEFALTE TILTAK|ANBEFALINGER|ANBEFALT VIDERE OPPFØLGING|VIDERE OPPFØLGING)\s*:?\s*\n/i;
  const match = heading.exec(text);

  let section = "";
  if (match) {
    const start = match.index + match[0].length;
    const rest = text.slice(start);
    const nextHeading = rest.search(
      /\n\s*(?:#+\s*)?(?:\d+[\.\)]?\s*)?[A-ZÆØÅ][A-ZÆØÅ0-9 /&().,\-]{3,}\s*:?\s*\n/
    );
    section = nextHeading >= 0 ? rest.slice(0, nextHeading) : rest;
  }

  const candidate = (section || text)
    .split("\n")
    .map((line) =>
      line
        .replace(/^\s*[-•*✓–—]\s*/, "")
        .replace(/^\s*\d+[\.\)]\s*/, "")
        .trim()
    )
    .filter(Boolean)
    .filter((line) => line.length >= 6)
    .filter(
      (line) =>
        !/^(faglig begrunnelse|konklusjon|sammendrag|videre anbefaling til kunde)$/i.test(
          line
        )
    );

  return Array.from(new Set(candidate)).slice(0, 12);
}

export default function ServiceCompletionWorkspace({
  inquiryId,
  reportText,
  employeeId = null,
  employeeName = null,
  onFinished,
}: Props) {
  const reportItems = useMemo(() => extractRecommendedItems(reportText), [reportText]);

  const [completion, setCompletion] = useState<CompletionData | null>(null);
  const [items, setItems] = useState<WorkItem[]>([]);
  const [controls, setControls] = useState<Controls>({});
  const [generalComment, setGeneralComment] = useState("");
  const [warrantyNotes, setWarrantyNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [documentation, setDocumentation] = useState<WorkDocumentation[]>([]);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [checklistRows, setChecklistRows] = useState<ChecklistRow[]>([]);
  const [pendingImage, setPendingImage] = useState<{
    itemIndex: number;
    file: File;
  } | null>(null);
  const [pendingAudio, setPendingAudio] = useState<{
    itemIndex: number;
    file: File;
  } | null>(null);
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  const sourceChecklistItems = (rows: ChecklistRow[]) =>
    rows.filter((row) =>
      ["tg1", "tg2", "tg3"].includes(
        String(row.status || "").toLowerCase()
      )
    );

  const normalizeText = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-zæøå0-9]+/gi, " ")
      .split(/\s+/)
      .filter((word) => word.length >= 4);

  const recommendationForTitle = (title: string): string => {
    const titleWords = new Set(normalizeText(title));
    if (titleWords.size === 0) return "";

    const matches = reportItems
      .map((recommendation) => {
        const recommendationWords = new Set(normalizeText(recommendation));
        let overlap = 0;
        titleWords.forEach((word) => {
          if (recommendationWords.has(word)) overlap++;
        });
        return { recommendation, overlap };
      })
      .filter((entry) => entry.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap);

    if (!matches.length) return "";

    const best = matches[0];
    const second = matches[1];

    if (best.overlap >= 2 && (!second || best.overlap > second.overlap)) {
      return best.recommendation;
    }

    return "";
  };

  const findUniqueChecklistMatch = (
    item: WorkItem,
    rows: ChecklistRow[]
  ): string | null => {
    if (item.source_checklist_item_id) {
      return item.source_checklist_item_id;
    }

    const itemWords = new Set(normalizeText(item.title));
    if (itemWords.size === 0) return null;

    const scored = sourceChecklistItems(rows)
      .map((row) => {
        const rowWords = new Set(
          normalizeText(
            `${row.item_title || ""} ${row.notes || ""} ${row.comment || ""}`
          )
        );

        let overlap = 0;
        itemWords.forEach((word) => {
          if (rowWords.has(word)) overlap++;
        });

        return { row, overlap };
      })
      .filter((entry) => entry.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap);

    if (scored.length === 0) return null;

    const best = scored[0];
    const second = scored[1];

    // Bare automatisk kobling når treffet er entydig.
    if (best.overlap >= 2 && (!second || best.overlap > second.overlap)) {
      return String(best.row.id);
    }

    return null;
  };

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        apiUrl(`/work_completion.php?inquiry_id=${inquiryId}`)
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke hente arbeidsstatus.");
      }

      const savedItems: WorkItem[] = Array.isArray(data.items)
        ? data.items.map((item: any) =>
            normalizeWorkItem({
              ...item,
              item_status: item.item_status || "ikke_vurdert",
              result_status: item.result_status || "ikke_vurdert",
              result_tg: item.result_tg || "ikke_vurdert",
            })
          )
        : [];

      const fallbackItems: WorkItem[] =
        reportItems.length > 0
          ? reportItems.map((title) => ({
              title,
              item_status: "ikke_vurdert",
              result_status: "ikke_vurdert",
              result_tg: "ikke_vurdert",
              comment: title,
            }))
          : [
              {
                title: "Utbedring i henhold til anbefalte tiltak i publisert rapport",
                item_status: "ikke_vurdert",
                result_status: "ikke_vurdert",
                result_tg: "ikke_vurdert",
                comment: "",
              },
            ];

      setCompletion(data.completion || null);
      setItems(savedItems.length > 0 ? savedItems : fallbackItems);
      setControls(data.controls || {});
      setGeneralComment(data.completion?.additional_work || "");
      setWarrantyNotes(data.completion?.warranty_notes || "");

      const [docsRes, checklistRes] = await Promise.all([
        fetch(apiUrl(`/photos.php?inquiry_id=${inquiryId}`)),
        fetch(apiUrl(`/checklists.php?inquiry_id=${inquiryId}`)),
      ]);

      const [docsData, checklistData] = await Promise.all([
        docsRes.json(),
        checklistRes.json(),
      ]);

      const nextDocumentation: WorkDocumentation[] =
        docsRes.ok && docsData.success && Array.isArray(docsData.photos)
          ? docsData.photos
          : [];

      const nextChecklistRows: ChecklistRow[] =
        checklistRes.ok &&
        checklistData.success &&
        Array.isArray(checklistData.checklists)
          ? checklistData.checklists
          : [];

      setDocumentation(nextDocumentation);
      setChecklistRows(nextChecklistRows);

      const deviationRows = sourceChecklistItems(nextChecklistRows);

      if (savedItems.length > 0) {
        setItems(
          savedItems.map((item) => {
            const linkedChecklistId =
              item.source_checklist_item_id ||
              findUniqueChecklistMatch(item, nextChecklistRows);
            const matchedRecommendation = recommendationForTitle(item.title);

            return {
              ...item,
              source_checklist_item_id: linkedChecklistId,
              comment:
                String(item.comment || "").trim() ||
                matchedRecommendation ||
                item.description ||
                "",
            };
          })
        );
      } else if (deviationRows.length > 0) {
        // Nye arbeidspunkter opprettes direkte fra kontrollpunktene som
        // ligger til grunn for Rapport 1. Dermed er fase-1-koblingen eksakt.
        setItems(
          deviationRows.map((row) => ({
            source_checklist_item_id: String(row.id),
            title: String(row.item_title || "Registrert avvik"),
            description:
              String(row.notes || row.comment || "").trim() || null,
            item_status: "ikke_vurdert",
            result_status: "ikke_vurdert",
            result_tg: "ikke_vurdert",
            comment:
              recommendationForTitle(String(row.item_title || "")) ||
              String(row.notes || row.comment || "").trim() ||
              "",
          }))
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunne ikke hente arbeidsstatus."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [inquiryId, reportItems.join("|")]);

  const patchItem = (index: number, patch: Partial<WorkItem>) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    );
  };

  const setExecutionStatus = (index: number, status: ItemStatus) => {
    if (status === "utfort") {
      // Standard ved utbedring/reparasjon: TG1.
      // Hvis prosjektansvarlig senere velger "Erstattet", settes TG0 automatisk.
      patchItem(index, {
        item_status: "utfort",
        result_status: "utbedret",
        result_tg: "TG1",
      });
      return;
    }

    if (status === "delvis_utfort") {
      patchItem(index, {
        item_status: "delvis_utfort",
        result_status: "delvis_utbedret",
        result_tg: "TG2",
      });
      return;
    }

    if (status === "ikke_utfort") {
      patchItem(index, {
        item_status: "ikke_utfort",
        result_status: "ikke_utbedret",
        result_tg: "TG3",
      });
      return;
    }

    patchItem(index, {
      item_status: status,
      result_status: "ikke_vurdert",
      result_tg: "ikke_vurdert",
    });
  };

  const setResultStatus = (index: number, status: ResultStatus) => {
    const automaticTg: ResultTg =
      status === "erstattet"
        ? "TG0"
        : status === "utbedret"
        ? "TG1"
        : status === "delvis_utbedret"
        ? "TG2"
        : status === "ikke_utbedret"
        ? "TG3"
        : "ikke_vurdert";

    patchItem(index, {
      result_status: status,
      result_tg: automaticTg,
    });
  };

  const toggleControl = (key: keyof Controls) => {
    setControls((current) => ({
      ...current,
      [key]: !boolValue(current[key]),
    }));
  };


  const documentationForItem = (
    item: WorkItem,
    phase?: 1 | 2 | 3
  ) =>
    documentation.filter((doc) => {
      const explicitPhase = Number(doc.documentation_phase || 0);
      const docPhase =
        explicitPhase || (doc.checklist_item_id ? 1 : 0);

      const phase1Match =
        docPhase === 1 &&
        Boolean(item.source_checklist_item_id) &&
        String(doc.checklist_item_id || "") ===
          String(item.source_checklist_item_id || "");

      const workMatch =
        [2, 3].includes(docPhase) &&
        Number(doc.work_completion_item_id || 0) === Number(item.id || 0);

      if (phase === 1) return phase1Match;
      if (phase === 2 || phase === 3) {
        return workMatch && docPhase === phase;
      }

      return phase1Match || workMatch;
    });

  const ensureItemId = async (
    item: WorkItem,
    itemIndex: number
  ): Promise<number> => {
    if (item.id) return item.id;

    const mainRes = await fetch(apiUrl("/work_completion.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_completion",
        completion_id: completion?.id || null,
        inquiry_id: inquiryId,
        work_type: "service",
        completed_at: null,
        completed_by_employee_id: employeeId,
        completed_by_name: employeeName,
        work_summary: "Arbeid registrert mot anbefalte tiltak i publisert rapport.",
        additional_work: generalComment || null,
        deviations: null,
        warranty_years: 5,
        warranty_start_date: completion?.warranty_start_date || null,
        warranty_notes: warrantyNotes || null,
        status: "utkast",
      }),
    });

    const mainData = await mainRes.json();
    if (!mainRes.ok || !mainData.success) {
      throw new Error(mainData.message || "Kunne ikke opprette arbeidsutkast.");
    }

    const completionId = Number(mainData.completion_id || completion?.id || 0);
    if (!completionId) throw new Error("Mangler completion_id.");

    const itemsRes = await fetch(apiUrl("/work_completion.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_items",
        completion_id: completionId,
        items: items.map((rawItem, index) => {
          const normalized = normalizeWorkItem(rawItem);
          return {
            source_checklist_item_id:
              normalized.source_checklist_item_id || null,
            title: normalized.title,
            description: normalized.description || null,
            item_status: normalized.item_status,
            result_status: normalized.result_status || "ikke_vurdert",
            result_tg: normalized.result_tg || "ikke_vurdert",
            comment: normalized.comment || null,
            sort_order: index + 1,
          };
        }),
      }),
    });

    const itemsData = await itemsRes.json();
    if (!itemsRes.ok || !itemsData.success) {
      throw new Error(itemsData.message || "Kunne ikke lagre tiltaket.");
    }

    const refreshRes = await fetch(
      apiUrl(`/work_completion.php?inquiry_id=${inquiryId}`)
    );
    const refreshData = await refreshRes.json();

    if (!refreshRes.ok || !refreshData.success || !Array.isArray(refreshData.items)) {
      throw new Error("Kunne ikke hente lagret tiltak etter opprettelse.");
    }

    const current = items[itemIndex];
    const savedItem = refreshData.items.find((candidate: WorkItem) => {
      if (
        current.source_checklist_item_id &&
        candidate.source_checklist_item_id
      ) {
        return (
          String(candidate.source_checklist_item_id) ===
          String(current.source_checklist_item_id)
        );
      }

      return String(candidate.title || "").trim() === String(current.title || "").trim();
    });

    const savedId = Number(savedItem?.id || 0);
    if (!savedId) {
      throw new Error("Kunne ikke finne lagret ID for tiltaket.");
    }

    setCompletion(refreshData.completion || { id: completionId });
    patchItem(itemIndex, { id: savedId });

    return savedId;
  };

  const uploadForItem = async (
    item: WorkItem,
    itemIndex: number,
    phase: 2 | 3,
    kind: "photo" | "audio",
    file: File
  ) => {
    const key = `${item.id || `new-${itemIndex}`}-${phase}-${kind}`;
    setUploadingKey(key);
    setMessage("");
    setError("");

    try {
      const itemId = await ensureItemId(item, itemIndex);

      const formData = new FormData();
      formData.append("inquiry_id", String(inquiryId));
      formData.append("work_completion_item_id", String(itemId));
      formData.append("documentation_phase", String(phase));
      formData.append(kind, file);

      const res = await fetch(apiUrl("/photos.php"), {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke laste opp dokumentasjon.");
      }

      setMessage(
        phase === 2
          ? "Dokumentasjon under arbeid er lagret."
          : "Resultatdokumentasjon er lagret."
      );

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kunne ikke laste opp dokumentasjonen."
      );
    } finally {
      setUploadingKey(null);
    }
  };

  const save = async (finish: boolean) => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const completedAt = finish
        ? new Date().toISOString().slice(0, 19).replace("T", " ")
        : null;
      const warrantyStartDate = finish
        ? new Date().toISOString().slice(0, 10)
        : completion?.warranty_start_date || null;

      const completedTitles = items
        .filter((item) => item.item_status === "utfort")
        .map((item) => item.title);

      const mainRes = await fetch(apiUrl("/work_completion.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_completion",
          completion_id: completion?.id || null,
          inquiry_id: inquiryId,
          work_type: "service",
          completed_at: completedAt,
          completed_by_employee_id: employeeId,
          completed_by_name: employeeName,
          work_summary:
            completedTitles.length > 0
              ? completedTitles.join("\n")
              : "Arbeid registrert mot anbefalte tiltak i publisert rapport.",
          additional_work: generalComment || null,
          deviations:
            items.some(
              (item) =>
                item.item_status === "delvis_utfort" ||
                item.item_status === "ikke_utfort"
            )
              ? "Se tiltaksposter med status delvis eller ikke utført."
              : null,
          warranty_years: 5,
          warranty_start_date: warrantyStartDate,
          warranty_notes: warrantyNotes || null,
          status: finish ? "arbeid_ferdig" : "utkast",
        }),
      });

      const mainData = await mainRes.json();
      if (!mainRes.ok || !mainData.success) {
        throw new Error(mainData.message || "Kunne ikke lagre arbeidet.");
      }

      const completionId = Number(mainData.completion_id || completion?.id || 0);
      if (!completionId) throw new Error("Mangler completion_id.");

      const itemsRes = await fetch(apiUrl("/work_completion.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_items",
          completion_id: completionId,
          items: items.map((rawItem, index) => {
            const item = normalizeWorkItem(rawItem);

            return {
              source_checklist_item_id:
                item.source_checklist_item_id || null,
              title: item.title,
              description: item.description || null,
              item_status: item.item_status,
              result_status: item.result_status || "ikke_vurdert",
              result_tg: item.result_tg || "ikke_vurdert",
              comment: item.comment || null,
              sort_order: index + 1,
            };
          }),
        }),
      });

      const itemsData = await itemsRes.json();
      if (!itemsRes.ok || !itemsData.success) {
        throw new Error(itemsData.message || "Kunne ikke lagre tiltakene.");
      }

      const controlsRes = await fetch(apiUrl("/work_completion.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_controls",
          completion_id: completionId,
          agreed_scope_completed: boolValue(controls.agreed_scope_completed),
          visual_control_completed: boolValue(controls.visual_control_completed),
          documentation_completed: boolValue(controls.documentation_completed),
          site_cleaned: boolValue(controls.site_cleaned),
          functional_control_completed: null,
          functional_control_not_applicable: true,
          deviations_found: items.some(
            (item) =>
              item.item_status === "delvis_utfort" ||
              item.item_status === "ikke_utfort"
          ),
          deviations_details: null,
          unforeseen_conditions: false,
          work_changed_from_offer: false,
          further_action_recommended: false,
        }),
      });

      const controlsData = await controlsRes.json();
      if (!controlsRes.ok || !controlsData.success) {
        throw new Error(
          controlsData.message || "Kunne ikke lagre sluttkontrollen."
        );
      }

      setMessage(
        finish
          ? "Arbeidet er ferdigstilt. Du kan fortsette til dokumentasjon."
          : "Arbeidet er lagret."
      );

      await load();

      if (finish) onFinished?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke lagre arbeidet.");
    } finally {
      setSaving(false);
    }
  };

  const normalizedItems = items.map(normalizeWorkItem);

  const incompleteItems = normalizedItems.filter(
    (item) =>
      item.item_status === "ikke_vurdert" ||
      item.result_status === "ikke_vurdert" ||
      item.result_tg === "ikke_vurdert"
  );

  const allItemsAssessed =
    normalizedItems.length > 0 && incompleteItems.length === 0;

  const controlsComplete = [
    controls.agreed_scope_completed,
    controls.visual_control_completed,
    controls.documentation_completed,
    controls.site_cleaned,
  ].every(boolValue);

  const completedCount = normalizedItems.filter(
    (item) =>
      item.item_status !== "ikke_vurdert" &&
      item.result_status !== "ikke_vurdert" &&
      item.result_tg !== "ikke_vurdert"
  ).length;

  const progressPercent = normalizedItems.length
    ? Math.round((completedCount / normalizedItems.length) * 100)
    : 0;

  const isItemComplete = (item: WorkItem) => {
    const normalized = normalizeWorkItem(item);
    return (
      normalized.item_status !== "ikke_vurdert" &&
      normalized.result_status !== "ikke_vurdert" &&
      normalized.result_tg !== "ikke_vurdert"
    );
  };

  const itemStatusLabel = (item: WorkItem) => {
    if (item.item_status === "utfort") return "Utført";
    if (item.item_status === "delvis_utfort") return "Delvis";
    if (item.item_status === "ikke_utfort") return "Ikke utført";
    return "Ikke startet";
  };

  const itemStatusClass = (item: WorkItem) => {
    if (item.item_status === "utfort") {
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    }
    if (item.item_status === "delvis_utfort") {
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    }
    if (item.item_status === "ikke_utfort") {
      return "border-red-500/30 bg-red-500/10 text-red-300";
    }
    return "border-slate-800 bg-slate-900 text-slate-500";
  };

  const goToItem = (index: number) => {
    if (index < 0 || index >= items.length) return;
    setPendingImage(null);
    setPendingAudio(null);
    setActiveItemIndex(index);
  };

  const goNext = () => {
    if (activeItemIndex < items.length - 1) {
      goToItem(activeItemIndex + 1);
    }
  };

  const goPrevious = () => {
    if (activeItemIndex > 0) {
      goToItem(activeItemIndex - 1);
    }
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-blue-500/25 bg-[#0b0f17]">
      <div className="border-b border-slate-800/80 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl border border-blue-500/20 bg-blue-500/10 p-2">
              <Wrench className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Utførelse etter publisert rapport
              </h3>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-400">
                Gå gjennom ett tiltak om gangen. Ferdige tiltak kollapses automatisk
                til en kompakt oversikt.
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[10px] font-black text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            5 års garanti
          </span>
        </div>

        {!loading && items.length > 0 && (
          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Fremdrift
                </p>
                <p className="mt-1 text-xs font-bold text-slate-200">
                  {completedCount} av {items.length} tiltak ferdig
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-white">{progressPercent}%</p>
                <p className="text-[9px] text-slate-600">fullført</p>
              </div>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-900">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-xs text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
          Henter tiltak...
        </div>
      ) : (
        <div className="space-y-5 p-5 sm:p-6">
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

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Tiltak fra rapporten
                </p>
                <p className="mt-1 text-[10px] text-slate-600">
                  Åpne et tidligere punkt når som helst for å endre registreringen.
                </p>
              </div>
              <span className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-[9px] font-black text-slate-500">
                Punkt {Math.min(activeItemIndex + 1, items.length)} av {items.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {items.map((item, index) => {
                const active = index === activeItemIndex;
                const normalized = normalizeWorkItem(item);
                const docs = documentationForItem(item);
                const complete = isItemComplete(item);
                const currentPendingImage =
                  pendingImage?.itemIndex === index ? pendingImage : null;
                const currentPendingAudio =
                  pendingAudio?.itemIndex === index ? pendingAudio : null;

                return (
                  <article
                    key={`${item.title}-${index}`}
                    className={`overflow-hidden rounded-2xl border transition-all ${
                      active
                        ? "border-blue-500/45 bg-[#0d1522] shadow-[0_0_0_1px_rgba(59,130,246,0.04)]"
                        : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => goToItem(index)}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left sm:px-5"
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-black ${
                          complete
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : active
                            ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                            : "border-slate-700 bg-slate-900 text-slate-500"
                        }`}
                      >
                        {complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-black text-white sm:text-xs">
                          {item.title}
                        </p>
                        {item.description && active && (
                          <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-slate-500">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="hidden items-center gap-2 sm:flex">
                        <span
                          className={`rounded-lg border px-2.5 py-1.5 text-[9px] font-black ${itemStatusClass(
                            item
                          )}`}
                        >
                          {itemStatusLabel(item)}
                        </span>
                        {normalized.result_tg !== "ikke_vurdert" && (
                          <span className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[9px] font-black text-slate-300">
                            {normalized.result_tg}
                          </span>
                        )}
                        {docs.length > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-[9px] font-bold text-slate-500">
                            <Camera className="h-3 w-3" />
                            {docs.length}
                          </span>
                        )}
                      </div>

                      {active ? (
                        <ChevronUp className="h-4 w-4 shrink-0 text-blue-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-600" />
                      )}
                    </button>

                    {active && (
                      <div className="border-t border-slate-800/80 px-4 py-5 sm:px-5">
                        {!item.source_checklist_item_id && checklistRows.length > 0 && (
                          <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3">
                            <p className="mb-2 text-[9px] font-black uppercase tracking-wider text-amber-300">
                              Kobling til Rapport 1
                            </p>
                            <select
                              value=""
                              onChange={(event) => {
                                if (!event.target.value) return;
                                patchItem(index, {
                                  source_checklist_item_id: event.target.value,
                                });
                              }}
                              className="w-full max-w-xl rounded-lg border border-amber-500/30 bg-[#0b0f17] px-3 py-2.5 text-[10px] font-bold text-amber-200 outline-none"
                            >
                              <option value="">Knytt til kontrollpunkt fra Rapport 1</option>
                              {sourceChecklistItems(checklistRows).map((row) => (
                                <option key={String(row.id)} value={String(row.id)}>
                                  {row.item_title || `Kontrollpunkt ${row.id}`}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="grid gap-5 lg:grid-cols-2">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                              1. Hva ble utført?
                            </p>
                            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                              {[
                                ["utfort", "Utført"],
                                ["delvis_utfort", "Delvis"],
                                ["ikke_utfort", "Ikke utført"],
                              ].map(([value, label]) => {
                                const selected = item.item_status === value;
                                return (
                                  <button
                                    key={value}
                                    type="button"
                                    onClick={() =>
                                      setExecutionStatus(index, value as ItemStatus)
                                    }
                                    className={`rounded-xl border px-3 py-3 text-[10px] font-black transition ${
                                      selected
                                        ? value === "utfort"
                                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                                          : value === "delvis_utfort"
                                          ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                                          : "border-red-500/40 bg-red-500/10 text-red-300"
                                        : "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-600 hover:text-white"
                                    }`}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                              2. Ny tilstandsgrad
                            </p>
                            <div className="mt-2 grid grid-cols-4 gap-2">
                              {["TG0", "TG1", "TG2", "TG3"].map((value) => {
                                const selected = normalized.result_tg === value;
                                return (
                                  <button
                                    key={value}
                                    type="button"
                                    disabled={item.item_status === "ikke_vurdert"}
                                    onClick={() =>
                                      patchItem(index, { result_tg: value as ResultTg })
                                    }
                                    className={`rounded-xl border px-2 py-3 text-[10px] font-black transition disabled:cursor-not-allowed disabled:opacity-35 ${
                                      selected
                                        ? value === "TG0"
                                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                                          : value === "TG1"
                                          ? "border-lime-500/40 bg-lime-500/10 text-lime-300"
                                          : value === "TG2"
                                          ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                                          : "border-red-500/40 bg-red-500/10 text-red-300"
                                        : "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-600 hover:text-white"
                                    }`}
                                  >
                                    {value}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {item.item_status !== "ikke_vurdert" && (
                          <div className="mt-5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                                3. Resultat etter utbedring
                              </p>
                              <span className="text-[9px] text-slate-600">
                                Valget foreslår TG automatisk, men TG kan overstyres.
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {[
                                ["utbedret", "Utbedret"],
                                ["delvis_utbedret", "Delvis utbedret"],
                                ["ikke_utbedret", "Ikke utbedret"],
                                ["erstattet", "Erstattet"],
                              ].map(([value, label]) => {
                                const selected = normalized.result_status === value;
                                return (
                                  <button
                                    key={value}
                                    type="button"
                                    onClick={() =>
                                      setResultStatus(index, value as ResultStatus)
                                    }
                                    className={`rounded-lg border px-3 py-2 text-[9px] font-black transition ${
                                      selected
                                        ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                                        : "border-slate-700 bg-slate-950 text-slate-400 hover:text-white"
                                    }`}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {item.item_status !== "ikke_vurdert" &&
                          normalized.result_tg !== "ikke_vurdert" && (
                            <div className="mt-5">
                              <label className="mb-2 block text-[9px] font-black uppercase tracking-wider text-slate-500">
                                4. Kommentar <span className="font-medium normal-case text-slate-700">– valgfritt</span>
                              </label>
                              <textarea
                                value={item.comment || ""}
                                onChange={(event) =>
                                  patchItem(index, { comment: event.target.value })
                                }
                                rows={3}
                                placeholder="Beskriv kort hva som er gjort, eventuelle avvik eller forbehold..."
                                className="w-full resize-y rounded-xl border border-slate-800 bg-[#08111d] px-3 py-3 text-[11px] leading-5 text-white outline-none focus:border-blue-500/50"
                              />
                            </div>
                          )}

                        {item.item_status !== "ikke_vurdert" &&
                          normalized.result_tg !== "ikke_vurdert" && (
                            <div className="mt-5 border-t border-slate-800/80 pt-5">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-wider text-cyan-400">
                                    5. Dokumentasjon
                                  </p>
                                  <p className="mt-1 text-[9px] text-slate-600">
                                    Før-bilder hentes fra Rapport 1. Nye bilder legges som under arbeid eller resultat.
                                  </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <label
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-[10px] font-black text-blue-300 transition hover:bg-blue-500/15" 
                                  >
                                    <Camera className="h-3.5 w-3.5" />
                                    + Bilde
                                    <input
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      className="hidden"
                                      disabled={Boolean(uploadingKey)}
                                      onChange={(event) => {
                                        const file = event.target.files?.[0];
                                        if (file) {
                                          setPendingImage({ itemIndex: index, file });
                                        }
                                        event.target.value = "";
                                      }}
                                    />
                                  </label>

                                  <label
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-[10px] font-black text-violet-300 transition hover:bg-violet-500/15" 
                                  >
                                    <FileAudio className="h-3.5 w-3.5" />
                                    + Lyd
                                    <input
                                      type="file"
                                      accept="audio/*"
                                      className="hidden"
                                      disabled={Boolean(uploadingKey)}
                                      onChange={(event) => {
                                        const file = event.target.files?.[0];
                                        if (file) {
                                          setPendingAudio({ itemIndex: index, file });
                                        }
                                        event.target.value = "";
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>

                              {currentPendingImage && (() => {
                                const pendingFile = currentPendingImage.file;

                                return (
                                  <div className="mt-3 flex flex-col gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.05] p-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-black text-white">Kategoriser bildet</p>
                                      <p className="mt-0.5 truncate text-[9px] text-slate-500">
                                        {pendingFile.name}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        disabled={Boolean(uploadingKey)}
                                        onClick={async () => {
                                          setPendingImage(null);
                                          await uploadForItem(item, index, 2, "photo", pendingFile);
                                        }}
                                        className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[9px] font-black text-amber-300 disabled:opacity-50"
                                      >
                                        Under arbeid
                                      </button>
                                      <button
                                        type="button"
                                        disabled={Boolean(uploadingKey)}
                                        onClick={async () => {
                                          setPendingImage(null);
                                          await uploadForItem(item, index, 3, "photo", pendingFile);
                                        }}
                                        className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[9px] font-black text-emerald-300 disabled:opacity-50"
                                      >
                                        Resultat
                                      </button>
                                      <button
                                        type="button"
                                        disabled={Boolean(uploadingKey)}
                                        onClick={() => setPendingImage(null)}
                                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[9px] font-black text-slate-400 disabled:opacity-50"
                                      >
                                        Avbryt
                                      </button>
                                    </div>
                                  </div>
                                );
                              })()}

                              {currentPendingAudio && (() => {
                                const pendingFile = currentPendingAudio.file;

                                return (
                                  <div className="mt-3 flex flex-col gap-3 rounded-xl border border-violet-500/20 bg-violet-500/[0.05] p-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-black text-white">Kategoriser lydopptaket</p>
                                      <p className="mt-0.5 truncate text-[9px] text-slate-500">
                                        {pendingFile.name}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        disabled={Boolean(uploadingKey)}
                                        onClick={async () => {
                                          setPendingAudio(null);
                                          await uploadForItem(item, index, 2, "audio", pendingFile);
                                        }}
                                        className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[9px] font-black text-amber-300 disabled:opacity-50"
                                      >
                                        Under arbeid
                                      </button>
                                      <button
                                        type="button"
                                        disabled={Boolean(uploadingKey)}
                                        onClick={async () => {
                                          setPendingAudio(null);
                                          await uploadForItem(item, index, 3, "audio", pendingFile);
                                        }}
                                        className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[9px] font-black text-emerald-300 disabled:opacity-50"
                                      >
                                        Resultat
                                      </button>
                                      <button
                                        type="button"
                                        disabled={Boolean(uploadingKey)}
                                        onClick={() => setPendingAudio(null)}
                                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[9px] font-black text-slate-400 disabled:opacity-50"
                                      >
                                        Avbryt
                                      </button>
                                    </div>
                                  </div>
                                );
                              })()}

                              {docs.length > 0 ? (
                                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                  {docs.map((doc) => {
                                    const phase =
                                      Number(doc.documentation_phase || 0) ||
                                      (doc.checklist_item_id ? 1 : 0);
                                    const phaseLabel =
                                      phase === 1
                                        ? "Før · Rapport 1"
                                        : phase === 2
                                        ? "Under arbeid"
                                        : phase === 3
                                        ? "Resultat"
                                        : "Uten kategori";

                                    const assetUrl = apiAssetUrl(
                                      String(doc.photo_url || doc.audio_url || "")
                                    );

                                    return (
                                      <a
                                        key={doc.id}
                                        href={assetUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="group overflow-hidden rounded-xl border border-slate-800 bg-[#08111d] transition hover:border-slate-700"
                                      >
                                        {doc.photo_url ? (
                                          <div className="aspect-[16/9] overflow-hidden bg-slate-950">
                                            <img
                                              src={assetUrl}
                                              alt={doc.caption_text || phaseLabel}
                                              className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                                            />
                                          </div>
                                        ) : (
                                          <div className="flex aspect-[16/9] items-center justify-center bg-violet-500/[0.05]">
                                            <div className="grid h-11 w-11 place-items-center rounded-full border border-violet-500/25 bg-violet-500/10">
                                              <FileAudio className="h-5 w-5 text-violet-400" />
                                            </div>
                                          </div>
                                        )}

                                        <div className="p-3">
                                          <div className="flex items-center justify-between gap-2">
                                            <span className={`rounded-md border px-2 py-1 text-[8px] font-black ${
                                              phase === 1
                                                ? "border-blue-500/25 bg-blue-500/10 text-blue-300"
                                                : phase === 2
                                                ? "border-amber-500/25 bg-amber-500/10 text-amber-300"
                                                : "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                                            }`}>
                                              {phaseLabel}
                                            </span>
                                            {doc.photo_url ? (
                                              <Camera className="h-3.5 w-3.5 text-slate-600" />
                                            ) : (
                                              <FileAudio className="h-3.5 w-3.5 text-violet-400" />
                                            )}
                                          </div>

                                          <p className="mt-2 line-clamp-2 text-[9px] leading-4 text-slate-400">
                                            {doc.caption_text ||
                                              (doc.photo_url ? "Bildedokumentasjon" : "Lydnotat")}
                                          </p>
                                        </div>
                                      </a>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="mt-3 text-[9px] text-slate-700">
                                  {item.source_checklist_item_id
                                    ? "Ingen dokumentasjon registrert på dette tiltaket ennå."
                                    : "Knytt tiltaket til kontrollpunktet fra Rapport 1 for å hente før-bildene."}
                                </p>
                              )}
                            </div>
                          )}

                        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-800/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <button
                            type="button"
                            onClick={goPrevious}
                            disabled={activeItemIndex === 0}
                            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-[10px] font-black text-slate-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            ← Forrige
                          </button>

                          <div className="flex items-center gap-3 sm:ml-auto">
                            {!complete && (
                              <span className="hidden text-[9px] text-slate-600 md:inline">
                                Velg utførelse og TG før punktet regnes som ferdig.
                              </span>
                            )}
                            {activeItemIndex < items.length - 1 ? (
                              <button
                                type="button"
                                onClick={goNext}
                                disabled={!complete}
                                className="flex-1 rounded-xl bg-blue-600 px-5 py-2.5 text-[10px] font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-35 sm:flex-none"
                              >
                                Neste tiltak →
                              </button>
                            ) : (
                              <span className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-2.5 text-[10px] font-black text-emerald-300">
                                Siste tiltak
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>

          {allItemsAssessed && (
            <div className="space-y-4 rounded-2xl border border-blue-500/20 bg-blue-500/[0.025] p-4 sm:p-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-blue-300">
                  Alle tiltak er gjennomgått
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Fullfør sluttkontrollen før arbeidet markeres ferdig.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Generell kommentar – valgfritt
                </label>
                <textarea
                  value={generalComment}
                  onChange={(e) => setGeneralComment(e.target.value)}
                  rows={2}
                  placeholder="Bare dersom det er noe prosjektansvarlig ønsker å kommentere..."
                  className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-5 text-white outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="border-t border-slate-800/80 pt-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Sluttkontroll
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[
                    ["agreed_scope_completed", "Avtalte tiltak er kontrollert"],
                    ["visual_control_completed", "Visuell sluttkontroll utført"],
                    ["documentation_completed", "Dokumentasjon er komplett"],
                    ["site_cleaned", "Arbeidsområdet er ferdigstilt"],
                  ].map(([key, label]) => {
                    const typedKey = key as keyof Controls;
                    const checked = boolValue(controls[typedKey]);

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleControl(typedKey)}
                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                          checked
                            ? "border-emerald-500/30 bg-emerald-500/[0.06]"
                            : "border-slate-800 bg-slate-950/45"
                        }`}
                      >
                        <CheckCircle2
                          className={`h-4 w-4 shrink-0 ${
                            checked ? "text-emerald-400" : "text-slate-700"
                          }`}
                        />
                        <span className="text-[11px] font-bold text-slate-300">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-white">5 års garanti på utført arbeid</p>
                    <p className="mt-1 text-[10px] leading-4 text-slate-500">
                      Garantistart settes automatisk til datoen arbeidet markeres ferdig.
                    </p>
                    <input
                      value={warrantyNotes}
                      onChange={(e) => setWarrantyNotes(e.target.value)}
                      placeholder="Eventuelle garantimerknader / forbehold..."
                      className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-[11px] text-white outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {(!allItemsAssessed || !controlsComplete) && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3 text-[10px] leading-4 text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                {!allItemsAssessed && (
                  <p>
                    {incompleteItems.length} av {items.length} tiltak mangler ferdig vurdering.
                  </p>
                )}
                {allItemsAssessed && !controlsComplete && (
                  <p>Bekreft alle fire punktene i sluttkontrollen.</p>
                )}
              </div>
            </div>
          )}

          <div className="sticky bottom-3 z-20 -mx-1 flex flex-col gap-2 rounded-2xl border border-slate-800 bg-[#0b0f17]/95 p-3 shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="hidden sm:block">
              <p className="text-[10px] font-black text-slate-300">
                {allItemsAssessed
                  ? "Tiltakene er ferdig vurdert"
                  : `${completedCount} av ${items.length} tiltak ferdig`}
              </p>
              <p className="mt-0.5 text-[9px] text-slate-600">
                Lagre utkast når du vil fortsette senere.
              </p>
            </div>

            <div className="flex gap-2 sm:ml-auto">
              <button
                type="button"
                onClick={() => save(false)}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs font-black text-slate-300 transition hover:border-slate-600 disabled:opacity-50 sm:flex-none"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Lagre
              </button>

              <button
                type="button"
                onClick={() => save(true)}
                disabled={saving || !allItemsAssessed || !controlsComplete}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-35 sm:flex-none"
              >
                <CheckCircle2 className="h-4 w-4" />
                Marker arbeid ferdig
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
