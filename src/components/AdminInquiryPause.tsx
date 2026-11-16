import { useEffect, useState } from "react";

type PauseEvent = {
  id: number;
  action: "pause" | "resume";
  reason: string;
  note: string | null;
  employee_name: string;
  created_at: string;
};

type PauseResponse = {
  success: boolean;
  message?: string;
  paused?: boolean;
  events?: PauseEvent[];
};

interface Props {
  inquiryId: number;
  endpoint: string;
  onPauseChange?: (
    paused: boolean,
    reason: string,
    note: string
  ) => void;
}

const reasons = [
  { value: "insurance", label: "Avventer forsikring / ansvarsavklaring" },
  { value: "customer", label: "Avventer kunden" },
  { value: "third_parties", label: "Avventer andre involverte parter" },
  { value: "other", label: "Annen årsak" },
];

export default function AdminInquiryPause({ inquiryId, endpoint, onPauseChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [paused, setPaused] = useState(false);
  const [events, setEvents] = useState<PauseEvent[]>([]);
  const [reason, setReason] = useState("insurance");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");
    setEvents([]);
    setPaused(false);

    async function load() {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "status", inquiry_id: inquiryId }),
        });

        const data = (await response.json()) as PauseResponse;
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Kunne ikke hente pausestatus.");
        }

        if (active) {
          setPaused(Boolean(data.paused));
          setEvents(data.events || []);
          onPauseChange?.(
            Boolean(data.paused),
            data.events?.[0]?.reason || "",
            data.events?.[0]?.note || ""
          );
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "Kunne ikke hente pausestatus.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [endpoint, inquiryId]);

  async function save(action: "pause" | "resume") {
    if (busy || loading) return;

    if (action === "pause" && !note.trim()) {
      setError("Beskriv hvorfor oppdraget skal settes på vent.");
      return;
    }

    const confirmation = action === "pause"
      ? "Sette oppdraget på vent? Tilbud og rapporter beholdes."
      : "Gjenoppta oppdraget og registrere dette i historikken?";

    if (!window.confirm(confirmation)) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          inquiry_id: inquiryId,
          reason: action === "pause" ? reason : "resumed",
          note: note.trim(),
        }),
      });

      const data = (await response.json()) as PauseResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke lagre handlingen.");
      }

      setPaused(Boolean(data.paused));
      setEvents(data.events || []);
      onPauseChange?.(
        Boolean(data.paused),
        data.events?.[0]?.reason || "",
        data.events?.[0]?.note || ""
      );
      setNote("");
      setMessage(
        action === "pause"
          ? "Oppdraget er registrert som satt på vent."
          : "Oppdraget er registrert som gjenopptatt."
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lagring feilet.");
    } finally {
      setBusy(false);
    }
  }

  const lastPause = events.find((event) => event.action === "pause");

  return (
    <section className="mb-5 space-y-4 rounded-2xl border-2 border-[#865064] bg-[#281722] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
            Administrativ oppdragsstyring
          </p>
          <h3 className="mt-1 text-sm font-black text-white">
            Pause og gjenopptakelse
          </h3>
        </div>
        {!loading && !error && (
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
            paused
              ? "border-amber-400/50 bg-amber-400/10 text-amber-200"
              : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
          }`}>
            {paused ? "På vent" : "Ikke på vent"}
          </span>
        )}
      </div>

      <p className="text-xs leading-5 text-slate-300">
        Administrativ pause endrer ikke tilbud, rapport eller prosjektstatus.
        Ingen kundemelding sendes automatisk.
      </p>

      {loading ? (
        <p className="text-xs text-slate-300">Henter pausestatus …</p>
      ) : !error || events.length > 0 ? (
        <div className="space-y-3">
          {paused && lastPause && (
            <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-3">
              <p className="text-xs font-bold text-amber-200">
                Videre arbeid er satt på vent
              </p>
              <p className="mt-2 whitespace-pre-wrap text-xs text-slate-200">
                {lastPause.note || "Ingen begrunnelse registrert"}
              </p>
              <p className="mt-2 text-[11px] text-slate-400">
                {lastPause.employee_name} · {lastPause.created_at}
              </p>
            </div>
          )}

          {!paused && (
            <label className="block text-xs font-semibold text-slate-200">
              Årsak til pause
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={busy}
                className="mt-2 w-full rounded-lg border border-[#865064] bg-[#1b0b12] p-3 text-xs text-white"
              >
                {reasons.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block text-xs font-semibold text-slate-200">
            {paused ? "Merknad ved gjenopptakelse (valgfritt)" : "Internt saksnotat (påkrevd)"}
            <textarea
              rows={3}
              maxLength={4000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={busy}
              placeholder={
                paused
                  ? "F.eks. Kunden har bekreftet at arbeidet kan fortsette."
                  : "Beskriv kundens beskjed og hva vi avventer."
              }
              className="mt-2 w-full resize-y rounded-lg border border-[#865064] bg-[#1b0b12] p-3 text-xs text-white"
            />
          </label>

          <button
            type="button"
            disabled={busy || (!paused && !note.trim())}
            onClick={() => void save(paused ? "resume" : "pause")}
            className="w-full rounded-xl border border-amber-400/50 bg-amber-400/15 px-4 py-3 text-xs font-black text-amber-100 transition hover:bg-amber-400/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Lagrer …" : paused ? "Gjenoppta oppdrag" : "Sett oppdrag på vent"}
          </button>
        </div>
      ) : null}

      {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
      {message && <p role="status" className="text-xs text-emerald-300">{message}</p>}

      {events.length > 0 && (
        <div className="border-t border-[#704052] pt-3">
          <h4 className="text-xs font-bold text-white">Historikk</h4>
          <div className="mt-2 max-h-56 space-y-2 overflow-y-auto">
            {events.map((event) => (
              <div key={event.id} className="rounded-lg border border-[#704052] bg-[#321722] p-3">
                <p className="text-xs font-bold text-white">
                  {event.action === "pause" ? "Satt på vent" : "Gjenopptatt"}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {event.employee_name} · {event.created_at}
                </p>
                {event.note && (
                  <p className="mt-2 whitespace-pre-wrap text-xs text-slate-200">
                    {event.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}