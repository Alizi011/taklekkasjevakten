import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCheck,
  Loader2,
  Mail,
  Search,
  Send,
  User,
} from "lucide-react";
import { apiUrl } from "../../lib/api";

interface InquiryItem {
  id: number | string;
  customer_id?: number | string | null;
  customer_name?: string;
  customerName?: string;
  address?: string;
  postal_code?: string;
  city?: string;
}

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

interface Conversation {
  inquiry: InquiryItem;
  messages: MessageRow[];
  unread: number;
  lastMessage: MessageRow | null;
}

interface ProjectManagerMessagesProps {
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

export default function ProjectManagerMessages({
  inquiries,
  projectManagerId,
  projectManagerName,
  onUnreadCountChange,
  onOpenInquiry,
}: ProjectManagerMessagesProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeInquiryId, setActiveInquiryId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const fetchConversations = async () => {
    setLoading(true);
    setError("");

    try {
      const rows = await Promise.all(
        inquiries.map(async (inquiry): Promise<Conversation> => {
          const inquiryId = normalizeInquiryId(inquiry.id);

          if (!inquiryId) {
            return {
              inquiry,
              messages: [],
              unread: 0,
              lastMessage: null,
            };
          }

          try {
            const res = await fetch(
              apiUrl(`/messages.php?inquiry_id=${inquiryId}`)
            );
            const data = await res.json();

            const allMessages: MessageRow[] =
              res.ok && data.success && Array.isArray(data.messages)
                ? data.messages
                : [];

            const visible = allMessages.filter(
              (message) =>
                !Boolean(Number(message.is_internal)) &&
                (message.sender_type === "customer" ||
                  message.recipient_type === "customer")
            );

            const unread = visible.filter(
              (message) =>
                message.sender_type === "customer" &&
                message.recipient_type === "project_manager" &&
                !message.read_at
            ).length;

            return {
              inquiry,
              messages: visible,
              unread,
              lastMessage: visible.length
                ? visible[visible.length - 1]
                : null,
            };
          } catch {
            return {
              inquiry,
              messages: [],
              unread: 0,
              lastMessage: null,
            };
          }
        })
      );

      const sorted = rows
        .filter((conversation) => conversation.messages.length > 0)
        .sort((a, b) => {
          const aDate = new Date(
            String(
              a.lastMessage?.sent_at ||
                a.lastMessage?.created_at ||
                "1970-01-01"
            ).replace(" ", "T")
          ).getTime();

          const bDate = new Date(
            String(
              b.lastMessage?.sent_at ||
                b.lastMessage?.created_at ||
                "1970-01-01"
            ).replace(" ", "T")
          ).getTime();

          return bDate - aDate;
        });

      setConversations(sorted);

      const totalUnread = sorted.reduce(
        (sum, conversation) => sum + conversation.unread,
        0
      );

      onUnreadCountChange?.(totalUnread);

      setActiveInquiryId((current) => {
        if (
          current &&
          sorted.some(
            (conversation) =>
              normalizeInquiryId(conversation.inquiry.id) === current
          )
        ) {
          return current;
        }

        return sorted[0]
          ? normalizeInquiryId(sorted[0].inquiry.id)
          : null;
      });
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

  useEffect(() => {
    fetchConversations();
  }, [inquiries]);

  const activeConversation =
    conversations.find(
      (conversation) =>
        normalizeInquiryId(conversation.inquiry.id) === activeInquiryId
    ) || null;

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;

    return conversations.filter((conversation) => {
      const inquiry = conversation.inquiry;

      return [
        customerName(inquiry),
        addressLabel(inquiry),
        `#${inquiry.id}`,
        conversation.lastMessage?.message || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [conversations, searchQuery]);

  const markConversationAsRead = async (conversation: Conversation) => {
    const unreadMessages = conversation.messages.filter(
      (message) =>
        message.sender_type === "customer" &&
        message.recipient_type === "project_manager" &&
        !message.read_at
    );

    if (unreadMessages.length === 0) return;

    try {
      await Promise.all(
        unreadMessages.map(async (message) => {
          const res = await fetch(apiUrl("/messages.php"), {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message_id: message.id,
            }),
          });

          const data = await res.json();

          if (!res.ok || !data.success) {
            throw new Error(
              data.message || "Kunne ikke markere meldingen som lest."
            );
          }
        })
      );

      const readAt = new Date().toISOString();

      setConversations((current) => {
        const updated = current.map((item) => {
          const itemInquiryId = normalizeInquiryId(item.inquiry.id);

          if (
            itemInquiryId !== normalizeInquiryId(conversation.inquiry.id)
          ) {
            return item;
          }

          return {
            ...item,
            unread: 0,
            messages: item.messages.map((message) =>
              unreadMessages.some(
                (unreadMessage) => unreadMessage.id === message.id
              )
                ? {
                    ...message,
                    read_at: message.read_at || readAt,
                  }
                : message
            ),
          };
        });

        onUnreadCountChange?.(
          updated.reduce((sum, item) => sum + item.unread, 0)
        );

        return updated;
      });
    } catch (err) {
      console.error("Kunne ikke markere samtalen som lest:", err);
    }
  };

  const openConversation = async (conversation: Conversation) => {
    const inquiryId = normalizeInquiryId(conversation.inquiry.id);
    if (!inquiryId) return;

    setActiveInquiryId(inquiryId);
    await markConversationAsRead(conversation);
  };

  const sendMessage = async () => {
    if (!activeConversation) return;

    const text = messageText.trim();
    if (!text || sending) return;

    const inquiryId = normalizeInquiryId(
      activeConversation.inquiry.id
    );

    if (!inquiryId) return;

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
          sender_type: "project_manager",
          sender_id: projectManagerId || undefined,
          sender_name: projectManagerName || undefined,
          recipient_type: "customer",
          subject: `Sak #${inquiryId}`,
          message: text,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Kunne ikke sende meldingen."
        );
      }

      setMessageText("");

      if (data.data) {
        setConversations((current) =>
          current.map((conversation) => {
            if (
              normalizeInquiryId(conversation.inquiry.id) !==
              inquiryId
            ) {
              return conversation;
            }

            const messages = [...conversation.messages, data.data];

            return {
              ...conversation,
              messages,
              lastMessage: data.data,
            };
          })
        );
      } else {
        await fetchConversations();
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

  const formatTime = (value?: string | null) => {
    if (!value) return "";

    const date = new Date(String(value).replace(" ", "T"));

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
    <div className="max-w-[1500px] mx-auto">
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0b0f17]">
        <div className="grid min-h-[680px] lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="border-b border-slate-800 bg-[#08111d] lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-800 p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                  <Mail className="h-5 w-5 text-[#F5B800]" />
                </div>
                <div>
                  <h2 className="font-black text-white">
                    Kundemeldinger
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Samtaler på dine oppdrag
                  </p>
                </div>
              </div>

              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                <input
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  placeholder="Søk kunde, adresse eller sak..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-9 pr-3 text-xs text-white outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <div className="max-h-[590px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center gap-2 p-8 text-xs text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                  Henter samtaler...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <Mail className="mx-auto h-8 w-8 text-slate-700" />
                  <p className="mt-3 text-xs font-bold text-slate-400">
                    Ingen meldinger ennå
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const inquiryId = normalizeInquiryId(
                    conversation.inquiry.id
                  );
                  const active = activeInquiryId === inquiryId;

                  return (
                    <button
                      key={inquiryId}
                      type="button"
                      onClick={() =>
                        openConversation(conversation)
                      }
                      className={`w-full border-b border-slate-800/70 p-4 text-left transition ${
                        active
                          ? "bg-amber-500/[0.07]"
                          : "hover:bg-slate-900/60"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-800 bg-slate-950">
                          <User className="h-4 w-4 text-slate-500" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-xs font-extrabold text-white">
                              {customerName(conversation.inquiry)}
                            </p>

                            {conversation.unread > 0 && (
                              <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-[#F5B800] px-1.5 py-0.5 text-[9px] font-black text-slate-950">
                                {conversation.unread > 9
                                  ? "9+"
                                  : conversation.unread}
                              </span>
                            )}
                          </div>

                          <p className="mt-1 truncate text-[10px] text-slate-600">
                            Sak #{conversation.inquiry.id}
                            {addressLabel(conversation.inquiry)
                              ? ` · ${addressLabel(
                                  conversation.inquiry
                                )}`
                              : ""}
                          </p>

                          <p
                            className={`mt-2 truncate text-[11px] ${
                              conversation.unread > 0
                                ? "font-bold text-slate-200"
                                : "text-slate-500"
                            }`}
                          >
                            {conversation.lastMessage?.message || ""}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <div className="flex min-w-0 flex-col">
            {!activeConversation ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <Mail className="h-10 w-10 text-slate-700" />
                <p className="mt-4 text-sm font-bold text-slate-300">
                  Velg en samtale
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Kundens meldingshistorikk vises her.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4 border-b border-slate-800 p-5">
                  <div>
                    <p className="text-sm font-black text-white">
                      {customerName(activeConversation.inquiry)}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Sak #{activeConversation.inquiry.id}
                      {addressLabel(activeConversation.inquiry)
                        ? ` · ${addressLabel(
                            activeConversation.inquiry
                          )}`
                        : ""}
                    </p>
                  </div>

                  {onOpenInquiry && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenInquiry(
                          normalizeInquiryId(
                            activeConversation.inquiry.id
                          )
                        )
                      }
                      className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] font-extrabold text-slate-300 transition hover:border-amber-500/30 hover:text-white"
                    >
                      Åpne oppdrag
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {error && (
                  <div className="mx-5 mt-5 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                  {activeConversation.messages.map((message) => {
                    const outgoing =
                      message.sender_type === "project_manager" ||
                      message.sender_type === "admin";

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          outgoing
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[86%] rounded-2xl px-4 py-3 md:max-w-[70%] ${
                            outgoing
                              ? "rounded-br-md bg-[#F5B800] text-slate-950"
                              : "rounded-bl-md border border-slate-800 bg-slate-900 text-slate-200"
                          }`}
                        >
                          <p
                            className={`text-[10px] font-extrabold ${
                              outgoing
                                ? "text-slate-800"
                                : "text-slate-400"
                            }`}
                          >
                            {message.sender_name ||
                              (outgoing
                                ? projectManagerName ||
                                  "Prosjektansvarlig"
                                : customerName(
                                    activeConversation.inquiry
                                  ))}
                          </p>

                          <p className="mt-1 whitespace-pre-wrap text-xs leading-5">
                            {message.message}
                          </p>

                          <div
                            className={`mt-2 flex items-center justify-end gap-1 text-[9px] ${
                              outgoing
                                ? "text-slate-700"
                                : "text-slate-500"
                            }`}
                          >
                            {formatTime(
                              message.sent_at ||
                                message.created_at
                            )}
                            {outgoing && message.read_at && (
                              <CheckCheck className="ml-1 h-3 w-3" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-slate-800 bg-slate-950/40 p-5">
                  <div className="flex items-end gap-3">
                    <textarea
                      value={messageText}
                      onChange={(event) =>
                        setMessageText(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          !event.shiftKey
                        ) {
                          event.preventDefault();
                          sendMessage();
                        }
                      }}
                      rows={3}
                      placeholder="Skriv melding til kunden..."
                      className="flex-1 resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-[#F5B800]"
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
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
