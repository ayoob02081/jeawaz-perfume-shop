"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import toast from "react-hot-toast";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Modal from "@/components/Modal";
import { useAuth } from "@/contexts/auth/AuthContext";
import {
  requestCurrentPhoneCodeApi,
  requestNewPhoneCodeApi,
  verifyCurrentPhoneCodeApi,
  verifyNewPhoneCodeApi,
} from "@/services/authServices";
import PersianOTPInput from "@/ui/PersianOTPInput";
import {
  cleanNumericValue,
  normalizeIranPhone,
  toPersianNumbers,
} from "@/utils/toPersianNumbers";
import {
  PHONE_CHANGE_CODE_LENGTH,
  PHONE_CHANGE_MESSAGES,
  canEditNewPhone,
  canRequestCurrent,
  canRequestNew,
  canResendCurrent,
  canResendNew,
  canVerifyCurrent,
  canVerifyNew,
  getCurrentVerifyRequest,
  getNewRequest,
  getNewVerifyRequest,
  getPhoneChangeRequestErrorMessage,
  getPhoneChangeVerifyErrorMessage,
  initialPhoneChangeState,
  isCurrentStep,
  isNewStep,
  isProfileUpToDate,
  isProofExpired,
  isRestartRequired,
  isSamePhone,
  looksLikeIranianMobile,
  maskPhoneForDisplay,
  phoneChangeReducer,
  secondsUntil,
} from "@/utils/phoneChangeFlow.mjs";

// The current time, ticking every second while `active` (code expiry,
// resend and proof countdowns).
function useNow(active) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [active]);

  return now;
}

const formatSeconds = (seconds) =>
  toPersianNumbers(
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`,
  );

// Changing the account phone in two steps inside this one dialog: first a
// code to the current number, then (only after the server confirmed it) the
// new number and its own code. Each step sends one SMS. All state stays in
// memory and is cleared on close; the flow shares nothing with the login OTP
// (no stored session, no WebOTP).
export default function PhoneChangeDialog({ isOpen, onClose, currentPhone }) {
  const { user, checkAuth } = useAuth();
  const [state, dispatch] = useReducer(
    phoneChangeReducer,
    initialPhoneChangeState,
  );
  // Answers for a dialog that was closed meanwhile are ignored.
  const sessionRef = useRef(0);
  // One request at a time, even for clicks faster than a re-render.
  const busyRef = useRef(false);
  const ticking = isOpen && state.step !== "success";
  const now = useNow(ticking);

  const close = () => {
    sessionRef.current += 1;
    busyRef.current = false;
    dispatch({ type: "reset" });
    onClose();
  };

  // Done once the profile (refreshed by checkAuth) shows the new number.
  useEffect(() => {
    if (state.step === "success" && isProfileUpToDate(user, state.changedPhone)) {
      close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step, state.changedPhone, user]);

  // Runs one call with the double-submit guard and stale-answer protection:
  // `start` is dispatched only when the call really starts; `onSuccess` /
  // `onError` run only if the dialog is still the same session, while
  // `onCommitted` runs after any success (a committed change stands even if
  // the dialog was closed meanwhile).
  const run = async (start, call, { onSuccess, onError, onCommitted }) => {
    if (busyRef.current) return;
    busyRef.current = true;
    const session = sessionRef.current;
    dispatch(start);

    let result;
    try {
      result = await call();
    } catch (error) {
      if (session === sessionRef.current) {
        busyRef.current = false;
        onError(error);
      }
      return;
    }

    onCommitted?.(result);
    if (session === sessionRef.current) {
      busyRef.current = false;
      onSuccess(result);
    }
  };

  const requestFailed = (type) => (error) => {
    // Only the new-number step depends on the proof.
    if (type === "newRequestFailed" && isRestartRequired(error)) {
      dispatch({
        type: "restartRequired",
        message: getPhoneChangeRequestErrorMessage(error),
      });
      return;
    }
    dispatch({ type, message: getPhoneChangeRequestErrorMessage(error) });
    // An ended session: let the app's normal auth state take over.
    if (error?.response?.status === 401) checkAuth();
  };

  // ---- Step 1: current number ----

  const requestCurrentCode = () =>
    run({ type: "currentRequestStarted" }, requestCurrentPhoneCodeApi, {
      onSuccess: (result) =>
        dispatch({
          type: "currentRequestSucceeded",
          challengeId: result.challengeId,
          expiresAt: result.expiresAt,
          now: Date.now(),
        }),
      onError: requestFailed("currentRequestFailed"),
    });

  const verifyCurrentCode = () => {
    const request = getCurrentVerifyRequest(state);
    return run({ type: "currentVerifyStarted" }, () => verifyCurrentPhoneCodeApi(request), {
      onSuccess: (result) =>
        dispatch({
          type: "currentVerified",
          proofId: result?.proofId,
          proofExpiresAt: result?.proofExpiresAt,
          now: Date.now(),
        }),
      onError: (error) =>
        dispatch({
          type: "currentVerifyFailed",
          message: getPhoneChangeVerifyErrorMessage(error),
        }),
    });
  };

  const handleCurrentSubmit = (event) => {
    event.preventDefault();
    if (busyRef.current) return;
    const at = Date.now();
    if (canRequestCurrent(state, at)) requestCurrentCode();
    else if (canVerifyCurrent(state, at)) verifyCurrentCode();
  };

  // A new code for the current number; the old one is void.
  const handleCurrentResend = () => {
    if (!busyRef.current && canResendCurrent(state, Date.now())) {
      requestCurrentCode();
    }
  };

  // ---- Step 2: new number ----

  const requestNewCode = (phoneNumber) => {
    const request = getNewRequest(state, phoneNumber);
    return run({ type: "newRequestStarted", phoneNumber }, () => requestNewPhoneCodeApi(request), {
      onSuccess: (result) =>
        dispatch({
          type: "newRequestSucceeded",
          challengeId: result.challengeId,
          expiresAt: result.expiresAt,
          now: Date.now(),
        }),
      onError: requestFailed("newRequestFailed"),
    });
  };

  const verifyNewCode = () => {
    const request = getNewVerifyRequest(state);
    const { requestedPhone } = state;
    return run({ type: "newVerifyStarted" }, () => verifyNewPhoneCodeApi(request), {
      // Committed on the server, with fresh session cookies: the change
      // stands even if the dialog was closed meanwhile or the refresh fails.
      onCommitted: () => {
        toast.success(PHONE_CHANGE_MESSAGES.changed);
        checkAuth();
      },
      onSuccess: (result) =>
        dispatch({
          type: "verifySucceeded",
          phoneNumber: result?.user?.phoneNumber ?? requestedPhone,
        }),
      onError: (error) =>
        dispatch(
          isRestartRequired(error)
            ? {
                type: "restartRequired",
                message: getPhoneChangeVerifyErrorMessage(error),
              }
            : {
                type: "newVerifyFailed",
                message: getPhoneChangeVerifyErrorMessage(error),
              },
        ),
    });
  };

  const handleNewSubmit = (event) => {
    event.preventDefault();
    if (busyRef.current) return;
    const at = Date.now();
    if (canRequestNew(state, at, currentPhone)) requestNewCode(state.phoneInput);
    else if (canVerifyNew(state, at)) verifyNewCode();
  };

  // A new code for the same new number; the old one is void.
  const handleNewResend = () => {
    if (!busyRef.current && canResendNew(state, Date.now())) {
      requestNewCode(state.requestedPhone);
    }
  };

  const handleEditNewPhone = () => {
    if (!busyRef.current && canEditNewPhone(state)) {
      dispatch({ type: "editNewPhone" });
    }
  };

  // The proof ran out on this device: start over from step 1.
  const handleRestart = () => {
    if (busyRef.current) return;
    dispatch({
      type: "restartRequired",
      message: PHONE_CHANGE_MESSAGES.restartRequired,
    });
  };

  const currentExpiresIn = secondsUntil(state.currentExpiresAt, now);
  const currentResendIn = secondsUntil(state.currentResendAt, now);
  const newExpiresIn = secondsUntil(state.newExpiresAt, now);
  const newResendIn = secondsUntil(state.newResendAt, now);
  const proofLeft = secondsUntil(state.proofExpiresAt, now);
  const proofExpired = isProofExpired(state, now);
  const currentCodeShown =
    state.step === "currentCode" || state.step === "currentVerifying";
  const newCodeShown = state.step === "newCode" || state.step === "newVerifying";
  const phoneLocked = state.step !== "newPhone";
  const showInvalidPhone =
    state.step === "newPhone" &&
    state.phoneInput.length > 0 &&
    !looksLikeIranianMobile(state.phoneInput);
  const showSamePhone =
    state.step === "newPhone" && isSamePhone(state.phoneInput, currentPhone);

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      scrollable
      className="h-fit w-full md:max-w-lg"
    >
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="phone-change-title"
          className="flex flex-col gap-6 w-full max-h-[85dvh] overflow-y-auto scrollbar-none text-stroke-800 bg-stroke-0 max-sm:p-4 p-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-stroke-250 w-full">
            <div className="flex flex-col gap-1">
              <h2
                id="phone-change-title"
                className="text-stroke-800 font-bold md:text-xl"
              >
                تغییر شماره موبایل
              </h2>
              {state.step !== "success" && (
                <p className="text-xs text-stroke-600" aria-live="polite">
                  {isCurrentStep(state)
                    ? "مرحله ۱ از ۲: تایید شماره فعلی"
                    : "مرحله ۲ از ۲: شماره جدید"}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="بستن"
              className="flex items-center justify-center size-8 aspect-square rounded-full border border-stroke-250"
            >
              <XMarkIcon className="size-4 text-stroke-800 stroke-2" />
            </button>
          </div>

          {isCurrentStep(state) && (
            <form onSubmit={handleCurrentSubmit} className="flex flex-col gap-5">
              <p className="text-sm text-stroke-600 leading-7">
                برای تغییر شماره، ابتدا یک کد تایید به شماره فعلی شما پیامک
                می‌شود.
              </p>
              <div className="flex flex-col gap-2">
                <span className="text-stroke-800 mr-2">شماره فعلی</span>
                <p
                  dir="ltr"
                  className="textField__input rounded-5xl h-12 text-right text-stroke-500"
                >
                  {normalizeIranPhone(currentPhone)}
                </p>
              </div>

              {currentCodeShown && (
                <div className="flex flex-col gap-3">
                  <span className="text-stroke-800 mr-2">
                    کد ارسال‌شده به شماره فعلی{" "}
                    <span dir="ltr" className="text-stroke-600">
                      {toPersianNumbers(maskPhoneForDisplay(currentPhone))}
                    </span>
                  </span>
                  {/* Remounted per code: a resend starts empty. The only
                      code on this panel, sent to this device's number, so
                      the browser may suggest it. */}
                  <PersianOTPInput
                    key={`current-${state.currentChallengeId}`}
                    value={state.currentCode}
                    onChange={(value) =>
                      dispatch({ type: "currentCodeChanged", value })
                    }
                    numInputs={PHONE_CHANGE_CODE_LENGTH}
                    readOnly={state.step === "currentVerifying" || state.resending}
                    autoComplete="one-time-code"
                    label="کد شماره فعلی"
                  />
                  <p className="text-sm text-stroke-600 mr-2" aria-live="polite">
                    {currentExpiresIn > 0
                      ? `اعتبار کد: ${formatSeconds(currentExpiresIn)}`
                      : "کد منقضی شده است؛ کد جدید دریافت کنید."}
                  </p>
                </div>
              )}

              <p
                id="phone-change-current-error"
                role="alert"
                className="min-h-5 text-sm text-error mr-2"
              >
                {state.error ?? ""}
              </p>

              {currentCodeShown ? (
                <>
                  <button
                    type="submit"
                    disabled={!canVerifyCurrent(state, now)}
                    className="btn btn--success py-3.5 px-7 w-full disabled:opacity-50"
                  >
                    {state.step === "currentVerifying"
                      ? "در حال بررسی..."
                      : "تایید و ادامه"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCurrentResend}
                    disabled={!canResendCurrent(state, now)}
                    className="btn btn--primary--2 border-2 border-primary py-3 px-7 w-full disabled:opacity-50"
                  >
                    {state.resending
                      ? "در حال ارسال..."
                      : currentResendIn > 0
                        ? `ارسال دوباره کد (${formatSeconds(currentResendIn)})`
                        : "ارسال دوباره کد"}
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  disabled={!canRequestCurrent(state, now)}
                  className="btn btn--success py-3.5 px-7 w-full disabled:opacity-50"
                >
                  {state.step === "currentRequesting"
                    ? "در حال ارسال کد..."
                    : currentResendIn > 0
                      ? `ارسال کد به شماره فعلی (${formatSeconds(currentResendIn)})`
                      : "ارسال کد به شماره فعلی"}
                </button>
              )}
            </form>
          )}

          {isNewStep(state) && (
            <form onSubmit={handleNewSubmit} className="flex flex-col gap-5">
              <p className="text-sm text-stroke-600 leading-7">
                شماره فعلی تایید شد. شماره موبایل جدید را وارد کنید تا کد تایید
                به آن پیامک شود.
              </p>
              <p className="text-xs text-stroke-600 mr-2" aria-live="polite">
                {proofExpired
                  ? "زمان تکمیل تغییر شماره به پایان رسید."
                  : `زمان باقی‌مانده برای تکمیل: ${formatSeconds(proofLeft)}`}
              </p>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3 mr-2">
                  <label htmlFor="phone-change-new" className="text-stroke-800">
                    شماره جدید
                  </label>
                  {newCodeShown && (
                    <button
                      type="button"
                      onClick={handleEditNewPhone}
                      disabled={!canEditNewPhone(state)}
                      className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
                    >
                      ویرایش شماره
                    </button>
                  )}
                </div>
                <div className="textField__input rounded-5xl h-12">
                  <input
                    id="phone-change-new"
                    type="text"
                    dir="ltr"
                    inputMode="numeric"
                    autoComplete="tel"
                    autoFocus
                    maxLength={16}
                    placeholder={toPersianNumbers("09123456789")}
                    value={toPersianNumbers(state.phoneInput)}
                    readOnly={phoneLocked}
                    aria-readonly={phoneLocked || undefined}
                    onChange={(e) =>
                      dispatch({
                        type: "phoneInputChanged",
                        value: cleanNumericValue(e.target.value),
                      })
                    }
                    aria-invalid={showInvalidPhone || showSamePhone || undefined}
                    aria-describedby="phone-change-new-error"
                    className="outline-0 size-full bg-transparent text-right"
                  />
                </div>
              </div>

              {newCodeShown && (
                <div className="flex flex-col gap-3">
                  <span className="text-stroke-800 mr-2">
                    کد ارسال‌شده به شماره جدید{" "}
                    <span dir="ltr" className="text-stroke-600">
                      {toPersianNumbers(maskPhoneForDisplay(state.requestedPhone))}
                    </span>
                  </span>
                  {/* Remounted per code. No browser SMS suggestion here: it
                      could offer the current-number code from step 1. */}
                  <PersianOTPInput
                    key={`new-${state.newChallengeId}`}
                    value={state.newCode}
                    onChange={(value) => dispatch({ type: "newCodeChanged", value })}
                    numInputs={PHONE_CHANGE_CODE_LENGTH}
                    readOnly={state.step === "newVerifying" || state.resending}
                    autoComplete="off"
                    label="کد شماره جدید"
                  />
                  <p className="text-sm text-stroke-600 mr-2" aria-live="polite">
                    {newExpiresIn > 0
                      ? `اعتبار کد: ${formatSeconds(newExpiresIn)}`
                      : "کد منقضی شده است؛ کد جدید دریافت کنید."}
                  </p>
                </div>
              )}

              <p
                id="phone-change-new-error"
                role="alert"
                className="min-h-5 text-sm text-error mr-2"
              >
                {state.error ??
                  (showInvalidPhone
                    ? PHONE_CHANGE_MESSAGES.invalidPhone
                    : showSamePhone
                      ? PHONE_CHANGE_MESSAGES.samePhone
                      : "")}
              </p>

              {proofExpired ? (
                <button
                  type="button"
                  onClick={handleRestart}
                  className="btn btn--success py-3.5 px-7 w-full"
                >
                  شروع دوباره
                </button>
              ) : newCodeShown ? (
                <>
                  <button
                    type="submit"
                    disabled={!canVerifyNew(state, now)}
                    className="btn btn--success py-3.5 px-7 w-full disabled:opacity-50"
                  >
                    {state.step === "newVerifying"
                      ? "در حال بررسی..."
                      : "تایید و تغییر شماره"}
                  </button>
                  <button
                    type="button"
                    onClick={handleNewResend}
                    disabled={!canResendNew(state, now)}
                    className="btn btn--primary--2 border-2 border-primary py-3 px-7 w-full disabled:opacity-50"
                  >
                    {state.resending
                      ? "در حال ارسال..."
                      : newResendIn > 0
                        ? `ارسال دوباره کد (${formatSeconds(newResendIn)})`
                        : "ارسال دوباره کد"}
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  disabled={!canRequestNew(state, now, currentPhone)}
                  className="btn btn--success py-3.5 px-7 w-full disabled:opacity-50"
                >
                  {state.step === "newRequesting"
                    ? "در حال ارسال کد..."
                    : newResendIn > 0
                      ? `ارسال کد به شماره جدید (${formatSeconds(newResendIn)})`
                      : "ارسال کد به شماره جدید"}
                </button>
              )}
            </form>
          )}

          {state.step === "success" && (
            <div className="flex flex-col gap-5" aria-live="polite">
              <p className="text-stroke-800 leading-7">
                {PHONE_CHANGE_MESSAGES.changed}:{" "}
                <span dir="ltr">{normalizeIranPhone(state.changedPhone)}</span>
              </p>
              {/* Shown while the profile still has the old number, e.g. when
                  refreshing it failed: the change itself is done. */}
              <p className="text-sm text-stroke-600 leading-7">
                اگر شماره جدید در پروفایل نمایش داده نمی‌شود، صفحه را دوباره
                بارگذاری کنید.
              </p>
              <div className="flex max-sm:flex-col gap-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="btn btn--success py-3 px-7 w-full"
                >
                  بارگذاری دوباره
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="btn btn--primary--2 border-2 border-primary py-3 px-7 w-full"
                >
                  بستن
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
