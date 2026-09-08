import { CheckCircle2 } from "lucide-react";

interface ChecklistProgressProps {
  completed: number;
  total: number;
}

export default function ChecklistProgress({
  completed,
  total,
}: ChecklistProgressProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-black text-slate-500">
            Fremdrift
          </p>
          <p className="mt-1 text-sm font-black text-slate-950">
            {completed} av {total} kontrollpunkter registrert
          </p>
        </div>

        <div
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black ${
            completed === total && total > 0
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-slate-200 bg-white text-slate-700"
          }`}
        >
          {completed === total && total > 0 && (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {percent} %
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-[#F5B800] transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}