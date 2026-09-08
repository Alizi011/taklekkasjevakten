import { useState, useRef } from "react";
import { Mic, Square, Check } from "lucide-react";
import { apiUrl } from "../lib/api";

interface PhotoItemProps {
  photoId: number;
  photoUrl: string;
  onAudioSaved?: (photoId: number, audioUrl: string) => void;
}

export default function PhotoWithAudioNote({ photoId, photoUrl, onAudioSaved }: PhotoItemProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const localUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(localUrl);

        // Send lydfilen til VPS-backend
        const formData = new FormData();
        formData.append("photo_id", photoId.toString());
        formData.append("audio", audioBlob, `photo_note_${photoId}.webm`);

        try {
          const res = await fetch(apiUrl("/upload_photo_audio.php"), {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (data.success && onAudioSaved) {
            onAudioSaved(photoId, data.audio_url);
          }
        } catch (err) {
          console.error("Feil ved lagring av lydnotat:", err);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert("Kunne ikke få tilgang til mikrofonen på enheten.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="bg-slate-800 rounded-2xl p-3 border border-slate-700 flex flex-col gap-2">
      <img
        src={photoUrl}
        alt="Befaringsbilde"
        className="w-full h-36 object-cover rounded-xl"
      />

      <div className="flex items-center justify-between gap-2">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              audioUrl
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-slate-700 hover:bg-slate-600 text-white"
            }`}
          >
            {audioUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Mic className="w-3.5 h-3.5 text-red-400" />}
            {audioUrl ? "Spill inn på nytt" : "Spill inn forklaring"}
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 text-white py-2 px-3 rounded-xl text-xs font-bold animate-pulse cursor-pointer"
          >
            <Square className="w-3.5 h-3.5" /> Stopp opptak...
          </button>
        )}

        {audioUrl && (
          <audio src={audioUrl} controls className="h-8 w-28 shrink-0" />
        )}
      </div>
    </div>
  );
}