import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { mock } from "node:test";
import {
  getRemainingMs,
  resolveOffProductsSource,
  splitRemaining,
  startCountdown,
  withClockOffset,
} from "./homeCampaignSection.mjs";
import { normalizeProductsQuery, productListKey } from "./productFilterContract.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const offProducts = read("../app/(user)/_components/CampaignsProducts.jsx");
const layout = read("../app/(user)/_components/HomePageSortProductsLayout.jsx");

const campaign = { id: 12, endsAt: "2026-10-01T20:29:59.000Z" };
const loaded = (data) => ({ isPending: false, error: null, data });
const pending = { isPending: true, error: null, data: undefined };
const failed = { isPending: false, error: new Error("x"), data: undefined };

test("A: an active campaign with sellable products drives the section", () => {
  assert.equal(resolveOffProductsSource({
    activeCampaign: loaded(campaign),
    campaignProducts: loaded({ data: [{ id: 1 }] }),
  }), "campaign");
});

test("B: no active campaign falls back to the normal list", () => {
  assert.equal(resolveOffProductsSource({
    activeCampaign: loaded(null),
    campaignProducts: pending,
  }), "fallback");
});

test("C: an active campaign with zero sellable products falls back", () => {
  assert.equal(resolveOffProductsSource({
    activeCampaign: loaded(campaign),
    campaignProducts: loaded({ data: [], meta: { total: 0 } }),
  }), "fallback");
});

test("campaign or campaign-product request failures fall back instead of erroring", () => {
  assert.equal(resolveOffProductsSource({
    activeCampaign: failed, campaignProducts: pending,
  }), "fallback");
  assert.equal(resolveOffProductsSource({
    activeCampaign: loaded(campaign), campaignProducts: failed,
  }), "fallback");
});

test("waits for the campaign and then its products before choosing", () => {
  assert.equal(resolveOffProductsSource({
    activeCampaign: pending, campaignProducts: pending,
  }), "loading");
  assert.equal(resolveOffProductsSource({
    activeCampaign: loaded(campaign), campaignProducts: pending,
  }), "loading");
});

test("OffProducts requests campaign products with the existing section query", () => {
  assert.match(offProducts, /const fallbackQuery = \{\s*sort: "most_discounted",\s*inStock: true,\s*page: 1,\s*limit: 8,\s*\};/);
  assert.match(offProducts, /campaignQuery = \{ \.\.\.fallbackQuery, campaignId: campaign\?\.id \}/);
  assert.match(offProducts, /enabled: Boolean\(campaign\?\.id\)/);
  assert.match(offProducts, /useGetAllProducts\(fallbackQuery, \{\s*enabled: source === "fallback",/);
});

test("OffProducts shows the countdown only for the campaign source", () => {
  assert.match(offProducts, /timer=\{\s*isCampaign && \(\s*<CampaignCountdown\s*endsAt=\{campaign\.endsAt\}/);
  assert.match(offProducts, /<ProductCard/);
});

test("D: expiry invalidates the active campaign and the section product queries", () => {
  const handler = offProducts.slice(offProducts.indexOf("handleCampaignExpire = useCallback"));
  assert.match(handler, /invalidateQueries\(\{ queryKey: campaignKeys\.active\(\) \}\)/);
  assert.match(handler, /productKeys\.list\(\{ \.\.\.fallbackQuery, campaignId \}\)/);
  assert.match(handler, /productKeys\.list\(fallbackQuery\)/);
});

test("the 'view all' link keeps its existing params without campaignId", () => {
  const href = offProducts.slice(
    offProducts.indexOf("getFullHrefParams = () =>"),
    offProducts.indexOf("return params;"),
  );
  assert.doesNotMatch(href, /campaign/i);
  assert.match(href, /params\.set\("sort", "most_discounted"\)/);
  assert.match(href, /params\.set\("limit", "12"\)/);
});

test("the layout timer slot is optional and the placeholder text is gone", () => {
  assert.doesNotMatch(layout, /"Timer"/);
  assert.match(layout, /genderType \? \(\s*<GenderType gender=\{gender\} onClick=\{onGenderClick\} \/>\s*\) : \(\s*timer\s*\)/);
});

test("F: Recent and Popular sections keep the gender switch and no timer", () => {
  for (const file of ["RecentProducts.jsx", "PopularProducts.jsx"]) {
    const source = read(`../app/(user)/_components/${file}`);
    assert.match(source, /genderType="true"/);
    assert.doesNotMatch(source, /timer|campaign/i);
  }
});

test("campaignId is whitelisted without changing queries that omit it", () => {
  const base = { sort: "most_discounted", inStock: true, page: 1, limit: 8 };
  const withoutCampaign = normalizeProductsQuery(base);
  assert.equal("campaignId" in withoutCampaign, false);
  assert.deepEqual(normalizeProductsQuery({ ...base, campaignId: undefined }), withoutCampaign);
  assert.equal(normalizeProductsQuery({ ...base, campaignId: 12 }).campaignId, 12);
  assert.equal(normalizeProductsQuery({ ...base, campaignId: "12" }).campaignId, 12);
  for (const invalid of [0, -1, 1.5, "abc", null]) {
    assert.equal("campaignId" in normalizeProductsQuery({ ...base, campaignId: invalid }), false);
  }
  assert.notDeepEqual(productListKey({ ...base, campaignId: 12 }), productListKey(base));
});

test("remaining time is computed from Date.parse(endsAt) and never negative", () => {
  const endsAt = "2026-10-01T00:00:10.000Z";
  const end = Date.parse(endsAt);
  assert.equal(getRemainingMs(endsAt, end - 10_000), 10_000);
  assert.equal(getRemainingMs(endsAt, end + 5_000), 0);
  assert.equal(getRemainingMs("not a date", end), null);
  assert.equal(getRemainingMs(undefined, end), null);
});

test("remaining time splits into days/hours/minutes/seconds, rounding up", () => {
  assert.deepEqual(splitRemaining(((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000),
    { days: 2, hours: 3, minutes: 4, seconds: 5 });
  assert.deepEqual(splitRemaining(400), { days: 0, hours: 0, minutes: 0, seconds: 1 });
  assert.deepEqual(splitRemaining(0), { days: 0, hours: 0, minutes: 0, seconds: 0 });
});

test("D: the countdown ticks, stops at zero and notifies expiry exactly once", () => {
  const endsAt = "2026-10-01T00:00:03.000Z";
  mock.timers.enable({ apis: ["setInterval", "Date"], now: Date.parse(endsAt) - 2_500 });
  try {
    const ticks = [];
    let expired = 0;
    startCountdown(endsAt, { onTick: (ms) => ticks.push(ms), onExpire: () => expired++ });

    assert.deepEqual(ticks, [2_500]);
    mock.timers.tick(1_000);
    mock.timers.tick(1_000);
    assert.equal(expired, 0);
    mock.timers.tick(1_000);
    assert.deepEqual(ticks, [2_500, 1_500, 500, 0]);
    assert.equal(expired, 1);
    mock.timers.tick(5_000);
    assert.equal(ticks.length, 4);
    assert.equal(expired, 1);
  } finally {
    mock.timers.reset();
  }
});

test("an already-expired campaign reports zero and expires immediately", () => {
  mock.timers.enable({ apis: ["setInterval", "Date"], now: Date.parse("2026-10-02T00:00:00Z") });
  try {
    const ticks = [];
    let expired = 0;
    startCountdown("2026-10-01T00:00:00Z", { onTick: (ms) => ticks.push(ms), onExpire: () => expired++ });
    mock.timers.tick(3_000);
    assert.deepEqual(ticks, [0]);
    assert.equal(expired, 1);
  } finally {
    mock.timers.reset();
  }
});

test("stopping the countdown cancels further ticks", () => {
  mock.timers.enable({ apis: ["setInterval", "Date"], now: 0 });
  try {
    const ticks = [];
    const stop = startCountdown(new Date(10_000).toISOString(), { onTick: (ms) => ticks.push(ms) });
    stop();
    mock.timers.tick(5_000);
    assert.deepEqual(ticks, [10_000]);
  } finally {
    mock.timers.reset();
  }
});

test("countdown hook/component: hydration-safe, Persian digits, no storage or OTP timer", () => {
  const hook = read("../hooks/useCountdown.js");
  const component = read("../components/CampaignCountdown.jsx");
  assert.match(hook, /useState\(null\)/);
  assert.match(hook, /startCountdown\(endsAt/);
  assert.match(component, /if \(!remaining\) return null;/);
  assert.match(component, /toPersianNumbers/);
  for (const source of [hook, component]) {
    assert.doesNotMatch(source, /localStorage|useOtpTimer/);
  }
});

test("the active campaign service and hook use the dedicated endpoint", () => {
  const service = read("../services/campaignServices.js");
  const hooks = read("../hooks/useCampaigns.js");
  assert.match(service, /\.get\("\/campaigns\/active"\)\s*\.then\(\(\{ data \}\) => withClockOffset\(data \?\? null, Date\.now\(\)\)\)/);
  assert.match(hooks, /active: \(\) => \[\.\.\.campaignKeys\.all, "active"\]/);
  assert.match(hooks, /queryKey: campaignKeys\.active\(\),\s*queryFn: getActiveCampaignApi/);
});

// --- Server clock correction (serverNow) ---

const ENDS_AT = "2026-10-01T12:00:00.000Z";
const SERVER_NOW = "2026-10-01T11:59:50.000Z"; // server: 10s remaining

function runCountdown(clientNow, clockOffsetMs) {
  mock.timers.enable({ apis: ["setInterval", "Date"], now: clientNow });
  const ticks = [];
  let expired = 0;
  startCountdown(ENDS_AT, {
    onTick: (ms) => ticks.push(ms),
    onExpire: () => expired++,
    clockOffsetMs,
  });
  return { ticks, expired: () => expired };
}

test("serverNow becomes a clock offset measured when the response arrives", () => {
  const received = Date.parse(SERVER_NOW) + 60_000; // client 60s ahead
  const campaign = withClockOffset({ id: 12, endsAt: ENDS_AT, serverNow: SERVER_NOW }, received);
  assert.equal(campaign.clockOffsetMs, -60_000);
  assert.equal(campaign.id, 12);
  assert.equal(campaign.serverNow, SERVER_NOW);
  assert.equal(withClockOffset(null, received), null);
});

test("countdown follows server time when the client clock is ahead", () => {
  const clientNow = Date.parse(SERVER_NOW) + 5 * 60_000; // client 5 minutes ahead
  const { clockOffsetMs } = withClockOffset({ endsAt: ENDS_AT, serverNow: SERVER_NOW }, clientNow);
  try {
    const run = runCountdown(clientNow, clockOffsetMs);
    assert.deepEqual(run.ticks, [10_000]);
    assert.equal(run.expired(), 0);
    mock.timers.tick(9_000);
    assert.equal(run.expired(), 0);
    mock.timers.tick(1_000);
    assert.equal(run.ticks.at(-1), 0);
    assert.equal(run.expired(), 1);
  } finally {
    mock.timers.reset();
  }
});

test("countdown follows server time when the client clock is behind", () => {
  const clientNow = Date.parse(SERVER_NOW) - 2 * 3_600_000; // client 2 hours behind
  const { clockOffsetMs } = withClockOffset({ endsAt: ENDS_AT, serverNow: SERVER_NOW }, clientNow);
  try {
    const run = runCountdown(clientNow, clockOffsetMs);
    assert.deepEqual(run.ticks, [10_000]);
    mock.timers.tick(10_000);
    assert.equal(run.ticks.at(-1), 0);
    assert.equal(run.expired(), 1);
    mock.timers.tick(5_000);
    assert.equal(run.expired(), 1);
  } finally {
    mock.timers.reset();
  }
});

test("missing or invalid serverNow falls back to the plain client clock", () => {
  const clientNow = Date.parse(ENDS_AT) - 30_000;
  for (const serverNow of [undefined, null, "", "not a date"]) {
    assert.equal(withClockOffset({ endsAt: ENDS_AT, serverNow }, clientNow).clockOffsetMs, 0);
  }
  for (const clockOffsetMs of [undefined, NaN, "abc"]) {
    try {
      const run = runCountdown(clientNow, clockOffsetMs);
      assert.deepEqual(run.ticks, [30_000]);
    } finally {
      mock.timers.reset();
    }
  }
});

test("the countdown receives the campaign's clock offset", () => {
  const hook = read("../hooks/useCountdown.js");
  const component = read("../components/CampaignCountdown.jsx");
  assert.match(offProducts, /clockOffsetMs=\{campaign\.clockOffsetMs\}/);
  assert.match(component, /useCountdown\(endsAt, onExpire, clockOffsetMs\)/);
  assert.match(hook, /\[endsAt, clockOffsetMs\]/);
});
