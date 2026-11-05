import { useMemo, useState } from "react";
import { Calculator, CirclePlus } from "lucide-react";
import type { CalculationLine } from "./OfferCalculator";

/**
 * Frivillig mengdeberegning. Ingen API-kall, ingen automatisk lagring og ingen
 * endring av eksisterende priser eller poster. Verdier må kontrolleres på stedet.
 */
export type QuantitySuggestion = Pick<CalculationLine, "category" | "description" | "quantity" | "unit">;

type Props = {
  onApplySuggestions?: (suggestions: QuantitySuggestion[]) => void;
  disabled?: boolean;
};

const asNumber = (raw: string) => {
  const num = Number(raw.replace(",", "."));
  return Number.isFinite(num) && num >= 0 ? num : 0;
};
const fmt = (value: number, digits = 2) =>
  value.toLocaleString("nb-NO", { maximumFractionDigits: digits });

export default function OfferQuantityCalculator({ onApplySuggestions, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [slope, setSlope] = useState("0");
  const [waste, setWaste] = useState("10");
  const [effectiveRollArea, setEffectiveRollArea] = useState("");
  const [flashingMeters, setFlashingMeters] = useState("");
  const [pieceLength, setPieceLength] = useState("");
  const [includeRoof, setIncludeRoof] = useState(true);
  const [includeRolls, setIncludeRolls] = useState(false);
  const [includeFlashing, setIncludeFlashing] = useState(true);
  const [notice, setNotice] = useState("");

  const results = useMemo(() => {
    const l = asNumber(length);
    const w = asNumber(width);
    const degrees = Math.min(89.9, asNumber(slope));
    const angleFactor = 1 / Math.cos((degrees * Math.PI) / 180);
    const roofArea = l * w * angleFactor;
    const extra = Math.min(100, asNumber(waste));
    const materialArea = roofArea * (1 + extra / 100);
    const rollCoverage = asNumber(effectiveRollArea);
    const rolls = rollCoverage > 0 ? Math.ceil(materialArea / rollCoverage) : null;
    const flashing = asNumber(flashingMeters);
    const profileLength = asNumber(pieceLength);
    const pieces = profileLength > 0 ? Math.ceil(flashing / profileLength) : null;
    return { roofArea, materialArea, rolls, flashing, pieces };
  }, [length, width, slope, waste, effectiveRollArea, flashingMeters, pieceLength]);

  const add = () => {
    if (!onApplySuggestions || disabled) return;
    if (includeRoof && includeRolls && results.roofArea > 0 && results.rolls !== null) {
      setNotice("Velg enten m² eller ruller for takbelegg, ikke begge. Dette hindrer dobbeltprising.");
      return;
    }
    const suggestions: QuantitySuggestion[] = [];
    if (includeRoof && results.roofArea > 0) {
      suggestions.push({ category: "material", description: "Takbelegg – beregnet areal inkl. tillegg (kontroller teknisk løsning)", quantity: Number(results.materialArea.toFixed(3)), unit: "m²" });
    }
    if (includeRolls && results.rolls !== null && results.roofArea > 0) {
      suggestions.push({ category: "material", description: "Takbelegg – ruller (effektiv dekning må bekreftes)", quantity: results.rolls, unit: "stk" });
    }
    if (includeFlashing && results.flashing > 0) {
      suggestions.push({ category: "material", description: "Beslag – målt lengde", quantity: Number(results.flashing.toFixed(3)), unit: "lm" });
    }
    if (!suggestions.length) {
      setNotice("Fyll inn mål og velg minst én beregnet mengde først.");
      return;
    }
    onApplySuggestions(suggestions);
    setNotice(`${suggestions.length} mengdeforslag ble sendt til kalkylen med kostpris 0. Kontroller før lagring.`);
  };

  const field = (label: string, val: string, set: (v: string) => void, placeholder: string) => (
    <label className="block text-xs font-bold text-slate-300">
      {label}
      <input type="number" min="0" step="any" value={val} placeholder={placeholder}
        onChange={(e) => { set(e.target.value); setNotice(""); }} disabled={disabled}
        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs text-white outline-none focus:border-amber-500/50" />
    </label>
  );

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4" aria-label="Mengde- og materialkalkulator">
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left text-sm font-black text-white">
        <span className="inline-flex items-center gap-2"><Calculator className="h-4 w-4 text-amber-300" />Mengde- og materialkalkulator</span>
        <span className="text-xs text-amber-300">{open ? "Lukk −" : "Åpne +"}</span>
      </button>
      {!open ? null : (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-slate-400">Internt beregningsverktøy. Bruk mål fra dokumentasjon eller oppmåling; ingen priser endres automatisk.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {field("Lengde (m)", length, setLength, "f.eks. 10")}
            {field("Bredde (m)", width, setWidth, "f.eks. 7,5")}
            {field("Takvinkel (grader)", slope, setSlope, "0 for flatt tak")}
            {field("Tillegg / svinn (%)", waste, setWaste, "f.eks. 10")}
            {field("Effektiv dekning per rull (m²)", effectiveRollArea, setEffectiveRollArea, "fra produktblad")}
          </div>
          <p className="text-[11px] text-slate-500">Lengde × bredde forutsettes å være horisontale planmål. Angi 0° dersom målene allerede beskriver faktisk takflate. Effektiv rulledekning må ta hensyn til overlapp og produkttype. Svinn er et separat anslag.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-900 p-3"><div className="text-[10px] text-slate-400">Takflate</div><strong className="text-white">{fmt(results.roofArea)} m²</strong></div>
            <div className="rounded-xl bg-slate-900 p-3"><div className="text-[10px] text-slate-400">Belegg inkl. tillegg</div><strong className="text-white">{fmt(results.materialArea)} m²</strong></div>
            <div className="rounded-xl bg-slate-900 p-3"><div className="text-[10px] text-slate-400">Antall ruller</div><strong className="text-white">{results.rolls === null ? "Angi rulledekning" : `${results.rolls} stk`}</strong></div>
          </div>
          <div className="border-t border-slate-800 pt-4">
            <h4 className="mb-3 text-xs font-black text-white">Beslag</h4>
            <div className="grid grid-cols-2 gap-3">
              {field("Samlet beslaglengde (lm)", flashingMeters, setFlashingMeters, "målte løpemeter")}
              {field("Lengde per profil (m, valgfritt)", pieceLength, setPieceLength, "f.eks. 2")}
            </div>
            <p className="mt-2 text-xs text-slate-400">Antall hele profiler: {results.pieces === null ? "angi profillengde" : results.pieces}. Kapping, skjøter og ekstra lengde må vurderes separat.</p>
          </div>
          {onApplySuggestions && (
            <div className="border-t border-slate-800 pt-4">
              <p className="mb-2 text-xs font-bold text-white">Velg hvilke mengder som skal legges til som nye poster</p>
              <div className="space-y-2 text-xs text-slate-300">
                <label className="flex gap-2"><input type="checkbox" checked={includeRoof} onChange={(e) => setIncludeRoof(e.target.checked)} /> Takbelegg i m²</label>
                <label className="flex gap-2"><input type="checkbox" checked={includeRolls} onChange={(e) => setIncludeRolls(e.target.checked)} /> Takbelegg i ruller (alternativ måleenhet – ikke dobbeltpris)</label>
                <label className="flex gap-2"><input type="checkbox" checked={includeFlashing} onChange={(e) => setIncludeFlashing(e.target.checked)} /> Beslag i løpemeter</label>
              </div>
              <p className="mt-2 text-[11px] text-amber-300">Velg enten m² eller ruller som prisbærende takbeleggspost for å unngå dobbeltfakturering.</p>
              <button type="button" onClick={add} disabled={disabled}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-slate-950 disabled:opacity-40">
                <CirclePlus className="h-4 w-4" />Legg valgte mengder til kalkyle
              </button>
            </div>
          )}
          {notice && <p role="status" className="text-xs text-amber-200">{notice}</p>}
        </div>
      )}
    </section>
  );
}
