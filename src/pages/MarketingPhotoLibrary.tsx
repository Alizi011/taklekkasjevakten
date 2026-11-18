import { useEffect, useMemo, useState } from "react";
import { ImageIcon, RefreshCw, Search } from "lucide-react";
import { apiAssetUrl, apiUrl } from "../lib/api";

type LibraryPhoto = {
  id: number;
  inquiry_id: number;
  photo_url: string;
  caption_text?: string | null;
  customer_name?: string | null;
  address?: string | null;
  city?: string | null;
  visible_to_customer?: number | string | boolean;
  created_at?: string | null;
};

export default function MarketingPhotoLibrary() {
  const [photos, setPhotos] = useState<LibraryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    void fetch(apiUrl("/admin_marketing_photo_library.php"), {
      credentials: "include",
      cache: "no-store"
    })
      .then(async response => {
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.photos)) {
          throw new Error(data.message || "Kunne ikke hente bildebiblioteket.");
        }
        if (!cancelled) setPhotos(data.photos as LibraryPhoto[]);
      })
      .catch(err => {
        if (!cancelled) setError(
          err instanceof Error ? err.message : "Kunne ikke hente bildene."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [refresh]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("nb-NO");
    if (!query) return photos;
    return photos.filter(photo =>
      [
        photo.id,
        photo.inquiry_id,
        photo.customer_name,
        photo.caption_text,
        photo.address,
        photo.city
      ].join(" ").toLocaleLowerCase("nb-NO").includes(query)
    );
  }, [photos, search]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-800 bg-[#32121d] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black text-white">
              <ImageIcon className="h-5 w-5 text-amber-300" />
              Bildebibliotek
            </h2>
            <p className="mt-2 text-xs text-slate-300">
              Bilder valgt fra kundesaker til mulig markedsføring.
              Dette biblioteket er adskilt fra reklamemotoren.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRefresh(n => n + 1)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
            Oppdater
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-[#1b0b12] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-white">
            {photos.length} bilder valgt til markedsføring
          </p>
          <label className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Søk bilde, kunde eller sak..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-white"
            />
          </label>
        </div>

        {loading && <p className="mt-6 text-sm text-slate-400">Henter bilder…</p>}
        {error && <p role="alert" className="mt-6 text-sm text-red-300">{error}</p>}

        {!loading && !error && filtered.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center">
            <p className="text-sm font-bold text-white">
              {photos.length === 0
                ? "Ingen bilder er valgt til markedsføring ennå."
                : "Ingen bilder matcher søket."}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Bilder velges fra den enkelte sak i administrasjonen.
            </p>
          </div>
        )}

        {!loading && !error && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(photo => (
              <article
                key={photo.id}
                className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950/60"
              >
                <a
                  href={apiAssetUrl(photo.photo_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={apiAssetUrl(photo.photo_url)}
                    alt={photo.caption_text || `Saksbilde ${photo.id}`}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </a>
                <div className="space-y-2 p-4">
                  <p className="text-sm font-bold text-white">
                    {photo.caption_text || `Bilde #${photo.id}`}
                  </p>
                  <p className="text-xs text-slate-300">
                    Sak #{photo.inquiry_id}
                    {photo.customer_name ? ` · ${photo.customer_name}` : ""}
                  </p>
                  <p className="text-xs text-slate-400">
                    {[photo.address, photo.city].filter(Boolean).join(", ")}
                  </p>
                  <p className="text-xs text-amber-300">
                    Valgt til markedsføring · Ikke automatisk publisert
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}