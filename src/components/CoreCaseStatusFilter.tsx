import type {
  CoreCaseStatusCounts,
  CoreCaseStatusFilterValue,
} from "../lib/coreCaseStatusFilter";

type Props = {
  value: CoreCaseStatusFilterValue;
  counts: CoreCaseStatusCounts | null;
  onChange: (value: CoreCaseStatusFilterValue) => void;
  unavailableMessage?: string;
};

const options: readonly { value: CoreCaseStatusFilterValue; label: string }[] = [
  { value: "all", label: "Alle oppdrag" },
  { value: "active", label: "Aktive oppdrag" },
  { value: "on_hold", label: "På vent" },
  { value: "completed", label: "Fullførte oppdrag" },
  { value: "closed", label: "Lukkede oppdrag" },
  { value: "stopped", label: "Stansede oppdrag" },
];

export default function CoreCaseStatusFilter({ value, counts, onChange, unavailableMessage = "Core-status er utilgjengelig. Statusfiltrering kan ikke bekreftes." }: Props) {
  const available = counts !== null;

  return (
    <div>
      <select
        aria-label="Filtrer oppdrag etter hovedstatus fra Perun Core"
        aria-describedby={available ? undefined : "core-status-filter-help"}
        value={value}
        onChange={(event) => {
          const selected = options.find((option) => option.value === event.currentTarget.value);
          if (selected && (available || selected.value === "all")) onChange(selected.value);
        }}
        className="max-w-full rounded-lg border border-[#693546] bg-[#391a27] px-3 py-2 text-base font-black text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={!available && option.value !== "all"}
          >
            {option.value === "all"
              ? option.label
              : counts
                ? `${option.label} (${counts[option.value]})`
                : `${option.label} – utilgjengelig`}
          </option>
        ))}
      </select>
      {!available && (
        <p id="core-status-filter-help" className="mt-1 text-xs text-[#d9b8c3]">
          {unavailableMessage}
        </p>
      )}
    </div>
  );
}
