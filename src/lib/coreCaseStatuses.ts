import type { CoreCaseStatus, CoreCaseStatusView } from "../components/CoreCaseStatusBadge";

export type CoreCaseStatusesSnapshot = {
  state: "loading" | "ready" | "unavailable";
  byInquiryId: ReadonlyMap<number, CoreCaseStatusView>;
};

const knownStatuses = new Set<CoreCaseStatus>(["active", "on_hold", "completed", "closed", "stopped"]);
const positiveId = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;

// Dedicated admin API contract. Never read TLV status/offer/booking/pause fields.
export function parseCoreCaseStatuses(payload: unknown): ReadonlyMap<number, CoreCaseStatusView> {
  if (!payload || typeof payload !== "object") throw new Error("Invalid Core response");
  const data = payload as Record<string, unknown>;
  if (data.success !== true || !Array.isArray(data.cases) ||
      typeof data.count !== "number" || !Number.isSafeInteger(data.count) || data.count < 0) {
    throw new Error("Invalid Core response");
  }

  // count is metadata; per-inquiry statuses come exclusively from cases rows.
  const byInquiryId = new Map<number, CoreCaseStatusView>();
  const seenInquiries = new Set<number>();
  const coreOwners = new Map<number, Set<number>>();
  for (const value of data.cases) {
    if (!value || typeof value !== "object") throw new Error("Invalid Core case");
    const row = value as Record<string, unknown>;
    if (!positiveId(row.inquiry_id) || !positiveId(row.core_case_id)) {
      // An unmappable row is not evidence that any local case is unlinked.
      throw new Error("Invalid Core case identity");
    }
    const view: CoreCaseStatusView =
      typeof row.status === "string" && knownStatuses.has(row.status as CoreCaseStatus)
        ? { state: "available", status: row.status as CoreCaseStatus }
        : { state: "unknown" };

    byInquiryId.set(row.inquiry_id, seenInquiries.has(row.inquiry_id) ? { state: "unknown" } : view);
    seenInquiries.add(row.inquiry_id);
    const owners = coreOwners.get(row.core_case_id) ?? new Set<number>();
    owners.add(row.inquiry_id);
    coreOwners.set(row.core_case_id, owners);
  }
  // A single Core case must not silently supply the status of multiple TLV cases.
  for (const owners of coreOwners.values()) {
    if (owners.size > 1) {
      for (const inquiryId of owners) byInquiryId.set(inquiryId, { state: "unknown" });
    }
  }
  return byInquiryId;
}

export function coreCaseStatusForInquiry(
  snapshot: CoreCaseStatusesSnapshot,
  inquiryId: unknown,
): CoreCaseStatusView {
  if (snapshot.state !== "ready") return { state: "unavailable" };
  // Local Inquiry.id is typed as string; require a complete canonical integer.
  const id = typeof inquiryId === "string" && /^[1-9]\d*$/.test(inquiryId)
    ? Number(inquiryId)
    : inquiryId;
  if (!positiveId(id)) return { state: "unknown" };
  return snapshot.byInquiryId.get(id) ?? { state: "unlinked" };
}

export function createCoreCaseStatusLoader(
  endpoint: string,
  onChange: (snapshot: CoreCaseStatusesSnapshot) => void,
  request: typeof fetch = (...args) => fetch(...args),
) {
  let generation = 0;
  let controller: AbortController | null = null;
  let disposed = false;

  async function refresh(): Promise<void> {
    if (disposed) return;
    const currentGeneration = ++generation;
    controller?.abort();
    const currentController = new AbortController();
    controller = currentController;
    const isCurrent = () =>
      !disposed && generation === currentGeneration && !currentController.signal.aborted;

    onChange({ state: "loading", byInquiryId: new Map() });
    try {
      const response = await request(endpoint, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        signal: currentController.signal,
      });
      if (!response.ok) throw new Error("Core request failed");
      const byInquiryId = parseCoreCaseStatuses(await response.json());
      if (isCurrent()) onChange({ state: "ready", byInquiryId });
    } catch {
      // Do not retain old statuses or expose backend response/error contents.
      if (isCurrent()) onChange({ state: "unavailable", byInquiryId: new Map() });
    } finally {
      if (controller === currentController) controller = null;
    }
  }

  function dispose() {
    disposed = true;
    generation++;
    controller?.abort();
    controller = null;
  }

  return { refresh, dispose };
}
