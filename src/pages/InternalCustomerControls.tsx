import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Loader2,
  LockKeyhole,
  MegaphoneOff,
  Save,
  ShieldCheck,
} from "lucide-react";
import { apiUrl } from "../lib/api";

type AccountStatus = "active" | "on_hold" | "blocked" | "closed";
type BillingStatus = "ok" | "payment_missing" | "overdue" | "disputed";
type PortalStatus = "active" | "limited" | "blocked";

interface CustomerControl {
  customer_id: number;
  account_status: AccountStatus;
  billing_status: BillingStatus;
  portal_access_status: PortalStatus;
  portal_message?: string | null;
  marketing_allowed: number;
  marketing_reason?: string | null;
  internal_note?: string | null;
  changed_by_name?: string | null;
  updated_at?: string | null;
}

interface CustomerControlsResponse {
  success: boolean;
  message?: string;
  control?: CustomerControl;
  effective_marketing_allowed?: boolean;
  marketing_suppression?: {
    reason?: string | null;
    source?: string | null;
  } | null;
}

export default function InternalCustomerControls({
  customerId,
}: {
  customerId: number;
}) {
  const [control, setControl] = useState<CustomerControl | null>(null);
  const [effectiveMarketingAllowed, setEffectiveMarketingAllowed] = useState(true);
  const [externalSuppression, setExternalSuppression] = useState<string | null>(null);
  const [changeReason, setChangeReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        apiUrl(`/core/customer_controls.php?customer_id=${customerId}`)
      );
      const data: CustomerControlsResponse = await res.json();

      if (!res.ok || !data.success || !data.control) {
        throw new Error(data.message || "Kunne ikke hente kundekontroller.");
      }

      setControl(data.control);
      setEffectiveMarketingAllowed(data.effective_marketing_allowed !== false);

      const suppression = data.marketing_suppression;
      if (
        suppression &&
        suppression.source &&
        !String(suppression.source).startsWith("customer_control:")
      ) {
        setExternalSuppression(
          suppression.reason || "Kunden er sperret av en annen markedsføringsregel."
        );
      } else {
        setExternalSuppression(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunne ikke hente kundekontroller."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [customerId]);

  const update = <K extends keyof CustomerControl>(
    key: K,
    value: CustomerControl[K]
  ) => {
    setControl((prev) => (prev ? { ...prev, [key]: value } : prev));
    setMessage("");
  };

  const save = async () => {
    if (!control) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(apiUrl("/core/customer_controls.php"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          account_status: control.account_status,
          billing_status: control.billing_status,
          portal_access_status: control.portal_access_status,
          portal_message: control.portal_message || null,
          marketing_allowed: Number(control.marketing_allowed) === 1,
          marketing_reason: control.marketing_reason || null,
          internal_note: control.internal_note || null,
          change_reason: changeReason || null,
          changed_by_name: "Admin",
        }),
      });

      const data: CustomerControlsResponse = await res.json();

      if (!res.ok || !data.success || !data.control) {
        throw new Error(data.message || "Kunne ikke lagre kundekontrollene.");
      }

      setControl(data.control);
      setEffectiveMarketingAllowed(data.effective_marketing_allowed !== false);
      setChangeReason("");
      setMessage("Kundekontrollene er lagret.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunne ikke lagre kundekontrollene."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-[#0d1320] p-5">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
          Henter interne kundekontroller...
        </div>
      </section>
    );
  }

  if (!control) {
    return (
      <section className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-5 text-xs text-red-300">
        {error || "Kundekontroller er ikke tilgjengelige."}
      </section>
    );
  }

  const paymentProblem =
    control.billing_status !== "ok" || control.account_status === "on_hold";
  const portalBlocked = control.portal_access_status !== "active";
  const marketingBlocked = !effectiveMarketingAllowed;

  return (
    <div className="space-y-5">
      {(paymentProblem || portalBlocked || marketingBlocked) && (
        <section className="grid gap-3 md:grid-cols-3">
          {paymentProblem && (
            <StatusCard
              icon={<CreditCard className="h-4 w-4" />}
              title="Betaling krever oppfølging"
              text="Kunden er markert med manglende, forsinket eller omtvistet betaling."
              tone="amber"
            />
          )}

          {portalBlocked && (
            <StatusCard
              icon={<LockKeyhole className="h-4 w-4" />}
              title="Kundeportal begrenset"
              text={
                control.portal_access_status === "blocked"
                  ? "Kundeportalen er sperret."
                  : "Enkelte handlinger i kundeportalen skal begrenses."
              }
              tone="red"
            />
          )}

          {marketingBlocked && (
            <StatusCard
              icon={<MegaphoneOff className="h-4 w-4" />}
              title="Markedsføring sperret"
              text="Kunden skal ikke tas med i markedsføringskampanjer."
              tone="red"
            />
          )}
        </section>
      )}

      <section className="rounded-2xl border border-slate-800 bg-[#0d1320]">
        <div className="border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-amber-300" />
            <h2 className="text-sm font-black">Intern kundekontroll</h2>
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            Disse opplysningene er kun for ansatte og vises ikke i kundeportalen.
          </p>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <ControlSelect
            label="Kundestatus"
            value={control.account_status}
            onChange={(value) =>
              update("account_status", value as AccountStatus)
            }
            options={[
              ["active", "Aktiv"],
              ["on_hold", "På vent / betalingshold"],
              ["blocked", "Sperret"],
              ["closed", "Avsluttet"],
            ]}
          />

          <ControlSelect
            label="Betalingsstatus"
            value={control.billing_status}
            onChange={(value) =>
              update("billing_status", value as BillingStatus)
            }
            options={[
              ["ok", "Betaling OK"],
              ["payment_missing", "Vi savner betaling"],
              ["overdue", "Forfalt betaling"],
              ["disputed", "Omtvistet betaling"],
            ]}
          />

          <ControlSelect
            label="Tilgang til kundeportal"
            value={control.portal_access_status}
            onChange={(value) =>
              update("portal_access_status", value as PortalStatus)
            }
            options={[
              ["active", "Full tilgang"],
              ["limited", "Begrenset tilgang"],
              ["blocked", "Sperret"],
            ]}
          />

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black text-white">
                  Ikke send markedsføring
                </p>
                <p className="mt-1 text-[10px] leading-4 text-slate-500">
                  Sperrer kunden i den sentrale marketing_suppressions-listen.
                  Tilbud, rapporter, faktura og oppdragsmeldinger påvirkes ikke.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  update(
                    "marketing_allowed",
                    Number(control.marketing_allowed) === 1 ? 0 : 1
                  )
                }
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                  Number(control.marketing_allowed) === 0
                    ? "bg-red-500"
                    : "bg-slate-700"
                }`}
                aria-label="Ikke send markedsføring"
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                    Number(control.marketing_allowed) === 0
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>
            </div>

            {externalSuppression && (
              <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] leading-4 text-amber-200">
                Kunden er også sperret av en annen regel: {externalSuppression}
              </div>
            )}
          </div>

          <TextArea
            label="Melding til kunden ved begrenset / sperret portal"
            value={control.portal_message || ""}
            onChange={(value) => update("portal_message", value)}
            placeholder="F.eks. Vi savner betaling på en utestående faktura. Ta kontakt dersom betalingen allerede er utført."
          />

          <TextArea
            label="Årsak til markedsføringssperre"
            value={control.marketing_reason || ""}
            onChange={(value) => update("marketing_reason", value)}
            placeholder="F.eks. Pågående konflikt / kunden har bedt om å ikke motta markedsføring."
          />

          <div className="lg:col-span-2">
            <TextArea
              label="Internt notat"
              value={control.internal_note || ""}
              onChange={(value) => update("internal_note", value)}
              placeholder="Kun for ansatte. Skal aldri vises til kunden."
              rows={4}
            />
          </div>

          <div className="lg:col-span-2">
            <TextArea
              label="Årsak til denne endringen"
              value={changeReason}
              onChange={setChangeReason}
              placeholder="Valgfritt. Lagres i endringshistorikken."
              rows={2}
            />
          </div>
        </div>

        {(message || error) && (
          <div className="border-t border-slate-800 px-5 py-3">
            {message && (
              <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                {message}
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-[11px] font-bold text-red-300">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end border-t border-slate-800 px-5 py-4">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-[11px] font-black text-slate-950 transition hover:bg-amber-300 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saving ? "Lagrer..." : "Lagre kundekontroller"}
          </button>
        </div>
      </section>
    </div>
  );
}

function ControlSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-3 text-xs font-bold text-white outline-none focus:border-amber-500/40"
      >
        {options.map(([id, text]) => (
          <option key={id} value={id}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-3 text-xs leading-5 text-white outline-none placeholder:text-slate-600 focus:border-amber-500/40"
      />
    </label>
  );
}

function StatusCard({
  icon,
  title,
  text,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  tone: "amber" | "red";
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        tone === "red"
          ? "border-red-500/20 bg-red-500/[0.06]"
          : "border-amber-500/20 bg-amber-500/[0.06]"
      }`}
    >
      <div
        className={`flex items-center gap-2 text-xs font-black ${
          tone === "red" ? "text-red-300" : "text-amber-300"
        }`}
      >
        {icon}
        {title}
      </div>
      <p className="mt-2 text-[10px] leading-4 text-slate-500">{text}</p>
    </div>
  );
}
