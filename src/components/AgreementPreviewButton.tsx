import { useEffect, useState } from "react";
import { FileCheck2, X } from "lucide-react";
import { apiUrl } from "../lib/api";

type Offer = {
  id: number;
  offer_number?: string | null;
  title?: string | null;
  status?: string | null;
  pricing_mode?: string | null;
};

type Props = {
  offer: Offer;
  customerName?: string;
  address?: string;
  customerOrgNumber?: string | null;
  customerPostalAddress?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerContact?: string | null;
};

export default function AgreementPreviewButton({ offer }: Props) {
  const [open, setOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  if (offer.pricing_mode !== "fixed") return null;

  async function preview() {
    setOpen(true);
    setLoading(true);
    setError("");
    setPdfUrl("");

    try {
      const response = await fetch(
        apiUrl(
          `/admin_agreement_v2_preview.php?offer_id=${encodeURIComponent(offer.id)}`
        ),
        { credentials: "include", cache: "no-store" }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${data.message || "Kunne ikke hente arbeidsavtalen."}`);
      }

      const blob = await response.blob();

      if (!blob.type.includes("application/pdf")) {
        throw new Error("Serveren returnerte ikke en PDF.");
      }

      setPdfUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Forhåndsvisningen feilet.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void preview()}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 text-xs font-bold text-amber-200 hover:bg-amber-500/20"
      >
        <FileCheck2 className="h-4 w-4" />
        Forhåndsvis avtale
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 p-3 sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Forhåndsvisning av arbeidsavtale"
            className="flex h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-white"
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-800 px-5 py-3">
              <div>
                <p className="text-xs font-bold text-amber-300">
                  KUN FORHÅNDSVISNING – INGEN AKSEPT ELLER SIGNERING
                </p>
                <h2 className="mt-1 font-bold">
                  {offer.offer_number || `Tilbud #${offer.id}`}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Lukk"
                className="rounded-lg p-2 hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1">
              {loading ? (
                <p className="p-6 text-sm">Genererer arbeidsavtalen …</p>
              ) : error ? (
                <p role="alert" className="p-6 text-sm text-red-300">
                  {error}
                </p>
              ) : pdfUrl ? (
                <iframe
                  title="Arbeidsavtale med pristilbud"
                  src={pdfUrl}
                  className="h-full w-full bg-white"
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

