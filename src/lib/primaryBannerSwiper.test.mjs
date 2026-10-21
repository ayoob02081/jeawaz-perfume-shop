// Hero banner Swiper (12.2.0): one manual swipe advances at most one banner.
// A swipe during the autoplay transition made loop repositioning skip a
// second banner, and autoplay only pauses ~200 ms into a drag, so its timer
// could still advance under the finger. Real browser runs (CDP touch and mouse,
// 2-4 banners) cover the gestures; these tests pin the props that fix them.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const { createElement: h } = require("react");
const { renderToString } = require("react-dom/server");
const SRC = fileURLToPath(new URL("../", import.meta.url));

let swiperProps = [];
const stubs = {
  "@/contexts/auth/AuthContext": { useAuth: () => ({ user: null }) },
  "next/link": ({ href, children, prefetch, ...rest }) =>
    h("a", { href, ...rest }, children),
  "@/services/bannerServices": {
    getActiveBannersApi: async () => {
      throw new Error("no client read during server render");
    },
  },
  "@/utils/showApiError": { showApiError() {} },
  "next/navigation": { useRouter: () => ({ push() {}, refresh() {} }) },
  "react-hot-toast": { default: { success() {} } },
  "swiper/css": {},
  "swiper/css/pagination": {},
  "swiper/modules": { Autoplay: { name: "Autoplay" }, Pagination: { name: "Pagination" } },
  "swiper/react": {
    Swiper: ({ children, ...props }) => {
      swiperProps.push(props);
      return h("div", { className: props.className }, children);
    },
    SwiperSlide: ({ children }) => h("div", null, children),
  },
};
const modules = new Map();
function file(base) {
  for (const candidate of [base, `${base}.jsx`, `${base}.js`, `${base}.mjs`]) {
    if (existsSync(candidate) && statSync(candidate).isFile())
      return resolve(candidate);
  }
  throw new Error(`Cannot resolve ${base}`);
}
function load(path) {
  if (path.endsWith(".mjs")) return require(path);
  if (modules.has(path)) return modules.get(path).exports;
  const module = { exports: {} };
  modules.set(path, module);
  const { code } = transformSync(readFileSync(path, "utf8"), {
    filename: path,
    jsc: {
      parser: { syntax: "ecmascript", jsx: true },
      transform: { react: { runtime: "automatic" } },
    },
    module: { type: "commonjs" },
  });
  const local = (name) =>
    Object.hasOwn(stubs, name)
      ? stubs[name]
      : name.startsWith("@/")
        ? load(file(SRC + name.slice(2)))
        : name.startsWith(".")
          ? load(file(resolve(dirname(path), name)))
          : require(name);
  new Function("require", "module", "exports", "process", code)(
    local,
    module,
    module.exports,
    process,
  );
  return module.exports;
}
const PrimaryBannerLayout = load(
  file(SRC + "app/(user)/_components/PrimaryBannerLayout"),
).default;

const banner = (id) => ({
  id,
  type: "primary",
  title: `بنر ${id}`,
  link: "/products",
  imageUrl: `/uploads/d${id}.webp`,
  mobileImageUrl: `/uploads/m${id}.webp`,
});

function render(count) {
  const { QueryClient, QueryClientProvider } = require("@tanstack/react-query");
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  swiperProps = [];
  renderToString(
    h(
      QueryClientProvider,
      { client },
      h(PrimaryBannerLayout, {
        initialSnapshot: {
          data: Array.from({ length: count }, (_, i) => banner(i + 1)),
          updatedAt: Date.now(),
        },
      }),
    ),
  );
  assert.equal(swiperProps.length, 1);
  return swiperProps[0];
}

const fakeSwiper = (running) => {
  const calls = [];
  return { calls, autoplay: { running, resume: () => calls.push("resume") } };
};

test("gestures are ignored while a slide transition runs", () => {
  for (const count of [2, 3, 4]) {
    assert.equal(render(count).preventInteractionOnTransition, true, `${count} banners`);
  }
});

test("the existing loop, autoplay and layout settings are unchanged", () => {
  for (const count of [1, 2, 3, 4]) {
    const props = render(count);
    assert.equal(props.loop, count > 1);
    assert.equal(props.speed, 700);
    assert.deepEqual(props.autoplay, {
      delay: 5000,
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
    });
    // centeredSlides skewed the first drag move towards "next" in small loops.
    assert.notEqual(props.centeredSlides, true);
    assert.equal(props.slidesPerView, 1);
    assert.equal(props.spaceBetween, 16);
    assert.deepEqual(props.pagination, { clickable: true });
    assert.deepEqual(props.modules.map((m) => m.name), ["Autoplay", "Pagination"]);
    assert.equal(typeof props.onSwiper, "function");
  }
});

test("a landing finger restarts the running autoplay countdown", () => {
  const { onTouchStart } = render(3);
  for (const pointerType of ["touch", "pen", undefined]) {
    const swiper = fakeSwiper(true);
    onTouchStart(swiper, { pointerType });
    assert.deepEqual(swiper.calls, ["resume"], String(pointerType));
  }
});

test("a mouse press or stopped autoplay leaves the countdown alone", () => {
  const { onTouchStart } = render(3);
  // Hovering already paused autoplay (pauseOnMouseEnter); resume would undo it.
  const mouse = fakeSwiper(true);
  onTouchStart(mouse, { pointerType: "mouse" });
  assert.deepEqual(mouse.calls, []);

  const stopped = fakeSwiper(false);
  onTouchStart(stopped, { pointerType: "touch" });
  assert.deepEqual(stopped.calls, []);
});

// The Swiper is dir="ltr" (next banner to the right, swipe left = next), so the
// desktop arrows must act in the direction they point.
test("the hero Swiper is LTR and each arrow acts in the direction it points", () => {
  assert.equal(render(3).dir, "ltr");
  const source = readFileSync(
    resolve(SRC, "app/(user)/_components/PrimaryBannerLayout.jsx"),
    "utf8",
  );
  const buttons = source.split("<button").slice(1);
  assert.equal(buttons.length, 2);
  const right = buttons.find((b) => b.includes("ChevronRightIcon"));
  const left = buttons.find((b) => b.includes("ChevronLeftIcon"));
  assert.match(right, /absolute right-1/);
  assert.match(right, /aria-label="بنر بعدی"/);
  assert.match(right, /slideNext\(\)/);
  assert.doesNotMatch(right, /slidePrev/);
  assert.match(left, /absolute left-1/);
  assert.match(left, /aria-label="بنر قبلی"/);
  assert.match(left, /slidePrev\(\)/);
  assert.doesNotMatch(left, /slideNext/);
});
