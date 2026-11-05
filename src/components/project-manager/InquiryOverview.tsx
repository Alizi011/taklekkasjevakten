import {
  ArrowUpRight,
  CalendarDays,
  MapPin,
  UserCheck,
} from "lucide-react";

export interface InquiryOverviewItem {
  id: number | string;
  customer_name?: string;
  customerName?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  status?: string;
  stage?: string;
  recommended_service?: string | null;
  booking_date?: string | null;
  booking_time?: string | null;
}

interface InquiryOverviewProps {
  title: string;
  subtitle?: string;
  inquiries: InquiryOverviewItem[];
  activeInquiryId?: number | null;
  onOpen: (id: number) => void;
  serviceLabel?: (service?: string | null) => string;
  stageLabel?: (stage?: string) => string;
  statusClass?: (status?: string) => string;
}

function nameOf(inquiry: InquiryOverviewItem) {
  return inquiry.customer_name || inquiry.customerName || "Ukjent kunde";
}

function addressOf(inquiry: InquiryOverviewItem) {
  return [inquiry.address, inquiry.postal_code, inquiry.city]
    .filter(Boolean)
    .join(", ");
}

export default function InquiryOverview({
  title,
  subtitle,
  inquiries,
  activeInquiryId,
  onOpen,
  serviceLabel = (value) => value || "Oppdrag",
  stageLabel = (value) => value || "Planlagt",
  statusClass = () => "bg-slate-800 text-slate-300 border-slate-700",
}: InquiryOverviewProps) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-5 md:p-6">
      <div className="flex items-end justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-black text-white">{title}</h3>
          {subtitle && (
            <p className="mt-1 text-[11px] text-slate-500">{subtitle}</p>
          )}
        </div>
        <span className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-[10px] font-black text-slate-400">
          {inquiries.length}
        </span>
      </div>

      {inquiries.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-600">
          Ingen oppdrag i denne gruppen.
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {inquiries.map((inquiry) => {
            const id = Number(inquiry.id);
            const active = activeInquiryId === id;

            return (
              <button
                key={inquiry.id}
                type="button"
                onClick={() => onOpen(id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  active
                    ? "border-amber-500/35 bg-amber-500/[0.045]"
                    : "border-slate-800 bg-slate-950/45 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-black text-white">
                        {nameOf(inquiry)}
                      </p>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${statusClass(
                          inquiry.status
                        )}`}
                      >
                        {inquiry.status || "Aktiv"}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {addressOf(inquiry) || "Adresse ikke oppgitt"}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5" />
                        {serviceLabel(inquiry.recommended_service)}
                      </span>
                      {inquiry.booking_date && (
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {inquiry.booking_date}
                          {inquiry.booking_time
                            ? ` ${String(inquiry.booking_time).substring(0, 5)}`
                            : ""}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-[10px] font-bold text-slate-600">
                      {stageLabel(inquiry.stage)}
                    </p>
                  </div>

                  <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-500" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}