import { useMemo, useState } from "react";
import type { CalculationLine, OfferCalculation } from "./OfferCalculator";

/**
 * Standalone, opt-in work-template picker for the existing OfferGenerator.
 * No API calls, writes, or automatic changes to the current offer.
 * Quantities and prices are intentionally NOT inferred.
 */
type WorkTemplate = {
  id: string;
  title: string;
  description: string;
  tasks: readonly {
    category: CalculationLine["category"];
    description: string;
    unit: string;
  }[];
};

const TEMPLATES: readonly WorkTemplate[] = [
  {
    id: "flat-roof", title: "Omtekking av flatt tak",
    description: "Arbeidsstruktur som tilpasses valgt tekkesystem og dokumenterte forhold.",
    tasks: [
      { category: "labor", description: "Rigging, sikring og klargjøring", unit: "time" },
      { category: "labor", description: "Fjerning og håndtering av eksisterende tekking etter avtalt omfang", unit: "time" },
      { category: "material", description: "Takbelegg – mengde og type må bekreftes", unit: "m²" },
      { category: "labor", description: "Legging og detaljarbeid med nytt takbelegg", unit: "time" },
      { category: "other", description: "Avfallshåndtering – kontroller behov", unit: "stk" },
    ],
  },
  {
    id: "roof-drain", title: "Utskifting av taksluk",
    description: "Kontroller type sluk, undertak og overgang før valg av løsning.",
    tasks: [
      { category: "labor", description: "Åpning og klargjøring rundt eksisterende sluk", unit: "time" },
      { category: "material", description: "Taksluk – spesifikasjon må bekreftes", unit: "stk" },
      { category: "labor", description: "Montering og vanntett tilslutning", unit: "time" },
    ],
  },
  {
    id: "flashing", title: "Beslag og overganger",
    description: "Tilpasses mål, underlag og valgt materiale.",
    tasks: [
      { category: "material", description: "Beslag – profil og materiale må avklares", unit: "lm" },
      { category: "labor", description: "Demontering, tilpassing og montering av beslag", unit: "time" },
      { category: "other", description: "Festemidler og tettemateriell – kontroller behov", unit: "stk" },
    ],
  },
  {
    id: "standing-seam", title: "Båndtekking",
    description: "Kontroller takfall, underlag, innfesting og nødvendig vindlastdimensjonering.",
    tasks: [
      { category: "material", description: "Båndtekkingsmateriale – type og mengde må avklares", unit: "m²" },
      { category: "material", description: "Klammere / innfesting – prosjekteringsgrunnlag kreves", unit: "stk" },
      { category: "labor", description: "Tilpassing og montering av båndtekking", unit: "time" },
    ],
  },
];

export type TemplateSuggestion = Pick<CalculationLine, "category" | "description" | "unit">;

type Props = {
  onApplySuggestions: (suggestions: TemplateSuggestion[]) => void;
  disabled?: boolean;
};

export default function OfferWorkTemplates({ onApplySuggestions, disabled = false }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(TEMPLATES[0].id);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const template = useMemo(
    () => TEMPLATES.find((item) => item.id === selectedTemplate) ?? TEMPLATES[0],
    [selectedTemplate],
  );
  const allSelected = template.tasks.filter((_, index) => selectedRows.includes(index));

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4" aria-label="Arbeidsmalbibliotek">
      <h3 className="text-sm font-black text-white">Arbeidsmalbibliotek</h3>
      <p className="mt-1 text-xs text-slate-400">
        Velg arbeidsoperasjoner som forslag. Ingen eksisterende post, pris eller tilbud endres automatisk.
      </p>
      <label className="mt-4 block text-xs font-bold text-slate-300" htmlFor="offer-work-template">
        Arbeidstype
      </label>
      <select
        id="offer-work-template"
        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-white"
        value={selectedTemplate}
        onChange={(event) => {
          setSelectedTemplate(event.target.value);
          setSelectedRows([]);
        }}
        disabled={disabled}
      >
        {TEMPLATES.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select>
      <p className="mt-2 text-xs text-slate-400">{template.description}</p>
      <div className="mt-3 space-y-2">
        {template.tasks.map((task, index) => (
          <label className="flex items-start gap-2 rounded-lg border border-slate-800 p-2 text-xs text-slate-200" key={`${template.id}-${index}`}>
            <input
              type="checkbox"
              className="mt-0.5"
              checked={selectedRows.includes(index)}
              disabled={disabled}
              onChange={(event) => setSelectedRows((current) => event.target.checked
                ? [...current, index]
                : current.filter((value) => value !== index))}
            />
            <span>{task.description} <span className="text-slate-500">({task.unit})</span></span>
          </label>
        ))}
      </div>
      <p className="mt-3 text-xs text-amber-200">
        Alle foreslåtte mengder og kostpriser må fylles inn og kontrolleres før bruk i et tilbud.
      </p>
      <button
        type="button"
        className="mt-3 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 disabled:opacity-40"
        disabled={disabled || allSelected.length === 0}
        onClick={() => {
          onApplySuggestions(allSelected.map(({ category, description, unit }) => ({ category, description, unit })));
          setSelectedRows([]);
        }}
      >
        Legg til {allSelected.length} valgte forslag
      </button>
    </section>
  );
}

/** Optional pure helper for a later, explicitly approved integration. */
export function appendWorkSuggestions(
  existing: OfferCalculation,
  suggestions: TemplateSuggestion[],
): OfferCalculation {
  const additions: CalculationLine[] = suggestions.map((suggestion) => ({
    ...suggestion,
    id: `template-${crypto.randomUUID()}`,
    quantity: 0,
    unit_cost: 0,
    markup_percent: 0,
  }));
  return { ...existing, lines: [...existing.lines, ...additions] };
}
