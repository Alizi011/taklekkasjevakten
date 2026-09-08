import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  Send,
  User,
  Users,
  X,
  Building2,
  Camera,
  FileText,
  Activity,
} from "lucide-react";
import { apiUrl } from "../../lib/api";

interface InquiryItem {
  id: number | string;
  customer_id?: number | string | null;
  customer_name?: string;
  customerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  status?: string;
  stage?: string;
  recommended_service?: string | null;
  created_at?: string;
  createdAt?: string;
}

interface ProjectManagerCustomersProps {
  inquiries: InquiryItem[];
  onOpenInquiry?: (inquiryId: number) => void;
}

interface CustomerGroup {
  key: string;
  customerId?: number | string | null;
  name: string;
  phone: string;
  email: string;
  addresses: string[];
  inquiries: InquiryItem[];
  latestInquiry: InquiryItem | null;
}

interface PropertyImageData {
  image_url: string;
  source: "streetview" | "satellite";
}

const normalizeInquiryId = (value: number | string | undefined) => {
  const id = Number(value);
  return Number.isFinite(id) ? id : 0;
};

const customerName = (inquiry: InquiryItem) =>
  String(inquiry.customer_name || inquiry.customerName || "Ukjent kunde").trim();

const fullAddress = (inquiry: InquiryItem) =>
  [inquiry.address, inquiry.postal_code, inquiry.city]
    .filter(Boolean)
    .join(", ");

const serviceLabel = (value?: string | null) => {
  switch (String(value || "").toLowerCase()) {
    case "lekkasjesok":
      return "Lekkasjesøk";
    case "service":
      return "Service";
    case "takkontroll":
      return "Takkontroll";
    case "digital_befaring":
      return "Digital befaring";
    default:
      return value || "Oppdrag";
  }
};

export default function ProjectManagerCustomers({
  inquiries,
  onOpenInquiry,
}: ProjectManagerCustomersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [messageCustomer, setMessageCustomer] = useState<CustomerGroup | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [messageSuccess, setMessageSuccess] = useState("");
  const [propertyImages, setPropertyImages] = useState<
    Record<number, PropertyImageData>
  >({});

  const customers = useMemo<CustomerGroup[]>(() => {
    const map = new Map<string, CustomerGroup>();

    inquiries.forEach((inquiry) => {
      const name = customerName(inquiry);
      const customerId =
        inquiry.customer_id !== null && inquiry.customer_id !== undefined
          ? inquiry.customer_id
          : null;

      const key = customerId
        ? `id:${customerId}`
        : `name:${name.toLowerCase()}|${String(inquiry.email || "").toLowerCase()}|${String(inquiry.phone || "")}`;

      const address = fullAddress(inquiry);

      if (!map.has(key)) {
        map.set(key, {
          key,
          customerId,
          name,
          phone: String(inquiry.phone || ""),
          email: String(inquiry.email || ""),
          addresses: address ? [address] : [],
          inquiries: [inquiry],
          latestInquiry: inquiry,
        });
        return;
      }

      const customer = map.get(key)!;
      customer.inquiries.push(inquiry);

      if (address && !customer.addresses.includes(address)) {
        customer.addresses.push(address);
      }

      if (!customer.phone && inquiry.phone) {
        customer.phone = String(inquiry.phone);
      }

      if (!customer.email && inquiry.email) {
        customer.email = String(inquiry.email);
      }

      const currentId = normalizeInquiryId(customer.latestInquiry?.id);
      const nextId = normalizeInquiryId(inquiry.id);

      if (nextId > currentId) {
        customer.latestInquiry = inquiry;
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "nb-NO")
    );
  }, [inquiries]);

  useEffect(() => {
    const latestIds = customers
      .map((customer) => normalizeInquiryId(customer.latestInquiry?.id))
      .filter((id) => id > 0);

    if (!latestIds.length) {
      setPropertyImages({});
      return;
    }

    let cancelled = false;

    const loadImages = async () => {
      const entries = await Promise.all(
        latestIds.map(async (inquiryId) => {
          try {
            const res = await fetch(
              apiUrl(`/property_image.php?inquiry_id=${inquiryId}`)
            );
            const data = await res.json();

            if (!res.ok || !data.success || !data.image_url) {
              return null;
            }

            const apiOrigin = new URL(apiUrl("/")).origin;

            return [
              inquiryId,
              {
                image_url: `${apiOrigin}${data.image_url}`,
                source: data.source,
              } as PropertyImageData,
            ] as const;
          } catch {
            return null;
          }
        })
      );

      if (cancelled) return;

      setPropertyImages(
        Object.fromEntries(
          entries.filter(
            (
              entry
            ): entry is readonly [number, PropertyImageData] => Boolean(entry)
          )
        )
      );
    };

    void loadImages();

    return () => {
      cancelled = true;
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;

    return customers.filter((customer) =>
      [
        customer.name,
        customer.phone,
        customer.email,
        ...customer.addresses,
        ...customer.inquiries.map((inquiry) => `#${inquiry.id}`),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [customers, searchQuery]);

  const openMessageComposer = (customer: CustomerGroup) => {
    setMessageCustomer(customer);
    setMessageText("");
    setMessageError("");
    setMessageSuccess("");
  };

  const closeMessageComposer = () => {
    if (sendingMessage) return;
    setMessageCustomer(null);
    setMessageText("");
    setMessageError("");
    setMessageSuccess("");
  };

  const sendMessageToCustomer = async () => {
    if (!messageCustomer) return;

    const latestInquiry = messageCustomer.latestInquiry;
    const inquiryId = normalizeInquiryId(latestInquiry?.id);
    const cleanMessage = messageText.trim();

    if (!inquiryId) {
      setMessageError("Fant ikke en gyldig sak for kunden.");
      return;
    }

    if (!cleanMessage) {
      setMessageError("Skriv en melding før du sender.");
      return;
    }

    setSendingMessage(true);
    setMessageError("");
    setMessageSuccess("");

    try {
      const res = await fetch(apiUrl("/messages.php"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inquiry_id: inquiryId,
          sender_type: "project_manager",
          recipient_type: "customer",
          subject: `Sak #${inquiryId}`,
          message: cleanMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke sende meldingen.");
      }

      setMessageText("");
      setMessageSuccess("Meldingen er sendt og arkivert på saken.");

      window.setTimeout(() => {
        setMessageCustomer(null);
        setMessageSuccess("");
      }, 1200);
    } catch (err) {
      setMessageError(
        err instanceof Error ? err.message : "Kunne ikke sende meldingen."
      );
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="max-w-[1500px] mx-auto space-y-5">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-400">
            Prosjektleder
          </p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">
            Kunder
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Kunder knyttet til dine tildelte oppdrag.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Søk kunde, adresse, telefon eller sak..."
              className="w-full rounded-xl border border-slate-800 bg-[#0b1725] py-3 pl-9 pr-3 text-xs text-white outline-none transition focus:border-[#F5B800]/70 sm:w-[360px]"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0b1725] px-4 py-3">
            <Users className="h-4 w-4 text-[#F5B800]" />
            <span className="text-xs font-extrabold text-slate-200">
              {customers.length} kunder
            </span>
          </div>
        </div>
      </section>

      {filteredCustomers.length === 0 ? (
        <section className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-12 text-center">
          <Users className="mx-auto h-9 w-9 text-slate-700" />
          <p className="mt-4 text-sm font-bold text-slate-300">
            Ingen kunder funnet
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Prøv et annet søk.
          </p>
        </section>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {filteredCustomers.map((customer) => {
            const latestInquiry = customer.latestInquiry;
            const latestInquiryId = normalizeInquiryId(latestInquiry?.id);
            const propertyImage = latestInquiryId
              ? propertyImages[latestInquiryId]
              : undefined;

            const activeInquiries = customer.inquiries.filter((inquiry) => {
              const status = String(inquiry.status || "").toLowerCase();
              return !["avsluttet", "utfort", "lukket"].includes(status);
            }).length;

            return (
              <article
                key={customer.key}
                className="group overflow-hidden rounded-3xl border border-slate-800 bg-[#0b0f17] transition-all hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
              >
                <div className="relative h-40 overflow-hidden border-b border-slate-800 bg-[#08111d]">
                  {propertyImage?.image_url ? (
                    <img
                      src={propertyImage.image_url}
                      alt={customer.addresses[0] || customer.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="grid h-full place-items-center">
                      <Building2 className="h-10 w-10 text-slate-700" />
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />

                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur">
                      {activeInquiries > 0
                        ? `${activeInquiries} aktive`
                        : "Ingen aktive"}
                    </span>

                    {latestInquiry && (
                      <span className="rounded-full border border-amber-500/20 bg-amber-500/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-amber-200 backdrop-blur">
                        {serviceLabel(latestInquiry.recommended_service)}
                      </span>
                    )}
                  </div>

                  {propertyImage && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider text-slate-300 backdrop-blur">
                      <Camera className="h-3 w-3" />
                      {propertyImage.source === "streetview"
                        ? "Fasade"
                        : "Satellitt"}
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-amber-400">
                        Kunde
                      </p>

                      <h3 className="mt-1 truncate text-lg font-black text-white">
                        {customer.name}
                      </h3>

                      {customer.customerId && (
                        <p className="mt-1 text-[9px] font-bold text-slate-600">
                          Kunde #{customer.customerId}
                        </p>
                      )}
                    </div>

                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-800 bg-slate-950">
                      <User className="h-4 w-4 text-slate-500" />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    {customer.addresses[0] && (
                      <div className="flex items-start gap-2 text-[11px] text-slate-300">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                        <span className="line-clamp-2">
                          {customer.addresses[0]}
                        </span>
                      </div>
                    )}

                    {customer.phone && (
                      <a
                        href={`tel:${customer.phone}`}
                        className="flex items-center gap-2 text-[11px] text-slate-400 transition hover:text-amber-300"
                      >
                        <Phone className="h-3.5 w-3.5 text-slate-600" />
                        {customer.phone}
                      </a>
                    )}

                    {customer.email && (
                      <a
                        href={`mailto:${customer.email}`}
                        className="flex min-w-0 items-center gap-2 text-[11px] text-slate-400 transition hover:text-amber-300"
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                        <span className="truncate">{customer.email}</span>
                      </a>
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                      <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                      <p className="mt-2 text-sm font-black text-white">
                        {customer.inquiries.length}
                      </p>
                      <p className="mt-0.5 text-[8px] uppercase tracking-wider text-slate-600">
                        Oppdrag
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                      <Activity className="h-3.5 w-3.5 text-emerald-400" />
                      <p className="mt-2 text-sm font-black text-white">
                        {activeInquiries}
                      </p>
                      <p className="mt-0.5 text-[8px] uppercase tracking-wider text-slate-600">
                        Aktive
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                      <FileText className="h-3.5 w-3.5 text-blue-400" />
                      <p className="mt-2 text-sm font-black text-white">
                        {latestInquiry ? `#${latestInquiry.id}` : "–"}
                      </p>
                      <p className="mt-0.5 text-[8px] uppercase tracking-wider text-slate-600">
                        Siste sak
                      </p>
                    </div>
                  </div>

                  {latestInquiry && (
                    <div className="mt-4 rounded-2xl border border-slate-800 bg-[#08111d] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-wider text-slate-600">
                            Siste oppdrag
                          </p>
                          <p className="mt-1 text-[11px] font-black text-slate-200">
                            {serviceLabel(latestInquiry.recommended_service)}
                          </p>
                        </div>

                        <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[8px] font-black uppercase text-slate-400">
                          {String(latestInquiry.status || "aktiv").replaceAll(
                            "_",
                            " "
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    {latestInquiryId > 0 && (
                      <button
                        type="button"
                        onClick={() => openMessageComposer(customer)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[10px] font-extrabold text-amber-300 transition hover:bg-amber-500/[0.12]"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Melding
                      </button>
                    )}

                    {latestInquiryId > 0 && onOpenInquiry && (
                      <button
                        type="button"
                        onClick={() => onOpenInquiry(latestInquiryId)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#F5B800] px-4 py-3 text-[10px] font-black text-slate-950 transition hover:bg-amber-400"
                      >
                        Åpne kunde
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {messageCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              closeMessageComposer();
            }
          }}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-800 bg-[#0b0f17] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-400">
                  Ny melding
                </p>
                <h3 className="mt-1 text-lg font-black text-white">
                  {messageCustomer.name}
                </h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  Meldingen arkiveres på sak #
                  {messageCustomer.latestInquiry?.id}
                </p>
              </div>

              <button
                type="button"
                onClick={closeMessageComposer}
                disabled={sendingMessage}
                className="grid h-9 w-9 place-items-center rounded-xl border border-slate-800 bg-slate-950 text-slate-500 transition hover:text-white disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {messageError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                  {messageError}
                </div>
              )}

              {messageSuccess && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  {messageSuccess}
                </div>
              )}

              <div>
                <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Melding til kunden
                </label>
                <textarea
                  value={messageText}
                  onChange={(event) => {
                    setMessageText(event.target.value);
                    setMessageError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessageToCustomer();
                    }
                  }}
                  rows={6}
                  autoFocus
                  placeholder="Skriv melding til kunden..."
                  className="w-full resize-none rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-500/60"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] text-slate-600">
                  Enter sender · Shift + Enter lager ny linje
                </p>

                <button
                  type="button"
                  onClick={sendMessageToCustomer}
                  disabled={sendingMessage || !messageText.trim()}
                  className="flex items-center gap-2 rounded-xl bg-[#F5B800] px-5 py-3 text-xs font-black text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sendingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {sendingMessage ? "Sender..." : "Send melding"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
