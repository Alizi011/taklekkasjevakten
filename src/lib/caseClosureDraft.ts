// Local form values only. These are not a backend request contract.
export const closureStatuses = [
  { value: "completed", label: "Arbeidet fullført" },
  { value: "closed", label: "Saken lukket" },
  { value: "stopped", label: "Saken stanset/avbestilt" },
] as const;
export const maintenanceChoices = [
  { value: "offer", label: "Tilby årlig kontroll og vedlikehold" },
  { value: "existing", label: "Kunden har allerede en kontroll-/vedlikeholdsplan" },
  { value: "none", label: "Ikke aktuelt" },
] as const;

export function validateClosureDraft(status: string, maintenance: string, note: string): string[] {
  const errors: string[] = [];
  if (!closureStatuses.some((item) => item.value === status)) errors.push("Velg avslutningsstatus.");
  if (!maintenanceChoices.some((item) => item.value === maintenance)) errors.push("Velg oppfølging for årlig kontroll.");
  if (!note.trim()) errors.push("Registrer en begrunnelse og eventuell videre oppfølging.");
  return errors;
}

// Preview only: Core must persist the actual closure timestamp and calculate cycles.
// No leap-day policy is assumed. Core must decide an invalid anniversary explicitly.
export function annualControlPreview(closedDate: string, years: number): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(closedDate);
  if (!match || !Number.isSafeInteger(years) || years < 1) return null;
  const [year, month, day] = match.slice(1).map(Number);
  if (year < 1000 || year + years > 9999) return null;
  const valid = (y: number) => {
    const value = new Date(Date.UTC(y, month - 1, day));
    return value.getUTCFullYear() === y && value.getUTCMonth() === month - 1 && value.getUTCDate() === day;
  };
  return valid(year) && valid(year + years) ? `${year + years}-${match[2]}-${match[3]}` : null;
}

export function closurePreviewDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Oslo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
