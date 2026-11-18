import { useEffect, useState } from "react";
import { apiAssetUrl, apiUrl } from "../lib/api";

type CasePhoto = {
  id: number;
  inquiry_id: number;
  photo_url: string;
  caption_text?: string | null;
  documentation_phase?: number | null;
  created_at?: string | null;
};

type Props = {
  inquiryId: number;
  sessionToken: string;
  previewMode?: boolean;
};

export default function CustomerCasePhotoGallery({
  inquiryId,
  sessionToken,
  previewMode = false
}: Props) {
  const [photos, setPhotos] = useState<CasePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setPhotos([]);
    setError("");
    setLoading(true);

    void fetch(apiUrl("/customer_case_photos.php"), {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inquiry_id: inquiryId,
        session_token: sessionToken,
        preview_mode: previewMode
      })
    })
      .then(async response => {
        const data = await response.json();

        if (!response.ok || !data.success || !Array.isArray(data.photos)) {
          throw new Error(data.message || "Kunne ikke hente saksbildene.");
        }

        if (!cancelled) setPhotos(data.photos as CasePhoto[]);
      })
      .catch(err => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Kunne ikke hente saksbildene."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [inquiryId, sessionToken, previewMode]);

  if (loading) {
    return (
      <p className="text-sm text-slate-400">
        Henter bilder fra saken…
      </p>
    );
  }

  if (error) {
    return <p role="alert" className="text-sm text-red-300">{error}</p>;
  }

  if (photos.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-8 text-center">
        <p className="font-semibold text-white">
          Ingen bilder er delt ennå
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Bilder vises her når de er frigitt til deg av Taklekkasjevakten.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <p className="text-xs text-slate-400">
        {photos.length} {photos.length === 1 ? "bilde" : "bilder"} delt fra saken.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {photos.map(photo => (
          <a
            key={photo.id}
            href={apiAssetUrl(photo.photo_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/50 transition hover:border-amber-500/40"
            title="Åpne bilde i full størrelse"
          >
            <img
              src={apiAssetUrl(photo.photo_url)}
              alt={photo.caption_text || `Saksbilde ${photo.id}`}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
            />

            <div className="space-y-2 p-4">
              <p className="text-sm font-semibold text-white">
                {photo.caption_text || "Bilde fra saken"}
              </p>

              <p className="text-xs text-amber-300">
                Åpne bilde i full størrelse
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}