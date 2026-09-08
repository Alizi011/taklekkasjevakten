import { useState, useEffect, useRef } from "react";
import { 
  CheckCircle2, AlertCircle, AlertTriangle, ShieldAlert, 
  XCircle, Info, Camera, Mic, Square, Play, Save, Loader2, PlusCircle 
} from "lucide-react";
import { apiUrl } from "../lib/api";
interface ChecklistDetail {
  title: string;
  info: string;
}

interface ChecklistItem {
  id: string;
  title: string;
  info: string;
  status: "tg0" | "tg1" | "tg2" | "tg3" | "ikke_aktuell";
  note: string;
  photoUrl?: string;
  audioUrl?: string;
}

// Komprimerer bilder i browseren til max 1600px og ~80% kvalitet før opplasting
const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1600;
        const MAX_HEIGHT = 1600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Kunne ikke komprimere bilde"));
          },
          "image/jpeg",
          0.8
        );
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

const CHECKLIST_TEMPLATES: Record<string, ChecklistDetail[]> = {
  flatt: [
    { title: "1. Yttertekking / Membran (PVC, Bitumen/Papp, Asfalt)", info: "Sjekk sveisesømmer med testnål. Ingen brennemerker eller ufullstendig oppheting." },
    { title: "2. Overflate / Slitelag (Mekanisk beskyttelse, hellesystem, grus)", info: "Krever drenerende og trykkfordelende sikt under heller/grus." },
    { title: "3. Fall og avrenning (Min. 1:40 på flate / 1:60 i renner)", info: "Byggforsk 525.207 krever min. 1:40 fall på ferdig flate." },
    { title: "4. Oppkanter og gesims (Vanntett oppbrett min. 150 mm)", info: "Membran skal føres min. 150 mm vertikalt opp på tilstøtende vegg/parapet." },
    { title: "5. Sluk, klemring og nødoverløp (Sikkerhet mot oversvømmelse)", info: "Sluk må ligge forsenket i lavpunkt. Nødoverløp er obligatorisk ved innvendig sluk." },
    { title: "6. Gjennomføringer (Lufterør, piper, kabelgjennomføringer)", info: "Skal ha ferdigsveist mansjett eller godkjent klemringsløsning." },
    { title: "7. Parapet og beslag (Fall inn mot tak, skjult festing)", info: "Beslag på topp parapet må ha fall inn mot takflaten." },
    { title: "8. Vindforankring og mekanisk festing (Rand- og hjørnesoner)", info: "Sjekk mekanisk festing i rand- og hjørnesoner ihht. Byggforsk 544.206." },
    { title: "9. Isolasjon og trykkfasthet (Tråkkfasthet og lunker)", info: "Isolasjonen må ha tilstrekkelig trykkfasthet ved gangveier." },
    { title: "10. Dampsperre og luftsperre (Kondensrisiko)", info: "Dampsperren må være kontinuerlig og klemles telt." },
    { title: "11. Bærekonstruksjon / Dekke (Betong, stålplater, tre)", info: "Visuell sjekk underifra. Se etter nedbøyninger eller riss." }
  ],
  skratak: [
    { title: "1. Primærtekking (Takstein, tegl, plater, shingel)", info: "Sjekk for sprukne steiner og manglende stormklemmer." },
    { title: "2. Sløyfer og lekter (Råte, dimensjonering og ventilasjon)", info: "Sløyfer min. 23x48 mm for god lufting under stein." },
    { title: "3. Undertak / Sutak (Kombiundertak eller forenklet)", info: "Sjekk for fuktskjolder, sagging og kapillæropptrekk." },
    { title: "4. Raft og sløyfeavslutning (Fuglenett, musebånd, dryppblikk)", info: "Fritt avløp fra undertak til takrenne via dryppblikk." },
    { title: "5. Møne og gavl (Mønestein, tetteliste, vindski)", info: "Sjekk at mønepanne er festet og at tetteliste slipper ut luft." },
    { title: "6. Gradrenner og skvettbeslag (Mose, korrosjon, avrenning)", info: "Gradrennebeslag må ha god overlapping (min. 150 mm)." },
    { title: "7. Pipe, takvinduer og gjennomføringer (Beslag og svellebånd)", info: "Bakkantbeslag skal ha oppbrett/sadel for avrenning." },
    { title: "8. Takrennesystem og nedløp (Kapasitet, fall og frost)", info: "Sjekk at rennekroker har jevnt fall mot nedløp." },
    { title: "9. Taksikring og snøfangere (Godkjent innfesting)", info: "Snøfangere må være festet direkte i bærende lekt eller sperre." },
    { title: "10. Lufting av undertak (Fri spalte fra raft til møne)", info: "Min. 50 mm kontinuerlig luftespalte mellom isolasjon og undertak." },
    { title: "11. Dampsperre og isolasjon (Innvendig tetting)", info: "Innvendig dampsperre (0,20 mm plast) må være klemles telt." }
  ],
  balkong: [
    { title: "1. Overflate og slitelag (Fliser, tregolv, gummidekke)", info: "Slitelaget må være avtagbart eller drenert." },
    { title: "2. Membran og tekking (Smøremembran / Bitumen / PVC)", info: "Sjekk at membranen er hel uten mekaniske skader." },
    { title: "3. Oppkant mot terrassedør og fasade (Min. 150 mm oppbrett)", info: "Membran må trekkes min. 150 mm opp under dørterskel." },
    { title: "4. Sluk, drenssikt og spalteavrenning", info: "Sluk må ha fri passasje under tralle/heller." },
    { title: "5. Rekkverksinnfesting (Membranbrudd)", info: "Topp- eller sidefester til rekkverk må være vanntett forseglet." },
    { title: "6. Frontbeslag og dryppnese (Fasadebeskyttelse)", info: "Frontbeslag skal kaste vannet godt ut fra fasaden." },
    { title: "7. Dilatasjonsfuger og riss i betongelementer", info: "Se etter riss og sprekker i dekke/oppforede kanter." }
  ]
};

interface ChecklistManagerProps {
  inquiryId?: number;
  initialRoofType?: string;
}

export default function ChecklistManager({ inquiryId, initialRoofType }: ChecklistManagerProps) {
  const roofTypeString = initialRoofType || "Flatt tak";

  const getTemplateKey = (str: string) => {
    const s = str.toLowerCase();
    if (s.includes("flatt") || s.includes("papp")) return "flatt";
    if (s.includes("balkong") || s.includes("terrasse") || s.includes("altan")) return "balkong";
    return "skratak";
  };

  const [activeTemplate, setActiveTemplate] = useState<string>(getTemplateKey(roofTypeString));
  const [openInfoId, setOpenInfoId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Lydopptaks-states
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const buildItems = (key: string): ChecklistItem[] => {
    const list = CHECKLIST_TEMPLATES[key] || CHECKLIST_TEMPLATES.skratak;
    const baseItems: ChecklistItem[] = list.map((item, idx) => ({
      id: `${key}-${idx}`,
      title: item.title,
      info: item.info,
      status: "tg0",
      note: ""
    }));

    baseItems.push({
      id: `${key}-extra-1`,
      title: "12. Andre observasjoner (Tilkomst, fasade, naboforhold, spesiell skade)",
      info: "Bruk dette feltet til å dokumentere spesielle forhold på stedet som ikke dekkes av standardpunktene over.",
      status: "tg1",
      note: ""
    });

    return baseItems;
  };

  const [items, setItems] = useState<ChecklistItem[]>(buildItems(activeTemplate));

  useEffect(() => {
    if (!inquiryId) return;
    const fetchSavedChecklist = async () => {
      try {
        const res = await fetch(apiUrl(`/checklists.php?inquiry_id=${inquiryId}`));
        const data = await res.json();
        if (data.success && data.checklists.length > 0) {
          setItems((prev) =>
            prev.map((item) => {
              const saved = data.checklists.find((c: any) => c.item_id === item.id);
              if (saved) {
                return {
                  ...item,
                  status: saved.status,
                  note: saved.comment || "",
                  photoUrl: saved.photo_url,
                  audioUrl: saved.audio_url
                };
              }
              return item;
            })
          );
        }
      } catch (err) {
        console.error("Feil ved henting av lagret sjekkliste:", err);
      }
    };
    fetchSavedChecklist();
  }, [inquiryId]);

  const handleTemplateChange = (newKey: string) => {
    setActiveTemplate(newKey);
    setOpenInfoId(null);
    setItems(buildItems(newKey));
  };

  const updateStatus = (id: string, status: ChecklistItem["status"]) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const updateNote = (id: string, note: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, note } : item)));
  };

  const saveChecklistItem = async (item: ChecklistItem, photoFile?: File, audioBlob?: Blob) => {
    if (!inquiryId) return;
    setSavingId(item.id);

    const formData = new FormData();
    formData.append("inquiry_id", inquiryId.toString());
    formData.append("item_id", item.id);
    formData.append("item_title", item.title);
    formData.append("status", item.status);
    formData.append("comment", item.note);

    if (photoFile) formData.append("photo", photoFile);
    if (audioBlob) formData.append("audio", audioBlob, `audio_${item.id}.webm`);

    try {
      const res = await fetch(apiUrl("/checklists.php"), {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        const refreshRes = await fetch(apiUrl(`/checklists.php?inquiry_id=${inquiryId}`));
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          const updated = refreshData.checklists.find((c: any) => c.item_id === item.id);
          if (updated) {
            setItems((prev) =>
              prev.map((i) =>
                i.id === item.id
                  ? { ...i, photoUrl: updated.photo_url, audioUrl: updated.audio_url }
                  : i
              )
            );
          }
        }
      }
    } catch (err) {
      console.error("Feil ved lagring av sjekkpunkt:", err);
    } finally {
      setSavingId(null);
    }
  };

  // Håndter og komprimer bilde før innsending
  const handlePhotoSelect = async (item: ChecklistItem, file: File) => {
    try {
      const compressedBlob = await compressImage(file);
      const compressedFile = new File([compressedBlob], file.name, { type: "image/jpeg" });
      await saveChecklistItem(item, compressedFile);
    } catch (err) {
      console.error("Bildekomprimering feilet, sender originalfil:", err);
      await saveChecklistItem(item, file);
    }
  };

  const startRecording = async (itemId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const item = items.find((i) => i.id === itemId);
        if (item) saveChecklistItem(item, undefined, audioBlob);
      };

      mediaRecorder.start();
      setRecordingId(itemId);
    } catch (err) {
      alert("Kunne ikke starte mikrofon. Vennligst sjekk tillatelser.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingId) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setRecordingId(null);
    }
  };

  const addExtraObservation = () => {
    const newIdx = items.length + 1;
    const newItem: ChecklistItem = {
      id: `${activeTemplate}-custom-${Date.now()}`,
      title: `${newIdx}. Ekstra observasjon / Tilleggspunkt`,
      info: "Fritekstpunkt for spesielle funn på dette taket.",
      status: "tg1",
      note: ""
    };
    setItems((prev) => [...prev, newItem]);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-4 mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h4 className="font-bold text-sm text-[#F5B800] uppercase tracking-wider">
            Teknisk Sjekkliste ({activeTemplate.toUpperCase()})
          </h4>
          <span className="text-xs text-slate-400 font-semibold">
            {items.length} kontrollpunkter (inkl. fritekst/ekstra observasjoner)
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {(["flatt", "skratak", "balkong"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleTemplateChange(key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTemplate === key ? "bg-[#F5B800] text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              {key === "flatt" ? "Flatt tak" : key === "skratak" ? "Skråtak" : "Balkong"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div 
            key={item.id} 
            className={`p-4 rounded-xl border transition-all ${
              item.id.includes("extra") || item.id.includes("custom")
                ? "bg-slate-950/90 border-amber-500/40"
                : "bg-slate-950 border-slate-800/80"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`font-bold text-xs ${item.id.includes("extra") || item.id.includes("custom") ? "text-amber-400" : "text-slate-200"}`}>
                  {item.title}
                </span>
                <button
                  type="button"
                  onClick={() => setOpenInfoId(openInfoId === item.id ? null : item.id)}
                  className={`p-1 rounded-full transition-colors cursor-pointer ${
                    openInfoId === item.id ? "bg-amber-500 text-slate-950" : "text-slate-500 hover:text-amber-400"
                  }`}
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* TG Vurdering */}
              <div className="flex items-center gap-1 flex-wrap">
                {(["tg0", "tg1", "tg2", "tg3", "ikke_aktuell"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      updateStatus(item.id, st);
                      saveChecklistItem({ ...item, status: st });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all ${
                      item.status === st
                        ? st === "tg0" ? "bg-emerald-500 text-slate-950"
                        : st === "tg1" ? "bg-amber-400 text-slate-950"
                        : st === "tg2" ? "bg-orange-500 text-white"
                        : st === "tg3" ? "bg-red-600 text-white animate-pulse"
                        : "bg-slate-700 text-white"
                        : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    {st === "tg0" && <CheckCircle2 className="w-3 h-3" />}
                    {st === "tg1" && <AlertCircle className="w-3 h-3" />}
                    {st === "tg2" && <AlertTriangle className="w-3 h-3" />}
                    {st === "tg3" && <ShieldAlert className="w-3 h-3" />}
                    {st === "ikke_aktuell" && <XCircle className="w-3 h-3" />}
                    {st.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* TEK17 Kravforklaring */}
            {openInfoId === item.id && (
              <div className="p-3 mt-2 bg-slate-900 border-l-4 border-[#F5B800] rounded-r-xl text-xs text-slate-300">
                <strong className="text-[#F5B800] block mb-1 uppercase text-[10px]">Byggforsk & TEK17 Krav / Hjelp:</strong>
                {item.info}
              </div>
            )}

            {/* Felt for Notat, Bilde & Lydnotat */}
            <div className="space-y-2 mt-3 pt-2 border-t border-slate-900">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Beskriv avvik, tilkomst, spesiell skade eller utdypende observasjon..."
                  value={item.note}
                  onChange={(e) => updateNote(item.id, e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-amber-500"
                />

                {/* Bilde-knapp med automatisk komprimering */}
                <label className="p-2 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700 rounded-lg cursor-pointer flex items-center justify-center" title="Legg til bilde for dette punktet">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handlePhotoSelect(item, e.target.files[0]);
                      }
                    }}
                  />
                </label>

                {/* Lydnotat-knapp */}
                {recordingId === item.id ? (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="p-2 bg-red-600 text-white rounded-lg animate-pulse flex items-center gap-1 text-xs font-bold cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5" /> Stopp
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => startRecording(item.id)}
                    className="p-2 bg-slate-900 hover:bg-slate-800 text-red-400 border border-slate-700 rounded-lg cursor-pointer"
                    title="Ta lydnotat for dette punktet"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}

                {/* Lagre-knapp */}
                <button
                  type="button"
                  onClick={() => saveChecklistItem(item)}
                  disabled={savingId === item.id}
                  className="px-3 py-2 bg-[#F5B800] text-slate-950 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {savingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Lagre
                </button>
              </div>

              {/* Visuelle vedlegg for sjekkpunktet */}
              {(item.photoUrl || item.audioUrl) && (
                <div className="flex items-center gap-4 bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-xs">
                  {item.photoUrl && (
                    <a href={item.photoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-amber-400 hover:underline">
                      <Camera className="w-3.5 h-3.5" /> Vis Bilde
                    </a>
                  )}
                  {item.audioUrl && (
                    <div className="flex items-center gap-2">
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                      <audio src={item.audioUrl} controls className="h-6 w-48" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* KNAPP FOR Å LEGGE TIL FLERE EGENDEFINERTE OBSERVASJONSPUNKTER */}
      <div className="pt-2">
        <button
          type="button"
          onClick={addExtraObservation}
          className="w-full py-3 bg-slate-950 hover:bg-slate-800 border border-dashed border-amber-500/50 hover:border-amber-500 text-amber-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" /> Legg til ekstra observasjonspunkt (Bilder/Lyd/Notat)
        </button>
      </div>
    </div>
  );
}