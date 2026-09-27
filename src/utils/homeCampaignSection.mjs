// Home "most discounted" section: which product list to show, and countdown math.

/**
 * @returns {"loading" | "campaign" | "fallback"}
 * The campaign list is used only when an active campaign has sellable products;
 * any campaign/request failure falls back to the normal most-discounted list.
 */
export function resolveOffProductsSource({ activeCampaign, campaignProducts }) {
  if (activeCampaign.isPending) return "loading";
  if (activeCampaign.error || !activeCampaign.data?.id) return "fallback";
  if (campaignProducts.isPending) return "loading";
  if (campaignProducts.error || !campaignProducts.data?.data?.length) {
    return "fallback";
  }
  return "campaign";
}

/**
 * @returns {"loading" | "error" | "products"}
 * Loading until the source is chosen and that source's list has settled, so
 * the fallback list never flashes while the campaign is still unresolved.
 */
export function offProductsSectionView({ source, section }) {
  if (source === "loading" || section.isPending) return "loading";
  if (section.error) return "error";
  return "products";
}

/** Milliseconds until endsAt (never negative), or null for an invalid date. */
export function getRemainingMs(endsAt, now) {
  const end = Date.parse(endsAt);
  if (!Number.isFinite(end)) return null;
  return Math.max(0, end - now);
}

/**
 * Adds clockOffsetMs (server time minus client time, measured when the
 * response arrived) so the countdown follows the backend clock. A missing or
 * invalid serverNow yields offset 0, i.e. the plain client clock.
 */
export function withClockOffset(campaign, receivedAt) {
  if (!campaign) return null;
  const serverNow = Date.parse(campaign.serverNow);
  return {
    ...campaign,
    clockOffsetMs: Number.isFinite(serverNow) ? serverNow - receivedAt : 0,
  };
}

/**
 * Ticks every second with the remaining milliseconds (null for an invalid
 * date), stops at zero and calls onExpire exactly once. Returns a stop function.
 */
export function startCountdown(endsAt, { onTick, onExpire, clockOffsetMs = 0 }) {
  const offset = Number.isFinite(clockOffsetMs) ? clockOffsetMs : 0;
  const tick = () => {
    const next = getRemainingMs(endsAt, Date.now() + offset);
    onTick(next);

    if (next === null || next === 0) {
      clearInterval(intervalId);
      if (next === 0) onExpire?.();
    }
  };

  const intervalId = setInterval(tick, 1000);
  tick();

  return () => clearInterval(intervalId);
}

/** Rounds up so the display reaches zero exactly when the campaign ends. */
export function splitRemaining(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}
