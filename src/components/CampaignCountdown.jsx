"use client";

import useCountdown from "@/hooks/useCountdown";
import { splitRemaining } from "@/utils/homeCampaignSection.mjs";
import { toPersianNumbers } from "@/utils/toPersianNumbers";

const pad = (value) => toPersianNumbers(String(value).padStart(2, "0"));

function CampaignCountdown({ endsAt, onExpire, clockOffsetMs }) {
  const remaining = useCountdown(endsAt, onExpire, clockOffsetMs);

  // null before mount or for an invalid date, 0 once expired.
  if (!remaining) return null;

  const { days, hours, minutes, seconds } = splitRemaining(remaining);
  const units = [
    ...(days > 0 ? [{ label: "روز", value: days }] : []),
    { label: "ساعت", value: hours },
    { label: "دقیقه", value: minutes },
    { label: "ثانیه", value: seconds },
  ];

  return (
    <div
    dir="ltr"
      role="timer"
      aria-label="زمان باقی‌مانده تا پایان تخفیف"
      className="flex items-center gap-1 sm:gap-2 text-nowrap"
    >
      {units.map(({ label, value }) => (
        <div
          key={label}
          className="flex flex-col items-center justify-center min-w-11 sm:min-w-14 py-1 px-2 rounded-xl border-[1.5px] border-stroke-200 bg-stroke-0 dark:bg-stroke-50"
        >
          <span className="text-base sm:text-xl font-bold text-primary tabular-nums">
            {pad(value)}
          </span>
          <span className="text-[10px] sm:text-xs text-stroke-600">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default CampaignCountdown;
