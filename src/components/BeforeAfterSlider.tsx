import { useState, useRef, useCallback, useEffect } from "react";

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeCaption?: string;
  afterCaption?: string;
  isCompact?: boolean; // Ny prop for små forsidekort
}

export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeCaption = "Før",
  afterCaption = "Etter",
  isCompact = false,
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;

    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;

    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden rounded-xl cursor-ew-resize group bg-slate-900 shadow-xl"
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onMouseMove={handleMouseMove}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={() => setIsDragging(false)}
      onTouchMove={handleTouchMove}
    >
      {/* ETTER-BILDE (Bakgrunn) */}
      <img
        src={afterSrc}
        alt={afterCaption}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* VANNMERKE ETTER */}
      <span className={`absolute ${isCompact ? "top-2 right-2 text-[9px] px-2 py-0.5" : "top-4 right-4 text-xs px-3 py-1.5"} z-10 bg-emerald-500/90 text-white font-black uppercase tracking-widest rounded-md shadow-md backdrop-blur-md border border-emerald-300 pointer-events-none`}>
        ✓ {afterCaption}
      </span>

      {/* FØR-BILDE (Beskåret overst) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none border-r-2 border-white/80"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={beforeSrc}
          alt={beforeCaption}
          className="absolute inset-0 h-full object-cover max-w-none"
          style={{
            width: containerWidth ? `${containerWidth}px` : "100%",
            height: "100%",
          }}
        />

        {/* VANNMERKE FØR */}
        <span className={`absolute ${isCompact ? "top-2 left-2 text-[9px] px-2 py-0.5" : "top-4 left-4 text-xs px-3 py-1.5"} z-10 bg-amber-500/90 text-slate-950 font-black uppercase tracking-widest rounded-md shadow-md backdrop-blur-md border border-amber-300 whitespace-nowrap`}>
          ⚠️ {beforeCaption}
        </span>
      </div>

      {/* DRA-HÅNDTAK I MIDTEN */}
      <div
        className="absolute top-0 bottom-0 z-30 w-1 bg-white/90 shadow-[0_0_10px_rgba(0,0,0,0.8)] cursor-ew-resize pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 ${isCompact ? "w-7 h-7" : "w-10 h-10"} bg-slate-950 text-[#F5B800] rounded-full shadow-2xl flex items-center justify-between px-1 border-2 border-[#F5B800]`}>
          <span className="text-[10px] font-black">‹</span>
          <span className="text-[10px] font-black">›</span>
        </div>
      </div>
    </div>
  );
}