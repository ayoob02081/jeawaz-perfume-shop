import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildProductShareUrl,
  copyText,
  shareProduct,
} from "./productShareContract.mjs";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const location = {
  origin: "https://jeawaz.com",
  href: "https://jeawaz.com/products/6?ref=x#top",
};
const product = { title: "پینک شنل", url: "https://jeawaz.com/products/6" };

function abort(name) {
  const error = new Error(name);
  error.name = name;
  return error;
}

function fakeNavigator({ share, canShare, writeText } = {}) {
  const calls = { share: [], copy: [] };
  const navigator = {};
  if (share) {
    navigator.share = async (data) => {
      calls.share.push(data);
      return share(data);
    };
  }
  if (canShare) navigator.canShare = canShare;
  if (writeText) {
    navigator.clipboard = {
      writeText: async (text) => {
        calls.copy.push(text);
        return writeText(text);
      },
    };
  }
  return { navigator, calls };
}

// Minimal document for the legacy execCommand copy path.
function fakeDocument({ copyResult = true } = {}) {
  const attached = new Set();
  const doc = {
    copied: [],
    attached,
    body: { appendChild: (el) => attached.add(el) },
    createElement: () => {
      const el = {
        value: "",
        style: {},
        setAttribute() {},
        select() { doc.selected = el.value; },
        remove: () => attached.delete(el),
      };
      return el;
    },
    execCommand(command) {
      if (command === "copy") doc.copied.push(doc.selected);
      return copyResult;
    },
  };
  return doc;
}

test("share URL is the canonical public product path on the current origin", () => {
  assert.equal(buildProductShareUrl(6, location), "https://jeawaz.com/products/6");
  assert.equal(
    buildProductShareUrl("a b", { origin: "http://localhost:3000" }),
    "http://localhost:3000/products/a%20b",
  );
  // No id: current page without its hash.
  assert.equal(buildProductShareUrl(undefined, location), "https://jeawaz.com/products/6?ref=x");
});

test("share URL is null without a browser location (SSR)", () => {
  assert.equal(buildProductShareUrl(6, undefined), null);
  assert.equal(buildProductShareUrl(6, {}), null);
});

test("native Web Share receives title and URL only; clipboard untouched", async () => {
  const { navigator, calls } = fakeNavigator({
    share: () => undefined,
    writeText: () => undefined,
  });
  assert.equal(await shareProduct(product, { navigator }), "shared");
  assert.deepEqual(calls.share, [{ title: "پینک شنل", url: "https://jeawaz.com/products/6" }]);
  assert.deepEqual(calls.copy, []);
});

test("cancelling the native share sheet is not an error and does not copy", async () => {
  const { navigator, calls } = fakeNavigator({
    share: () => { throw abort("AbortError"); },
    writeText: () => undefined,
  });
  assert.equal(await shareProduct(product, { navigator }), "cancelled");
  assert.deepEqual(calls.copy, []);
});

test("a failing native share falls back to copying the URL", async () => {
  const { navigator, calls } = fakeNavigator({
    share: () => { throw abort("NotAllowedError"); },
    writeText: () => undefined,
  });
  assert.equal(await shareProduct(product, { navigator }), "copied");
  assert.deepEqual(calls.copy, [product.url]);
});

test("canShare rejection skips native share and copies", async () => {
  const { navigator, calls } = fakeNavigator({
    share: () => undefined,
    canShare: () => false,
    writeText: () => undefined,
  });
  assert.equal(await shareProduct(product, { navigator }), "copied");
  assert.deepEqual(calls.share, []);
  assert.deepEqual(calls.copy, [product.url]);
});

test("without Web Share the URL is copied to the clipboard", async () => {
  const { navigator, calls } = fakeNavigator({ writeText: () => undefined });
  assert.equal(await shareProduct(product, { navigator }), "copied");
  assert.deepEqual(calls.copy, [product.url]);
});

test("non-secure context (no Clipboard API) uses the legacy copy and cleans up", async () => {
  const document = fakeDocument();
  assert.equal(await shareProduct(product, { navigator: {}, document }), "copied");
  assert.deepEqual(document.copied, [product.url]);
  assert.equal(document.attached.size, 0);
});

test("a denied clipboard write falls back to the legacy copy", async () => {
  const { navigator } = fakeNavigator({ writeText: () => { throw abort("NotAllowedError"); } });
  const document = fakeDocument();
  assert.equal(await copyText(product.url, { navigator, document }), true);
  assert.deepEqual(document.copied, [product.url]);
});

test("an actual copy failure reports failed instead of throwing", async () => {
  const { navigator } = fakeNavigator({ writeText: () => { throw abort("NotAllowedError"); } });
  assert.equal(await shareProduct(product, { navigator }), "failed");
  assert.equal(
    await shareProduct(product, { navigator: {}, document: fakeDocument({ copyResult: false }) }),
    "failed",
  );
});

test("missing browser APIs or URL never throw", async () => {
  assert.equal(await shareProduct(product), "failed");
  assert.equal(await shareProduct(product, {}), "failed");
  assert.equal(await shareProduct({ title: "x", url: null }, {}), "failed");
});

test("ImageSwiper share button is wired with Persian feedback", () => {
  const swiper = source("../ui/ImageSwiper.jsx");
  assert.match(swiper, /onClick=\{handleShare\}/);
  assert.match(swiper, /buildProductShareUrl\(product\?\.id, window\.location\)/);
  assert.match(swiper, /result === "copied"\) toast\.success\(/);
  assert.match(swiper, /result === "failed"\) toast\.error\(/);
  assert.doesNotMatch(swiper, /cancelled"\) toast/);
});
