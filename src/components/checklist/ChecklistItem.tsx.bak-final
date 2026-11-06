import {
  AlertCircle,
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  Mic,
  Play,
  Save,
  ShieldAlert,
  Square,
  XCircle,
} from "lucide-react";

export type ChecklistStatus =
  | "tg0"
  | "tg1"
  | "tg2"
  | "tg3"
  | "ikke_aktuell";

export interface ChecklistItemData {
  id: string;
  title: string;
  info: string;
  status?: ChecklistStatus;
  note: string;
  photoUrl?: string;
  audioUrl?: string;
}

interface ChecklistItemProps {
  item: ChecklistItemData;
  index: number;
  isOpen: boolean;
  isSaved: boolean;
  isSaving: boolean;
  isRecording: boolean;
  onToggle: () => void;
  onStatusChange: (status: ChecklistStatus) => void;
  onNoteChange: (note: string) => void;
  onSave: () => void;
  onPhotoSelect: (file: File) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

const statusConfig: Record<
  ChecklistStatus,
  {
    label: string;
    button: string;
    compact: string;
    icon: typeof CheckCircle2;
  }
> = {
  tg0: {
    label: "TG0",
    button: "bg-emerald-500 text-slate-950",
    compact: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    icon: CheckCircle2,
  },
  tg1: {
    label: "TG1",
    button: "bg-amber-400 text-slate-950",
    compact: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    icon: AlertCircle,
  },
  tg2: {
    label: "TG2",
    button: "bg-orange-500 text-white",
    compact: "border-orange-500/30 bg-orange-500/10 text-orange-300",
    icon: AlertTriangle,
  },
  tg3: {
    label: "TG3",
    button: "bg-red-600 text-white",
    compact: "border-red-500/30 bg-red-500/10 text-red-300",
    icon: ShieldAlert,
  },
  ikke_aktuell: {
    label: "Ikke aktuell",
    button: "bg-slate-700 text-white",
    compact: "border-slate-700 bg-slate-800 text-slate-700",
    icon: XCircle,
  },
};

export default function ChecklistItem({
  item,
  index,
  isOpen,
  isSaved,
  isSaving,
  isRecording,
  onToggle,
  onStatusChange,
  onNoteChange,
  onSave,
  onPhotoSelect,
  onStartRecording,
  onStopRecording,
}: ChecklistItemProps) {
  const selected = item.status ? statusConfig[item.status] : null;
  const SelectedIcon = selected?.icon;
  const isExtra =
    item.id.includes("extra") || item.id.includes("custom");

  return (
    <article
      className={`overflow-hidden rounded-2xl border transition-colors ${
        isOpen
          ? "border-amber-400 bg-white shadow-sm"
          : isExtra
          ? "border-amber-200 bg-amber-50/40"
          : "border-slate-200 bg-slate-50 hover:border-slate-300"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3.5 text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-[10px] font-black ${
              isSaved
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            {String(index + 1).padStart(2, "0")}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4
                className={`text-xs font-black ${
                  isExtra ? "text-amber-700" : "text-slate-900"
                }`}
              >
                {item.title.replace(/^\d+\.\s*/, "")}
              </h4>

              {isSaved && (
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600">
                  Lagret
                </span>
              )}
            </div>

            {!isOpen && item.note && (
              <p className="mt-1 truncate text-[10px] text-slate-500">
                {item.note}
              </p>
            )}
          </div>

          {selected && SelectedIcon ? (
            <div
              className={`hidden sm:flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-black ${selected.compact}`}
            >
              <SelectedIcon className="h-3.5 w-3.5" />
              {selected.label}
            </div>
          ) : (
            <div className="hidden sm:flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-slate-500">
              Ikke kontrollert
            </div>
          )}

          {isOpen ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-slate-200 px-4 pb-4 pt-4">
          <div className="rounded-xl border-l-4 border-[#F5B800] bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-[#F5B800]">
              <Info className="h-3.5 w-3.5" />
              Byggforsk / TEK17 – hjelp
            </div>
            <p className="mt-1.5 text-[11px] leading-5 text-slate-700">
              {item.info}
            </p>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-[9px] font-black uppercase tracking-wider text-slate-500">
              Tilstandsgrad
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  "tg0",
                  "tg1",
                  "tg2",
                  "tg3",
                  "ikke_aktuell",
                ] as ChecklistStatus[]
              ).map((status) => {
                const config = statusConfig[status];
                const Icon = config.icon;
                const active = item.status === status;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onStatusChange(status)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-black transition-colors ${
                      active
                        ? config.button
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-950"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-[9px] font-black uppercase tracking-wider text-slate-500">
              Kommentar / observasjon
            </label>
            <textarea
              value={item.note}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder="Beskriv avvik, tilkomst, skade eller annen relevant observasjon..."
              className="min-h-[86px] w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-950 outline-none focus:border-amber-500"
            />
          </div>

          {(item.photoUrl || item.audioUrl) && (
            <div className="mt-3 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/60 p-3 sm:flex-row sm:items-center">
              {item.photoUrl && (
                <a
                  href={item.photoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-xs font-bold text-amber-700 hover:underline"
                >
                  <Camera className="h-4 w-4" />
                  Vis bilde
                </a>
              )}

              {item.audioUrl && (
                <div className="flex min-w-0 items-center gap-2">
                  <Play className="h-4 w-4 shrink-0 text-emerald-600" />
                  <audio
                    src={item.audioUrl}
                    controls
                    className="h-8 max-w-full"
                  />
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <label
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-extrabold text-amber-400 hover:bg-slate-100"
                title="Legg til bilde"
              >
                <Camera className="h-4 w-4" />
                Bilde
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onPhotoSelect(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>

              {isRecording ? (
                <button
                  type="button"
                  onClick={onStopRecording}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2.5 text-xs font-black text-white"
                >
                  <Square className="h-3.5 w-3.5" />
                  Stopp lyd
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onStartRecording}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-extrabold text-red-600 hover:bg-slate-100"
                >
                  <Mic className="h-4 w-4" />
                  Lydnotat
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#F5B800] px-4 py-2.5 text-xs font-black text-slate-950 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Lagre punkt
            </button>
          </div>
        </div>
      )}
    </article>
  );
}