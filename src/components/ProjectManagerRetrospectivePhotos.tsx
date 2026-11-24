import { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";

type Photo = { id: number; caption?: string | null; taken_at?: string | null };
type DisplayPhoto = Photo & { src: string };

export default function ProjectManagerRetrospectivePhotos({ inquiryId }: { inquiryId: number }) {
  const [photos, setPhotos] = useState<DisplayPhoto[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const urls: string[] = [];
    setPhotos([]);
    setError("");
    setLoading(true);

    const run = async () => {
      const sessionToken = window.localStorage.getItem("taklekkasjevakten_project_manager_session");
      if (!sessionToken) throw new Error("Prosjektlederinnlogging kreves.");
      const request = async (payload: Record<string, unknown>) => fetch(
        apiUrl("/project_manager_core_case_photos.php"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          signal: controller.signal,
          body: JSON.stringify({ session_token: sessionToken, inquiry_id: inquiryId, ...payload })
        }
      );
      const listResponse = await request({ action: "list" });
      const data = await listResponse.json() as {
        success?: boolean; message?: string; photos?: Photo[]; inquiry_id?: number
      };
      if (!listResponse.ok || !data.success || data.inquiry_id !== inquiryId ||
          !Array.isArray(data.photos)) {
        throw new Error(data.message || "Kunne ikke hente prosjektbilder.");
      }
      const loaded: DisplayPhoto[] = [];
      // Bound concurrent image requests so the server is not overwhelmed.
      for (const row of data.photos.slice(0, 30)) {
        if (controller.signal.aborted) break;
        const response = await request({ action: "photo", photo_id: row.id });
        if (!response.ok || !(response.headers.get("content-type") || "").startsWith("image/")) {
          throw new Error("Bildedokumentasjon er ikke tilgjengelig.");
        }
        const blob = await response.blob();
        const src = URL.createObjectURL(blob);
        urls.push(src);
        loaded.push({ ...row, src });
      }
      if (!cancelled) setPhotos(loaded);
    };
    void run().catch(e => {
      if (!cancelled) setError(e instanceof Error ? e.message : "Kunne ikke hente prosjektbilder.");
    }).finally(() => { if (!cancelled) setLoading(false); });

    return () => {
      cancelled = true;
      controller.abort();
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [inquiryId]);

  return (
    <section className="mb-4 space-y-3 rounded-xl border border-slate-700 bg-slate-950/75 p-4 text-slate-100"
      aria-label="Tidligere bildedokumentasjon">
      <h3 className="text-sm font-black text-white">Eksisterende bildedokumentasjon fra Perun Core</h3>
      <p className="text-xs text-slate-300">
        Les bildene før du etterregistrerer. De beviser ikke automatisk at alle kontrollpunkter ble undersøkt.
        Bildene er kun tilgjengelige for tildelt prosjektansvarlig.
      </p>
      {loading && <p className="text-xs text-slate-400">Henter bilder fra Core …</p>}
      {error && <p role="alert" className="text-xs text-amber-300">{error}</p>}
      {!loading && !error && photos.length === 0 &&
        <p className="text-xs text-slate-400">Ingen importerte prosjektbilder.</p>}
      {photos.length > 0 && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {photos.map(photo => <a key={photo.id} href={photo.src} target="_blank" rel="noopener noreferrer"
          className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
          <img src={photo.src} alt={photo.caption || `Bilde #${photo.id}`}
            loading="lazy" className="h-40 w-full object-cover" />
          <p className="break-words p-2 text-xs text-slate-100">{photo.caption || `Bilde #${photo.id}`}</p>
        </a>)}
      </div>}
      <p className="text-[11px] text-slate-400">Opptaksdato kan ikke bekreftes ut fra importdato eller filnavn.</p>
    </section>
  );
}
