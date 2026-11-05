import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export type ProjectCalendarView = "maaned" | "uke" | "dag";

export interface CalendarProject {
  id: number | string;
  customer_name?: string;
  customerName?: string;
  address?: string;
  booking_date?: string | null;
  booking_time?: string | null;
  status?: string;
}

interface ProjectCalendarProps {
  title: string;
  view: ProjectCalendarView;
  onViewChange: (view: ProjectCalendarView) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  projects: CalendarProject[];
  onOpenProject: (id: number) => void;
}

function nameOf(project: CalendarProject) {
  return project.customer_name || project.customerName || "Ukjent kunde";
}

export default function ProjectCalendar({
  title,
  view,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  projects,
  onOpenProject,
}: ProjectCalendarProps) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-5 md:p-6">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10">
            <CalendarDays className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-black capitalize text-white">
              {title}
            </h3>
            <p className="text-[11px] text-slate-500">
              Planlagte oppdrag
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onPrevious}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onToday}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] font-extrabold text-slate-300 hover:bg-slate-800"
          >
            I dag
          </button>

          <button
            type="button"
            onClick={onNext}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="ml-1 flex rounded-xl border border-slate-800 bg-slate-950 p-1">
            {(["maaned", "uke", "dag"] as ProjectCalendarView[]).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => onViewChange(item)}
                  className={`rounded-lg px-3 py-1.5 text-[10px] font-black ${
                    view === item
                      ? "bg-[#F5B800] text-slate-950"
                      : "text-slate-500 hover:text-white"
                  }`}
                >
                  {item === "maaned"
                    ? "Måned"
                    : item === "uke"
                    ? "Uke"
                    : "Dag"}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {projects.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-600">
            Ingen planlagte oppdrag i valgt periode.
          </div>
        ) : (
          projects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => onOpenProject(Number(project.id))}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/45 p-4 text-left hover:border-amber-500/25"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-black text-white">
                    {nameOf(project)}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {project.address || "Adresse ikke oppgitt"}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs font-extrabold text-amber-300">
                    {project.booking_date || "Dato ikke satt"}
                  </p>
                  {project.booking_time && (
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      kl. {String(project.booking_time).substring(0, 5)}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}