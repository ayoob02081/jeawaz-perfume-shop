"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PassInput from "@/ui/PassInput";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/auth/AuthContext";
import { useModalDismissal } from "@/components/Modal";
import LoginForm from "./LoginForm";
import { requestOtpApi, verifyOtpApi } from "@/services/authServices";
import { DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import useOtpTimer from "@/hooks/useOtpTimer";
import RHFTextField from "@/ui/RHFTextField";
import PersianOTPInput from "@/ui/PersianOTPInput";
import useWebOtp from "@/hooks/useWebOtp";
import {
  createOtpVerificationGuard,
  isCompleteOtp,
} from "@/utils/otpInputContract.mjs";
import {
  clearOtpSession,
  createOtpRequestGuard,
  createOtpSession,
  decidePhoneSubmit,
  canEditPhone,
  getBrowserStorage,
  getOtpRequestErrorMessage,
  getOtpScreenStatus,
  getOtpVerifyErrorMessage,
  getResendRequest,
  getRetryRequest,
  getVerifyRequest,
  initialOtpLoginState,
  isCurrentAttempt,
  isPreSendOtpRejection,
  isRequestPending,
  isVerifyBusy,
  isWebOtpActive,
  otpLoginReducer,
  readOtpSession,
  writeOtpSession,
} from "@/utils/otpLoginFlow.mjs";

// `afterLoginHref` is where the full /auth/login page goes after a successful
// login (a direct load or proxy redirect may have no useful history). Without
// it, the intercepted modal closes back to the page it was opened over.
// `onAuthenticated` / `onClose` (checkout's in-place modal): the caller is
// told about a successful login or a close and decides what happens next;
// nothing navigates.
function Login({ closeBtn, afterLoginHref, onAuthenticated, onClose }) {
  const modalDismissal = useModalDismissal();
  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [otp, setOtp] = useState("");
  const [sessionAccepted, setSessionAccepted] = useState(false);
  // Retain acceptance across confirmation failures; the consumed OTP is never replayed.
  const acceptedAttemptRef = useRef(null);
  const phoneNumber = watch("phoneNumber") || "";
  const [isPasswordType, setIsPasswordType] = useState(false);

  // Phone/code step state (otpLoginFlow.mjs). The ref is updated on every
  // dispatch, so async completions compare against the latest attempt.
  const [flow, setFlow] = useState(initialOtpLoginState);
  const flowRef = useRef(flow);
  const dispatch = useCallback((action) => {
    flowRef.current = otpLoginReducer(flowRef.current, action);
    setFlow(flowRef.current);
  }, []);

  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Only a result of the still-mounted flow and its current attempt may show
  // a toast, change the step or navigate.
  const isCurrent = (attempt) =>
    mountedRef.current && !modalDismissal?.isDismissed() && isCurrentAttempt(flowRef.current, attempt);

  const requestPending = isRequestPending(flow);
  const verifyPending = isVerifyBusy(flow);
  const otpScreen = getOtpScreenStatus(flow);
  const { resendRemaining } = useOtpTimer(flow.resendAt);

  const router = useRouter();

  const { checkAuth, login } = useAuth();

  // One OTP request per phone at a time (see createOtpRequestGuard).
  const requestGuardRef = useRef(null);
  if (!requestGuardRef.current) {
    requestGuardRef.current = createOtpRequestGuard();
  }

  // One OTP verification at a time (manual submit, Enter, WebOTP).
  const verificationGuardRef = useRef(null);
  if (!verificationGuardRef.current) {
    verificationGuardRef.current = createOtpVerificationGuard();
  }

  const leaveAfterLogin = () => {
    if (onAuthenticated) return onAuthenticated();
    return afterLoginHref ? router.replace(afterLoginHref) : router.back();
  };
  const close = () => {
    if (!mountedRef.current) return;
    // Suppress late success before a route transition has finished unmounting.
    mountedRef.current = false;
    if (modalDismissal) modalDismissal.dismiss();
    else if (onClose) onClose();
    else router.back();
  };

  const togglePasswordType = () => {
    setIsPasswordType((prevState) => !prevState);
  };

  // Shows the code screen ("sending") at once; the code is only claimed as
  // sent once the backend confirms it.
  const requestOtp = async (phone) => {
    if (!isCurrent(flowRef.current.attempt)) return;
    // Synchronous: the flow ref is updated by dispatch, so a double click or
    // repeated Enter in the same attempt stops here.
    if (isRequestPending(flowRef.current)) return;
    dispatch({ type: "requestStarted", phone });
    const { attempt } = flowRef.current;

    const result = await requestGuardRef.current.run(phone, async () => {
      const res = await requestOtpApi({ phoneNumber: phone });
      return createOtpSession({
        phone,
        expiresAt: res?.expiresAt,
        now: Date.now(),
      });
    });
    const current = isCurrent(attempt);
    const preSend = !result.ok && isPreSendOtpRejection(result.error);

    if (result.ok) {
      // A code now exists for this phone: keep it resumable even if this
      // flow was edited or closed meanwhile, but then never over another
      // phone's session.
      writeOtpSession(getBrowserStorage(), result.value, {
        replaceOtherPhone: current,
        now: Date.now(),
      });
    } else if (!preSend) {
      // The previous code may have been invalidated: a reopened login must
      // not resume it.
      clearOtpSession(getBrowserStorage(), phone);
    }

    if (!current) return;

    if (!result.ok) {
      const message = getOtpRequestErrorMessage(result.error);
      dispatch({
        type: "requestFailed",
        attempt,
        message,
        preSend,
        now: Date.now(),
      });
      // The send-error screen shows the message itself; a resend rejected
      // before the previous code was touched keeps the ready screen, so it
      // is announced here.
      if (flowRef.current.otpPhone) toast.error(message);
      return;
    }

    setOtp("");
    dispatch({ type: "requestSucceeded", attempt, session: result.value });
  };

  const handlePhoneSubmit = ({ phoneNumber }) => {
    if (isRequestPending(flowRef.current)) return;

    const phone = String(phoneNumber ?? "");
    const now = Date.now();
    const decision = decidePhoneSubmit({
      phone,
      session: readOtpSession(getBrowserStorage(), now),
      now,
    });

    if (decision.action === "resume") {
      setOtp("");
      return dispatch({ type: "otpResumed", session: decision.session });
    }

    return requestOtp(phone);
  };

  // Pencil, back arrow and «ویرایش شماره»: back to the phone step with the
  // phone text kept. No request; the new attempt makes a pending request,
  // its result and WebOTP stale.
  const handleEditPhone = () => {
    if (acceptedAttemptRef.current !== null || !canEditPhone(flowRef.current)) return;
    setOtp("");
    dispatch({ type: "phoneEdited" });
  };

  // Resends in place, always to the phone the current code was issued for.
  const handleResend = () => {
    if (acceptedAttemptRef.current !== null) return;
    const resend = getResendRequest(flowRef.current, Date.now());
    if (resend.ok) requestOtp(resend.phoneNumber);
  };

  // «تلاش مجدد» after a failed first request: the same pending phone, without
  // re-entering it.
  const handleRetry = () => {
    const retry = getRetryRequest(flowRef.current);
    if (retry.ok) requestOtp(retry.phoneNumber);
  };

  // Verifies the given code, not the `otp` state, so a code that was just set
  // (WebOTP) is used before React re-renders. The phone is the one the code
  // was issued for, never the live phone field.
  const verifyOtp = async (code) => {
    if (!isCurrent(flowRef.current.attempt)) return;
    const request = acceptedAttemptRef.current === flowRef.current.attempt
      ? { ok: true, phoneNumber: flowRef.current.otpPhone, attempt: flowRef.current.attempt }
      : getVerifyRequest(flowRef.current, code);
    if (!request.ok) {
      if (request.reason === "no-otp-phone") handleEditPhone();
      return;
    }
    const { phoneNumber: otpPhone, attempt } = request;

    const result = await verificationGuardRef.current.run(async () => {
      dispatch({ type: "verifyStarted", attempt });
      if (acceptedAttemptRef.current !== attempt) {
        await verifyOtpApi({ phoneNumber: otpPhone, code });
        acceptedAttemptRef.current = attempt;
        // The code is used up: a reopened login must not resume it.
        clearOtpSession(getBrowserStorage(), otpPhone);
      }
      if (!isCurrent(attempt)) return;
      setSessionAccepted(true);
      await checkAuth({ requireUser: true });
    });

    if (result.skipped || !isCurrent(attempt)) return;

    if (!result.ok) {
      const message = acceptedAttemptRef.current === attempt
        ? "کد ورود تأیید شد، اما بررسی وضعیت ورود انجام نشد. دوباره وضعیت ورود را بررسی کنید."
        : getOtpVerifyErrorMessage(result.error);
      dispatch({ type: "verifyFailed", attempt, message });
      return toast.error(message);
    }

    dispatch({ type: "verifySucceeded", attempt });
    toast.success("به جیاواز خوش آمدید!");
    leaveAfterLogin();
  };

  useWebOtp({
    enabled: isWebOtpActive(flow) && !isPasswordType && !sessionAccepted,
    requestKey: flow.attempt,
    onCode: (code, requestKey) => {
      if (!isCurrent(requestKey)) return;
      setOtp(code);
      verifyOtp(code);
    },
  });

  const handleSubmitForm = async (e) => {
    const attempt = flowRef.current.attempt;
    if (!isCurrent(attempt)) return;
    const { password, phoneNumber } = e;

    if (!isPasswordType) {
      if (acceptedAttemptRef.current === flowRef.current.attempt) return verifyOtp("");
      if (!isCompleteOtp(otp)) return toast.error("کد تکمیل نشده");
      return verifyOtp(otp);
    }

    try {
      if (password.length < 6) return toast.error("رمز عبور کوتاه است");

      await login({ phoneNumber, password }, { requireUser: true });
      if (!isCurrent(attempt)) return;

      toast.success("به جیاواز خوش آمدید!");
      leaveAfterLogin();
    } catch {
      if (!isCurrent(attempt)) return;
      toast.error("ورود ناموفق بود، دوباره تلاش کنید");
    }
  };

  const submitStep1 = handleSubmit(handlePhoneSubmit);
  const submitStep2 = handleSubmit(handleSubmitForm);

  const renderSteps = () => {
    switch (flow.step) {
      case "phone":
        return (
          <LoginForm
            togglePasswordType={togglePasswordType}
            isPasswordType={isPasswordType}
            password={watch("password") || ""}
            otp={otp}
            step={flow.step}
            phoneNumber={phoneNumber}
            onClose={close}
            onSubmit={submitStep1}
            closeBtn={closeBtn}
          >
            <RHFTextField
              name="phoneNumber"
              type="tel"
              control={control}
              errors={errors}
              icon={DevicePhoneMobileIcon}
              placeholder="شماره همراه شما"
              validationSchema={{
                required: "شماره تلفن الزامی است",
                pattern: {
                  value: /^09\d{9}$/,
                  message: "شماره موبایل باید با ۰۹ شروع شود",
                },
                minLength: {
                  value: 11,
                  message: "شماره همراه باید ۱۱ کاراکتر باشد",
                },
                maxLength: {
                  value: 11,
                  message: "شماره همراه باید ۱۱ کاراکتر باشد",
                },
              }}
              isPrimary
            />
            {isPasswordType === true && (
              <PassInput
                RHForm
                isRequired
                name="password"
                errors={errors}
                register={register}
                validationSchema={{
                  required: "رمز عبور الزامی است",
                  pattern: {
                    value: /^[a-zA-Z0-9]+$/,
                    message: "فقط حروف انگلیسی و عدد مجاز است",
                  },
                  minLength: {
                    value: 6,
                    message: "رمز عبور باید حداقل ۶ کاراکتر باشد",
                  },
                }}
                className="w-full"
                placeholder="رمز عبور"
              />
            )}
          </LoginForm>
        );

      case "otp":
        return (
          <LoginForm
            isPasswordType={isPasswordType}
            password={watch("password") || ""}
            otp={otp}
            step={flow.step}
            phoneNumber={flow.otpPhone ?? flow.pendingPhone ?? ""}
            otpScreen={otpScreen}
            requestError={flow.requestError}
            onEditPhone={handleEditPhone}
            onResend={handleResend}
            onRetry={handleRetry}
            editDisabled={sessionAccepted || !canEditPhone(flow)}
            sessionAccepted={sessionAccepted}
            resendRemaining={resendRemaining}
            requestPending={requestPending}
            verifyPending={verifyPending}
            onClose={close}
            onSubmit={submitStep2}
            closeBtn={closeBtn}
          >
            {sessionAccepted ? (
              <p role={flow.verifyError ? "alert" : "status"} className="text-sm text-stroke-800 text-center my-4">
                {flow.verifyError || "کد ورود تأیید شد؛ در حال بررسی وضعیت ورود..."}
              </p>
            ) : <div
              className={`flex items-center justify-center gap-2 w-full h-12 my-4 duration-200 ${otpScreen === "ready" ? "" : "opacity-50"}`}
            >
              {/* A new attempt remounts the slots: empty, first slot focused.
                  No code can be entered before one was confirmed. */}
              <PersianOTPInput
                key={flow.attempt}
                value={otp}
                onChange={setOtp}
                numInputs={5}
                label="کد ورود"
                readOnly={otpScreen !== "ready" || verifyPending}
              />
            </div>}
          </LoginForm>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative size-full max-[30rem]:px-4 sm:py-10 p-6 sm:px-14">
      {renderSteps()}
    </div>
  );
}

export default Login;
