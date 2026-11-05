import { useEffect, useRef, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoConference,
  useLocalParticipant,
  useRoomContext,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  RotateCcw,
  Save,
  Signal,
  Video,
  X,
} from "lucide-react";
import { RoomEvent, Track } from "livekit-client";
import { apiUrl } from "../lib/api";

type LiveInspectionRole = "customer" | "project_manager";

interface LiveInspectionRoomProps {
  inquiryId: number;
  role: LiveInspectionRole;
  displayName: string;
  employeeId?: number | null;
  onClose: () => void;
}

interface TokenResponse {
  success: boolean;
  token?: string;
  server_url?: string;
  room?: string;
  message?: string;
}

interface SessionSnapshot {
  id: string;
  previewUrl: string;
  saved: boolean;
}

interface LogResponse {
  success: boolean;
  log_id?: number;
  message?: string;
}

const INSPECTION_STEPS = [
  "Vis området der lekkasjen eller skaden oppstår.",
  "Vis taket, balkongen eller konstruksjonen over skadeområdet.",
  "Gå nærmere sluk, beslag, skjøter og overganger.",
  "Vis overgang mot vegg, pipe, dør eller annen tilstøtende konstruksjon.",
  "Avslutt med et tydelig oversiktsbilde av området.",
];

function CameraSwitcher() {
  const { localParticipant } = useLocalParticipant();
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [switching, setSwitching] = useState(false);

  const switchCamera = async () => {
    if (switching) return;

    setSwitching(true);

    try {
      const nextFacingMode =
        facingMode === "user" ? "environment" : "user";

      const publication = localParticipant.getTrackPublication(
        Track.Source.Camera
      );

      const cameraTrack = publication?.videoTrack;

      if (!cameraTrack) {
        await localParticipant.setCameraEnabled(true, {
          facingMode: nextFacingMode,
        });
      } else {
        await cameraTrack.restartTrack({
          facingMode: nextFacingMode,
        });
      }

      setFacingMode(nextFacingMode);
    } catch (error) {
      console.error("Kunne ikke bytte kamera:", error);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <button
      type="button"
      onClick={switchCamera}
      disabled={switching}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/90 px-3 text-xs font-extrabold text-white shadow-lg backdrop-blur transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
      aria-label="Bytt mellom frontkamera og bak-kamera"
      title="Bytt kamera"
    >
      {switching ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RotateCcw className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">Bytt kamera</span>
    </button>
  );
}

function InspectionControls({
  inquiryId,
  role,
  employeeId,
  roomName,
}: {
  inquiryId: number;
  role: LiveInspectionRole;
  employeeId?: number | null;
  roomName: string;
}) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const cameraTracks = useTracks([Track.Source.Camera]);

  const [networkLabel, setNetworkLabel] = useState("Kontrollerer forbindelse");
  const [reconnecting, setReconnecting] = useState(false);

  const [frozenBlob, setFrozenBlob] = useState<Blob | null>(null);
  const [frozenPreviewUrl, setFrozenPreviewUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [includeInReport, setIncludeInReport] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [snapshotError, setSnapshotError] = useState("");
  const [snapshots, setSnapshots] = useState<SessionSnapshot[]>([]);

  const [notesOpen, setNotesOpen] = useState(false);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteMessage, setNoteMessage] = useState("");
  const [noteError, setNoteError] = useState("");

  const [guideOpen, setGuideOpen] = useState(false);
  const [guideStep, setGuideStep] = useState(0);

  const logIdRef = useRef<number | null>(null);
  const snapshotCountRef = useRef(0);
  const interruptionCountRef = useRef(0);

  useEffect(() => {
    let active = true;

    const startLog = async () => {
      try {
        const res = await fetch(apiUrl("/live_inspection_log.php"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "start",
            inquiry_id: inquiryId,
            role,
            employee_id: employeeId || null,
            room_name: roomName || null,
          }),
        });

        const data: LogResponse = await res.json();

        if (active && res.ok && data.success && data.log_id) {
          logIdRef.current = Number(data.log_id);
        }
      } catch (error) {
        console.error("Kunne ikke starte befaringslogg:", error);
      }
    };

    startLog();

    return () => {
      active = false;

      const logId = logIdRef.current;
      if (!logId) return;

      fetch(apiUrl("/live_inspection_log.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          action: "end",
          log_id: logId,
          inquiry_id: inquiryId,
          snapshot_count: snapshotCountRef.current,
          connection_interruptions: interruptionCountRef.current,
        }),
      }).catch(() => {});
    };
  }, [inquiryId, role, employeeId, roomName]);

  useEffect(() => {
    const updateQuality = (quality: unknown, participant: any) => {
      const isRelevantParticipant =
        role === "project_manager"
          ? participant?.identity !== localParticipant.identity
          : participant?.identity === localParticipant.identity;

      if (!isRelevantParticipant) return;

      const normalized = String(quality || "").toLowerCase();

      if (normalized.includes("excellent")) {
        setNetworkLabel("Svært god forbindelse");
      } else if (normalized.includes("good")) {
        setNetworkLabel("God forbindelse");
      } else if (normalized.includes("poor")) {
        setNetworkLabel("Ustabil forbindelse");
      } else if (normalized.includes("lost")) {
        setNetworkLabel("Forbindelsen er brutt");
      } else {
        setNetworkLabel("Forbindelse aktiv");
      }
    };

    const handleReconnecting = () => {
      setReconnecting(true);
      setNetworkLabel("Kobler til igjen...");
      interruptionCountRef.current += 1;
    };

    const handleReconnected = () => {
      setReconnecting(false);
      setNetworkLabel("Forbindelse gjenopprettet");
    };

    room.on(RoomEvent.ConnectionQualityChanged, updateQuality);
    room.on(RoomEvent.Reconnecting, handleReconnecting);
    room.on(RoomEvent.Reconnected, handleReconnected);

    return () => {
      room.off(RoomEvent.ConnectionQualityChanged, updateQuality);
      room.off(RoomEvent.Reconnecting, handleReconnecting);
      room.off(RoomEvent.Reconnected, handleReconnected);
    };
  }, [room, role, localParticipant.identity]);

  useEffect(() => {
    return () => {
      if (frozenPreviewUrl) {
        URL.revokeObjectURL(frozenPreviewUrl);
      }

      snapshots.forEach((snapshot) => {
        URL.revokeObjectURL(snapshot.previewUrl);
      });
    };
  }, [frozenPreviewUrl, snapshots]);

  const getRemoteCameraTrack = () => {
    const remoteReference = cameraTracks.find(
      (reference: any) =>
        reference?.participant?.identity !== localParticipant.identity &&
        reference?.publication?.track
    );

    return remoteReference?.publication?.track || null;
  };

  const captureRemoteFrame = async () => {
    if (role !== "project_manager" || capturing) return;

    setCapturing(true);
    setSnapshotError("");

    try {
      const remoteTrack: any = getRemoteCameraTrack();

      if (!remoteTrack) {
        throw new Error(
          "Kundens kamera er ikke tilgjengelig ennå. Be kunden slå på kameraet."
        );
      }

      const video = document.createElement("video");
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;

      remoteTrack.attach(video);

      try {
        await video.play().catch(() => undefined);

        if (
          video.readyState < 2 ||
          video.videoWidth <= 0 ||
          video.videoHeight <= 0
        ) {
          await new Promise<void>((resolve, reject) => {
            const timeout = window.setTimeout(
              () => reject(new Error("Videobildet ble ikke klart i tide.")),
              2500
            );

            const ready = () => {
              window.clearTimeout(timeout);
              video.removeEventListener("loadeddata", ready);
              resolve();
            };

            video.addEventListener("loadeddata", ready, { once: true });
          });
        }

        if (video.videoWidth <= 0 || video.videoHeight <= 0) {
          throw new Error("Kunne ikke lese videobildet.");
        }

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Kunne ikke opprette bilde.");
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (result) => {
              if (result) resolve(result);
              else reject(new Error("Kunne ikke opprette stillbildet."));
            },
            "image/jpeg",
            0.92
          );
        });

        if (frozenPreviewUrl) {
          URL.revokeObjectURL(frozenPreviewUrl);
        }

        const previewUrl = URL.createObjectURL(blob);

        setFrozenBlob(blob);
        setFrozenPreviewUrl(previewUrl);
        setCaption("");
        setIncludeInReport(false);
      } finally {
        remoteTrack.detach(video);
      }
    } catch (error) {
      setSnapshotError(
        error instanceof Error
          ? error.message
          : "Kunne ikke ta bilde fra videostrømmen."
      );
    } finally {
      setCapturing(false);
    }
  };

  const discardFrozenFrame = () => {
    if (frozenPreviewUrl) {
      URL.revokeObjectURL(frozenPreviewUrl);
    }

    setFrozenBlob(null);
    setFrozenPreviewUrl("");
    setCaption("");
    setIncludeInReport(false);
    setSnapshotError("");
  };

  const saveSnapshot = async () => {
    if (!frozenBlob || savingSnapshot) return;

    setSavingSnapshot(true);
    setSnapshotError("");

    try {
      const file = new File(
        [frozenBlob],
        `digital_befaring_${inquiryId}_${Date.now()}.jpg`,
        { type: "image/jpeg" }
      );

      const formData = new FormData();
      formData.append("inquiry_id", String(inquiryId));
      formData.append("photo", file);
      formData.append("documentation_phase", "1");
      formData.append("include_in_report", includeInReport ? "1" : "0");
      formData.append("caption_text", caption.trim());

      const res = await fetch(apiUrl("/photos.php"), {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke lagre bildet på saken.");
      }

      const previewUrl = frozenPreviewUrl;

      setSnapshots((current) => [
        ...current,
        {
          id: `${Date.now()}`,
          previewUrl,
          saved: true,
        },
      ]);

      const nextCount = snapshotCountRef.current + 1;
      snapshotCountRef.current = nextCount;

      if (logIdRef.current) {
        fetch(apiUrl("/live_inspection_log.php"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "snapshot",
            log_id: logIdRef.current,
            inquiry_id: inquiryId,
            caption: caption.trim(),
            include_in_report: includeInReport,
          }),
        }).catch(() => {});
      }

      setFrozenBlob(null);
      setFrozenPreviewUrl("");
      setCaption("");
      setIncludeInReport(false);
    } catch (error) {
      setSnapshotError(
        error instanceof Error
          ? error.message
          : "Kunne ikke lagre bildet på saken."
      );
    } finally {
      setSavingSnapshot(false);
    }
  };

  const saveNote = async () => {
    const cleanNote = note.trim();

    if (!cleanNote || savingNote) return;

    setSavingNote(true);
    setNoteMessage("");
    setNoteError("");

    try {
      const res = await fetch(apiUrl("/live_inspection_log.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "note",
          log_id: logIdRef.current,
          inquiry_id: inquiryId,
          employee_id: employeeId || null,
          role,
          note: cleanNote,
        }),
      });

      const data: LogResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke lagre notatet.");
      }

      setNote("");
      setNoteMessage("Notatet er lagret på befaringen.");
    } catch (error) {
      setNoteError(
        error instanceof Error ? error.message : "Kunne ikke lagre notatet."
      );
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <>
      <div className="pointer-events-none absolute left-3 right-3 top-3 z-50 flex items-start justify-between gap-2 sm:left-4 sm:right-4 sm:top-4">
        <div className="pointer-events-auto inline-flex min-h-9 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/90 px-3 text-[11px] font-extrabold text-slate-200 shadow-lg backdrop-blur">
          {reconnecting ? (
            <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
          ) : (
            <Signal className="h-4 w-4 text-emerald-400" />
          )}
          <span>{networkLabel}</span>
        </div>

        <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
          <CameraSwitcher />

          {role === "project_manager" && (
            <>
              <button
                type="button"
                onClick={captureRemoteFrame}
                disabled={capturing}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 text-xs font-extrabold text-cyan-200 shadow-lg backdrop-blur transition hover:bg-cyan-500/20 disabled:opacity-60"
              >
                {capturing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Ta bilde</span>
              </button>

              <button
                type="button"
                onClick={() => setNotesOpen((current) => !current)}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/90 px-3 text-xs font-extrabold text-white shadow-lg backdrop-blur transition hover:bg-slate-900"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Notat</span>
              </button>

              <button
                type="button"
                onClick={() => setGuideOpen((current) => !current)}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/90 px-3 text-xs font-extrabold text-white shadow-lg backdrop-blur transition hover:bg-slate-900"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span className="hidden sm:inline">Kontrollsteg</span>
              </button>
            </>
          )}
        </div>
      </div>

      {role === "project_manager" && snapshots.length > 0 && (
        <div className="absolute bottom-20 left-3 z-50 flex max-w-[calc(100%-1.5rem)] gap-2 overflow-x-auto rounded-2xl border border-slate-700 bg-slate-950/90 p-2 shadow-xl backdrop-blur sm:left-4">
          {snapshots.map((snapshot) => (
            <div
              key={snapshot.id}
              className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-black"
            >
              <img
                src={snapshot.previewUrl}
                alt="Lagret bilde fra digital befaring"
                className="h-full w-full object-cover"
              />
              {snapshot.saved && (
                <CheckCircle2 className="absolute right-1 top-1 h-3.5 w-3.5 text-emerald-400 drop-shadow" />
              )}
            </div>
          ))}
        </div>
      )}

      {role === "project_manager" && guideOpen && (
        <div className="absolute bottom-20 right-3 z-[55] w-[min(92vw,380px)] rounded-2xl border border-slate-700 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur sm:right-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                Strukturert digital befaring
              </p>
              <h3 className="mt-1 text-sm font-black">
                Kontrollsteg {guideStep + 1} av {INSPECTION_STEPS.length}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setGuideOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-4 min-h-[48px] text-xs leading-5 text-slate-300">
            {INSPECTION_STEPS[guideStep]}
          </p>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() =>
                setGuideStep((current) => Math.max(0, current - 1))
              }
              disabled={guideStep === 0}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs font-bold text-slate-200 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Forrige
            </button>

            <button
              type="button"
              onClick={() =>
                setGuideStep((current) =>
                  Math.min(INSPECTION_STEPS.length - 1, current + 1)
                )
              }
              disabled={guideStep === INSPECTION_STEPS.length - 1}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#F5B800] px-3 text-xs font-black text-slate-950 disabled:opacity-40"
            >
              Neste
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {role === "project_manager" && notesOpen && (
        <div className="absolute bottom-20 right-3 z-[56] w-[min(92vw,420px)] rounded-2xl border border-slate-700 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur sm:right-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                Befaringsnotat
              </p>
              <h3 className="mt-1 text-sm font-black">
                Lagre observasjon på saken
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setNotesOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            placeholder="Eksempel: Fuktmerke ved pipe. Kunden viser sprekk i overgang mellom beslag og membran."
            className="mt-4 w-full resize-none rounded-xl border border-slate-700 bg-[#08111d] px-3 py-3 text-xs text-white outline-none focus:border-amber-500/50"
          />

          {noteError && (
            <p className="mt-2 text-[11px] text-red-300">{noteError}</p>
          )}
          {noteMessage && (
            <p className="mt-2 text-[11px] text-emerald-300">{noteMessage}</p>
          )}

          <button
            type="button"
            onClick={saveNote}
            disabled={savingNote || !note.trim()}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F5B800] px-4 py-3 text-xs font-black text-slate-950 disabled:opacity-50"
          >
            {savingNote ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Lagre notat
          </button>
        </div>
      )}

      {frozenBlob && frozenPreviewUrl && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/90 p-3 sm:p-6">
          <div className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#070a11] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div>
                <p className="text-sm font-black text-white">
                  Stillbilde fra kundens videostrøm
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  Bildet er ikke lagret før du trykker «Lagre til saken».
                </p>
              </div>

              <button
                type="button"
                onClick={discardFrozenFrame}
                className="grid h-9 w-9 place-items-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300"
                aria-label="Fortsett live"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-h-0 bg-black">
                <img
                  src={frozenPreviewUrl}
                  alt="Stillbilde fra digital befaring"
                  className="h-full max-h-[62vh] w-full object-contain"
                />
              </div>

              <div className="overflow-y-auto border-t border-slate-800 p-4 lg:border-l lg:border-t-0">
                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Bildetekst / observasjon
                  </span>
                  <textarea
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                    rows={5}
                    placeholder="Beskriv hva bildet viser..."
                    className="w-full resize-none rounded-xl border border-slate-700 bg-[#08111d] px-3 py-3 text-xs text-white outline-none focus:border-cyan-500/50"
                  />
                </label>

                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <input
                    type="checkbox"
                    checked={includeInReport}
                    onChange={(event) =>
                      setIncludeInReport(event.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 accent-cyan-500"
                  />
                  <span>
                    <span className="block text-xs font-extrabold text-white">
                      Ta med i rapport
                    </span>
                    <span className="mt-1 block text-[10px] leading-4 text-slate-500">
                      Bildet kan senere brukes i den tekniske rapporten.
                    </span>
                  </span>
                </label>

                {snapshotError && (
                  <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
                    {snapshotError}
                  </p>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={discardFrozenFrame}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-xs font-extrabold text-slate-200"
                  >
                    Fortsett live
                  </button>

                  <button
                    type="button"
                    onClick={saveSnapshot}
                    disabled={savingSnapshot}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5B800] px-3 py-3 text-xs font-black text-slate-950 disabled:opacity-60"
                  >
                    {savingSnapshot ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Lagre til saken
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function LiveInspectionRoom({
  inquiryId,
  role,
  displayName,
  employeeId,
  onClose,
}: LiveInspectionRoomProps) {
  const [token, setToken] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [roomName, setRoomName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchToken = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(apiUrl("/livekit_token.php"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inquiry_id: inquiryId,
            role,
            employee_id: employeeId || null,
          }),
        });

        const data: TokenResponse = await res.json();

        if (!res.ok || !data.success || !data.token || !data.server_url) {
          throw new Error(
            data.message || "Kunne ikke opprette sikker videotilkobling."
          );
        }

        if (cancelled) return;

        setToken(data.token);
        setServerUrl(data.server_url);
        setRoomName(data.room || "");
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Kunne ikke starte digital befaring."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchToken();

    return () => {
      cancelled = true;
    };
  }, [inquiryId, role, employeeId]);

  return (
    <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm p-2 sm:p-4">
      <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#070a11] shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-950 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-black text-white">
              <Video className="h-4 w-4 text-cyan-400" />
              Digital befaring
            </p>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">
              {displayName}
              {roomName ? ` · ${roomName}` : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white"
            aria-label="Lukk digital befaring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1">
          {loading ? (
            <div className="flex h-full items-center justify-center gap-3 text-sm text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
              Oppretter sikker forbindelse...
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center p-6">
              <div className="max-w-lg rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-center">
                <p className="text-sm font-extrabold text-red-300">
                  Kunne ikke starte videobefaringen
                </p>
                <p className="mt-2 text-xs leading-5 text-red-200/80">
                  {error}
                </p>
              </div>
            </div>
          ) : (
            <LiveKitRoom
              token={token}
              serverUrl={serverUrl}
              connect={true}
              audio={true}
              video={true}
              onDisconnected={onClose}
              data-lk-theme="default"
              style={{ height: "100%", position: "relative" }}
            >
              <InspectionControls
                inquiryId={inquiryId}
                role={role}
                employeeId={employeeId}
                roomName={roomName}
              />
              <VideoConference />
              <RoomAudioRenderer />
            </LiveKitRoom>
          )}
        </div>
      </div>
    </div>
  );
}
