import { useEffect, useRef } from "react";
import { OTP_LENGTH, requestWebOtp } from "@/utils/otpInputContract.mjs";

// WebOTP progressive enhancement: while `enabled`, wait for an origin-bound
// SMS and hand a complete code to `onCode` once, together with the
// `requestKey` it was received under. Each `requestKey` (one OTP request) gets
// its own listener: a new key, turning `enabled` off or unmounting aborts the
// pending request. Unsupported browsers, denial, timeout and abort are silent;
// manual entry always stays available.
export default function useWebOtp({
  enabled,
  requestKey,
  onCode,
  length = OTP_LENGTH,
}) {
  const onCodeRef = useRef(onCode);

  useEffect(() => {
    onCodeRef.current = onCode;
  });

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    requestWebOtp({ signal: controller.signal, length }).then((code) => {
      if (code && !controller.signal.aborted) {
        onCodeRef.current?.(code, requestKey);
      }
    });

    return () => controller.abort();
  }, [enabled, requestKey, length]);
}
