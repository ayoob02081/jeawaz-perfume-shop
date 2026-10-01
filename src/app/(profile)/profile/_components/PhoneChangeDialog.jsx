"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import toast from "react-hot-toast";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Modal from "@/components/Modal";
import { useAuth } from "@/contexts/auth/AuthContext";
import {
  requestPhoneChangeApi,
  verifyPhoneChangeApi,
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
  canRequest,
  canResend,
  canVerify,
  getPhoneChangeRequestErrorMessage,
  getPhoneChangeVerifyErrorMessage,
  getVerifyRequest,
  initialPhoneChangeState,
  isProfileUpToDate,
  looksLikeIranianMobile,
  maskPhoneForDisplay,
  phoneChangeReducer,
  secondsUntil,
} from "@/utils/phoneChangeFlow.mjs";

// The current time, ticking every second while `active` (code expiry and
// resend countdowns).
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

// Changing the account phone: the new number, then one code sent to the
// current number and one to the new number. All state stays in memory and is
// cleared on close; the flow shares nothing with the login OTP (no stored
// session, no WebOTP, no browser code suggestions).
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
  const codesShown = state.step === "verifyCodes" || state.step === "verifying";
  const now = useNow(isOpen && codesShown);

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

  const requestCodes = async (phoneNumber) => {
    if (busyRef.current) return;
    busyRef.current = true;
    const session = sessionRef.current;
    dispatch({ type: "requestStarted", phoneNumber });

    try {
      const result = await requestPhoneChangeApi(phoneNumber);
      if (session !== sessionRef.current) return;
      dispatch({
        type: "requestSucceeded",
        challengeId: result.challengeId,
        expiresAt: result.expiresAt,
        now: Date.now(),
      });
    } catch (error) {
      if (session !== sessionRef.current) return;
      dispatch({
        type: "requestFailed",
        message: getPhoneChangeRequestErrorMessage(error),
      });
      // An ended session: let the app's normal auth state take over.
      if (error?.response?.status === 401) checkAuth();
    } finally {
      if (session === sessionRef.current) busyRef.current = false;
    }
  };

  const handleRequest = (event) => {
    event.preventDefault();
    if (canRequest(state)) requestCodes(state.phoneInput);
  };

  // A new challenge for the same number; the old codes are void.
  const handleResend = () => {
    if (canResend(state, Date.now())) requestCodes(state.requestedPhone);
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    if (busyRef.current || !canVerify(state, Date.now())) return;
    busyRef.current = true;
    const session = sessionRef.current;
    const request = getVerifyRequest(state);
    const { requestedPhone } = state;
    dispatch({ type: "verifyStarted" });

    let result;
    try {
      result = await verifyPhoneChangeApi(request);
    } catch (error) {
      if (session === sessionRef.current) {
        busyRef.current = false;
        dispatch({
          type: "verifyFailed",
          message: getPhoneChangeVerifyErrorMessage(error),
        });
      }
      return;
    }

    // Committed on the server, with fresh session cookies: the change stands
    // even if the dialog was closed meanwhile or the refresh below fails.
    toast.success(PHONE_CHANGE_MESSAGES.changed);
    if (session === sessionRef.current) {
      busyRef.current = false;
      dispatch({
        type: "verifySucceeded",
        phoneNumber: result?.user?.phoneNumber ?? requestedPhone,
      });
    }
    await checkAuth();
  };

  const expiresIn = secondsUntil(state.expiresAt, now);
  const resendIn = secondsUntil(state.resendAt, now);
  const showInvalidPhone =
    state.phoneInput.length > 0 && !looksLikeIranianMobile(state.phoneInput);

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
            <h2
              id="phone-change-title"
              className="text-stroke-800 font-bold md:text-xl"
            >
              تغییر شماره موبایل
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="بستن"
              className="flex items-center justify-center size-8 aspect-square rounded-full border border-stroke-250"
            >
              <XMarkIcon className="size-4 text-stroke-800 stroke-2" />
            </button>
          </div>

          {(state.step === "enterPhone" || state.step === "requesting") && (
            <form onSubmit={handleRequest} className="flex flex-col gap-5">
              <p className="text-sm text-stroke-600 leading-7">
                برای تغییر شماره، یک کد به شماره فعلی و یک کد به شماره جدید
                پیامک می‌شود.
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
              <div className="flex flex-col gap-2">
                <label htmlFor="phone-change-new" className="text-stroke-800 mr-2">
                  شماره جدید
                </label>
                <div className="textField__input rounded-5xl h-12">
                  <input
                    id="phone-change-new"
                    type="text"
                    dir="ltr"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={16}
                    placeholder={toPersianNumbers("09123456789")}
                    value={toPersianNumbers(state.phoneInput)}
                    readOnly={state.step === "requesting"}
                    onChange={(e) =>
                      dispatch({
                        type: "phoneInputChanged",
                        value: cleanNumericValue(e.target.value),
                      })
                    }
                    aria-invalid={showInvalidPhone || undefined}
                    aria-describedby="phone-change-error"
                    className="outline-0 size-full bg-transparent text-right"
                  />
                </div>
              </div>
              <p
                id="phone-change-error"
                role="alert"
                className="min-h-5 text-sm text-error mr-2"
              >
                {state.error ??
                  (showInvalidPhone ? PHONE_CHANGE_MESSAGES.invalidPhone : "")}
              </p>
              <button
                type="submit"
                disabled={!canRequest(state)}
                className="btn btn--success py-3.5 px-7 w-full disabled:opacity-50"
              >
                {state.step === "requesting" ? "در حال ارسال کد..." : "ارسال کد تایید"}
              </button>
            </form>
          )}

          {codesShown && (
            <form onSubmit={handleVerify} className="flex flex-col gap-5">
              <div className="flex flex-col gap-3">
                <span className="text-stroke-800 mr-2">
                  کد ارسال‌شده به شماره فعلی{" "}
                  <span dir="ltr" className="text-stroke-600">
                    {toPersianNumbers(maskPhoneForDisplay(currentPhone))}
                  </span>
                </span>
                {/* Remounted per challenge: a resend starts both codes empty. */}
                <PersianOTPInput
                  key={`current-${state.challengeId}`}
                  value={state.currentPhoneCode}
                  onChange={(value) =>
                    dispatch({ type: "codeChanged", field: "currentPhoneCode", value })
                  }
                  numInputs={PHONE_CHANGE_CODE_LENGTH}
                  readOnly={state.step === "verifying" || state.resending}
                  autoComplete="off"
                  label="کد شماره فعلی"
                />
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-stroke-800 mr-2">
                  کد ارسال‌شده به شماره جدید{" "}
                  <span dir="ltr" className="text-stroke-600">
                    {toPersianNumbers(maskPhoneForDisplay(state.requestedPhone))}
                  </span>
                </span>
                <PersianOTPInput
                  key={`new-${state.challengeId}`}
                  value={state.newPhoneCode}
                  onChange={(value) =>
                    dispatch({ type: "codeChanged", field: "newPhoneCode", value })
                  }
                  numInputs={PHONE_CHANGE_CODE_LENGTH}
                  readOnly={state.step === "verifying" || state.resending}
                  autoComplete="off"
                  autoFocus={false}
                  label="کد شماره جدید"
                />
              </div>

              <p className="text-sm text-stroke-600 mr-2" aria-live="polite">
                {expiresIn > 0
                  ? `اعتبار کدها: ${formatSeconds(expiresIn)}`
                  : "کدها منقضی شده‌اند؛ کد جدید دریافت کنید."}
              </p>
              <p role="alert" className="min-h-5 text-sm text-error mr-2">
                {state.error ?? ""}
              </p>

              <button
                type="submit"
                disabled={!canVerify(state, now)}
                className="btn btn--success py-3.5 px-7 w-full disabled:opacity-50"
              >
                {state.step === "verifying" ? "در حال بررسی..." : "تایید و تغییر شماره"}
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend(state, now)}
                className="btn btn--primary--2 border-2 border-primary py-3 px-7 w-full disabled:opacity-50"
              >
                {state.resending
                  ? "در حال ارسال..."
                  : resendIn > 0
                    ? `ارسال دوباره کدها (${formatSeconds(resendIn)})`
                    : "ارسال دوباره کدها"}
              </button>
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
