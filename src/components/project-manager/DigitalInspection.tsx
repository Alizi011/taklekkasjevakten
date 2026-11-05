import {
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Loader2,
  Sparkles,
  Video,
} from "lucide-react";

export interface DigitalInspectionSlotDraft {
  date: string;
  start_time: string;
  end_time: string;
  note: string;
}

interface DigitalInspectionProps {
  comment: string;
  onCommentChange: (value: string) => void;

  slots: DigitalInspectionSlotDraft[];
  selectedSlotKeys: string[];
  slotKey: (slot: DigitalInspectionSlotDraft) => string;
  onToggleSlot: (slot: DigitalInspectionSlotDraft) => void;
  onSlotChange: (
    index: number,
    patch: Partial<DigitalInspectionSlotDraft>
  ) => void;
  onResetSlots: () => void;
  onSaveSlots: () => void;

  loadingSlots?: boolean;
  savingSlots?: boolean;
  slotError?: string;
  slotMessage?: string;

  appointmentLabel?: string | null;
  onOpenVideo?: () => void;

  onChooseService: (
    service: "lekkasjesok" | "takkontroll" | "service" | "avsluttet"
  ) => void;
  savingAssessment?: boolean;
  assessmentError?: string;
  assessmentMessage?: string;
}

export default function DigitalInspection({
  comment,
  onCommentChange,
  slots,
  selectedSlotKeys,
  slotKey,
  onToggleSlot,
  onSlotChange,
  onResetSlots,
  onSaveSlots,
  loadingSlots = false,
  savingSlots = false,
  slotError,
  slotMessage,
  appointmentLabel,
  onOpenVideo,
  onChooseService,
  savingAssessment = false,
  assessmentError,
  assessmentMessage,
}: DigitalInspectionProps) {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-5 md:p-6">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-amber-400" />
              <h3 className="text-base font-black text-white">
                Digital befaring
              </h3>
            </div>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              Foreslå tidspunkt, gjennomfør videobefaring og dokumenter vurderingen.
            </p>
          </div>

          {appointmentLabel && (
            <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] font-extrabold text-emerald-300">
              <CalendarCheck className="h-4 w-4" />
              {appointmentLabel}
            </span>
          )}
        </div>

        {onOpenVideo && (
          <button
            type="button"
            onClick={onOpenVideo}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#F5B800] px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-400"
          >
            <Video className="h-4 w-4" />
            Åpne videobefaring
          </button>
        )}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-5 md:p-6">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-amber-400" />
              <h3 className="text-base font-black text-white">
                Foreslå tidspunkt
              </h3>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Velg 3–4 tidspunkt som kunden kan velge mellom.
            </p>
          </div>

          <button
            type="button"
            onClick={onResetSlots}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] font-extrabold text-slate-300 hover:bg-slate-800"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Nye forslag
          </button>
        </div>

        {slotError && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
            {slotError}
          </div>
        )}

        {slotMessage && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
            {slotMessage}
          </div>
        )}

        {loadingSlots ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Henter tidspunkt...
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {slots.map((slot, index) => {
              const key = slotKey(slot);
              const selected = selectedSlotKeys.includes(key);

              return (
                <div
                  key={`${key}-${index}`}
                  className={`rounded-2xl border p-4 ${
                    selected
                      ? "border-amber-500/40 bg-amber-500/[0.05]"
                      : "border-slate-800 bg-slate-950/55"
                  }`}
                >
                  <label className="mb-3 flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleSlot(slot)}
                      className="h-4 w-4 accent-[#F5B800]"
                    />
                    <span className="text-xs font-extrabold text-white">
                      Tilbud {index + 1}
                    </span>
                  </label>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <input
                      type="date"
                      value={slot.date}
                      onChange={(event) =>
                        onSlotChange(index, { date: event.target.value })
                      }
                      className="rounded-xl border border-slate-800 bg-[#08111d] px-3 py-2.5 text-xs text-slate-200 outline-none"
                    />
                    <input
                      type="time"
                      value={slot.start_time}
                      onChange={(event) =>
                        onSlotChange(index, {
                          start_time: event.target.value,
                        })
                      }
                      className="rounded-xl border border-slate-800 bg-[#08111d] px-3 py-2.5 text-xs text-slate-200 outline-none"
                    />
                    <input
                      type="time"
                      value={slot.end_time}
                      onChange={(event) =>
                        onSlotChange(index, {
                          end_time: event.target.value,
                        })
                      }
                      className="rounded-xl border border-slate-800 bg-[#08111d] px-3 py-2.5 text-xs text-slate-200 outline-none"
                    />
                  </div>

                  <input
                    value={slot.note}
                    onChange={(event) =>
                      onSlotChange(index, { note: event.target.value })
                    }
                    placeholder="Kommentar (valgfritt)"
                    className="mt-2 w-full rounded-xl border border-slate-800 bg-[#08111d] px-3 py-2.5 text-xs text-slate-200 outline-none"
                  />
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onSaveSlots}
            disabled={savingSlots}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F5B800] px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-400 disabled:opacity-50"
          >
            {savingSlots ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Send tidspunkt til kunden
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-5 md:p-6">
        <h3 className="text-base font-black text-white">
          Faglig vurdering
        </h3>
        <p className="mt-1 text-[11px] text-slate-500">
          Noter hva som ble avklart under befaringen før du velger videre oppfølging.
        </p>

        {assessmentError && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
            {assessmentError}
          </div>
        )}

        {assessmentMessage && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
            {assessmentMessage}
          </div>
        )}

        <textarea
          value={comment}
          onChange={(event) => onCommentChange(event.target.value)}
          rows={6}
          placeholder="Oppsummer vurdering, mulige årsaker og anbefalt videre arbeid..."
          className="mt-4 w-full resize-y rounded-2xl border border-slate-800 bg-[#08111d] p-4 text-sm leading-6 text-slate-200 outline-none focus:border-amber-500/50"
        />

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["lekkasjesok", "Lekkasjesøk"],
            ["takkontroll", "Takkontroll"],
            ["service", "Service / utbedring"],
            ["avsluttet", "Ingen videre arbeid"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              disabled={savingAssessment}
              onClick={() =>
                onChooseService(
                  value as
                    | "lekkasjesok"
                    | "takkontroll"
                    | "service"
                    | "avsluttet"
                )
              }
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-extrabold text-slate-200 hover:border-amber-500/40 hover:bg-slate-800 disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}