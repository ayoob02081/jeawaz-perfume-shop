import { useEffect, useState } from "react";
import { resendRemainingSeconds } from "@/utils/otpLoginFlow.mjs";

// Resend countdown for the current code. `resendAt` belongs to the phone the
// code was issued for (otpLoginFlow.mjs owns it and its phone-scoped
// persistence); it is a client-side hint and the backend cooldown stays
// authoritative.
export default function useOtpTimer(resendAt) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!resendAt) return;

    const tick = () => {
      const current = Date.now();
      setNow(current);
      return current;
    };

    if (tick() >= resendAt) return;

    const interval = setInterval(() => {
      if (tick() >= resendAt) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [resendAt]);

  return { resendRemaining: resendRemainingSeconds(resendAt, now) };
}
