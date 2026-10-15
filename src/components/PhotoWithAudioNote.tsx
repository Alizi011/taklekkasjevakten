import { useEffect, useRef, useState } from "react";
import { Mic, Square, Check, Loader2, AlertCircle } from "lucide-react";
import { apiUrl } from "../lib/api";

interface PhotoItemProps {
  photoId: number;
  photoUrl: string;
  onAudioSaved?: (photoId: number, audioUrl: string) => void;
}

export default function PhotoWithAudioNote({
  photoId,
  photoUrl,
  onAudioSaved,
}: PhotoItemProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const pendingFileRef = useRef<File | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.onstop = null;
        recorderRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioUrl?.startsWith("blob:")) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const uploadAudio = async (file: File) => {
    setIsUploading(true);
    setError("");
    setSaved(false);

    try {
      const data = new FormData();
      data.append("photo_id", String(photoId));
      data.append("audio", file);

      const response = await fetch(apiUrl("/upload_photo_audio.php"), {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.audio_url) {
        throw new Error(result.message || "Lydopplastingen feilet.");
      }

      pendingFileRef.current = null;

      if (mountedRef.current) {
        setSaved(true);
        onAudioSaved?.(photoId, result.audio_url);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err instanceof Error
            ? err.message
            : "Kunne ikke lagre lydopptaket."
        );
      }
    } finally {
      if (mountedRef.current) setIsUploading(false);
    }
  };

  const startRecording = async () => {
    setError("");
    setSaved(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;

      const supportedTypes = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/webm",
      ];

      const mimeType = supportedTypes.find((type) =>
        MediaRecorder.isTypeSupported(type)
      );

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );

      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        const type = recorder.mimeType || "audio/webm";
        const extension = type.includes("mp4") ? "m4a" : "webm";
        const blob = new Blob(chunksRef.current, { type });

        if (blob.size === 0) {
          setError("Opptaket er tomt. Prøv igjen.");
          return;
        }

        const file = new File(
          [blob],
          `photo_note_${photoId}.${extension}`,
          { type }
        );

        pendingFileRef.current = file;
        setAudioUrl(URL.createObjectURL(blob));

        await uploadAudio(file);
      };

      recorder.onerror = () => {
        stream.getTracks().forEach((track) => track.stop());
        setError("Feil under lydopptaket.");
        setIsRecording(false);
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setError("Kunne ikke starte mikrofonen.");
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-700 bg-slate-800 p-3">
      <img
        src={photoUrl}
        alt="Prosjektbilde"
        className="h-36 w-full rounded-xl object-cover"
      />

      {isRecording ? (
        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white"
        >
          <Square className="h-4 w-4" />
          Stopp opptak
        </button>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          disabled={isUploading}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          <Mic className="h-4 w-4 text-red-400" />
          {saved ? "Spill inn på nytt" : "Spill inn forklaring"}
        </button>
      )}

      {isUploading && (
        <p className="flex items-center gap-2 text-xs text-amber-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          Laster opp lydopptaket...
        </p>
      )}

      {saved && !isUploading && (
        <p className="flex items-center gap-2 text-xs text-emerald-400">
          <Check className="h-4 w-4" />
          Lydopptaket er lagret på serveren
        </p>
      )}

      {error && (
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>

          {pendingFileRef.current && (
            <button
              type="button"
              disabled={isUploading}
              onClick={() => {
                const file = pendingFileRef.current;
                if (file) void uploadAudio(file);
              }}
              className="rounded-lg border border-red-500/40 px-3 py-2 text-xs font-bold text-red-200"
            >
              Prøv opplasting igjen
            </button>
          )}
        </div>
      )}

      {audioUrl && (
        <audio
          src={audioUrl}
          controls
          preload="metadata"
          className="w-full"
        />
      )}
    </div>
  );
}
