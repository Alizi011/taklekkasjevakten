import { useEffect, useState } from "react";
import { MessageSquare, ScrollText } from "lucide-react";
import ProjectManagerMessages from "./ProjectManagerMessages";
import InquiryCommunicationLog from "./InquiryCommunicationLog";

interface InquiryItem {
  id: number | string;
  customer_id?: number | string | null;
  customer_name?: string;
  customerName?: string;
  address?: string;
  postal_code?: string;
  city?: string;
}

interface ProjectManagerCommunicationProps {
  inquiries: InquiryItem[];
  projectManagerId?: number | null;
  projectManagerName?: string | null;
  onUnreadCountChange?: (count: number) => void;
  onOpenInquiry?: (inquiryId: number) => void;
}

const normalizeInquiryId = (value: number | string | undefined) => {
  const id = Number(value);
  return Number.isFinite(id) ? id : 0;
};

const customerName = (inquiry: InquiryItem) =>
  inquiry.customer_name || inquiry.customerName || "Kunde";

const addressLabel = (inquiry: InquiryItem) =>
  [inquiry.address, inquiry.postal_code, inquiry.city]
    .filter(Boolean)
    .join(", ");

export default function ProjectManagerCommunication({
  inquiries,
  projectManagerId,
  projectManagerName,
  onUnreadCountChange,
  onOpenInquiry,
}: ProjectManagerCommunicationProps) {
  const [mode, setMode] = useState<"messages" | "log">("messages");
  const [activeLogInquiryId, setActiveLogInquiryId] = useState<number | null>(
    null
  );

  useEffect(() => {
    setActiveLogInquiryId((current) => {
      if (
        current &&
        inquiries.some(
          (inquiry) => normalizeInquiryId(inquiry.id) === current
        )
      ) {
        return current;
      }

      const firstId = inquiries.length
        ? normalizeInquiryId(inquiries[0].id)
        : 0;

      return firstId || null;
    });
  }, [inquiries]);

  return (
    <div className="max-w-[1500px] mx-auto space-y-4">
      <section className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800 bg-[#0b0f17] p-2">
        <button
          type="button"
          onClick={() => setMode("messages")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
            mode === "messages"
              ? "bg-[#F5B800] text-slate-950"
              : "text-slate-400 hover:bg-slate-900 hover:text-white"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Samtaler
        </button>

        <button
          type="button"
          onClick={() => setMode("log")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
            mode === "log"
              ? "bg-[#F5B800] text-slate-950"
              : "text-slate-400 hover:bg-slate-900 hover:text-white"
          }`}
        >
          <ScrollText className="h-4 w-4" />
          Kommunikasjonslogg
        </button>
      </section>

      {mode === "messages" ? (
        <ProjectManagerMessages
          inquiries={inquiries}
          projectManagerId={projectManagerId}
          projectManagerName={projectManagerName}
          onUnreadCountChange={onUnreadCountChange}
          onOpenInquiry={onOpenInquiry}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0b0f17]">
            <div className="border-b border-slate-800 px-5 py-4">
              <h2 className="text-sm font-black text-white">
                Velg sak
              </h2>
              <p className="mt-1 text-[10px] text-slate-500">
                Kommunikasjon vises per oppdrag.
              </p>
            </div>

            <div className="max-h-[680px] overflow-y-auto">
              {inquiries.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Ingen tildelte saker.
                </div>
              ) : (
                inquiries.map((inquiry) => {
                  const inquiryId = normalizeInquiryId(inquiry.id);
                  const active = activeLogInquiryId === inquiryId;

                  return (
                    <button
                      key={inquiryId}
                      type="button"
                      onClick={() => setActiveLogInquiryId(inquiryId)}
                      className={`w-full border-b border-slate-800/70 px-4 py-4 text-left transition ${
                        active
                          ? "bg-[#F5B800]/10"
                          : "hover:bg-slate-900/60"
                      }`}
                    >
                      <p
                        className={`truncate text-xs font-extrabold ${
                          active ? "text-[#F5B800]" : "text-white"
                        }`}
                      >
                        Sak #{inquiryId} · {customerName(inquiry)}
                      </p>
                      {addressLabel(inquiry) && (
                        <p className="mt-1 truncate text-[10px] text-slate-600">
                          {addressLabel(inquiry)}
                        </p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <div className="min-w-0">
            {activeLogInquiryId ? (
              <InquiryCommunicationLog inquiryId={activeLogInquiryId} />
            ) : (
              <section className="flex min-h-[320px] items-center justify-center rounded-3xl border border-slate-800 bg-[#0b0f17] p-8 text-center text-xs text-slate-500">
                Velg en sak for å se kommunikasjonsloggen.
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
