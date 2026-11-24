import test from "node:test";
import assert from "node:assert/strict";
import { isActiveCustomerMessageNotification } from "../../src/lib/customerMessageAlerts.ts";

test("legacy October/November customer messages are history, not new action alerts", () => {
  for (const created_at of ["2026-10-26 15:32:27", "2026-11-12 06:56:36", "2026-11-16 09:46:30"]) {
    assert.equal(isActiveCustomerMessageNotification({ created_at }), false);
  }
});
test("new message on an older thread remains actionable", () => {
  assert.equal(isActiveCustomerMessageNotification({ created_at: "2026-11-24 10:03:00" }), true);
  assert.equal(isActiveCustomerMessageNotification({ created_at: "2026-11-25T09:30:00" }), true);
});
test("invalid or missing timestamp does not silently suppress a customer message", () => {
  assert.equal(isActiveCustomerMessageNotification({}), true);
  assert.equal(isActiveCustomerMessageNotification({ created_at: null }), true);
});
test("notification baseline is midnight on cutover day", () => {
  assert.equal(isActiveCustomerMessageNotification({ created_at: "2026-11-23 23:59:59" }), false);
  assert.equal(isActiveCustomerMessageNotification({ created_at: "2026-11-24 00:00:00" }), true);
});
