import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import {
  initialImageSrc,
  nextImageSrcAfterError,
  resolveImageSrc,
} from "./appImageSource.mjs";

const BASE = "https://api.example.test";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const appImage = read("../components/AppImage.jsx");

// Plays AppImage's onError chain: every shown source fails to load.
const failEverything = (src, fallbackSrc) => {
  const requested = [];
  let current = initialImageSrc(src, fallbackSrc, BASE);
  while (current && requested.length < 10) {
    requested.push(current);
    current = nextImageSrcAfterError(current, fallbackSrc, BASE);
  }
  return { requested, final: current };
};

test("missing, blank and stringified-empty sources resolve to nothing", () => {
  for (const src of ["", "   ", null, undefined, "undefined", "null", 42, {}]) {
    assert.equal(resolveImageSrc(src, BASE), null, String(src));
    assert.equal(initialImageSrc(src, undefined, BASE), null, String(src));
  }
});

test("source normalization is unchanged for real paths", () => {
  assert.equal(resolveImageSrc("https://cdn.test/a.webp", BASE), "https://cdn.test/a.webp");
  assert.equal(resolveImageSrc("/uploads/p/1.webp", BASE), `${BASE}/uploads/p/1.webp`);
  assert.equal(resolveImageSrc("/images/star-8-icon.svg", BASE), "/images/star-8-icon.svg");
});

test("a missing source uses a custom fallback when one is given", () => {
  assert.equal(initialImageSrc("", "/uploads/fallback.webp", BASE), `${BASE}/uploads/fallback.webp`);
  assert.equal(initialImageSrc(null, "   ", BASE), null);
});

test("a failed primary image shows nothing when there is no fallback", () => {
  assert.equal(nextImageSrcAfterError("/uploads/gone.webp", undefined, BASE), null);
  assert.deepEqual(failEverything("/uploads/gone.webp"), {
    requested: [`${BASE}/uploads/gone.webp`],
    final: null,
  });
});

test("a failed primary image switches to a custom fallback once", () => {
  assert.equal(
    nextImageSrcAfterError(`${BASE}/uploads/gone.webp`, "/images/star-8-icon.svg", BASE),
    "/images/star-8-icon.svg",
  );
});

test("a fallback that also fails stops cleanly without looping", () => {
  assert.deepEqual(failEverything("/uploads/gone.webp", "/images/missing.png"), {
    requested: [`${BASE}/uploads/gone.webp`, "/images/missing.png"],
    final: null,
  });
  // Missing primary + failing fallback: one request, then nothing.
  assert.deepEqual(failEverything(undefined, "/images/missing.png"), {
    requested: ["/images/missing.png"],
    final: null,
  });
  // A fallback equal to the failed primary is never retried.
  assert.equal(nextImageSrcAfterError("/images/a.svg", "/images/a.svg", BASE), null);
});

test("AppImage has no default placeholder and renders no <Image> without a source", () => {
  assert.match(appImage, /fallbackSrc = null,/);
  assert.doesNotMatch(appImage, /placeholder\.png|getCorrectSrc/);
  assert.match(appImage, /useState\(\(\) =>\s*initialImageSrc\(src, fallbackSrc, BASE_URL\),?\s*\)/);
  assert.match(appImage, /\{imgSrc && \(\s*<Image/);
  // The failed URL feeds the next choice, so onError cannot repeat itself.
  assert.match(
    appImage,
    /onError=\{\(\) =>\s*setImgSrc\(\(failed\) =>\s*nextImageSrcAfterError\(failed, fallbackSrc, BASE_URL\),?\s*\)\s*\}/,
  );
  // The sized container (and its caller classes) is always rendered.
  assert.match(appImage, /className=\{`relative \$\{width\} \$\{ratio\} overflow-hidden \$\{className\}`\}/);
});

test("no source file references the nonexistent placeholder asset", () => {
  const root = new URL("../", import.meta.url);
  const hits = readdirSync(root, { recursive: true })
    .filter((file) => /\.(jsx?|mjs)$/.test(file) && !file.endsWith(".test.mjs"))
    .filter((file) => readFileSync(new URL(file.replaceAll("\\", "/"), root), "utf8").includes("placeholder.png"));
  assert.deepEqual(hits, []);
});
