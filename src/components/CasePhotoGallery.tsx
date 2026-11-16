import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type CasePhoto = { id: number; src: string; caption?: string | null };

export default function CasePhotoGallery({ images }: { images: readonly CasePhoto[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const index = images.findIndex((image) => image.id === selectedId);
  const selected = images[index];

  function open(id: number, button: HTMLButtonElement) {
    opener.current = button;
    setSelectedId(id);
  }

  function move(offset: number) {
    if (selected && images.length > 1) {
      setSelectedId(images[(index + offset + images.length) % images.length].id);
    }
  }

  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Siste bilder fra saken</h3>
        <button type="button" disabled={!images.length} onClick={(event) => {
          event.stopPropagation();
          if (images[0]) open(images[0].id, event.currentTarget);
        }} className="text-xs font-semibold text-cyan-300 disabled:opacity-50">Vis alle →</button>
      </div>
      {images.length ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {images.slice(0, 6).map((image, imageIndex) => (
            <button type="button" key={image.id} aria-label={`Åpne bilde ${imageIndex + 1}`} onClick={(event) => {
              event.stopPropagation();
              open(image.id, event.currentTarget);
            }} className="aspect-square overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
              <img src={image.src} alt={image.caption || "Feltbilde"} className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      ) : <p className="mt-4 text-xs text-slate-400">Ingen feltbilder registrert</p>}

      <Dialog.Root open={Boolean(selected)} onOpenChange={(isOpen) => {
        if (!isOpen) setSelectedId(null);
      }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[120] bg-black/90" onClick={(event) => event.stopPropagation()} />
          <Dialog.Content aria-describedby={undefined}
            className="fixed left-1/2 top-1/2 z-[121] flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2 -translate-y-1/2 flex-col gap-3 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 p-4 text-white shadow-xl outline-none"
            onClick={(event) => event.stopPropagation()}
            onEscapeKeyDown={(event) => event.stopPropagation()}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              opener.current?.focus();
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                event.stopPropagation();
                move(event.key === "ArrowLeft" ? -1 : 1);
              }
            }}>
            <div className="flex items-center justify-between gap-3">
              <Dialog.Title className="text-sm font-bold">Bilder fra saken</Dialog.Title>
              <span aria-live="polite" aria-atomic="true" className="text-xs text-slate-300">Bilde {index + 1} av {images.length}</span>
              <Dialog.Close asChild>
                <button type="button" aria-label="Lukk bildeviser" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-700 hover:bg-slate-800"><X className="h-5 w-5" /></button>
              </Dialog.Close>
            </div>
            {selected && <>
              <div className="relative min-h-0 touch-pan-y"
                onTouchStart={(event) => {
                  touchStart.current = event.touches.length === 1
                    ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
                }}
                onTouchCancel={() => { touchStart.current = null; }}
                onTouchEnd={(event) => {
                  const start = touchStart.current;
                  touchStart.current = null;
                  if (!start || event.changedTouches.length !== 1 || event.touches.length) return;
                  const dx = event.changedTouches[0].clientX - start.x;
                  const dy = event.changedTouches[0].clientY - start.y;
                  if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1);
                }}>
                <img src={selected.src} alt={selected.caption || `Feltbilde ${index + 1}`} draggable={false} className="h-[55dvh] w-full object-contain" />
                <button type="button" aria-label="Forrige bilde" disabled={images.length < 2} onClick={() => move(-1)} className="absolute left-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg border border-slate-700 bg-slate-950/80 disabled:opacity-40"><ChevronLeft className="h-6 w-6" /></button>
                <button type="button" aria-label="Neste bilde" disabled={images.length < 2} onClick={() => move(1)} className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg border border-slate-700 bg-slate-950/80 disabled:opacity-40"><ChevronRight className="h-6 w-6" /></button>
              </div>
              {selected.caption && <p className="text-sm text-slate-300">{selected.caption}</p>}
              <nav aria-label="Velg bilde" className="flex shrink-0 gap-2 overflow-x-auto pb-1">
                {images.map((image, imageIndex) => (
                  <button type="button" key={image.id} aria-label={`Vis bilde ${imageIndex + 1}`} aria-current={image.id === selectedId ? "true" : undefined}
                    onClick={() => setSelectedId(image.id)} className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${image.id === selectedId ? "border-cyan-300" : "border-slate-700"}`}>
                    <img src={image.src} alt={image.caption || `Feltbilde ${imageIndex + 1}`} loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </nav>
            </>}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
