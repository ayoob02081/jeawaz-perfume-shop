import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  canOpenLightbox,
  containedImageRect,
  isPointOnContainedImage,
  LIGHTBOX_MEDIA_QUERY,
  openLightboxSession,
  thumbnailScrollTarget,
} from "./imageSwiperContract.mjs";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

// A browser-like window: real EventTargets, so listener registration and
// removal behave as in the DOM.
function fakeWindow({ desktop = true, scrollbar = 0, bodyStyle = {} } = {}) {
  const media = new EventTarget();
  media.matches = desktop;
  const win = new EventTarget();
  win.innerWidth = 1440;
  win.document = {
    body: { style: { overflow: "", paddingRight: "", ...bodyStyle } },
    documentElement: { clientWidth: 1440 - scrollbar },
  };
  win.matchMedia = (query) => {
    assert.equal(query, LIGHTBOX_MEDIA_QUERY);
    return media;
  };
  win.setViewport = (isDesktop) => {
    media.matches = isDesktop;
    media.dispatchEvent(new Event("change"));
  };
  win.press = (key) => win.dispatchEvent(Object.assign(new Event("keydown"), { key }));
  return win;
}

// ImageSwiper: selected index is Embla's; the lightbox shows images[selected].
function gallery(win, imageCount) {
  const state = { open: false, selected: 0, closes: 0, cleanup: null };
  const sync = () => {
    if (state.open && !state.cleanup) {
      state.cleanup = openLightboxSession({
        window: win,
        onClose: () => { state.closes += 1; state.open = false; sync(); },
        onPrev: () => { state.selected = Math.max(0, state.selected - 1); },
        onNext: () => { state.selected = Math.min(imageCount - 1, state.selected + 1); },
      });
    } else if (!state.open && state.cleanup) {
      state.cleanup();
      state.cleanup = null;
    }
  };
  return {
    state,
    open() {
      if (canOpenLightbox(imageCount, win.matchMedia)) state.open = true;
      sync();
    },
    close() { state.open = false; sync(); },
    select(i) { state.selected = i; },
  };
}

test("lightbox opens only on the desktop breakpoint where it is rendered", () => {
  const desktop = fakeWindow();
  const mobile = fakeWindow({ desktop: false });
  assert.equal(canOpenLightbox(3, desktop.matchMedia), true);
  assert.equal(canOpenLightbox(1, desktop.matchMedia), true);
  assert.equal(canOpenLightbox(0, desktop.matchMedia), false);
  assert.equal(canOpenLightbox(3, mobile.matchMedia), false);
  assert.equal(canOpenLightbox(3, undefined), false);
});

test("mobile tap does not leave a hidden lightbox open that appears on resize", () => {
  const win = fakeWindow({ desktop: false });
  const g = gallery(win, 3);
  g.open();
  assert.equal(g.state.open, false);
  assert.equal(win.document.body.style.overflow, "");
  win.setViewport(true);
  assert.equal(g.state.open, false);
});

test("opens on the currently selected image and keyboard navigates while open", () => {
  const win = fakeWindow();
  const g = gallery(win, 3);
  g.select(2);
  g.open();
  assert.equal(g.state.selected, 2);
  win.press("ArrowLeft");
  assert.equal(g.state.selected, 1);
  win.press("ArrowRight");
  assert.equal(g.state.selected, 2);
  win.press("Escape");
  assert.equal(g.state.open, false);
});

test("closed lightbox leaves no keyboard listener behind", () => {
  const win = fakeWindow();
  const g = gallery(win, 3);
  g.open();
  g.close();
  win.press("ArrowLeft");
  win.press("Escape");
  assert.equal(g.state.selected, 0);
  assert.equal(g.state.closes, 0);
});

test("repeated open/close cycles do not accumulate listeners", () => {
  const win = fakeWindow();
  const g = gallery(win, 5);
  for (let i = 0; i < 5; i++) {
    g.open();
    g.close();
  }
  g.open();
  win.press("ArrowRight");
  assert.equal(g.state.selected, 1, "one ArrowRight moves exactly one image");
  win.press("Escape");
  assert.equal(g.state.closes, 1, "one Escape closes exactly once");
  g.open();
  assert.equal(g.state.open, true, "reopens after an Escape close");
});

test("background scroll is locked while open and restored on close", () => {
  const win = fakeWindow({ scrollbar: 15, bodyStyle: { overflow: "clip", paddingRight: "2px" } });
  const g = gallery(win, 3);
  g.open();
  assert.equal(win.document.body.style.overflow, "hidden");
  assert.equal(win.document.body.style.paddingRight, "15px");
  g.close();
  assert.deepEqual(win.document.body.style, { overflow: "clip", paddingRight: "2px" });
  g.open();
  assert.equal(win.document.body.style.overflow, "hidden");
  g.close();
  assert.deepEqual(win.document.body.style, { overflow: "clip", paddingRight: "2px" });
});

test("shrinking below the breakpoint closes the lightbox and unlocks scroll", () => {
  const win = fakeWindow();
  const g = gallery(win, 3);
  g.open();
  win.setViewport(false);
  assert.equal(g.state.open, false);
  assert.equal(win.document.body.style.overflow, "");
  win.setViewport(true);
  assert.equal(g.state.open, false, "does not reopen by itself");
});

test("one-image product: navigation stays on the only image", () => {
  const win = fakeWindow();
  const g = gallery(win, 1);
  g.open();
  win.press("ArrowRight");
  win.press("ArrowLeft");
  assert.equal(g.state.selected, 0);
  g.close();
});

test("visible area of an object-contain image", () => {
  const box = { left: 72, top: 45, width: 1296, height: 810 };
  assert.deepEqual(containedImageRect(box, 1000, 1000), {
    left: 315, top: 45, width: 810, height: 810,
  });
  // Unknown intrinsic size (loading, dimensionless SVG): whole box.
  assert.equal(containedImageRect(box, 0, 0), box);
});

test("clicks beside a contained image are backdrop clicks; clicks on it are not", () => {
  const box = { left: 72, top: 45, width: 1296, height: 810 };
  assert.equal(isPointOnContainedImage(box, 1000, 1000, 720, 450), true);
  assert.equal(isPointOnContainedImage(box, 1000, 1000, 200, 450), false);
  assert.equal(isPointOnContainedImage(box, 1000, 1000, 1300, 450), false);
  // Portrait image in the same box.
  assert.equal(isPointOnContainedImage(box, 500, 1000, 500, 450), false);
  assert.equal(isPointOnContainedImage(box, 500, 1000, 720, 450), true);
});

test("thumbnail sync scrolls only the strip, start-aligned horizontally", () => {
  const strip = { scrollLeft: 0, scrollTop: 0, rect: { left: 16, right: 374, top: 500, bottom: 620 } };
  assert.deepEqual(thumbnailScrollTarget(strip, { left: 250, right: 354, top: 508, bottom: 612 }), {
    left: 234, top: 0,
  });
  assert.deepEqual(
    thumbnailScrollTarget({ ...strip, scrollLeft: 234 }, { left: -202, right: -98, top: 508, bottom: 612 }),
    { left: 16, top: 0 },
  );
});

test("thumbnail sync scrolls the vertical strip to the nearest edge only", () => {
  const strip = { scrollLeft: 0, scrollTop: 100, rect: { left: 0, right: 96, top: 250, bottom: 600 } };
  const inside = { left: 0, right: 96, top: 300, bottom: 396 };
  const below = { left: 0, right: 96, top: 560, bottom: 656 };
  const above = { left: 0, right: 96, top: 200, bottom: 296 };
  assert.equal(thumbnailScrollTarget(strip, inside).top, 100);
  assert.equal(thumbnailScrollTarget(strip, below).top, 156);
  assert.equal(thumbnailScrollTarget(strip, above).top, 50);
});

test("ImageSwiper wiring: portal, strip-only scroll, gated open, contained images", () => {
  const swiper = source("../ui/ImageSwiper.jsx");
  assert.match(swiper, /createPortal\(/);
  assert.match(swiper, /document\.body,\s*\)/);
  assert.doesNotMatch(swiper, /\.scrollIntoView\(/);
  assert.match(swiper, /strip\.scrollTo\(/);
  assert.match(swiper, /onClick=\{openLightbox\}/);
  assert.match(swiper, /openLightboxSession\(/);
  assert.match(swiper, /onClick=\{onLightboxImageClick\}/);
  // AppImage only understands "contain"; "object-contain" fell back to stretching.
  assert.doesNotMatch(swiper, /objectFit="object-contain"/);
});
