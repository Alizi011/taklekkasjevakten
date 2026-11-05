import { useEffect, useMemo, useState } from "react";
import {
  Camera,
  CheckCircle2,
  FileAudio,
  Image,
  Loader2,
  Save,
  Upload,
  X,
} from "lucide-react";
import { apiAssetUrl, apiUrl } from "../../lib/api";

interface WorkCompletionItem {
  id: number;
  title: string;
  result_status?: string | null;
  result_tg?: string | null;
}

interface WorkDocumentation {
  id: number;
  inquiry_id: number;
  checklist_item_id?: string | null;
  documentation_phase?: number | null;
  work_completion_item_id?: number | null;
  custom_point_title?: string | null;
  photo_url?: string | null;
  audio_url?: string | null;
  audio_transcript?: string | null;
  caption_text?: string | null;
  created_at?: string | null;
}

type PhaseFilter = "all" | 1 | 2 | 3;
type UploadKind = "photo" | "audio";

interface PendingUpload {
  file: File;
  kind: UploadKind;
  phase: 2 | 3;
  workItemId: number | "";
  customPointTitle: string;
  caption: string;
}

interface Props {
  inquiryId: number;
}

const phaseLabel = (phase: number | null) => {
  if (phase === 1) return "1 · Før";
  if (phase === 2) return "2 · Under arbeid";
  if (phase === 3) return "3 · Resultat";
  return "Uten fase";
};

const resolvedPhase = (doc: WorkDocumentation): number | null => {
  const explicit = Number(doc.documentation_phase || 0);
  if ([1, 2, 3].includes(explicit)) return explicit;

  // Eldre lekkasjesøk-dokumentasjon hadde ikke documentation_phase.
  // Dersom den er knyttet til sjekkliste, er den faglig fase 1.
  if (doc.checklist_item_id) return 1;

  return null;
};

export default function WorkDocumentationWorkspace({ inquiryId }: Props) {
  const [items, setItems] = useState<WorkCompletionItem[]>([]);
  const [documents, setDocuments] = useState<WorkDocumentation[]>([]);
  const [filter, setFilter] = useState<PhaseFilter>("all");
  const [pending, setPending] = useState<PendingUpload | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingCaptionId, setSavingCaptionId] = useState<number | null>(null);
  const [captionDrafts, setCaptionDrafts] = useState<Record<number, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const [completionRes, photosRes] = await Promise.all([
        fetch(apiUrl(`/work_completion.php?inquiry_id=${inquiryId}`)),
        fetch(apiUrl(`/photos.php?inquiry_id=${inquiryId}`)),
      ]);

      const completionData = await completionRes.json();
      const photosData = await photosRes.json();

      if (!completionRes.ok || !completionData.success) {
        throw new Error(
          completionData.message || "Kunne ikke hente utbedringstiltak."
        );
      }

      if (!photosRes.ok || !photosData.success) {
        throw new Error(
          photosData.message || "Kunne ikke hente dokumentasjon."
        );
      }

      const nextItems: WorkCompletionItem[] = Array.isArray(completionData.items)
        ? completionData.items
        : [];

      const nextDocuments: WorkDocumentation[] = Array.isArray(photosData.photos)
        ? photosData.photos
        : [];

      setItems(nextItems);
      setDocuments(nextDocuments);
      setCaptionDrafts(
        Object.fromEntries(
          nextDocuments.map((doc) => [doc.id, doc.caption_text || ""])
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kunne ikke hente dokumentasjonen."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [inquiryId]);

  const counts = useMemo(() => {
    const base = { all: documents.length, 1: 0, 2: 0, 3: 0 };

    documents.forEach((doc) => {
      const phase = resolvedPhase(doc);
      if (phase === 1) base[1]++;
      if (phase === 2) base[2]++;
      if (phase === 3) base[3]++;
    });

    return base;
  }, [documents]);

  const visibleDocuments = useMemo(() => {
    if (filter === "all") return documents;

    return documents.filter((doc) => resolvedPhase(doc) === filter);
  }, [documents, filter]);

  const itemTitle = (itemId?: number | null) =>
    items.find((item) => item.id === Number(itemId || 0))?.title || "";

  const chooseFile = (kind: UploadKind, file: File) => {
    setPending({
      file,
      kind,
      phase: 2,
      workItemId: "",
      customPointTitle: "",
      caption: "",
    });
    setMessage("");
    setError("");
  };

  const savePendingUpload = async () => {
    if (!pending) return;

    setUploading(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("inquiry_id", String(inquiryId));
      formData.append("documentation_phase", String(pending.phase));
      formData.append(pending.kind, pending.file);

      if (pending.workItemId !== "") {
        formData.append(
          "work_completion_item_id",
          String(pending.workItemId)
        );
      }

      if (pending.customPointTitle.trim()) {
        formData.append(
          "custom_point_title",
          pending.customPointTitle.trim()
        );
      }

      if (pending.caption.trim()) {
        formData.append("caption_text", pending.caption.trim());
      }

      const res = await fetch(apiUrl("/photos.php"), {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke lagre dokumentasjonen.");
      }

      setPending(null);
      setMessage(
        pending.phase === 2
          ? "Dokumentasjon er lagret som 2 · Under arbeid."
          : "Dokumentasjon er lagret som 3 · Resultat."
      );
      await fetchData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kunne ikke lagre dokumentasjonen."
      );
    } finally {
      setUploading(false);
    }
  };

  const saveCaption = async (doc: WorkDocumentation) => {
    setSavingCaptionId(doc.id);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("photo_id", String(doc.id));
      formData.append("inquiry_id", String(inquiryId));
      formData.append("caption_text", captionDrafts[doc.id] || "");

      const phase = resolvedPhase(doc);
      if (phase) {
        formData.append("documentation_phase", String(phase));
      }

      if (doc.work_completion_item_id) {
        formData.append(
          "work_completion_item_id",
          String(doc.work_completion_item_id)
        );
      }

      if (doc.custom_point_title) {
        formData.append("custom_point_title", doc.custom_point_title);
      }

      const res = await fetch(apiUrl("/photos.php"), {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke lagre kommentaren.");
      }

      setMessage("Kommentaren er lagret.");
      await fetchData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunne ikke lagre kommentaren."
      );
    } finally {
      setSavingCaptionId(null);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-cyan-500/20 bg-[#0b0f17] px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
              <Image className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-cyan-400">
                Felles dokumentasjonsbibliotek
              </p>
              <h3 className="mt-1 text-base font-black text-white">
                Bilder, lyd og kommentarer
              </h3>
              <p className="mt-1 max-w-3xl text-[11px] leading-5 text-slate-400">
                Lekkasjesøk lagres automatisk som fase 1 · Før. Under
                utbedringen velger prosjektansvarlig bare mellom fase 2 · Under
                arbeid og fase 3 · Resultat.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-xs font-black text-blue-300 hover:bg-blue-500/15">
              <Camera className="h-4 w-4" />
              Nytt bilde
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) chooseFile("photo", file);
                  event.target.value = "";
                }}
              />
            </label>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-xs font-black text-violet-300 hover:bg-violet-500/15">
              <FileAudio className="h-4 w-4" />
              Ny lyd
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) chooseFile("audio", file);
                  event.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
      </section>

      {pending && (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-amber-400">
                Før lagring
              </p>
              <h4 className="mt-1 text-sm font-black text-white">
                Hva dokumenterer filen?
              </h4>
              <p className="mt-1 text-[10px] text-slate-500">
                {pending.file.name}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-[9px] font-black uppercase tracking-wider text-slate-500">
                Fase
              </label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  [2, "2 · Under arbeid"],
                  [3, "3 · Resultat"],
                ] as const).map(([phase, label]) => (
                  <button
                    key={phase}
                    type="button"
                    onClick={() =>
                      setPending((current) =>
                        current ? { ...current, phase } : current
                      )
                    }
                    className={`rounded-xl border px-3 py-3 text-[10px] font-black transition ${
                      pending.phase === phase
                        ? phase === 2
                          ? "border-blue-500/50 bg-blue-500/15 text-blue-300"
                          : "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                        : "border-slate-800 bg-[#08111d] text-slate-400"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[9px] font-black uppercase tracking-wider text-slate-500">
                Knytt til tiltak – valgfritt
              </label>
              <select
                value={pending.workItemId}
                onChange={(event) =>
                  setPending((current) =>
                    current
                      ? {
                          ...current,
                          workItemId:
                            event.target.value === ""
                              ? ""
                              : Number(event.target.value),
                        }
                      : current
                  )
                }
                className="w-full rounded-xl border border-slate-800 bg-[#08111d] px-3 py-3 text-xs text-slate-300 outline-none"
              >
                <option value="">Generell dokumentasjon</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-[9px] font-black uppercase tracking-wider text-slate-500">
                Kommentar – valgfritt
              </label>
              <input
                value={pending.caption}
                onChange={(event) =>
                  setPending((current) =>
                    current
                      ? { ...current, caption: event.target.value }
                      : current
                  )
                }
                placeholder="Hva viser bildet eller lydnotatet?"
                className="w-full rounded-xl border border-slate-800 bg-[#08111d] px-3 py-3 text-xs text-white outline-none focus:border-cyan-500/40"
              />
            </div>

            <div>
              <label className="mb-2 block text-[9px] font-black uppercase tracking-wider text-slate-500">
                Eget dokumentasjonspunkt – valgfritt
              </label>
              <input
                value={pending.customPointTitle}
                onChange={(event) =>
                  setPending((current) =>
                    current
                      ? {
                          ...current,
                          customPointTitle: event.target.value,
                        }
                      : current
                  )
                }
                placeholder="F.eks. ekstra kontroll av gesims"
                className="w-full rounded-xl border border-slate-800 bg-[#08111d] px-3 py-3 text-xs text-white outline-none focus:border-violet-500/40"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={savePendingUpload}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-xs font-black text-slate-950 hover:bg-amber-300 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? "Lagrer..." : "Lagre i bibliotek"}
            </button>
          </div>
        </section>
      )}

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

      <section className="rounded-2xl border border-slate-800 bg-[#0b0f17] p-4">
        <div className="flex flex-wrap gap-2">
          {([
            ["all", "Alle", counts.all],
            [1, "1 · Før", counts[1]],
            [2, "2 · Under arbeid", counts[2]],
            [3, "3 · Resultat", counts[3]],
          ] as const).map(([value, label, count]) => (
            <button
              key={String(value)}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-xl border px-3 py-2 text-[10px] font-black transition ${
                filter === value
                  ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                  : "border-slate-800 bg-[#08111d] text-slate-500 hover:text-slate-300"
              }`}
            >
              {label} · {count}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-xs text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
          Henter dokumentasjonsbibliotek...
        </div>
      ) : visibleDocuments.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-800 bg-[#0b0f17] py-12 text-center">
          <Image className="mx-auto h-6 w-6 text-slate-700" />
          <p className="mt-3 text-xs font-bold text-slate-400">
            Ingen dokumentasjon i dette filteret.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleDocuments.map((doc) => {
            const phase = resolvedPhase(doc);
            const relatedItem = itemTitle(doc.work_completion_item_id);

            return (
              <article
                key={doc.id}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0b0f17]"
              >
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${
                        doc.photo_url
                          ? "border-blue-500/20 bg-blue-500/10"
                          : "border-violet-500/20 bg-violet-500/10"
                      }`}
                    >
                      {doc.photo_url ? (
                        <Camera className="h-4 w-4 text-blue-400" />
                      ) : (
                        <FileAudio className="h-4 w-4 text-violet-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-black text-white">
                        {doc.photo_url ? "Bilde" : "Lydnotat"} #{doc.id}
                      </p>
                      <p className="mt-0.5 truncate text-[9px] text-slate-600">
                        {relatedItem ||
                          doc.custom_point_title ||
                          (doc.checklist_item_id
                            ? "Lekkasjesøk / kontrollpunkt"
                            : "Generell dokumentasjon")}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-lg border px-2 py-1 text-[9px] font-black ${
                      phase === 1
                        ? "border-amber-500/25 bg-amber-500/10 text-amber-300"
                        : phase === 2
                        ? "border-blue-500/25 bg-blue-500/10 text-blue-300"
                        : phase === 3
                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                        : "border-slate-700 bg-slate-900 text-slate-500"
                    }`}
                  >
                    {phaseLabel(phase)}
                  </span>
                </div>

                <div className="p-4">
                  {doc.photo_url && (
                    <a
                      href={apiAssetUrl(doc.photo_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="mb-3 block overflow-hidden rounded-xl border border-slate-800 bg-slate-950"
                    >
                      <img
                        src={apiAssetUrl(doc.photo_url)}
                        alt={doc.caption_text || "Dokumentasjonsbilde"}
                        className="h-48 w-full object-cover"
                      />
                    </a>
                  )}

                  {doc.audio_url && (
                    <audio
                      controls
                      preload="metadata"
                      src={apiAssetUrl(doc.audio_url)}
                      className="mb-3 w-full"
                    />
                  )}

                  <div className="flex gap-2">
                    <input
                      value={captionDrafts[doc.id] ?? ""}
                      onChange={(event) =>
                        setCaptionDrafts((current) => ({
                          ...current,
                          [doc.id]: event.target.value,
                        }))
                      }
                      placeholder="Kommentar..."
                      className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-[#08111d] px-3 py-2 text-[10px] text-white outline-none focus:border-cyan-500/40"
                    />
                    <button
                      type="button"
                      onClick={() => saveCaption(doc)}
                      disabled={savingCaptionId === doc.id}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-50"
                    >
                      {savingCaptionId === doc.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {doc.audio_transcript && (
                    <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-[9px] leading-4 text-slate-500">
                      {doc.audio_transcript}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-1.5 text-[9px] font-bold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Lagret i sakens dokumentasjonsbibliotek
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
