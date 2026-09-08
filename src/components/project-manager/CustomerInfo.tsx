import {
  Building2,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";

export interface CustomerInfoInquiry {
  id: number | string;
  customer_name?: string;
  customerName?: string;
  customer_type?: string;
  phone?: string;
  email?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  roof_type?: string;
  building_type?: string;
  inquiry_type?: string;
}

interface CustomerInfoProps {
  inquiry: CustomerInfoInquiry;
  compact?: boolean;
}

function customerName(inquiry: CustomerInfoInquiry) {
  return inquiry.customer_name || inquiry.customerName || "Ukjent kunde";
}

function fullAddress(inquiry: CustomerInfoInquiry) {
  return [inquiry.address, inquiry.postal_code, inquiry.city]
    .filter(Boolean)
    .join(", ");
}

export default function CustomerInfo({
  inquiry,
  compact = false,
}: CustomerInfoProps) {
  const rows = [
    {
      label: "Kunde",
      value: customerName(inquiry),
      icon: <UserRound className="h-4 w-4" />,
    },
    {
      label: "Adresse",
      value: fullAddress(inquiry) || "Ikke oppgitt",
      icon: <MapPin className="h-4 w-4" />,
    },
    {
      label: "Telefon",
      value: inquiry.phone || "Ikke oppgitt",
      icon: <Phone className="h-4 w-4" />,
    },
    {
      label: "E-post",
      value: inquiry.email || "Ikke oppgitt",
      icon: <Mail className="h-4 w-4" />,
    },
    {
      label: "Tak / bygg",
      value:
        [inquiry.roof_type, inquiry.building_type]
          .filter(Boolean)
          .join(" · ") || "Ikke oppgitt",
      icon: <Building2 className="h-4 w-4" />,
    },
  ];

  if (compact) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rows.slice(0, 4).map((row) => (
          <div
            key={row.label}
            className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
          >
            <div className="flex items-center gap-2 text-slate-500">
              {row.icon}
              <span className="text-[9px] font-black uppercase tracking-wider">
                {row.label}
              </span>
            </div>
            <p className="mt-1.5 break-words text-xs font-bold text-slate-200">
              {row.value}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-5 md:p-6">
      <div className="border-b border-slate-800 pb-4">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-400">
          Kunde og eiendom
        </p>
        <h3 className="mt-1 text-lg font-black text-white">
          {customerName(inquiry)}
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Sak #{inquiry.id}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-xl border border-slate-800 bg-slate-950/55 p-4"
          >
            <div className="flex items-center gap-2 text-slate-500">
              {row.icon}
              <span className="text-[9px] font-black uppercase tracking-wider">
                {row.label}
              </span>
            </div>
            <p className="mt-1.5 break-words text-xs font-extrabold text-slate-200">
              {row.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}