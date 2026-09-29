import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  OTP_LENGTH,
  applyOtpBackspace,
  applyOtpInput,
  applyOtpPaste,
  createOtpVerificationGuard,
  firstEmptyOtpIndex,
  getOtpSlots,
  isCompleteOtp,
  isWebOtpSupported,
  normalizeOtpDigits,
  normalizeWebOtpCode,
  requestWebOtp,
} from "./otpInputContract.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const otpInputSource = read("../ui/PersianOTPInput.jsx");
const loginSource = read("../app/(user)/auth/_components/Login.jsx");
const webOtpHookSource = read("../hooks/useWebOtp.js");

// --- slot model -------------------------------------------------------------

test("the OTP is exactly five digits", () => {
  assert.equal(OTP_LENGTH, 5);
  assert.equal(isCompleteOtp("24516"), true);
  for (const value of ["", "2451", "245166", "24 16", "2451a", "۲۴۵۱۶", null]) {
    assert.equal(isCompleteOtp(value), false, String(value));
  }
});

test("normal single-digit entry fills the slot and moves focus forward", () => {
  let state = { value: "" };
  ["2", "4", "5", "1", "6"].forEach((digit, index) => {
    state = applyOtpInput(state.value, index, digit);
  });
  assert.equal(state.value, "24516");
  assert.equal(state.focusIndex, 4);

  assert.deepEqual(applyOtpInput("", 0, "2"), { value: "2", focusIndex: 1 });
  assert.deepEqual(applyOtpInput("2451", 4, "6"), { value: "24516", focusIndex: 4 });
});

test("typed Persian and Arabic-Indic digits are stored as ASCII", () => {
  assert.equal(normalizeOtpDigits("۲۴۵۱۶"), "24516");
  assert.equal(normalizeOtpDigits("٢٤٥١٦"), "24516");
  assert.equal(normalizeOtpDigits(" 2-4 5 "), "245");
  assert.equal(applyOtpInput("", 0, "۲").value, "2");
  assert.equal(applyOtpInput("2", 1, "٤").value, "24");
  assert.equal(applyOtpInput("", 0, "x").value, "");
});

test("a full code autofilled into one slot fills all five slots", () => {
  assert.deepEqual(applyOtpInput("", 0, "24516"), { value: "24516", focusIndex: 4 });
  assert.deepEqual(applyOtpInput("", 0, "۲۴۵۱۶"), { value: "24516", focusIndex: 4 });
  // Any slot, even a later one, receives the whole code from slot 0.
  assert.equal(applyOtpInput("", 2, "24516").value, "24516");
  // A filled slot reports its old digit plus the inserted code.
  assert.equal(applyOtpInput("3", 0, "۳24516", { caret: 6 }).value, "24516");
  assert.equal(applyOtpInput("3", 0, "24516۳", { caret: 5 }).value, "24516");
  // Exactly five digits replace the field even if the first equals the old digit.
  assert.equal(applyOtpInput("2", 0, "24516", { caret: 5 }).value, "24516");
});

test("typing into a filled slot replaces its digit", () => {
  assert.equal(applyOtpInput("24516", 2, "۵7", { caret: 2 }).value, "24716");
  assert.equal(applyOtpInput("24516", 2, "7۵", { caret: 1 }).value, "24716");
  assert.equal(applyOtpInput("24516", 2, "۵۵", { caret: 2 }).value, "24516");
});

test("a short run of digits fills from the edited slot onwards", () => {
  assert.deepEqual(applyOtpInput("24", 2, "51"), { value: "2451", focusIndex: 4 });
  assert.equal(applyOtpInput("245", 3, "169").value, "24516");
});

test("editing or clearing a later slot never shifts the other digits", () => {
  assert.equal(applyOtpInput("", 3, "1").value, "   1");
  assert.deepEqual(getOtpSlots("   1"), ["", "", "", "1", ""]);
  assert.equal(applyOtpInput("   1", 0, "2").value, "2  1");
  assert.equal(applyOtpInput("24516", 1, "").value, "2 516");
  assert.deepEqual(getOtpSlots("2 516"), ["2", "", "5", "1", "6"]);
  assert.equal(applyOtpInput("2 516", 1, "4").value, "24516");
  assert.equal(isCompleteOtp("2 516"), false);
});

test("backspace clears in place and steps back from an empty slot", () => {
  assert.deepEqual(applyOtpBackspace("24516", 2), { value: "24 16", focusIndex: 2 });
  assert.deepEqual(applyOtpBackspace("24", 2), { value: "24", focusIndex: 1 });
  assert.deepEqual(applyOtpBackspace("24516", 4), { value: "2451", focusIndex: 4 });
  assert.deepEqual(applyOtpBackspace("", 0), { value: "", focusIndex: 0 });
});

test("paste of a full OTP replaces the value from slot 0", () => {
  assert.equal(applyOtpPaste("24516"), "24516");
  assert.equal(applyOtpPaste("کد تایید: ۲۴۵۱۶"), "24516");
  assert.equal(applyOtpPaste("2451699"), "24516");
  assert.equal(applyOtpPaste("24"), "24");
});

test("autofocus targets the first empty slot", () => {
  assert.equal(firstEmptyOtpIndex(""), 0);
  assert.equal(firstEmptyOtpIndex("24"), 2);
  assert.equal(firstEmptyOtpIndex("2 516"), 1);
  assert.equal(firstEmptyOtpIndex("24516"), 4);
});

// --- WebOTP -----------------------------------------------------------------

test("WebOTP codes are accepted only when complete", () => {
  assert.equal(normalizeWebOtpCode("24516"), "24516");
  assert.equal(normalizeWebOtpCode(" 24516 "), "24516");
  assert.equal(normalizeWebOtpCode("۲۴۵۱۶"), "24516");
  for (const code of ["2451", "245166", "24516x", "24 16", "", null, undefined, 24516]) {
    assert.equal(normalizeWebOtpCode(code), null, String(code));
  }
});

const fakeWindow = (get) => ({ OTPCredential: function OTPCredential() {}, navigator: { credentials: { get } } });

test("WebOTP is feature-detected and inert without support or during SSR", async () => {
  assert.equal(isWebOtpSupported(undefined), false);
  assert.equal(isWebOtpSupported({ navigator: { credentials: { get() {} } } }), false);
  assert.equal(isWebOtpSupported(fakeWindow(() => {})), true);
  assert.equal(await requestWebOtp({ win: undefined }), null);
  assert.equal(await requestWebOtp({ win: { navigator: {} } }), null);
});

test("a complete WebOTP result is accepted with the SMS transport and signal", async () => {
  const calls = [];
  const controller = new AbortController();
  const win = fakeWindow(async (options) => {
    calls.push(options);
    return { code: "24516", type: "otp" };
  });
  assert.equal(await requestWebOtp({ win, signal: controller.signal }), "24516");
  assert.deepEqual(calls, [{ otp: { transport: ["sms"] }, signal: controller.signal }]);
});

test("an incomplete or unusable WebOTP result is ignored", async () => {
  for (const credential of [{ code: "2451" }, { code: "24516x" }, {}, null]) {
    assert.equal(await requestWebOtp({ win: fakeWindow(async () => credential) }), null);
  }
});

test("WebOTP failures resolve silently to null", async () => {
  for (const name of ["AbortError", "NotAllowedError", "InvalidStateError", "NotSupportedError"]) {
    const win = fakeWindow(async () => {
      throw new DOMException("failed", name);
    });
    assert.equal(await requestWebOtp({ win }), null, name);
  }
});

test("a WebOTP result that arrives after abort is dropped", async () => {
  const controller = new AbortController();
  const win = fakeWindow(async () => {
    controller.abort();
    return { code: "24516" };
  });
  assert.equal(await requestWebOtp({ win, signal: controller.signal }), null);
});

// --- verification guard -----------------------------------------------------

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

test("the in-flight guard ignores duplicate verifications and stays closed after success", async () => {
  const guard = createOtpVerificationGuard();
  const pending = deferred();
  let calls = 0;
  const task = () => {
    calls += 1;
    return pending.promise;
  };

  const first = guard.run(task);
  assert.equal(guard.state, "pending");
  assert.deepEqual(await guard.run(task), { ok: false, skipped: true });
  assert.deepEqual(await guard.run(task), { ok: false, skipped: true });

  pending.resolve();
  assert.deepEqual(await first, { ok: true });
  assert.equal(guard.state, "done");
  assert.deepEqual(await guard.run(task), { ok: false, skipped: true });
  assert.equal(calls, 1);
});

test("a failed verification releases the guard for a corrected code", async () => {
  const guard = createOtpVerificationGuard();
  const error = new Error("کد نامعتبر یا منقضی است");
  const failed = await guard.run(async () => {
    throw error;
  });
  assert.deepEqual(failed, { ok: false, error });
  assert.equal(guard.state, "idle");

  assert.deepEqual(await guard.run(async () => {}), { ok: true });
});

// --- wiring -----------------------------------------------------------------

test("the OTP inputs keep numeric one-time-code entry and autofocus on mount", () => {
  assert.match(otpInputSource, /inputMode="numeric"/);
  assert.match(otpInputSource, /autoComplete="one-time-code"/);
  assert.match(otpInputSource, /maxLength=\{numInputs \+ 1\}/);
  assert.doesNotMatch(otpInputSource, /maxLength=\{1\}/);
  assert.match(otpInputSource, /firstEmptyOtpIndex\(value, numInputs\)\]\?\.focus\(\)/);
  assert.doesNotMatch(otpInputSource, /setTimeout/);
});

// The flow rules themselves (otpPhone, attempts, resend) are covered by
// otpLoginFlow.test.mjs; these only check that Login is wired to them.
test("WebOTP verifies the received code, not the previous OTP state", () => {
  assert.match(loginSource, /enabled: isWebOtpActive\(flow\) && !isPasswordType/);
  assert.match(loginSource, /requestKey: flow\.attempt/);
  assert.match(
    loginSource,
    /if \(!isCurrentAttempt\(flowRef\.current, requestKey\)\) return;\s*setOtp\(code\);\s*verifyOtp\(code\);/,
  );
  assert.match(loginSource, /getVerifyRequest\(flowRef\.current, code\)/);
  assert.match(loginSource, /verifyOtpApi\(\{ phoneNumber: otpPhone, code \}\)/);
  assert.doesNotMatch(loginSource, /getValues\(/);
  assert.match(loginSource, /verificationGuardRef\.current\.run\(/);
  assert.match(loginSource, /if \(!isCompleteOtp\(otp\)\) return toast\.error\("کد تکمیل نشده"\);\s*return verifyOtp\(otp\);/);
});

test("the WebOTP hook aborts on cleanup and names no domain", () => {
  assert.match(webOtpHookSource, /return \(\) => controller\.abort\(\);/);
  // One listener per OTP request: a new request key aborts the previous one.
  assert.match(webOtpHookSource, /\[enabled, requestKey, length\]/);
  assert.match(webOtpHookSource, /onCodeRef\.current\?\.\(code, requestKey\)/);
  for (const source of [webOtpHookSource, loginSource, read("./otpInputContract.mjs")]) {
    assert.doesNotMatch(source, /jeawaz\.com/);
  }
});
