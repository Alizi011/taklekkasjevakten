import { Sparkles, ArrowRight, HardHat } from "lucide-react";
import FadeIn from "../components/FadeIn";

interface ValuePropositionProps {
  onOpenContact: () => void;
}

export default function ValuePropositionSection({ onOpenContact }: ValuePropositionProps) {
  return (
    <section className="py-16 px-4 md:px-8 bg-slate-950 text-white relative overflow-hidden border-b border-slate-800/80">
      {/* Bakgrunnsglød */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 text-center">
        
        {/* Hovedoverskrift fra Om Oss */}
        <FadeIn>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 text-[#F5B800] border border-amber-500/30 text-xs font-bold uppercase tracking-wider rounded-full mb-4 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            Ingeniørkompetanse på taket
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
            Vi fjernet gjetning fra <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#FCD34D] via-[#F5B800] to-[#B45309] bg-clip-text text-transparent">
              tak- og lekkasjebransjen
            </span>
          </h2>
          <p className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto mb-10 leading-relaxed">
            <strong className="text-white font-semibold">Perun AS ble bygget på én klar visjon:</strong> Når en lekkasje oppstår, trenger du fakta – ikke kostbare antakelser. Vi kombinerer dyp bygningsteknisk ingeniørinnsikt med umiddelbar, praktisk utførelse.
          </p>
        </FadeIn>

        {/* Det Råe Millionbeløp-Kortet */}
        <FadeIn delay={0.2}>
          <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-500/15 border border-[#F5B800]/40 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-[#F5B800] text-[11px] font-bold uppercase rounded-md mb-3 border border-amber-500/30">
              <HardHat className="w-3.5 h-3.5" /> Ekte Besparelse
            </div>

            <span className="text-4xl md:text-6xl font-black bg-gradient-to-r from-[#FCD34D] via-[#F5B800] to-amber-500 bg-clip-text text-transparent block mb-2 tracking-tight">
              Millionbeløp spart
            </span>

            <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
              Vi kamuflerer ikke salg som "gratis befaring"
            </h3>

            <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-3xl mx-auto mb-6 font-normal">
              Mange i bransjen står på bakkeplan, gjør en rask visuell sjekk og konkluderer med at hele taket må skiftes ut. Våre ingeniører klatrer opp, finner den reelle årsaken og utbedrer feilen der det er mulig – noe som har spart kundene våre for enorme beløp.
            </p>

            <button
              type="button"
              onClick={onOpenContact}
              className="inline-flex items-center gap-2 bg-[#F5B800] hover:bg-[#e0a800] text-gray-950 font-extrabold px-6 py-3.5 rounded-2xl text-xs md:text-sm transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              Få Ekte Fakta Om Ditt Tak
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </FadeIn>

      </div>
    </section>
  );
}