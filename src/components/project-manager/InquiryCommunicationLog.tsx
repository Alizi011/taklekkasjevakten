import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Mail,
  MessageSquare,
  RefreshCw,
  Smartphone,
  User,
  Users,
} from "lucide-react";
import { apiUrl } from "../../lib/api";

type CommunicationChannel =
  | "sms"
  | "email"
  | "portal"
  | "internal"
  | "system";

interface CommunicationItem {
  id: string;
  source: string;
  source_id: number;
  inquiry_id: number;
  channel: CommunicationChannel;
  direction: "incoming" | "outgoing" | "internal";
  sender_type?: string | null;
  sender_id?: number | null;
  sender_name?: string | null;
  recipient_type?: string | null;
  recipient_id?: number | null;
  recipient_name?: string | null;
  recipient_address?: string | null;
  subject?: string | null;
  message?: string | null;
  delivery_status?: string | null;
  provider?: string | null;
  provider_message_id?: string | null;
  event_type?: string | null;
  occurred_at: string;
}

interface CommunicationResponse {
  success: boolean;
  inquiry_id?: number;
  items?: CommunicationItem[];
  message?: string;
}

interface InquiryCommunicationLogProps {
  inquiryId: number;
}

const channelLabel = (channel: CommunicationChannel) => {
  switch (channel) {
    case "sms":
      return "SMS";
    case "email":
      return "E-post";
    case "portal":
      return "Portalmelding";
    case "internal":
      return "Intern";
    case "system":
      return "System";
    default:
      return channel;
  }
};

const deliveryLabel = (status?: string | null) => {
  const normalized = String(status || "").toLowerCase();

  if (["sent", "delivered", "success"].includes(normalized)) {
    return "Sendt";
  }

  if (["queued", "pending"].includes(normalized)) {
    return "I kø";
  }

  if (["failed", "error"].includes(normalized)) {
    return "Feilet";
  }

  if (["read", "opened"].includes(normalized)) {
    return "Lest";
  }

  return status || "Registrert";
};

const formatTime = (value: string) => {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export default function InquiryCommunicationLog({
  inquiryId,
}: InquiryCommunicationLogProps) {
  const [items, setItems] = useState<CommunicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [channelFilter, setChannelFilter] = useState<
    "all" | CommunicationChannel
  >("all");

  const fetchLog = async () => {
    if (!inquiryId) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        apiUrl(`/inquiry_communication_log.php?inquiry_id=${inquiryId}`)
      );
      const data: CommunicationResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Kunne ikke hente kommunikasjonsloggen."
        );
      }

      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setItems([]);
      setError(
        err instanceof Error
          ? err.message
          : "Kunne ikke hente kommunikasjonsloggen."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLog();
  }, [inquiryId]);

  const visibleItems = useMemo(() => {
    if (channelFilter === "all") return items;
    return items.filter((item) => item.channel === channelFilter);
  }, [items, channelFilter]);

  const channelIcon = (channel: CommunicationChannel) => {
    switch (channel) {
      case "sms":
        return Smartphone;
      case "email":
        return Mail;
      case "portal":
        return MessageSquare;
      case "internal":
        return Users;
      case "system":
        return Clock3;
      default:
        return MessageSquare;
    }
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0b0f17]">
      <div className="flex flex-col gap-4 border-b border-slate-800 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Sak #{inquiryId}
          </p>
          <h2 className="mt-1 text-base font-black text-white">
            Kommunikasjonslogg
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            SMS, e-post, portalmeldinger og automatiske varsler samlet kronologisk.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLog}
          disabled={loading}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 text-xs font-extrabold text-slate-300 transition hover:text-white disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Oppdater
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-800 px-5 py-3">
        {(
          [
            ["all", "Alle"],
            ["sms", "SMS"],
            ["email", "E-post"],
            ["portal", "Portal"],
            ["internal", "Intern"],
            ["system", "System"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setChannelFilter(value)}
            className={`rounded-xl border px-3 py-2 text-[10px] font-extrabold transition ${
              channelFilter === value
                ? "border-[#F5B800]/40 bg-[#F5B800]/10 text-[#F5B800]"
                : "border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="m-5 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[260px] items-center justify-center gap-3 text-xs text-slate-500">
          <RefreshCw className="h-4 w-4 animate-spin text-[#F5B800]" />
          Henter kommunikasjonslogg...
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
          <MessageSquare className="h-8 w-8 text-slate-700" />
          <p className="mt-3 text-xs font-extrabold text-slate-400">
            Ingen kommunikasjon registrert
          </p>
          <p className="mt-1 max-w-md text-[11px] leading-5 text-slate-600">
            Nye SMS-er, e-poster og portalmeldinger vil vises her når de blir registrert på saken.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/80">
          {visibleItems.map((item) => {
            const Icon = channelIcon(item.channel);
            const outgoing = item.direction === "outgoing";
            const recipient =
              item.recipient_name ||
              item.recipient_address ||
              item.recipient_type ||
              "Ukjent mottaker";
            const sender =
              item.sender_name || item.sender_type || "System";

            return (
              <article
                key={item.id}
                className="grid gap-4 px-5 py-5 md:grid-cols-[44px_minmax(0,1fr)_auto]"
              >
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-800 bg-slate-950">
                  <Icon className="h-4 w-4 text-[#F5B800]" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
                      {channelLabel(item.channel)}
                    </span>

                    <span className="text-[10px] font-extrabold text-slate-500">
                      {outgoing
                        ? `Til ${recipient}`
                        : item.direction === "incoming"
                        ? `Fra ${sender}`
                        : sender}
                    </span>
                  </div>

                  {item.subject && (
                    <p className="mt-3 text-xs font-extrabold text-white">
                      {item.subject}
                    </p>
                  )}

                  {item.message && (
                    <p className="mt-2 whitespace-pre-wrap text-[11px] leading-5 text-slate-300">
                      {item.message}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-slate-600">
                    {item.sender_name && (
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Avsender: {item.sender_name}
                      </span>
                    )}
                    {item.provider && <span>Via: {item.provider}</span>}
                    {item.provider_message_id && (
                      <span>ID: {item.provider_message_id}</span>
                    )}
                  </div>
                </div>

                <div className="flex min-w-[130px] flex-col items-start gap-2 md:items-end">
                  <span className="text-[10px] font-bold text-slate-500">
                    {formatTime(item.occurred_at)}
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9px] font-black text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    {deliveryLabel(item.delivery_status)}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
