"use client";

import { useEffect, useRef, useState } from "react";
import { startCountdown } from "@/utils/homeCampaignSection.mjs";

/**
 * Remaining milliseconds until endsAt, or null before mount / for an invalid
 * date (so server and first client render match). Calls onExpire once when
 * the remaining time reaches zero. clockOffsetMs corrects the client clock.
 */
export default function useCountdown(endsAt, onExpire, clockOffsetMs = 0) {
  const [remaining, setRemaining] = useState(null);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(
    () =>
      startCountdown(endsAt, {
        onTick: setRemaining,
        onExpire: () => onExpireRef.current?.(),
        clockOffsetMs,
      }),
    [endsAt, clockOffsetMs],
  );

  return remaining;
}
