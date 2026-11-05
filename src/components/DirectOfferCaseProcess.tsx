import {
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  CalendarDays,
  XCircle,
} from "lucide-react";

type DirectOffer = {
  id: number;
  offer_number?: string | null;
  title?: string | null;
  status: string;
};

type Props = {
  offer: DirectOffer;
  onOpenOffer: () => void;
  onOpenPlanning?: () => void;
  onOpenReport2?: () => void;
};

export default function DirectOfferCaseProcess({
  offer,
  onOpenOffer,
  onOpenPlanning,
  onOpenReport2,
}: Props) {
  const status = offer.status;
  const accepted = status === "akseptert";
  const rejected = status === "avvist";
  const published = status === "publisert";
  const draft = status === "utkast";

  const headline = draft
    ? "Tilbud klart til publisering"
    : published
      ? "Tilbud sendt – venter på kunde"
      : accepted
        ? "Kunden har akseptert tilbudet"
        : rejected
          ? "Kunden har avvist tilbudet"
          : "Tilbudsbehandling";

  const steps = [
    {
      title: "Tilbud opprettet",
      detail: offer.offer_number || `Tilbud #${offer.id}`,
      state: "done",
    },
    {
      title: "Kundens godkjenning",
      detail: draft
        ? "Tilbudet er ikke sendt"
        : published
          ? "Avventer kundens svar"
          : accepted
            ? "Tilbud akseptert"
            : rejected
              ? "Tilbud avvist"
              : "Se tilbudsstatus",
      state: accepted ? "done" : rejected ? "rejected" : "pending",
    },
    {
      title: "Planlegging og utførelse",
      detail: accepted
        ? "Avtal tidspunkt og klargjør utførelse"
        : "Aktiveres etter kundens aksept",
      state: accepted ? "active" : "waiting",
    },
    {
      title: "Rapport 2 – Utførelsesrapport",
      detail: "Dokumenterer utført arbeid, bilder og sluttkontroll",
      state: "waiting",
    },
    {
      title: "Årlig vedlikeholdsoppfølging",
      detail: "Aktuelt etter godkjent Rapport 2 og avsluttet oppdrag",
      state: "waiting",
    },
  ] as const;

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
        Direkte oppdrag · Saksprosess
      </p>

      <h2 className="text-lg font-extrabold text-white">
        {headline}
      </h2>

      <p className="text-xs text-slate-400">
        {offer.title || "Registrert tilbud"}
      </p>

      <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-4">
        <div className="text-sm font-extrabold text-white">
          {offer.offer_number || `Tilbud #${offer.id}`}
        </div>
        <div className="mt-1 text-xs text-slate-400">
          Status: {status}
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenOffer}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/50 bg-cyan-500/15 px-4 py-3 text-sm font-bold text-cyan-100 hover:bg-cyan-500/25"
      >
        <FileText className="h-4 w-4" />
        Åpne tilbud
      </button>

      {accepted && onOpenPlanning && (
        <button
          type="button"
          onClick={onOpenPlanning}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-bold text-white hover:bg-cyan-500"
        >
          <CalendarDays className="h-4 w-4" />
          Foreslå tidspunkt
        </button>
      )}

      {accepted && onOpenReport2 && (
        <button
          type="button"
          onClick={onOpenReport2}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600 px-4 py-3 text-sm font-bold text-white"
        >
          <FileCheck2 className="h-4 w-4" />
          Åpne Rapport 2
        </button>
      )}

      <div className="space-y-5 border-t border-white/10 pt-5">
        {steps.map((step, index) => {
          const Icon =
            step.state === "done"
              ? CheckCircle2
              : step.state === "rejected"
                ? XCircle
                : index === 3
                  ? FileCheck2
                  : Clock3;

          return (
            <div key={step.title} className="flex items-start gap-3">
              <Icon
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  step.state === "done"
                    ? "text-emerald-300"
                    : step.state === "rejected"
                      ? "text-rose-300"
                      : step.state === "active"
                        ? "text-cyan-300"
                        : "text-slate-500"
                }`}
              />
              <div>
                <p className="text-sm font-bold text-white">
                  {step.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  {step.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {rejected && (
        <p className="text-xs text-rose-300">
          Tilbudet er avvist. Avtalen beholdes i historikken.
        </p>
      )}
    </div>
  );
}