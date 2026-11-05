import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCheck,
  Loader2,
  MessageSquare,
  Send,
} from "lucide-react";
import { apiUrl } from "../lib/api";

interface MessageRow {
  id: number;
  thread_id: number;
  inquiry_id: number;
  sender_type: "customer" | "admin" | "project_manager";
  sender_id?: number | null;
  sender_name?: string | null;
  recipient_type: "customer" | "admin" | "project_manager";
  recipient_id?: number | null;
  recipient_name?: string | null;
  message: string;
  is_internal: number | boolean;
  channel: string;
  delivery_status: string;
  sent_at?: string | null;
  read_at?: string | null;
  created_at: string;
}

interface CustomerInquiryMessagesProps {
  inquiryId: number;
  customerId?: number | null;
  customerName?: string | null;
  showComposer?: boolean;
  refreshKey?: number;
}

export default function CustomerInquiryMessages({
  inquiryId,
  customerId,
  customerName,
  showComposer = true,
  refreshKey = 0,
}: CustomerInquiryMessagesProps) {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const visibleMessages = useMemo(
    () =>
      messages.filter(
        (item) =>
          !Boolean(Number(item.is_internal)) &&
          (item.sender_type === "customer" ||
            item.recipient_type === "customer")
      ),
    [messages]
  );

  const fetchMessages = async () => {
    if (!inquiryId) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        apiUrl(`/messages.php?inquiry_id=${inquiryId}`)
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke hente meldinger.");
      }

      const rows: MessageRow[] = Array.isArray(data.messages)
        ? data.messages
        : [];

      const customerVisible = rows.filter(
        (item) =>
          !Boolean(Number(item.is_internal)) &&
          (item.sender_type === "customer" ||
            item.recipient_type === "customer")
      );

      setMessages(customerVisible);

      const unreadIncoming = customerVisible.filter(
        (item) =>
          item.sender_type !== "customer" &&
          item.recipient_type === "customer" &&
          !item.read_at
      );

      if (unreadIncoming.length > 0) {
        await Promise.all(
          unreadIncoming.map((item) =>
            fetch(apiUrl("/messages.php"), {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                message_id: item.id,
              }),
            })
          )
        );

        setMessages((current) =>
          current.map((item) =>
            unreadIncoming.some((unread) => unread.id === item.id)
              ? {
                  ...item,
                  read_at: item.read_at || new Date().toISOString(),
                }
              : item
          )
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kunne ikke hente meldinger."
      );
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const text = messageText.trim();
    if (!text || sending || !inquiryId) return;

    setSending(true);
    setError("");

    try {
      const res = await fetch(apiUrl("/messages.php"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inquiry_id: inquiryId,
          sender_type: "customer",
          sender_id: customerId || undefined,
          sender_name: customerName || "Kunde",
          recipient_type: "project_manager",
          subject: `Sak #${inquiryId}`,
          message: text,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke sende meldingen.");
      }

      setMessageText("");

      if (data.data) {
        setMessages((current) => [...current, data.data]);
      } else {
        await fetchMessages();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kunne ikke sende meldingen."
      );
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [inquiryId, refreshKey]);

  const formatTime = (value?: string | null) => {
    if (!value) return "";

    const normalized = value.includes("T")
      ? value
      : value.replace(" ", "T");

    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("nb-NO", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0b0f17]">
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 p-5 md:p-6">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-white">
            <MessageSquare className="h-5 w-5 text-[#F5B800]" />
            Meldinger
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Send melding direkte til prosjektansvarlig om denne saken.
          </p>
        </div>

        <span className="shrink-0 text-[10px] font-bold text-slate-500">
          {visibleMessages.length} meldinger
        </span>
      </div>

      {error && (
        <div className="mx-5 mt-5 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 md:mx-6">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="p-5 md:p-6">
        {loading ? (
          <div className="flex h-36 items-center justify-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-[#F5B800]" />
            Henter meldinger...
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="flex h-36 flex-col items-center justify-center text-center">
            <MessageSquare className="mb-3 h-8 w-8 text-slate-700" />
            <p className="text-xs font-bold text-slate-400">
              Ingen meldinger ennå
            </p>
            <p className="mt-1 text-[11px] text-slate-600">
              Du kan starte en samtale med prosjektansvarlig nedenfor.
            </p>
          </div>
        ) : (
          <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
            {visibleMessages.map((item) => {
              const outgoing = item.sender_type === "customer";

              return (
                <div
                  key={item.id}
                  className={`flex ${
                    outgoing ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 md:max-w-[72%] ${
                      outgoing
                        ? "rounded-br-md bg-[#F5B800] text-slate-950"
                        : "rounded-bl-md border border-slate-800 bg-slate-900 text-slate-200"
                    }`}
                  >
                    <span
                      className={`block text-[10px] font-extrabold ${
                        outgoing ? "text-slate-800" : "text-slate-400"
                      }`}
                    >
                      {item.sender_name ||
                        (outgoing ? customerName || "Kunde" : "Prosjektansvarlig")}
                    </span>

                    <p className="mt-1 whitespace-pre-wrap text-xs leading-5">
                      {item.message}
                    </p>

                    <div
                      className={`mt-2 flex items-center justify-end gap-1 text-[9px] ${
                        outgoing ? "text-slate-700" : "text-slate-500"
                      }`}
                    >
                      {formatTime(item.sent_at || item.created_at)}
                      {outgoing && item.read_at && (
                        <CheckCheck className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showComposer && (
        <div className="border-t border-slate-800 bg-slate-950/40 p-5 md:p-6">
          <div className="flex items-end gap-3">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            rows={3}
            placeholder="Skriv melding til prosjektansvarlig..."
            className="flex-1 resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white focus:border-[#F5B800] focus:outline-none"
          />

          <button
            type="button"
            onClick={sendMessage}
            disabled={sending || !messageText.trim()}
            className="flex h-[66px] items-center gap-2 rounded-xl bg-[#F5B800] px-5 text-xs font-extrabold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send
          </button>
        </div>

          <p className="mt-2 text-[10px] text-slate-600">
            Enter sender · Shift + Enter lager ny linje
          </p>
        </div>
      )}
    </section>
  );
}
