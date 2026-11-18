import { useMemo, useState } from "react";
import { ArrowRight, FilePlus2, Plus, Search, X } from "lucide-react";

export type OfferCaseChoice = {
  id: number | string;
  customer_name?: string | null;
  customerName?: string | null;
  address?: string | null;
  city?: string | null;
  status?: string | null;
};
type Props = {
  open: boolean;
  inquiries: OfferCaseChoice[];
  onClose: () => void;
  onChoose: (id: number) => void;
  onNewCase: () => void;
};
export default function NewPriceOfferChooser({ open, inquiries, onClose, onChoose, onNewCase }: Props) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("nb-NO");
    return inquiries.filter(item => {
      const status = String(item.status || "").toLowerCase();
      if (["avsluttet", "tilbud_avvist"].includes(status)) return false;
      return !q || [String(item.id), item.customer_name, item.customerName, item.address, item.city]
        .some(value => String(value || "").toLocaleLowerCase("nb-NO").includes(q));
    }).slice(0, 30);
  }, [inquiries, query]);

  if (!open) return null;
  return <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-label="Nytt pristilbud">
    <div className="w-full max-w-2xl rounded-2xl border border-[#7d4257] bg-[#25121f] p-5 text-white shadow-2xl">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div><h2 className="flex items-center gap-2 text-xl font-black"><FilePlus2 size={22}/> Nytt pristilbud</h2>
          <p className="mt-1 text-xs text-slate-300">Velg en eksisterende sak eller registrer et nytt oppdrag. Tilbudet opprettes først når du lagrer det i tilbudsgeneratoren.</p></div>
        <button type="button" onClick={onClose} aria-label="Lukk" className="rounded-lg border border-white/15 p-2"><X size={17}/></button>
      </div>
      <button type="button" onClick={onNewCase}
        className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 py-3 text-sm font-bold hover:bg-rose-600">
        <Plus size={17}/> Ny kunde eller nytt oppdrag
      </button>
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-3 text-slate-400"/>
        <input value={query} onChange={e => setQuery(e.target.value)}
          aria-label="Søk eksisterende oppdrag" placeholder="Søk etter kunde, adresse eller saksnummer"
          className="w-full rounded-xl border border-[#714152] bg-[#180b15] py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-rose-400"/>
      </div>
      <div className="max-h-[45vh] space-y-2 overflow-y-auto">
        {results.length === 0 && <p className="p-4 text-sm text-slate-300">Ingen samsvarende saker funnet.</p>}
        {results.map(item => <button type="button" key={item.id} onClick={() => onChoose(Number(item.id))}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#351b29] px-4 py-3 text-left hover:border-rose-400/60">
          <div className="min-w-0"><p className="truncate text-sm font-bold">Sak #{item.id} · {item.customer_name || item.customerName || "Ukjent kunde"}</p>
            <p className="mt-1 truncate text-xs text-slate-300">{[item.address,item.city].filter(Boolean).join(", ") || "Adresse ikke oppgitt"}</p></div>
          <ArrowRight size={17} className="shrink-0 text-amber-300"/>
        </button>)}
      </div>
    </div>
  </div>;
}
