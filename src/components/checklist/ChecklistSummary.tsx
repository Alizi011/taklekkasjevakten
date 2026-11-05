interface ChecklistSummaryProps {
  tg0: number;
  tg1: number;
  tg2: number;
  tg3: number;
  notApplicable: number;
}

export default function ChecklistSummary({
  tg0,
  tg1,
  tg2,
  tg3,
  notApplicable,
}: ChecklistSummaryProps) {
  const entries = [
    {
      label: "TG0",
      value: tg0,
      className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    },
    {
      label: "TG1",
      value: tg1,
      className: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    },
    {
      label: "TG2",
      value: tg2,
      className: "border-orange-500/25 bg-orange-500/10 text-orange-300",
    },
    {
      label: "TG3",
      value: tg3,
      className: "border-red-500/25 bg-red-500/10 text-red-300",
    },
    {
      label: "Ikke aktuell",
      value: notApplicable,
      className: "border-slate-200 bg-white text-slate-600",
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map((entry) => (
        <div
          key={entry.label}
          className={`rounded-xl border px-3 py-2 ${entry.className}`}
        >
          <span className="text-[9px] uppercase tracking-wider font-black opacity-80">
            {entry.label}
          </span>
          <span className="ml-2 text-sm font-black">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}