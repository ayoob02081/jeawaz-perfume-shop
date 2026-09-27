import { useEffect, useRef } from "react";
import { OTP_LENGTH, requestWebOtp } from "@/utils/otpInputContract.mjs";

// WebOTP progressive enhancement: while `enabled`, wait for an origin-bound
// SMS and hand a complete code to `onCode` once. Unsupported browsers, denial,
// timeout and abort are silent; manual entry always stays available. Turning
// `enabled` off or unmounting aborts the pending request.
export default function useWebOtp({ enabled, onCode, length = OTP_LENGTH }) {
  const onCodeRef = useRef(onCode);

  useEffect(() => {
    onCodeRef.current = onCode;
  });

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    requestWebOtp({ signal: controller.signal, length }).then((code) => {
      if (code && !controller.signal.aborted) onCodeRef.current?.(code);
    });

    return () => controller.abort();
  }, [enabled, length]);
}
