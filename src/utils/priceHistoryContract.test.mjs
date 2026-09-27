import test from "node:test";
import assert from "node:assert/strict";
import {
  basePriceText, buildRecoveryPreviewRequest, classifyRecoveryError,
  HISTORY_SOURCE, historyListParams, historyPaths, isRecoverableItem, RECOVERY_MODE,
  recoveryInputKey, recoveryPaths, recoveryPreviewReady, toggleHistoryItem,
} from "./priceHistoryContract.mjs";

test("history filters use the backend names and timezone-aware dates", () => {
  const result = historyListParams({ productId: "4", source: HISTORY_SOURCE.MANUAL,
    adminId: "7", appliedFrom: "2026-09-23T10:00", appliedTo: "2026-09-23T11:00",
    unsupported: "ignored" }, 2, 20);
  assert.equal(result.productId, 4);
  assert.equal(result.adminId, 7);
  assert.equal(result.source, "MANUAL_PRODUCT_EDIT");
  assert.match(result.appliedFrom, /Z$/);
  assert.match(result.appliedTo, /Z$/);
  assert.equal(result.page, 2);
  assert.equal(result.limit, 20);
  assert.equal("unsupported" in result, false);
});

test("selected and whole-operation Preview payloads cannot cross operation boundaries", () => {
  assert.deepEqual(buildRecoveryPreviewRequest(8, RECOVERY_MODE.SELECTED, [12, 11, 12]), {
    sourceOperationId: 8, targetMode: "SELECTED_ITEMS", sourceItemIds: [11, 12],
  });
  assert.deepEqual(buildRecoveryPreviewRequest(8, RECOVERY_MODE.WHOLE, [12]), {
    sourceOperationId: 8, targetMode: "ALL_RECOVERABLE",
  });
  assert.throws(() => buildRecoveryPreviewRequest(8, RECOVERY_MODE.SELECTED, []));
  assert.throws(() => buildRecoveryPreviewRequest(0, RECOVERY_MODE.WHOLE, []));
});

test("only backend-classified recoverable rows can be selected across detail pages", () => {
  const safe = { id: 11, status: "RECOVERABLE", recoverable: true };
  const structural = { id: 12, status: "STRUCTURAL_EVENT", recoverable: false };
  assert.equal(isRecoverableItem(safe), true);
  assert.equal(isRecoverableItem(structural), false);
  assert.deepEqual(toggleHistoryItem([2], safe), [2, 11]);
  assert.deepEqual(toggleHistoryItem([2, 11], structural), [2, 11]);
  assert.deepEqual(toggleHistoryItem([2, 11], safe), [2]);
});

test("input changes invalidate a persisted Preview; stale or expired states cannot Apply", () => {
  const original = recoveryInputKey(8, RECOVERY_MODE.SELECTED, [11, 12]);
  const reordered = recoveryInputKey(8, RECOVERY_MODE.SELECTED, [12, 11]);
  const changed = recoveryInputKey(8, RECOVERY_MODE.SELECTED, [11]);
  const whole = recoveryInputKey(8, RECOVERY_MODE.WHOLE, [11, 12]);
  assert.equal(original, reordered);
  assert.notEqual(original, changed);
  assert.notEqual(original, whole);
  assert.equal(recoveryPreviewReady({ status: "DRAFT" }, original, original, "ready"), true);
  assert.equal(recoveryPreviewReady({ status: "DRAFT" }, original, changed, "ready"), false);
  assert.equal(recoveryPreviewReady({ status: "DRAFT" }, original, original, "stale"), false);
  assert.equal(recoveryPreviewReady({ status: "DRAFT" }, original, original, "expired"), false);
});

test("Preview read and Apply paths use the persisted Recovery operation ID", () => {
  assert.equal(historyPaths.operations, "/products/price-history/operations");
  assert.equal(historyPaths.operation(8), "/products/price-history/operations/8");
  assert.equal(recoveryPaths.preview, "/products/price-history/recovery/preview");
  assert.equal(recoveryPaths.read(25), "/products/price-history/recovery/25/preview");
  assert.equal(recoveryPaths.apply(25), "/products/price-history/recovery/25/apply");
});

test("structured stale, unsafe, expiry and authorization errors remain distinct", () => {
  assert.deepEqual(classifyRecoveryError({ response: { status: 409, data: {
    reason: "STALE_RECOVERY", conflictCount: 2, conflicts: [{ reason: "LATER_PRICE_CHANGE" }],
  } } }), { kind: "stale", conflictCount: 2,
    conflicts: [{ reason: "LATER_PRICE_CHANGE" }] });
  assert.equal(classifyRecoveryError({ response: { status: 409, data: {
    reason: "RECOVERY_NOT_SAFE", nonRecoverableCount: 1,
  } } }).kind, "unsafe");
  assert.equal(classifyRecoveryError({ response: { status: 410 } }).kind, "expired");
  assert.equal(classifyRecoveryError({ response: { status: 403 } }).kind, "forbidden");
});

test("CREATED and REMOVED prices display a dash, never zero", () => {
  assert.equal(basePriceText(null), "—");
  assert.equal(basePriceText(undefined), "—");
  assert.notEqual(basePriceText(0), "—");
  assert.match(basePriceText(1000), /تومان/);
});
