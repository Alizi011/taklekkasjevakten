/**
 * TLV legacy notification baseline.
 *
 * Historical customer conversations remain visible in Messages but should not
 * be presented as brand-new action alerts after the November platform cutover.
 * New incoming customer messages are still actionable, even on older threads.
 * A missing timestamp is left actionable (fail open for notification).
 *
 * Dates from TLV's messages API use local SQL DATETIME and are compared in
 * canonical YYYY-MM-DD HH:mm:ss format.
 */
export const CUSTOMER_MESSAGE_NOTIFICATION_CUTOVER = "2026-11-24 00:00:00";

export function isActiveCustomerMessageNotification(
  message: { created_at?: unknown }
): boolean {
  const created = String(message.created_at || "")
    .replace("T", " ")
    .slice(0, 19);
  return !created || created >= CUSTOMER_MESSAGE_NOTIFICATION_CUTOVER;
}
