import { useEffect, useState } from "react";
import AgreementPlanning from "@/components/project-manager/AgreementPlanning";
import { apiUrl } from "@/lib/api";

type Offer = {
  id: number;
  inquiry_id?: number;
  offer_number?: string | null;
  status?: string | null;
  offer_context?: string | null;
  pricing_mode?: string | null;
};

type Props = { inquiryId: number; onSaved: () => Promise<void> };

export default function QuickAgreementPlanning({ inquiryId, onSaved }: Props) {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setOffer(null);
    setNotice("");
    setSuccess(false);
    const load = async () => {
      try {
        const token = window.localStorage.getItem("taklekkasjevakten_project_manager_session");
        if (!token) throw new Error("Prosjektleder må være innlogget for å planlegge arbeid.");
        const response = await fetch(apiUrl(`/offers.php?inquiry_id=${inquiryId}&all=1`), {
          credentials: "include",
          cache: "no-store",
          headers: { "X-TLV-PM-Session": token },
        });
        const data = await response.json();
        if (!response.ok || data.success !== true) {
          throw new Error(data.message || "Kunne ikke kontrollere akseptert tilbud.");
        }
        const rows: Offer[] = Array.isArray(data.offers) ? data.offers : data.offer ? [data.offer] : [];
        const accepted = rows
          .filter((item) =>
            Number(item.inquiry_id || inquiryId) === inquiryId &&
            String(item.status || "").toLowerCase() === "akseptert" &&
            String(item.offer_context || "").toLowerCase() === "followup" &&
            String(item.pricing_mode || "").toLowerCase() === "fixed"
          )
          .sort((a, b) => Number(b.id) - Number(a.id))[0] || null;
        if (!accepted) throw new Error("Ingen akseptert fastprisavtale ble funnet for denne saken.");
        if (!cancelled) setOffer(accepted);
      } catch (error) {
        if (!cancelled) setNotice(error instanceof Error ? error.message : "Tilbudskontrollen feilet.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [inquiryId]);

  return (
    <section className="mt-4 rounded-2xl border border-amber-500/25 bg-[#1b1715] p-4 sm:p-5" aria-label="Planlegg arbeidsavtale">
      <h5 className="text-sm font-black text-white">Foreslå oppstartsdato</h5>
      <p className="mt-1 text-xs text-slate-300">Forslaget sendes til styreleder for godkjenning før arbeidsavtalen opprettes.</p>
      {loading && <p role="status" className="mt-3 text-xs text-slate-300">Kontrollerer tilbudet …</p>}
      {notice && <p role="status" className="mt-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-200">{notice}</p>}
      {success && <p role="status" className="mt-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-200">Datoforslaget er registrert. Avventer styreleders godkjenning.</p>}
      {!loading && offer && !success && (
        <div className="mt-4">
          <AgreementPlanning
            inquiryId={inquiryId}
            offerNumber={String(offer.offer_number || "")}
            onSubmit={async ({ start_date, estimated_duration }) => {
              if (saving) return;
              const token = window.localStorage.getItem("taklekkasjevakten_project_manager_session");
              if (!token) throw new Error("Prosjektlederinnlogging kreves.");
              setSaving(true);
              setNotice("");
              try {
                const response = await fetch(apiUrl("/project_manager_agreement_schedule.php"), {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "propose",
                    inquiry_id: inquiryId,
                    tlv_offer_id: offer.id,
                    start_date,
                    duration: estimated_duration,
                    session_token: token,
                  }),
                });
                const data = await response.json();
                if (!response.ok || data.success !== true) {
                  throw new Error(data.message || "Datoforslaget kunne ikke lagres.");
                }
                setSuccess(true);
                try { await onSaved(); } catch { /* Oppgavelisten kan oppdateres neste gang portalen får fokus. */ }
              } catch (error) {
                const message = error instanceof Error ? error.message : "Datoforslaget kunne ikke lagres.";
                setNotice(message);
                throw new Error(message);
              } finally {
                setSaving(false);
              }
            }}
          />
        </div>
      )}
    </section>
  );
}
