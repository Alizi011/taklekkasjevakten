import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  Mail,
  Paperclip,
  ShieldCheck,
  Video,
} from "lucide-react";

interface DashboardProps {
  inquiry: any;
  previewMode?: boolean;
  onBackToMain?: () => void;
  onLogout: () => void;
  preinspectionSubmitted: boolean;
  preinspectionProgress: number;
  unreadMessages: number;
  filesCount: number;
  appointmentBooked: boolean;
  statusMessage: string;
  onOpenPreinspection: () => void;
  onOpenMessages: () => void;
}

export default function CustomerPortalHome({
  inquiry,
  previewMode = false,
  onBackToMain,
  onLogout,
  preinspectionSubmitted,
  preinspectionProgress,
  unreadMessages,
  filesCount,
  appointmentBooked,
  statusMessage,
  onOpenPreinspection,
  onOpenMessages,
}: DashboardProps) {
  const address = [
    inquiry?.address,
    [inquiry?.postal_code, inquiry?.city].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  const cards = [
    {
      label: "Bygg og opplysninger",
      value: preinspectionSubmitted ? "Fullført" : `${preinspectionProgress} % fullført`,
      description: preinspectionSubmitted
        ? "Opplysningene er mottatt"
        : "Se og rediger informasjon",
      icon: ClipboardList,
      onClick: onOpenPreinspection,
      important: !preinspectionSubmitted,
    },
    {
      label: "Digital befaring",
      value: appointmentBooked ? "Bekreftet" : "Neste steg",
      description: appointmentBooked
        ? "Tidspunkt er avtalt"
        : "Neste steg i saken",
      icon: Video,
      onClick: undefined,
      important: false,
    },
    {
      label: "Meldinger",
      value: unreadMessages > 0 ? `${unreadMessages} nye` : "Ingen nye meldinger",
      description: "Kontakt prosjektansvarlig",
      icon: Mail,
      onClick: onOpenMessages,
      important: unreadMessages > 0,
    },
    {
      label: "Dokumenter",
      value: filesCount > 0 ? `${filesCount} filer` : "Ingen filer lastet opp",
      description: "Bilder og vedlegg",
      icon: Paperclip,
      onClick: undefined,
      important: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#06101d] text-white">
      <header className="sticky top-0 z-40 border-b border-slate-800/90 bg-[#06101d]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Taklekkasjevakten" className="h-11 w-auto" />
            <div className="hidden sm:block">
              <p className="text-sm font-black tracking-wide">TAKLEKKASJEVAKTEN</p>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">
                Kundeportal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-bold">{inquiry?.customer_name || "Kunde"}</p>
              <p className="text-[10px] text-slate-500">Sak #{inquiry?.id}</p>
            </div>

            {previewMode && onBackToMain ? (
              <button
                type="button"
                onClick={onBackToMain}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200"
              >
                <ArrowLeft className="h-4 w-4" />
                Tilbake til admin
              </button>
            ) : (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300"
              >
                <LogOut className="h-4 w-4" />
                Logg ut
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 md:grid-cols-[210px_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100vh-73px)] border-r border-slate-800/80 bg-[#071321] px-3 py-6 md:block">
          <nav className="space-y-2">
            <button className="flex w-full items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-left text-xs font-bold text-amber-300">
              <Home className="h-4 w-4" />
              Oversikt
            </button>
            <button
              type="button"
              onClick={onOpenPreinspection}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-xs font-bold text-slate-400 hover:bg-slate-900 hover:text-white"
            >
              <span className="flex items-center gap-3">
                <ClipboardList className="h-4 w-4" />
                Bygg og opplysninger
              </span>
              {!preinspectionSubmitted && <span className="h-2 w-2 rounded-full bg-amber-400" />}
            </button>
            <button
              type="button"
              onClick={onOpenMessages}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-xs font-bold text-slate-400 hover:bg-slate-900 hover:text-white"
            >
              <span className="flex items-center gap-3">
                <Mail className="h-4 w-4" />
                Meldinger
              </span>
              {unreadMessages > 0 && (
                <span className="rounded-full bg-[#F5B800] px-1.5 py-0.5 text-[9px] font-black text-slate-950">
                  {unreadMessages}
                </span>
              )}
            </button>
            <div className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold text-slate-600">
              <Paperclip className="h-4 w-4" />
              Dokumenter
            </div>
            <div className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold text-slate-600">
              <ShieldCheck className="h-4 w-4" />
              Tilbud
            </div>
            <div className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold text-slate-600">
              <FileText className="h-4 w-4" />
              Rapport
            </div>
          </nav>

          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs font-black">Trenger du hjelp?</p>
            <p className="mt-1 text-[10px] text-slate-500">Ring oss gjerne</p>
            <a href="tel:92029090" className="mt-3 block text-sm font-black text-amber-400">
              92 02 90 90
            </a>
          </div>
        </aside>

        <main className="min-w-0 space-y-5 px-4 py-5 md:px-6 lg:px-8">
          <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-[#0a1a2d] via-[#081522] to-[#07111c] p-6 md:p-7">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-400">
                Sak #{inquiry?.id}
              </p>

              <h1 className="mt-3 text-2xl font-black md:text-3xl">
                {address || "Din eiendom"}
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                {inquiry?.roof_type || "Taktype ikke oppgitt"}
              </p>

              <div className="mt-7 grid gap-3 border-t border-slate-800/80 pt-5 sm:grid-cols-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                    Prosjekttype
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-300">
                    {inquiry?.roof_type || "Ikke oppgitt"}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                    Opprettet
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-300">
                    {inquiry?.created_at
                      ? new Date(String(inquiry.created_at).replace(" ", "T")).toLocaleDateString("nb-NO")
                      : "Ikke oppgitt"}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                    Din kontakt
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-300">
                    {inquiry?.assigned_to || "Prosjektansvarlig"}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-amber-500/45 bg-gradient-to-br from-[#121820] to-[#0b0f17] p-6 shadow-[0_0_30px_rgba(245,184,0,0.14)]">
              {!preinspectionSubmitted && (
                <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-amber-400/10 blur-3xl" />
              )}

              <div className="relative">
                <div className="flex items-center gap-2 text-amber-300">
                  <div className="grid h-8 w-8 place-items-center rounded-xl border border-amber-500/25 bg-amber-500/10">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <p className="text-[11px] font-black">Neste handling</p>
                </div>

                {!preinspectionSubmitted ? (
                  <>
                    <h2 className="mt-5 text-2xl font-black text-white">
                      Fyll ut opplysninger om bygget
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      Gi oss informasjon om bygget, problemet og tidligere arbeider,
                      slik at vi kan forberede den digitale befaringen best mulig.
                    </p>

                    <button
                      type="button"
                      onClick={onOpenPreinspection}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F5B800] px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-amber-400"
                    >
                      Fyll ut opplysninger
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mt-5 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <h2 className="text-lg font-black text-white">
                        Opplysninger mottatt
                      </h2>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      {statusMessage}
                    </p>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-[#0b0f17] p-5 md:p-6">
            <p className="text-sm font-black text-white">Saksforløp</p>

            <div className="mt-6 overflow-x-auto pb-1">
              <div className="grid min-w-[860px] grid-cols-6 items-start">
                {[
                  ["1", "Opplysninger"],
                  ["2", "Digital befaring"],
                  ["3", "Tilbud & plan"],
                  ["4", "Feltarbeid"],
                  ["5", "Rapport"],
                  ["6", "Videre oppfølging"],
                ].map(([number, title], index) => {
                  const complete = preinspectionSubmitted && index === 0;
                  const active =
                    (!preinspectionSubmitted && index === 0) ||
                    (preinspectionSubmitted && index === 1);

                  return (
                    <div key={number} className="relative text-center">
                      {index < 5 && (
                        <div
                          className={`absolute left-1/2 top-4 h-px w-full ${
                            complete ? "bg-emerald-500/60" : active ? "bg-amber-400/70" : "bg-slate-700"
                          }`}
                        />
                      )}

                      <div className="relative z-10 mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-[#0b0f17] text-[11px] font-black text-slate-400">
                        {complete ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <span className={active ? "text-amber-300" : ""}>{number}</span>
                        )}
                      </div>

                      <p
                        className={`mt-3 text-[10px] font-bold ${
                          active ? "text-amber-300" : complete ? "text-emerald-300" : "text-slate-400"
                        }`}
                      >
                        {title}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.label}
                  type="button"
                  onClick={card.onClick}
                  disabled={!card.onClick}
                  className={`group rounded-2xl border p-5 text-left transition ${
                    card.important
                      ? "border-amber-500/25 bg-amber-500/[0.06]"
                      : "border-slate-800 bg-[#0b0f17]"
                  } ${card.onClick ? "hover:border-slate-600" : "cursor-default"}`}
                >
                  <div className="flex items-start justify-between gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 bg-slate-950">
                    <Icon className="h-5 w-5 text-[#F5B800]" />
                  </div><ArrowRight className="h-4 w-4 text-slate-700 transition group-hover:text-slate-400" /></div>
                  <p className="mt-4 text-xl font-black">{card.value}</p>
                  <p className="mt-1 text-xs font-black">{card.label}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{card.description}</p>
                </button>
              );
            })}
          </section>

        </main>
      </div>
    </div>
  );
}
