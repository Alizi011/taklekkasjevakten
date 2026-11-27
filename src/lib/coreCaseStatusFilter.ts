import type { CoreCaseStatus, CoreCaseStatusView } from "../components/CoreCaseStatusBadge";

export type CoreCaseStatusFilterValue = "all" | "pending_offer" | CoreCaseStatus;
export type CoreCaseStatusCounts = Record<CoreCaseStatus, number>;

// These are presentation helpers, not a backend contract. Only a verified Core reader
// may provide available states; operational TLV status must never be passed here.
export function filterCoreStatusRows<T>(
  rows: T[],
  selected: CoreCaseStatusFilterValue,
  statusForRow: (row: T) => CoreCaseStatusView,
  sourceAvailable: boolean,
): T[] {
  // A lost/unconfirmed data source must not hide cases or invent a distribution.
  if (!sourceAvailable || selected === "all") return rows;
  return rows.filter((row) => {
    const view = statusForRow(row);
    return view.state === "available" && view.status === selected;
  });
}

export function countCoreStatusRows<T>(
  rows: T[],
  statusForRow: (row: T) => CoreCaseStatusView,
  sourceAvailable: boolean,
): CoreCaseStatusCounts | null {
  if (!sourceAvailable) return null;
  const counts: CoreCaseStatusCounts = {
    active: 0,
    on_hold: 0,
    completed: 0,
    closed: 0,
    stopped: 0,
  };
  for (const row of rows) {
    const view = statusForRow(row);
    if (view.state === "available" && Object.hasOwn(counts, view.status)) {
      counts[view.status]++;
    }
  }
  return counts;
}
