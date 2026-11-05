import { useEffect, useMemo, useState } from "react";
import {
  Clock3,
  Loader2,
  LogIn,
  LogOut,
  TimerReset,
} from "lucide-react";
import { apiUrl } from "../lib/api";

interface ActiveTimeSession {
  id: number;
  employee_id: number;
  project_id: number;
  task_id?: number | null;
  checked_in_at: string;
  checked_out_at?: string | null;
  break_minutes?: number;
  description?: string | null;
  status: string;
  source_platform?: string;
  project_number?: string | null;
  project_title?: string | null;
  project_source_system?: string | null;
  property_address?: string | null;
  property_postal_code?: string | null;
  property_city?: string | null;
}

interface TimeSessionResponse {
  success: boolean;
  active?: boolean;
  session?: ActiveTimeSession | null;
  server_time?: string;
  message?: string;
}

interface TimeTrackerProps {
  sourceEmployeeId?: number | null;
  sourceProjectId?: number | null;
  projectLabel?: string;
  compact?: boolean;
}

function parseServerDateTime(value?: string | null): Date | null {
  if (!value) return null;

  const normalized = value.includes("T")
    ? value
    : value.replace(" ", "T");

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export default function TimeTracker({
  sourceEmployeeId,
  sourceProjectId,
  projectLabel,
  compact = false,
}: TimeTrackerProps) {
  const [activeSession, setActiveSession] =
    useState<ActiveTimeSession | null>(null);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState("0");
  const [description, setDescription] = useState("");

  const employeeId = Number(sourceEmployeeId || 0);
  const projectId = Number(sourceProjectId || 0);

  const fetchActiveSession = async () => {
    if (employeeId <= 0) {
      setActiveSession(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        apiUrl(
          `/core/time_session.php?source_employee_id=${encodeURIComponent(
            String(employeeId)
          )}`
        )
      );

      const data = (await res.json()) as TimeSessionResponse;

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke hente aktiv timeregistrering.");
      }

      setActiveSession(data.active ? data.session || null : null);

      const serverTime = parseServerDateTime(data.server_time);
      if (serverTime) {
        setServerOffsetMs(serverTime.getTime() - Date.now());
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kunne ikke hente aktiv timeregistrering."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSession();
  }, [employeeId]);

  useEffect(() => {
    if (!activeSession) return;

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeSession]);

  const elapsedSeconds = useMemo(() => {
    const checkedIn = parseServerDateTime(activeSession?.checked_in_at);
    if (!checkedIn) return 0;

    const serverNow = now + serverOffsetMs;
    return Math.max(0, Math.floor((serverNow - checkedIn.getTime()) / 1000));
  }, [activeSession?.checked_in_at, now, serverOffsetMs]);

  const activeProjectLabel = useMemo(() => {
    if (!activeSession) return "";

    const address = [
      activeSession.property_address,
      activeSession.property_postal_code,
      activeSession.property_city,
    ]
      .filter(Boolean)
      .join(", ");

    return (
      [activeSession.project_number, activeSession.project_title]
        .filter(Boolean)
        .join(" · ") ||
      address ||
      `Prosjekt #${activeSession.project_id}`
    );
  }, [activeSession]);

  const checkIn = async () => {
    if (employeeId <= 0) {
      setError("Ansatt-ID mangler.");
      return;
    }

    if (projectId <= 0) {
      setError("Åpne et prosjekt før du sjekker inn.");
      return;
    }

    setActionLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(apiUrl("/core/time_session.php"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "check_in",
          source_employee_id: employeeId,
          source_project_id: projectId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke sjekke inn.");
      }

      setMessage("Du er sjekket inn.");
      await fetchActiveSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke sjekke inn.");
    } finally {
      setActionLoading(false);
    }
  };

  const checkOut = async () => {
    if (employeeId <= 0) {
      setError("Ansatt-ID mangler.");
      return;
    }

    const parsedBreak = Math.max(
      0,
      Number.parseInt(breakMinutes || "0", 10) || 0
    );

    setActionLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(apiUrl("/core/time_session.php"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "check_out",
          source_employee_id: employeeId,
          break_minutes: parsedBreak,
          description: description.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke sjekke ut.");
      }

      setMessage(
        data.status === "needs_review"
          ? "Du er sjekket ut. Økten er sendt til kontroll."
          : "Du er sjekket ut."
      );

      setCheckoutOpen(false);
      setBreakMinutes("0");
      setDescription("");
      await fetchActiveSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke sjekke ut.");
    } finally {
      setActionLoading(false);
    }
  };

  if (employeeId <= 0) {
    return null;
  }

  return (
    <section
      className={`border rounded-2xl ${
        activeSession
          ? "border-emerald-500/30 bg-emerald-500/[0.06]"
          : "border-slate-800 bg-[#0b0f17]"
      } ${compact ? "p-4" : "p-5"}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Clock3
              className={`h-4 w-4 ${
                activeSession ? "text-emerald-400" : "text-amber-400"
              }`}
            />
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              Arbeidstid
            </p>

            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />}
          </div>

          {activeSession ? (
            <>
              <p className="mt-2 text-3xl font-black tabular-nums text-white">
                {formatDuration(elapsedSeconds)}
              </p>
              <p className="mt-1 truncate text-xs font-bold text-emerald-300">
                {activeProjectLabel}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                Sjekket inn {activeSession.checked_in_at}
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm font-extrabold text-white">
                Ikke sjekket inn
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {projectId > 0
                  ? projectLabel || `Oppdrag #${projectId}`
                  : "Åpne et prosjekt for å starte arbeidstiden."}
              </p>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {!activeSession ? (
            <button
              type="button"
              onClick={checkIn}
              disabled={actionLoading || projectId <= 0}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#F5B800] px-5 py-3 text-xs font-black text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              Sjekk inn
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCheckoutOpen((current) => !current)}
                disabled={actionLoading}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-xs font-black text-red-300 transition hover:bg-red-500/15 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                Sjekk ut
              </button>

              <button
                type="button"
                onClick={fetchActiveSession}
                disabled={loading || actionLoading}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-xs font-bold text-slate-300 transition hover:text-white disabled:opacity-50"
                title="Oppdater timer"
              >
                <TimerReset className="h-4 w-4" />
                Oppdater
              </button>
            </>
          )}
        </div>
      </div>

      {checkoutOpen && activeSession && (
        <div className="mt-4 border-t border-slate-800 pt-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[160px_1fr]">
            <div>
              <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Pause i minutter
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={breakMinutes}
                onChange={(event) => setBreakMinutes(event.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Arbeidsbeskrivelse
              </label>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Kort beskrivelse av utført arbeid..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setCheckoutOpen(false)}
              disabled={actionLoading}
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-50"
            >
              Avbryt
            </button>

            <button
              type="button"
              onClick={checkOut}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-xs font-black text-white transition hover:bg-red-400 disabled:opacity-50"
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Bekreft utsjekk
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-300">
          {message}
        </div>
      )}
    </section>
  );
}
