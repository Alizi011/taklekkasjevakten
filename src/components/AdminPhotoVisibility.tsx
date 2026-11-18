import { useEffect, useState } from "react";
import { apiAssetUrl, apiUrl } from "../lib/api";

type Photo = {
  id: number;
  photo_url: string;
  caption_text?: string | null;
};

type Visibility = {
  id: number | string;
  visible_to_customer: number | string | boolean;
  marketing_selected: number | string | boolean;
};

type Props = {
  inquiryId: number;
  photos: Photo[];
};

export default function AdminPhotoVisibility({ inquiryId, photos }: Props) {
  const [settings, setSettings] = useState<Record<number, Visibility>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    setSettings({});
    setError("");
    setMessage("");
    setLoading(true);

    void fetch(
      apiUrl(`/admin_photo_visibility.php?inquiry_id=${inquiryId}`),
      { credentials: "include", cache: "no-store" }
    )
      .then(async response => {
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.photos)) {
          throw new Error(data.message || "Kunne ikke hente bildevalg.");
        }
        if (!cancelled) {
          const next: Record<number, Visibility> = {};
          for (const item of data.photos as Visibility[]) {
            next[Number(item.id)] = item;
          }
          setSettings(next);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Kunne ikke hente bildevalg.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [inquiryId]);

  async function save(
    photoId: number,
    field: "visible_to_customer" | "marketing_selected",
    checked: boolean
  ) {
    const previous = settings[photoId];
    if (!previous || saving !== null) return;

    const payload = {
      inquiry_id: inquiryId,
      photo_id: photoId,
      visible_to_customer:
        field === "visible_to_customer"
          ? checked
          : Boolean(Number(previous.visible_to_customer)),
      marketing_selected:
        field === "marketing_selected"
          ? checked
          : Boolean(Number(previous.marketing_selected))
    };

    setSaving(photoId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(apiUrl("/admin_photo_visibility.php"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok || !data.success || !data.photo) {
        throw new Error(data.message || "Lagring mislyktes.");
      }

      setSettings(old => ({
        ...old,
        [photoId]: data.photo as Visibility
      }));
      setMessage(`Bilde #${photoId}: Lagret.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lagring mislyktes.");
    } finally {
      setSaving(null);
    }
  }

  const images = photos.filter(p => Boolean(p.photo_url));

  return (
    <section className="mb-5 space-y-4 rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
      <div>
        <h3 className="text-sm font-bold text-white">
          Bildevalg for kunde og markedsføring
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          Velg hvilke bilder kunden får se og hvilke som er aktuelle for markedsføring.
          Originalbilder og rapporter endres ikke.
        </p>
      </div>

      {loading && <p className="text-xs text-slate-400">Henter bildevalg…</p>}
      {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
      {message && <p role="status" className="text-xs text-emerald-300">{message}</p>}

      {!loading && images.length === 0 && (
        <p className="text-xs text-slate-400">Ingen saksbilder registrert.</p>
      )}

      {!loading && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {images.map(photo => {
            const choice = settings[photo.id];
            return (
              <div key={photo.id} className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
                <img
                  src={apiAssetUrl(photo.photo_url)}
                  alt={photo.caption_text || `Bilde ${photo.id}`}
                  loading="lazy"
                  className="h-40 w-full object-cover"
                />
                <div className="space-y-3 p-3">
                  <p className="text-xs text-slate-300">
                    #{photo.id} · {photo.caption_text || "Uten bildetekst"}
                  </p>
                  <label className="flex items-center gap-2 text-xs text-white">
                    <input
                      type="checkbox"
                      disabled={!choice || saving !== null}
                      checked={Boolean(Number(choice?.visible_to_customer || 0))}
                      onChange={e => void save(photo.id, "visible_to_customer", e.target.checked)}
                    />
                    Vis i kundeportal
                  </label>
                  <label className="flex items-center gap-2 text-xs text-white">
                    <input
                      type="checkbox"
                      disabled={!choice || saving !== null}
                      checked={Boolean(Number(choice?.marketing_selected || 0))}
                      onChange={e => void save(photo.id, "marketing_selected", e.target.checked)}
                    />
                    Velg til markedsføring
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}