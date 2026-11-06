import { useEffect, useState } from "react";
import { Building2, ChevronDown, UserRound, CheckCircle2 } from "lucide-react";

type Organisation = {
  customer_id: number;
  customer_name: string;
  access_role: string;
};

type Props = {
  inquiryId: number;
  endpoint: string;
  previewMode?: boolean;
  currentAccountName?: string;
};

const SESSION_KEY = "taklekkasjevakten_customer_session";

function roleLabel(role: string): string {
  switch (role) {
    case "customer_admin":
      return "Kundeadministrator";
    case "board_member":
      return "Styremedlem";
    default:
      return "Tilknyttet konto";
  }
}

export default function CustomerAccountSwitcher({
  inquiryId,
  endpoint,
  previewMode = false,
  currentAccountName = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    setOrganisations([]);
    setLoadError(false);
    setLoading(false);

    if (previewMode || inquiryId <= 0) {
      return () => controller.abort();
    }

    const token = window.localStorage.getItem(SESSION_KEY);

    if (!token) {
      return () => controller.abort();
    }

    setLoading(true);

    async function load() {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          signal: controller.signal,
          body: JSON.stringify({
            action: "list",
            inquiry_id: inquiryId,
            session_token: token,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error("Kunne ikke hente kontotilknytninger.");
        }

        if (!cancelled) {
          setOrganisations(
            (Array.isArray(data.organisations) ? data.organisations : [])
              .filter(
                (item: Organisation) =>
                  Number.isFinite(Number(item.customer_id)) &&
                  typeof item.customer_name === "string" &&
                  item.customer_name.trim().length > 0
              )
          );
        }
      } catch {
        if (!cancelled && !controller.signal.aborted) {
          setLoadError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [inquiryId, endpoint, previewMode]);

  const nameFromCase = currentAccountName.trim();

  const currentOrganisation = organisations.find(
    (org) =>
      org.customer_name.trim().toLocaleLowerCase("nb-NO") ===
      nameFromCase.toLocaleLowerCase("nb-NO")
  );

  const displayName =
    nameFromCase || organisations[0]?.customer_name || "Kundekonto";

  const otherOrganisations = organisations.filter(
    (org) =>
      org.customer_id !== currentOrganisation?.customer_id &&
      org.customer_name.trim().toLocaleLowerCase("nb-NO") !==
        displayName.toLocaleLowerCase("nb-NO")
  );

  return (
    <div className="mb-5 px-1 py-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Vis kundekontoer"
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div className="min-w-0">


          <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-white">
            <Building2 size={16} className="shrink-0 text-amber-400" />
            <span className="break-words">{displayName}</span>
          </div>
        </div>

        <ChevronDown
          size={17}
          className={`shrink-0 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="mt-4 space-y-4 border-t border-slate-800 pt-4">
          <div className="flex items-start gap-2">
            <CheckCircle2
              size={16}
              className="mt-0.5 shrink-0 text-emerald-400"
            />
            <div className="min-w-0">
              <p className="break-words text-xs font-semibold text-white">
                {displayName}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Gjeldende konto
                {currentOrganisation
                  ? ` · ${roleLabel(currentOrganisation.access_role)}`
                  : ""}
              </p>
            </div>
          </div>

          {loading && (
            <p className="text-xs text-slate-400">
              Henter kontotilknytninger …
            </p>
          )}

          {loadError && (
            <p className="text-xs text-slate-400">
              Andre kontotilknytninger kunne ikke hentes.
            </p>
          )}

          {otherOrganisations.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Andre tilknytninger
              </p>

              {otherOrganisations.map((org) => (
                <div
                  key={org.customer_id}
                  className="flex items-start gap-2"
                >
                  <Building2
                    size={16}
                    className="mt-0.5 shrink-0 text-slate-400"
                  />
                  <div className="min-w-0">
                    <p className="break-words text-xs font-semibold text-white">
                      {org.customer_name}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {roleLabel(org.access_role)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-slate-800 pt-4">
            <div className="flex items-start gap-2">
              <UserRound
                size={17}
                className="mt-0.5 shrink-0 text-amber-400"
              />

              <div>
                <p className="text-sm font-semibold text-white">
                  Privatkonto
                </p>
                <p className="mt-1 text-[11px] leading-5 text-slate-400">
                  For egne private oppdrag
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}