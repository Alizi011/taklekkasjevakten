import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Mail,
  Megaphone,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Send,
  XCircle,
  Sparkles,
  Image as ImageIcon,
  Monitor,
  Smartphone,
  UserPlus,
  X,
  Building2,
  MapPinned,
} from "lucide-react";
import { apiUrl } from "../lib/api";

type EmailCenterView = "overview" | "compose" | "campaigns" | "queue";

interface EmailCenterPageProps {
  activeView?: EmailCenterView;
}

interface QueueItem {
  id: number;
  source_system_key: string;
  recipient_name?: string | null;
  recipient_email: string;
  subject: string;
  message_type: string;
  priority: number;
  status: string;
  attempt_count: number;
  sent_at?: string | null;
  created_at: string;
  campaign_id?: number | null;
  last_error?: string | null;
}

interface Campaign {
  id: number;
  source_system_key: string;
  name: string;
  subject: string;
  status: string;
  total_recipients: number;
  queued_count: number;
  sent_count: number;
  failed_count: number;
  skipped_count: number;
  scheduled_at?: string | null;
  created_at: string;
}

interface SenderProfile {
  id: number;
  source_system_key: string;
  from_name: string;
  from_email: string;
  reply_to_email?: string | null;
  active: number;
  is_default: number;
}

interface Overview {
  pending: number;
  sent_today: number;
  failed: number;
  campaigns_running: number;
}

interface AudiencePreset {
  key: string;
  label: string;
  description: string;
  category: string;
  region: string;
  count: number;
}

const statusLabel: Record<string, string> = {
  pending: "Venter",
  scheduled: "Planlagt",
  sending: "Sender",
  sent: "Sendt",
  retry: "Prøver igjen",
  failed: "Feilet",
  cancelled: "Avbrutt",
  suppressed: "Sperret",
  draft: "Utkast",
  running: "Aktiv",
  paused: "Pauset",
  completed: "Ferdig",
};

const statusClass = (status: string) => {
  if (status === "sent" || status === "completed") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }
  if (status === "failed") {
    return "border-red-500/20 bg-red-500/10 text-red-300";
  }
  if (status === "running" || status === "sending") {
    return "border-cyan-500/20 bg-cyan-500/10 text-cyan-300";
  }
  if (status === "paused" || status === "suppressed") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }
  return "border-slate-700 bg-slate-900 text-slate-300";
};

export default function EmailCenterPage({
  activeView = "overview",
}: EmailCenterPageProps) {
  const [view, setView] = useState<EmailCenterView>(activeView);
  const [overview, setOverview] = useState<Overview>({
    pending: 0,
    sent_today: 0,
    failed: 0,
    campaigns_running: 0,
  });
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [senderProfiles, setSenderProfiles] = useState<SenderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const [singleRecipient, setSingleRecipient] = useState("");
  const [singleRecipientName, setSingleRecipientName] = useState("");
  const [singleSubject, setSingleSubject] = useState("");
  const [singleMessage, setSingleMessage] = useState("");
  const [singleBusy, setSingleBusy] = useState(false);

  const [campaignName, setCampaignName] = useState("");
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignPreheader, setCampaignPreheader] = useState("");
  const [campaignHeadline, setCampaignHeadline] = useState("");
  const [campaignMessage, setCampaignMessage] = useState("");
  const [campaignCtaLabel, setCampaignCtaLabel] = useState("Kontakt oss");
  const [campaignRecipients, setCampaignRecipients] = useState("");
  const [recipientDraft, setRecipientDraft] = useState("");
  const [showRecipientInput, setShowRecipientInput] = useState(false);
  const [showAudiencePicker, setShowAudiencePicker] = useState(false);
  const [audiencePresets, setAudiencePresets] = useState<AudiencePreset[]>([]);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [campaignImageUrl, setCampaignImageUrl] = useState("");
  const [campaignBusy, setCampaignBusy] = useState(false);
  const [aiBrief, setAiBrief] = useState("");
  const [aiAudience, setAiAudience] = useState("Sameier og borettslag");
  const [aiTone, setAiTone] = useState("Profesjonell og tydelig");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiImageBusy, setAiImageBusy] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    setView(activeView);
  }, [activeView]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/core/email_center.php?action=dashboard"));
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke hente e-postdata.");
      }

      setOverview(data.overview || {});
      setQueue(Array.isArray(data.queue) ? data.queue : []);
      setCampaigns(Array.isArray(data.campaigns) ? data.campaigns : []);
      setSenderProfiles(
        Array.isArray(data.sender_profiles) ? data.sender_profiles : []
      );
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : "Kunne ikke hente e-postdata."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const defaultSender = useMemo(
    () =>
      senderProfiles.find(
        (p) =>
          p.source_system_key === "taklekkasjevakten" &&
          Number(p.active) === 1 &&
          Number(p.is_default) === 1
      ),
    [senderProfiles]
  );

  const sendSingleEmail = async () => {
    if (!singleRecipient.trim() || !singleSubject.trim() || !singleMessage.trim()) {
      setFeedback("Fyll inn mottaker, emne og melding.");
      return;
    }

    setSingleBusy(true);
    setFeedback("");

    try {
      const res = await fetch(apiUrl("/core/email_center.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_email",
          source_system_key: "taklekkasjevakten",
          recipient_email: singleRecipient.trim(),
          recipient_name: singleRecipientName.trim() || null,
          subject: singleSubject.trim(),
          message: singleMessage.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke legge e-posten i kø.");
      }

      setSingleRecipient("");
      setSingleRecipientName("");
      setSingleSubject("");
      setSingleMessage("");
      setFeedback("E-posten er lagt i utsendingskøen.");
      await loadData();
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : "Kunne ikke legge e-posten i kø."
      );
    } finally {
      setSingleBusy(false);
    }
  };

  const loadAudiencePresets = async () => {
    if (audiencePresets.length > 0) {
      setShowAudiencePicker(true);
      return;
    }

    setAudienceLoading(true);
    setFeedback("");

    try {
      const res = await fetch(apiUrl("/core/email_audiences.php"));
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke hente mottakergruppene.");
      }

      setAudiencePresets(Array.isArray(data.audiences) ? data.audiences : []);
      setShowAudiencePicker(true);
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : "Kunne ikke hente mottakergruppene."
      );
    } finally {
      setAudienceLoading(false);
    }
  };

  const toggleAudience = (key: string) => {
    setSelectedAudiences((prev) =>
      prev.includes(key)
        ? prev.filter((item) => item !== key)
        : [...prev, key]
    );
  };

  const selectedAudienceCount = useMemo(
    () =>
      audiencePresets
        .filter((item) => selectedAudiences.includes(item.key))
        .reduce((sum, item) => sum + Number(item.count || 0), 0),
    [audiencePresets, selectedAudiences]
  );

  const campaignRecipientList = useMemo(
    () =>
      campaignRecipients
        .split(/[\n,;]+/)
        .map((value) => value.trim())
        .filter(Boolean),
    [campaignRecipients]
  );

  const addCampaignRecipients = () => {
    const incoming = recipientDraft
      .split(/[\n,;]+/)
      .map((value) => value.trim())
      .filter(Boolean);

    if (incoming.length === 0) return;

    const merged = Array.from(
      new Set([...campaignRecipientList, ...incoming].map((email) => email.toLowerCase()))
    );

    setCampaignRecipients(merged.join("\n"));
    setRecipientDraft("");
    setShowRecipientInput(false);
  };

  const removeCampaignRecipient = (email: string) => {
    setCampaignRecipients(
      campaignRecipientList
        .filter((item) => item.toLowerCase() !== email.toLowerCase())
        .join("\n")
    );
  };

  const campaignImageAbsoluteUrl = useMemo(() => {
    if (!campaignImageUrl) return "";
    if (/^https?:\/\//i.test(campaignImageUrl)) return campaignImageUrl;
    const origin = apiUrl("/").replace(/\/api\/?$/i, "").replace(/\/$/, "");
    return `${origin}${campaignImageUrl.startsWith("/") ? campaignImageUrl : `/${campaignImageUrl}`}`;
  }, [campaignImageUrl]);

  const generateCampaignCopy = async () => {
    if (!aiBrief.trim()) {
      setFeedback("Beskriv kampanjen for AI først.");
      return;
    }

    setAiBusy(true);
    setFeedback("");

    try {
      const res = await fetch(apiUrl("/core/email_ai.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_copy",
          brief: aiBrief.trim(),
          audience: aiAudience,
          tone: aiTone,
          campaign_name: campaignName.trim(),
          subject: campaignSubject.trim(),
          message: campaignMessage.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "AI kunne ikke lage kampanjeteksten.");
      }

      const copy = data.copy || {};
      setCampaignSubject(String(copy.subject || ""));
      setCampaignPreheader(String(copy.preheader || ""));
      setCampaignHeadline(String(copy.headline || ""));
      setCampaignMessage(String(copy.body || ""));
      setCampaignCtaLabel(String(copy.cta_label || "Kontakt oss"));
      setFeedback("AI-forslaget er klart. Du kan redigere alt før utsending.");
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : "AI kunne ikke lage kampanjeteksten."
      );
    } finally {
      setAiBusy(false);
    }
  };

  const generateCampaignImage = async () => {
    if (!aiBrief.trim()) {
      setFeedback("Beskriv kampanjen for AI først.");
      return;
    }

    setAiImageBusy(true);
    setFeedback("");

    try {
      const res = await fetch(apiUrl("/core/email_ai.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_image",
          brief: aiBrief.trim(),
          audience: aiAudience,
          headline: campaignHeadline.trim(),
          style: "realistisk, profesjonell, nordisk, moderne",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "AI kunne ikke lage bildet.");
      }

      setCampaignImageUrl(String(data.image_url || ""));
      setFeedback("AI-bildet er laget og lagt inn i forhåndsvisningen.");
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : "AI kunne ikke lage bildet."
      );
    } finally {
      setAiImageBusy(false);
    }
  };

  const buildCampaignHtml = () => {
    const esc = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const paragraphs = campaignMessage
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .filter(Boolean)
      .map(
        (part) =>
          `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">${esc(
            part
          ).replace(/\n/g, "<br>")}</p>`
      )
      .join("");

    const image = campaignImageAbsoluteUrl
      ? `<img src="${esc(
          campaignImageAbsoluteUrl
        )}" alt="" style="display:block;width:100%;max-width:680px;height:auto;border:0;" />`
      : "";

    const preheader = campaignPreheader
      ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(
          campaignPreheader
        )}</div>`
      : "";

    const headline = campaignHeadline
      ? `<h1 style="margin:0 0 18px;font-size:28px;line-height:1.2;color:#0f172a;">${esc(
          campaignHeadline
        )}</h1>`
      : "";

    const cta = campaignCtaLabel.trim()
      ? `<p style="margin:24px 0 0;"><a href="https://taklekkasjevakten.no" style="display:inline-block;background:#f59e0b;color:#0f172a;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px;">${esc(
          campaignCtaLabel.trim()
        )}</a></p>`
      : "";

    return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;">${preheader}<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:24px 12px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border-radius:12px;overflow:hidden;"><tr><td>${image}</td></tr><tr><td style="padding:32px;">${headline}${paragraphs}${cta}<p style="margin:32px 0 0;font-size:13px;line-height:1.5;color:#64748b;">Med vennlig hilsen<br><strong>Taklekkasjevakten</strong><br>Vi finner årsaken – ikke bare symptomene.</p></td></tr></table></td></tr></table></body></html>`;
  };

  const createCampaign = async () => {
    if (
      !campaignName.trim() ||
      !campaignSubject.trim() ||
      !campaignMessage.trim() ||
      (!campaignRecipients.trim() && selectedAudiences.length === 0)
    ) {
      setFeedback("Fyll inn kampanjenavn, mottakere, emne og melding.");
      return;
    }

    const recipients = campaignRecipients
      .split(/[\n,;]+/)
      .map((value) => value.trim())
      .filter(Boolean);

    if (recipients.length === 0 && selectedAudiences.length === 0) {
      setFeedback("Legg inn minst én mottaker eller velg en mottakergruppe.");
      return;
    }

    setCampaignBusy(true);
    setFeedback("");

    try {
      const res = await fetch(apiUrl("/core/email_center.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_campaign",
          source_system_key: "taklekkasjevakten",
          name: campaignName.trim(),
          subject: campaignSubject.trim(),
          message: campaignMessage.trim(),
          body_html: buildCampaignHtml(),
          recipients,
          audiences: selectedAudiences,
          start_now: true,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke opprette kampanjen.");
      }

      setCampaignName("");
      setCampaignSubject("");
      setCampaignPreheader("");
      setCampaignHeadline("");
      setCampaignMessage("");
      setCampaignCtaLabel("Kontakt oss");
      setCampaignRecipients("");
      setSelectedAudiences([]);
      setCampaignImageUrl("");
      setAiBrief("");
      setFeedback(
        `Kampanjen er opprettet med ${data.queued_count || recipients.length} mottakere.`
      );
      await loadData();
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : "Kunne ikke opprette kampanjen."
      );
    } finally {
      setCampaignBusy(false);
    }
  };

  const setCampaignStatus = async (
    campaignId: number,
    status: "running" | "paused"
  ) => {
    setFeedback("");
    try {
      const res = await fetch(apiUrl("/core/email_center.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "campaign_status",
          campaign_id: campaignId,
          status,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke endre kampanjestatus.");
      }

      await loadData();
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : "Kunne ikke endre kampanjestatus."
      );
    }
  };

  const tabs: Array<{
    id: EmailCenterView;
    label: string;
    icon: typeof Mail;
  }> = [
    { id: "overview", label: "Oversikt", icon: BarChart3 },
    { id: "compose", label: "Ny e-post", icon: Mail },
    { id: "campaigns", label: "Kampanjer", icon: Megaphone },
    { id: "queue", label: "Utsendingskø", icon: Clock3 },
  ];

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1320]">
        <div className="flex flex-col gap-4 border-b border-slate-800/80 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                <Mail className="h-4 w-4 text-amber-300" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  E-post & kampanjer
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Felles utsendingsmotor via perun_core og one.com SMTP.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {defaultSender && (
              <div className="hidden rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[10px] text-slate-400 sm:block">
                Fra{" "}
                <span className="font-bold text-slate-200">
                  {defaultSender.from_email}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => void loadData()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-[10px] font-black text-slate-300 transition hover:bg-white/5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Oppdater
            </button>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = view === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-[11px] font-black transition ${
                  active
                    ? "bg-amber-500/10 text-amber-300"
                    : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {feedback && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-xs font-semibold text-slate-200">
          {feedback}
        </div>
      )}

      {view === "overview" && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "I kø",
                value: overview.pending || 0,
                icon: Clock3,
                detail: "Venter / planlagt / retry",
              },
              {
                label: "Sendt i dag",
                value: overview.sent_today || 0,
                icon: CheckCircle2,
                detail: "Akseptert av SMTP",
              },
              {
                label: "Feilet",
                value: overview.failed || 0,
                icon: XCircle,
                detail: "Krever kontroll",
              },
              {
                label: "Aktive kampanjer",
                value: overview.campaigns_running || 0,
                icon: Megaphone,
                detail: "Kjører nå",
              },
            ].map(({ label, value, icon: Icon, detail }) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-800/80 bg-[#0d1320] p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">{value}</p>
                    <p className="mt-1 text-[10px] text-slate-600">{detail}</p>
                  </div>
                  <Icon className="h-4 w-4 text-slate-500" />
                </div>
              </div>
            ))}
          </div>

          <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320]">
            <div className="flex items-center justify-between border-b border-slate-800/70 px-5 py-4">
              <div>
                <h4 className="text-sm font-black text-white">Siste utsendinger</h4>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  De siste e-postene i den felles køen.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setView("queue")}
                className="text-[10px] font-black text-amber-300"
              >
                Se hele køen
              </button>
            </div>
            <QueueTable items={queue.slice(0, 8)} />
          </section>
        </>
      )}

      {view === "compose" && (
        <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320]">
          <div className="border-b border-slate-800/70 px-5 py-4">
            <h4 className="text-sm font-black text-white">Ny e-post</h4>
            <p className="mt-0.5 text-[10px] text-slate-500">
              Direkte kundedialog med høy prioritet i utsendingskøen.
            </p>
          </div>

          <div className="grid gap-4 p-5 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <Field label="Mottakerens e-post">
                <input
                  value={singleRecipient}
                  onChange={(e) => setSingleRecipient(e.target.value)}
                  placeholder="kunde@eksempel.no"
                  className={inputClass}
                />
              </Field>

              <Field label="Navn, valgfritt">
                <input
                  value={singleRecipientName}
                  onChange={(e) => setSingleRecipientName(e.target.value)}
                  placeholder="Kundenavn"
                  className={inputClass}
                />
              </Field>

              <Field label="Emne">
                <input
                  value={singleSubject}
                  onChange={(e) => setSingleSubject(e.target.value)}
                  placeholder="Emne"
                  className={inputClass}
                />
              </Field>

              <Field label="Melding">
                <textarea
                  value={singleMessage}
                  onChange={(e) => setSingleMessage(e.target.value)}
                  rows={12}
                  placeholder="Skriv e-post..."
                  className={`${inputClass} resize-y leading-5`}
                />
              </Field>

              <button
                type="button"
                onClick={() => void sendSingleEmail()}
                disabled={singleBusy}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-[11px] font-black text-slate-950 transition hover:bg-amber-300 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {singleBusy ? "Legger i kø..." : "Send e-post"}
              </button>
            </div>

            <aside className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
              <h5 className="text-xs font-black text-white">Utsending</h5>
              <div className="mt-4 space-y-3 text-[10px] text-slate-500">
                <div>
                  <span className="block font-black uppercase tracking-wide text-slate-600">
                    Avsender
                  </span>
                  <span className="mt-1 block text-slate-300">
                    {defaultSender?.from_email || "Ikke konfigurert"}
                  </span>
                </div>
                <div>
                  <span className="block font-black uppercase tracking-wide text-slate-600">
                    Reply-To
                  </span>
                  <span className="mt-1 block text-slate-300">
                    {defaultSender?.reply_to_email || "Ikke konfigurert"}
                  </span>
                </div>
                <div>
                  <span className="block font-black uppercase tracking-wide text-slate-600">
                    Prioritet
                  </span>
                  <span className="mt-1 block text-emerald-300">
                    Høy · kundedialog
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </section>
      )}

      {view === "campaigns" && (
        <div className="space-y-5">
          <div className="grid gap-5 2xl:grid-cols-[420px_minmax(0,1fr)]">
            <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320]">
              <div className="border-b border-slate-800/70 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <h4 className="text-sm font-black text-white">AI kampanjeverksted</h4>
                </div>
                <p className="mt-1 text-[10px] text-slate-500">
                  Beskriv kampanjen, la AI lage forslag, rediger selv og forhåndsvis før du sender.
                </p>
              </div>

              <div className="space-y-4 p-5">
                <Field label="Hva skal kampanjen handle om?">
                  <textarea
                    value={aiBrief}
                    onChange={(e) => setAiBrief(e.target.value)}
                    rows={4}
                    placeholder="F.eks. Informer borettslag om forebyggende takkontroll før høstregnet..."
                    className={`${inputClass} resize-y leading-5`}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Målgruppe">
                    <select
                      value={aiAudience}
                      onChange={(e) => setAiAudience(e.target.value)}
                      className={inputClass}
                    >
                      <option>Sameier og borettslag</option>
                      <option>Bedrifter</option>
                      <option>Private kunder</option>
                      <option>Eiendomsforvaltere</option>
                    </select>
                  </Field>

                  <Field label="Tone">
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      className={inputClass}
                    >
                      <option>Profesjonell og tydelig</option>
                      <option>Vennlig og rådgivende</option>
                      <option>Kort og direkte</option>
                      <option>Salgsrettet, men nøktern</option>
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => void generateCampaignCopy()}
                    disabled={aiBusy}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-3 text-[10px] font-black text-amber-300 transition hover:bg-amber-500/15 disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {aiBusy ? "Lager tekst..." : "Lag tekst med AI"}
                  </button>

                  <button
                    type="button"
                    onClick={() => void generateCampaignImage()}
                    disabled={aiImageBusy}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-3 py-3 text-[10px] font-black text-cyan-300 transition hover:bg-cyan-500/15 disabled:opacity-50"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    {aiImageBusy ? "Lager bilde..." : "Lag bilde med AI"}
                  </button>
                </div>

                <div className="border-t border-slate-800/70 pt-4" />

                <Field label="Kampanjenavn">
                  <input
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="F.eks. Takkontroll – høst 2026"
                    className={inputClass}
                  />
                </Field>

                <Field label="Mottakere">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                    <div className="flex flex-wrap gap-2">
                      {campaignRecipientList.map((email) => (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-slate-300"
                        >
                          {email}
                          <button
                            type="button"
                            onClick={() => removeCampaignRecipient(email)}
                            className="rounded-full p-0.5 text-slate-500 transition hover:bg-slate-800 hover:text-red-300"
                            aria-label={`Fjern ${email}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}

                      {!showRecipientInput && (
                        <button
                          type="button"
                          onClick={() => setShowRecipientInput(true)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-1.5 text-[10px] font-black text-amber-300 transition hover:bg-amber-500/10"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Legg til mottaker
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => void loadAudiencePresets()}
                        disabled={audienceLoading}
                        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-cyan-500/40 bg-cyan-500/5 px-3 py-1.5 text-[10px] font-black text-cyan-300 transition hover:bg-cyan-500/10 disabled:opacity-50"
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        {audienceLoading ? "Henter grupper..." : "Legg til gruppe"}
                      </button>
                    </div>

                    {selectedAudiences.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-800 pt-3">
                        {audiencePresets
                          .filter((group) => selectedAudiences.includes(group.key))
                          .map((group) => (
                            <span
                              key={group.key}
                              className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-black text-cyan-200"
                            >
                              <MapPinned className="h-3 w-3" />
                              {group.label}
                              <span className="text-cyan-400">{group.count}</span>
                              <button
                                type="button"
                                onClick={() => toggleAudience(group.key)}
                                className="rounded-full p-0.5 text-cyan-500 hover:bg-cyan-500/10 hover:text-red-300"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                      </div>
                    )}

                    {showAudiencePicker && (
                      <div className="mt-3 rounded-xl border border-cyan-500/20 bg-slate-950/70 p-3">
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-black text-white">
                              Velg mottakergruppe
                            </div>
                            <div className="mt-0.5 text-[9px] text-slate-600">
                              Ett klikk velger hele segmentet. Kun markedsføringsklare e-postadresser tas med.
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowAudiencePicker(false)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-white"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          {audiencePresets.map((group) => {
                            const selected = selectedAudiences.includes(group.key);

                            return (
                              <button
                                key={group.key}
                                type="button"
                                onClick={() => toggleAudience(group.key)}
                                className={`rounded-xl border p-3 text-left transition ${
                                  selected
                                    ? "border-cyan-400/40 bg-cyan-500/10"
                                    : "border-slate-800 bg-slate-950/30 hover:border-slate-700"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div
                                      className={`text-[10px] font-black ${
                                        selected ? "text-cyan-200" : "text-slate-200"
                                      }`}
                                    >
                                      {group.label}
                                    </div>
                                    <div className="mt-1 text-[9px] leading-4 text-slate-600">
                                      {group.description}
                                    </div>
                                  </div>
                                  <span
                                    className={`shrink-0 rounded-lg px-2 py-1 text-[9px] font-black ${
                                      selected
                                        ? "bg-cyan-500/15 text-cyan-300"
                                        : "bg-slate-900 text-slate-500"
                                    }`}
                                  >
                                    {group.count}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {showRecipientInput && (
                      <div className="mt-3 flex gap-2">
                        <input
                          autoFocus
                          value={recipientDraft}
                          onChange={(e) => setRecipientDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCampaignRecipients();
                            }
                            if (e.key === "Escape") {
                              setRecipientDraft("");
                              setShowRecipientInput(false);
                            }
                          }}
                          placeholder="navn@firma.no"
                          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-[11px] text-white outline-none placeholder:text-slate-600 focus:border-amber-500/50"
                        />
                        <button
                          type="button"
                          onClick={addCampaignRecipients}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-2.5 text-[10px] font-black text-slate-950 transition hover:bg-amber-300"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Legg til
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRecipientDraft("");
                            setShowRecipientInput(false);
                          }}
                          className="rounded-lg border border-slate-700 px-3 py-2.5 text-[10px] font-black text-slate-400 transition hover:bg-white/5"
                        >
                          Avbryt
                        </button>
                      </div>
                    )}

                    {campaignRecipientList.length === 0 && !showRecipientInput && (
                      <p className="mt-2 text-[9px] text-slate-600">
                        Ingen mottakere valgt ennå.
                      </p>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[9px] text-slate-600">
                      Du kan legge inn én eller flere adresser samtidig, separert med komma eller linjeskift.
                    </p>
                    <span className="shrink-0 text-[9px] font-black text-slate-500">
                      {campaignRecipientList.length + selectedAudienceCount} mottakere
                    </span>
                  </div>
                </Field>

                <Field label="Emne">
                  <input
                    value={campaignSubject}
                    onChange={(e) => setCampaignSubject(e.target.value)}
                    placeholder="Emne"
                    className={inputClass}
                  />
                </Field>

                <Field label="Preheader">
                  <input
                    value={campaignPreheader}
                    onChange={(e) => setCampaignPreheader(e.target.value)}
                    placeholder="Kort teksten som vises etter emnefeltet i innboksen"
                    className={inputClass}
                  />
                </Field>

                <Field label="Overskrift">
                  <input
                    value={campaignHeadline}
                    onChange={(e) => setCampaignHeadline(e.target.value)}
                    placeholder="Overskrift i selve e-posten"
                    className={inputClass}
                  />
                </Field>

                <Field label="Melding">
                  <textarea
                    value={campaignMessage}
                    onChange={(e) => setCampaignMessage(e.target.value)}
                    rows={10}
                    placeholder="Skriv eller generer kampanjemelding..."
                    className={`${inputClass} resize-y leading-5`}
                  />
                </Field>

                <Field label="CTA-knapp">
                  <input
                    value={campaignCtaLabel}
                    onChange={(e) => setCampaignCtaLabel(e.target.value)}
                    placeholder="Kontakt oss"
                    className={inputClass}
                  />
                </Field>

                {campaignImageUrl && (
                  <div className="overflow-hidden rounded-xl border border-slate-800">
                    <img
                      src={campaignImageAbsoluteUrl}
                      alt="AI-generert kampanjebilde"
                      className="aspect-[3/2] w-full object-cover"
                    />
                    <div className="flex items-center justify-between bg-slate-950/50 px-3 py-2">
                      <span className="text-[9px] text-slate-500">AI-generert hero-bilde</span>
                      <button
                        type="button"
                        onClick={() => setCampaignImageUrl("")}
                        className="text-[9px] font-black text-red-300"
                      >
                        Fjern
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => void createCampaign()}
                  disabled={campaignBusy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-[11px] font-black text-slate-950 transition hover:bg-amber-300 disabled:opacity-50"
                >
                  <Megaphone className="h-3.5 w-3.5" />
                  {campaignBusy ? "Oppretter..." : "Godkjenn og start kampanje"}
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320]">
              <div className="flex items-center justify-between border-b border-slate-800/70 px-5 py-4">
                <div>
                  <h4 className="text-sm font-black text-white">Forhåndsvisning</h4>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Slik vil kampanjen omtrent se ut før den sendes.
                  </p>
                </div>
                <div className="flex rounded-xl border border-slate-800 bg-slate-950/40 p-1">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("desktop")}
                    className={`rounded-lg p-2 ${
                      previewMode === "desktop"
                        ? "bg-slate-800 text-white"
                        : "text-slate-500"
                    }`}
                    title="Desktop"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("mobile")}
                    className={`rounded-lg p-2 ${
                      previewMode === "mobile"
                        ? "bg-slate-800 text-white"
                        : "text-slate-500"
                    }`}
                    title="Mobil"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-950/30 p-5">
                <div
                  className={`mx-auto overflow-hidden rounded-2xl border border-slate-700 bg-white shadow-2xl transition-all ${
                    previewMode === "mobile" ? "max-w-[390px]" : "max-w-[760px]"
                  }`}
                >
                  <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div className="text-[11px] font-bold text-slate-900">
                      {campaignSubject || "Emnefelt for kampanjen"}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">
                      {campaignPreheader || "Preheader vises her"}
                    </div>
                    <div className="mt-2 text-[9px] text-slate-400">
                      Taklekkasjevakten &lt;{defaultSender?.from_email || "post@taklekkasjevakten.no"}&gt;
                    </div>
                  </div>

                  {campaignImageAbsoluteUrl ? (
                    <img
                      src={campaignImageAbsoluteUrl}
                      alt=""
                      className="block w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[3/1] items-center justify-center bg-slate-100 text-slate-400">
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-6 w-6" />
                        <div className="mt-2 text-[10px]">AI-bilde kan legges her</div>
                      </div>
                    </div>
                  )}

                  <div className="p-7">
                    <h2 className="text-2xl font-black leading-tight text-slate-900">
                      {campaignHeadline || "Kampanjeoverskrift"}
                    </h2>

                    <div className="mt-5 whitespace-pre-line text-sm leading-6 text-slate-600">
                      {campaignMessage ||
                        "Her vises kampanjeteksten. Lag et forslag med AI eller skriv teksten selv."}
                    </div>

                    {campaignCtaLabel.trim() && (
                      <button
                        type="button"
                        className="mt-6 rounded-lg bg-amber-400 px-5 py-3 text-xs font-black text-slate-950"
                      >
                        {campaignCtaLabel}
                      </button>
                    )}

                    <div className="mt-8 border-t border-slate-200 pt-5 text-[10px] leading-4 text-slate-400">
                      Med vennlig hilsen<br />
                      <strong className="text-slate-600">Taklekkasjevakten</strong><br />
                      Vi finner årsaken – ikke bare symptomene.
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320]">
            <div className="border-b border-slate-800/70 px-5 py-4">
              <h4 className="text-sm font-black text-white">Kampanjer</h4>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Status og fremdrift for markedsføringsutsendinger.
              </p>
            </div>

            {campaigns.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title="Ingen kampanjer ennå"
                text="Bygg og forhåndsvis den første kampanjen over."
              />
            ) : (
              <div className="divide-y divide-slate-800/70">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[9px] font-black text-slate-600">
                            #{campaign.id}
                          </span>
                          <h5 className="truncate text-xs font-black text-white">
                            {campaign.name}
                          </h5>
                          <StatusBadge status={campaign.status} />
                        </div>
                        <p className="mt-1 truncate text-[10px] text-slate-500">
                          {campaign.subject}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        {campaign.status === "running" ? (
                          <button
                            type="button"
                            onClick={() => void setCampaignStatus(campaign.id, "paused")}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-2 text-[9px] font-black text-slate-300 hover:bg-white/5"
                          >
                            <Pause className="h-3 w-3" />
                            Pause
                          </button>
                        ) : campaign.status === "paused" ? (
                          <button
                            type="button"
                            onClick={() => void setCampaignStatus(campaign.id, "running")}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-2 text-[9px] font-black text-emerald-300"
                          >
                            <Play className="h-3 w-3" />
                            Fortsett
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-2">
                      <Metric label="Totalt" value={campaign.total_recipients} />
                      <Metric label="I kø" value={campaign.queued_count} />
                      <Metric label="Sendt" value={campaign.sent_count} />
                      <Metric label="Feilet" value={campaign.failed_count} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {view === "queue" && (
        <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320]">
          <div className="flex items-center justify-between border-b border-slate-800/70 px-5 py-4">
            <div>
              <h4 className="text-sm font-black text-white">Utsendingskø</h4>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Kundedialog prioriteres foran markedsføringsmail.
              </p>
            </div>
            <span className="rounded-lg border border-slate-700 px-2.5 py-1 text-[9px] font-black text-slate-400">
              {queue.length} siste
            </span>
          </div>
          <QueueTable items={queue} />
        </section>
      )}
    </div>
  );
}

function QueueTable({ items }: { items: QueueItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Mail}
        title="Køen er tom"
        text="Nye e-poster og kampanjer vil vises her."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px]">
        <thead>
          <tr className="border-b border-slate-800/70 text-left">
            {["ID", "Mottaker", "Emne", "Type", "Status", "Forsøk", "Opprettet"].map(
              (label) => (
                <th
                  key={label}
                  className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.12em] text-slate-600"
                >
                  {label}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3 font-mono text-[9px] font-black text-slate-600">
                #{item.id}
              </td>
              <td className="px-4 py-3">
                <div className="text-[10px] font-bold text-slate-200">
                  {item.recipient_name || item.recipient_email}
                </div>
                {item.recipient_name && (
                  <div className="mt-0.5 text-[9px] text-slate-600">
                    {item.recipient_email}
                  </div>
                )}
              </td>
              <td className="max-w-[260px] truncate px-4 py-3 text-[10px] text-slate-300">
                {item.subject}
              </td>
              <td className="px-4 py-3 text-[9px] font-bold text-slate-500">
                {item.message_type === "marketing" ? "Kampanje" : "Kundedialog"}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={item.status} />
              </td>
              <td className="px-4 py-3 text-[10px] text-slate-500">
                {item.attempt_count || 0}
              </td>
              <td className="px-4 py-3 text-[9px] text-slate-600">
                {formatDate(item.sent_at || item.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-black ${statusClass(
        status
      )}`}
    >
      {statusLabel[status] || status}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/30 px-3 py-2.5">
      <div className="text-[9px] font-black uppercase tracking-wide text-slate-600">
        {label}
      </div>
      <div className="mt-1 text-sm font-black text-white">{value || 0}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Mail;
  title: string;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/40">
        <Icon className="h-4 w-4 text-slate-600" />
      </div>
      <h5 className="mt-3 text-xs font-black text-slate-300">{title}</h5>
      <p className="mt-1 max-w-sm text-[10px] leading-4 text-slate-600">{text}</p>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-3 text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-amber-500/40";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
