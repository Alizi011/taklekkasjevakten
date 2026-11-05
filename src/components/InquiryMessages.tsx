import { useEffect, useState } from "react";
import {
  Loader2,
  MessageSquare,
  Send,
  CheckCheck,
  AlertTriangle,
  Smartphone,
  CheckCircle2,
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

interface InquiryMessagesProps {
  inquiryId: number;
  projectManagerName?: string | null;
}

export default function InquiryMessages({
  inquiryId,
  projectManagerName,
}: InquiryMessagesProps) {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [messageText, setMessageText] = useState("");

  const [loading, setLoading] = useState(true);

  const [sending, setSending] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

      setMessages(rows);

      const unreadCustomerMessages = rows.filter(
        (message) =>
          message.sender_type === "customer" &&
          !message.read_at
      );

      await Promise.all(
        unreadCustomerMessages.map((message) =>
          fetch(apiUrl("/messages.php"), {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message_id: message.id,
            }),
          })
        )
      );

      if (unreadCustomerMessages.length > 0) {
        setMessages((current) =>
          current.map((message) =>
            unreadCustomerMessages.some(
              (unread) => unread.id === message.id
            )
              ? {
                  ...message,
                  read_at:
                    message.read_at || new Date().toISOString(),
                }
              : message
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

  /*
  |--------------------------------------------------------------------------
  | Send melding i kundeportalen
  |--------------------------------------------------------------------------
  */
  const sendMessage = async () => {
    const text = messageText.trim();

    if (!text || sending || sendingSms) return;

    setSending(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch(apiUrl("/messages.php"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inquiry_id: inquiryId,
          sender_type: "project_manager",
          sender_name: projectManagerName || "",
          recipient_type: "customer",
          message: text,
          subject: `Oppdrag #${inquiryId}`,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Kunne ikke sende meldingen."
        );
      }

      setMessageText("");
      setSuccessMessage("Meldingen er sendt til kundeportalen.");

      if (data.data) {
        setMessages((current) => [
          ...current,
          data.data,
        ]);
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

  /*
  |--------------------------------------------------------------------------
  | Send SMS via Strib
  |--------------------------------------------------------------------------
  |
  | Telefonnummer og Strib-konfigurasjon håndteres i backend.
  | Frontend sender aldri Strib API-nøkkel eller sender-ID.
  |--------------------------------------------------------------------------
  */
  const sendSms = async () => {
    const text = messageText.trim();

    if (!text || sendingSms || sending) return;

    const confirmed = window.confirm(
      "Vil du sende denne teksten som SMS til kunden?"
    );

    if (!confirmed) return;

    setSendingSms(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch(apiUrl("/send_sms.php"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inquiry_id: inquiryId,
          message: text,
          message_type: "transactional",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Kunne ikke sende SMS."
        );
      }

      setMessageText("");

      const sender =
        data?.strib?.sender || "Perun AS";

      setSuccessMessage(
        `SMS er sendt til Strib med ${sender} som avsender.`
      );

      /*
       * Vi gjør ingen endring i eksisterende meldingshistorikk her.
       * Strib-SMS håndteres separat fra kundeportalens meldinger.
       */
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kunne ikke sende SMS."
      );
    } finally {
      setSendingSms(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [inquiryId]);

  const formatTime = (value?: string | null) => {
    if (!value) return "";

    const normalized = value.includes("T")
      ? value
      : value.replace(" ", "T");

    const date = new Date(normalized);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("nb-NO", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <section className="bg-[#0b0f17] border border-slate-800 rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#F5B800]" />
            Meldinger
          </h3>

          <p className="text-xs text-slate-400 mt-1">
            Kommunikasjon mellom prosjektansvarlig og kunde.
          </p>
        </div>

        <span className="text-[10px] text-slate-500 font-bold">
          {messages.length} meldinger
        </span>
      </div>

      {error && (
        <div className="m-5 mb-0 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-300 flex gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="m-5 mb-0 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMessage}
        </div>
      )}

      <div className="p-5">
        {loading ? (
          <div className="h-40 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-[#F5B800]" />
            Henter meldinger...
          </div>
        ) : messages.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center">
            <MessageSquare className="w-8 h-8 text-slate-700 mb-3" />

            <p className="text-xs font-bold text-slate-400">
              Ingen meldinger ennå
            </p>

            <p className="text-[11px] text-slate-600 mt-1">
              Start samtalen med kunden nedenfor.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {messages.map((item) => {
              const outgoing =
                item.sender_type === "project_manager" ||
                item.sender_type === "admin";

              return (
                <div
                  key={item.id}
                  className={`flex ${
                    outgoing
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                      outgoing
                        ? "bg-[#F5B800] text-slate-950 rounded-br-md"
                        : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-md"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <span
                        className={`text-[10px] font-extrabold ${
                          outgoing
                            ? "text-slate-800"
                            : "text-slate-400"
                        }`}
                      >
                        {item.sender_name ||
                          (outgoing
                            ? "Prosjektansvarlig"
                            : "Kunde")}
                      </span>
                    </div>

                    <p className="text-xs whitespace-pre-wrap leading-5">
                      {item.message}
                    </p>

                    <div
                      className={`mt-2 flex items-center justify-end gap-1 text-[9px] ${
                        outgoing
                          ? "text-slate-700"
                          : "text-slate-500"
                      }`}
                    >
                      {formatTime(
                        item.sent_at || item.created_at
                      )}

                      {outgoing && item.read_at && (
                        <CheckCheck className="w-3 h-3 ml-1" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-5 border-t border-slate-800 bg-slate-950/40">
        <textarea
          value={messageText}
          onChange={(e) => {
            setMessageText(e.target.value);

            if (successMessage) {
              setSuccessMessage("");
            }
          }}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !sending &&
              !sendingSms
            ) {
              e.preventDefault();
              sendMessage();
            }
          }}
          rows={3}
          placeholder="Skriv melding til kunden..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white resize-none focus:outline-none focus:border-[#F5B800]"
        />

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={sendSms}
            disabled={
              sendingSms ||
              sending ||
              !messageText.trim()
            }
            className="h-11 px-5 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendingSms ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Smartphone className="w-4 h-4" />
            )}

            {sendingSms ? "Sender SMS..." : "Send SMS"}
          </button>

          <button
            type="button"
            onClick={sendMessage}
            disabled={
              sending ||
              sendingSms ||
              !messageText.trim()
            }
            className="h-11 px-5 bg-[#F5B800] hover:bg-amber-400 text-slate-950 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}

            {sending
              ? "Sender..."
              : "Send melding"}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-600">
          <span>
            Send melding → kundeportalen
          </span>

          <span>
            Send SMS → mobil via Strib / Perun AS
          </span>

          <span>
            Enter sender melding · Shift + Enter lager ny linje
          </span>
        </div>
      </div>
    </section>
  );
}