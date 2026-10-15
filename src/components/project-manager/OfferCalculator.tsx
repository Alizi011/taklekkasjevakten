import { useMemo } from "react";
import {
  Calculator,
  CirclePlus,
  Trash2,
} from "lucide-react";
export type PricingMode = "hourly" | "fixed";
export interface CalculationLine {
  id: string;
  category: "labor" | "material" | "equipment" | "subcontractor" | "other";
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  markup_percent: number;
}
export interface OfferCalculation {
  pricingMode: PricingMode;
  lines: CalculationLine[];
  overheadPercent: number;
  contingencyPercent: number;
  discountPercent: number;
  vatPercent: number;
}
interface OfferCalculatorProps {
  value: OfferCalculation;
  onChange: (value: OfferCalculation) => void;
}
const categoryLabel: Record<CalculationLine["category"], string> = {
  labor: "Arbeid",
  material: "Materialer",
  equipment: "Utstyr / maskin",
  subcontractor: "Underentreprenør",
  other: "Annet",
};
const money = (value: number) =>
  Math.round(Number.isFinite(value) ? value : 0).toLocaleString("nb-NO");
export function calculateOffer(value: OfferCalculation) {
  const lineResults = value.lines.map((line) => {
    const isHourlyLabor =
      value.pricingMode === "hourly" && line.category === "labor";
    const cost = isHourlyLabor
      ? 0
      : Math.max(0, line.quantity) * Math.max(0, line.unit_cost);
    const markup = cost * (Math.max(0, line.markup_percent) / 100);
    return {
      ...line,
      cost,
      markup,
      sell: isHourlyLabor ? Math.max(0, line.unit_cost) : cost + markup,
    };
  });
  const directCost = lineResults.reduce((sum, line) => sum + line.cost, 0);
  const beforeOverhead = lineResults.reduce((sum, line) => sum + line.sell, 0);
  const overhead = beforeOverhead * (Math.max(0, value.overheadPercent) / 100);
  const beforeContingency = beforeOverhead + overhead;
  const contingency =
    beforeContingency * (Math.max(0, value.contingencyPercent) / 100);
  const beforeDiscount = beforeContingency + contingency;
  const discount = beforeDiscount * (Math.max(0, value.discountPercent) / 100);
  const exclVat = Math.max(0, beforeDiscount - discount);
  const vat = exclVat * (Math.max(0, value.vatPercent) / 100);
  const inclVat = exclVat + vat;
  const grossProfit = exclVat - directCost;
  const grossMarginPercent = exclVat > 0 ? (grossProfit / exclVat) * 100 : 0;
  return {
    lineResults,
    directCost,
    overhead,
    contingency,
    discount,
    exclVat,
    vat,
    inclVat,
    grossProfit,
    grossMarginPercent,
  };
}
function newLine(category: CalculationLine["category"] = "labor"): CalculationLine {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    category,
    description: category === "labor" ? "Arbeid / service" : "",
    quantity: 1,
    unit: category === "labor" ? "time" : "stk",
    unit_cost: 0,
    markup_percent: category === "labor" ? 0 : 15,
  };
}
export const EMPTY_CALCULATION: OfferCalculation = {
  pricingMode: "hourly",
  lines: [
    {
      id: "labor-1",
      category: "labor",
      description: "Arbeid / service",
      quantity: 1,
      unit: "time",
      unit_cost: 1960,
      markup_percent: 0,
    },
    {
      id: "vehicle-1",
      category: "equipment",
      description: "Servicebil & rigg",
      quantity: 1,
      unit: "dag",
      unit_cost: 340,
      markup_percent: 0,
    },
  ],
  overheadPercent: 0,
  contingencyPercent: 0,
  discountPercent: 0,
  vatPercent: 25,
};
export default function OfferCalculator({
  value,
  onChange,
}: OfferCalculatorProps) {
  const totals = useMemo(() => calculateOffer(value), [value]);
  const patchLine = (id: string, patch: Partial<CalculationLine>) => {
    onChange({
      ...value,
      lines: value.lines.map((line) =>
        line.id === id ? { ...line, ...patch } : line
      ),
    });
  };
  const removeLine = (id: string) => {
    const line = value.lines.find((item) => item.id === id);
    if (!line) return;
    if (!window.confirm(`Fjerne «${line.description || categoryLabel[line.category]}» fra kalkulasjonen?`)) return;
    onChange({
      ...value,
      lines: value.lines.filter((item) => item.id !== id),
    });
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-amber-300" />
            <p className="text-xs font-black text-white">
              Kalkulasjon og prismodell
            </p>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {value.pricingMode === "hourly"
              ? "Ved timesats angis bare avtalte satser. Kunden skal ikke se et estimert timeforbruk."
              : "Ved fastpris kan timer og øvrige kostnader kalkuleres internt uten at kunden ser timegrunnlaget."}
          </p>
        </div>
        <div className="grid grid-cols-2 rounded-xl border border-slate-800 bg-[#08111d] p-1">
          <button
            type="button"
            onClick={() => onChange({ ...value, pricingMode: "hourly" })}
            className={`rounded-lg px-4 py-2 text-[11px] font-black ${
              value.pricingMode === "hourly"
                ? "bg-[#F5B800] text-slate-950"
                : "text-slate-500"
            }`}
          >
            Timesats
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...value, pricingMode: "fixed" })}
            className={`rounded-lg px-4 py-2 text-[11px] font-black ${
              value.pricingMode === "fixed"
                ? "bg-[#F5B800] text-slate-950"
                : "text-slate-500"
            }`}
          >
            Fastpris
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-800">
        <div className="border-b border-slate-800 bg-slate-950/70 px-3 py-2 text-[10px] font-bold text-slate-400">Kalkulasjonsposter – velg kategori, beskrivelse, mengde, enhet, sats og påslag</div>
        <div className="divide-y divide-slate-800">
          {value.lines.map((line) => {
            const result = totals.lineResults.find((item) => item.id === line.id);
            return (
              <div
                key={line.id}
                className="relative grid min-w-0 grid-cols-1 gap-2 bg-[#0b0f17] px-3 pb-3 pt-12 sm:grid-cols-2 xl:grid-cols-3"
              >
                <button
                  type="button"
                  onClick={() => removeLine(line.id)}
                  aria-label={`Fjern ${line.description || categoryLabel[line.category]} fra kalkulasjonen`}
                  title="Fjern kalkulasjonspost"
                  className="absolute right-3 top-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/35 bg-red-500/10 text-red-300 transition hover:border-red-400 hover:bg-red-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <select
                  value={line.category}
                  onChange={(event) =>
                    patchLine(line.id, {
                      category: event.target.value as CalculationLine["category"],
                    })
                  }
                  className="rounded-xl border border-slate-800 bg-[#08111d] px-2.5 py-2 text-[11px] font-bold text-slate-300 outline-none"
                >
                  {Object.entries(categoryLabel).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  value={line.description}
                  onChange={(event) =>
                    patchLine(line.id, { description: event.target.value })
                  }
                  placeholder="Arbeid eller kostnadspost"
                  className="rounded-xl border border-slate-800 bg-[#08111d] px-3 py-2 text-[11px] text-slate-200 outline-none"
                />
                {value.pricingMode === "hourly" &&
                line.category === "labor" ? (
                  <>
                    <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950/45 px-3 py-2 text-[10px] font-bold text-slate-500">
                      Ikke estimert
                    </div>
                    <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950/45 px-3 py-2 text-[10px] font-bold text-slate-500">
                      pr. time
                    </div>
                  </>
                ) : (
                  <>
                    <input
                      type="number"
                      min={0}
                      step="0.25"
                      value={line.quantity}
                      onChange={(event) =>
                        patchLine(line.id, {
                          quantity: Number(event.target.value),
                        })
                      }
                      className="rounded-xl border border-slate-800 bg-[#08111d] px-2.5 py-2 text-[11px] text-slate-200 outline-none"
                    />
                    <input
                      value={line.unit}
                      onChange={(event) =>
                        patchLine(line.id, { unit: event.target.value })
                      }
                      className="rounded-xl border border-slate-800 bg-[#08111d] px-2.5 py-2 text-[11px] text-slate-200 outline-none"
                    />
                  </>
                )}
                <input
                  type="number"
                  min={0}
                  value={line.unit_cost}
                  onChange={(event) =>
                    patchLine(line.id, {
                      unit_cost: Number(event.target.value),
                    })
                  }
                  className="rounded-xl border border-slate-800 bg-[#08111d] px-2.5 py-2 text-[11px] text-slate-200 outline-none"
                />
                <input
                  type="number"
                  min={0}
                  value={line.markup_percent}
                  onChange={(event) =>
                    patchLine(line.id, {
                      markup_percent: Number(event.target.value),
                    })
                  }
                  className="rounded-xl border border-slate-800 bg-[#08111d] px-2.5 py-2 text-[11px] text-slate-200 outline-none"
                />
                <div className="col-span-full flex justify-end text-[10px] text-slate-400">
                  Salgsverdi post: <strong className="ml-1 text-slate-200">kr {money(result?.sell || 0)}</strong>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-slate-800 bg-slate-950/55 p-3">
          {(
            [
              ["labor", "Arbeid"],
              ["material", "Materiale"],
              ["equipment", "Utstyr"],
              ["subcontractor", "UE"],
              ["other", "Annet"],
            ] as Array<[CalculationLine["category"], string]>
          ).map(([category, label]) => (
            <button
              key={category}
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  lines: [...value.lines, newLine(category)],
                })
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-[10px] font-extrabold text-slate-300 hover:bg-slate-800"
            >
              <CirclePlus className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["overheadPercent", "Administrasjon / overhead %"],
          ["contingencyPercent", "Risiko / reserve %"],
          ["discountPercent", "Rabatt %"],
          ["vatPercent", "MVA %"],
        ].map(([key, label]) => (
          <label
            key={key}
            className="rounded-xl border border-slate-800 bg-slate-950/45 p-3"
          >
            <span className="block text-[9px] font-black uppercase tracking-wider text-slate-600">
              {label}
            </span>
            <input
              type="number"
              min={0}
              value={value[key as keyof OfferCalculation] as number}
              onChange={(event) =>
                onChange({
                  ...value,
                  [key]: Number(event.target.value),
                })
              }
              className="mt-1.5 w-full bg-transparent text-sm font-black text-white outline-none"
            />
          </label>
        ))}
      </div>
      {value.pricingMode === "hourly" && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.04] px-4 py-3 text-[11px] leading-5 text-slate-400">
          Ved timesats er arbeidets varighet ikke kalkulert. Total prosjektpris og endelig
          dekningsbidrag kan derfor først beregnes etter faktisk medgått tid. Materialer og
          øvrige kostnader kommer i tillegg etter faktisk forbruk dersom ikke annet er avtalt.
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Summary label="Direkte kost" value={`kr ${money(totals.directCost)}`} />
        <Summary label="Overhead" value={`kr ${money(totals.overhead)}`} />
        <Summary label="Reserve" value={`kr ${money(totals.contingency)}`} />
        <Summary label="Eks. mva" value={`kr ${money(totals.exclVat)}`} strong />
        <Summary label="Inkl. mva" value={`kr ${money(totals.inclVat)}`} strong />
        <Summary
          label="DB / margin"
          value={`kr ${money(totals.grossProfit)} · ${totals.grossMarginPercent.toFixed(
            1
          )}%`}
          strong
        />
      </div>
    </div>
  );
}
function Summary({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/55 p-3">
      <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
        {label}
      </p>
      <p
        className={`mt-1 text-xs ${
          strong ? "font-black text-white" : "font-extrabold text-slate-300"
        }`}
      >
        {value}
      </p>
    </div>
  );
}