import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ACCORD_CATEGORY_SKELETON_COUNT,
  GENDER_CATEGORY_SKELETON_COUNT,
  homeBannerView,
  homeCategoryView,
  SECONDARY_BANNER_SKELETON_COUNT,
} from "./homeSectionView.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const home = (name) => read(`../app/(user)/_components/${name}.jsx`);
const skeletons = () => read("../app/(user)/_components/skeleton/HomeSectionSkeletons.jsx");
const banner = { id: 1 };

test("banners: loading → skeleton; settled → banners; empty or error → hidden", () => {
  assert.equal(homeBannerView({ isPending: true, isError: false, banners: undefined }), "loading");
  assert.equal(homeBannerView({ isPending: false, isError: false, banners: [banner] }), "banners");
  assert.equal(homeBannerView({ isPending: false, isError: false, banners: [] }), "hidden");
  assert.equal(homeBannerView({ isPending: false, isError: false, banners: undefined }), "hidden");
  assert.equal(homeBannerView({ isPending: false, isError: true, banners: undefined }), "hidden");
});

test("categories: loading → skeletons; settled (even empty) → list; error → error UI", () => {
  assert.equal(homeCategoryView({ isPending: true, error: null }), "loading");
  assert.equal(homeCategoryView({ isPending: false, error: null }), "categories");
  assert.equal(homeCategoryView({ isPending: false, error: new Error("x") }), "error");
  // Errors never show skeletons.
  assert.equal(homeCategoryView({ isPending: true, error: new Error("x") }), "error");
});

test("the banner sections render skeletons instead of the spinner", () => {
  const primary = home("PrimaryBannerLayout");
  assert.match(primary, /if \(view === "loading"\) \{\s*return <PrimaryBannerSkeleton \/>;/);
  assert.match(primary, /if \(view === "hidden"\) \{\s*return null;/);
  const secondary = home("SecondaryBannerLayout");
  assert.match(
    secondary,
    /if \(view === "loading"\) \{\s*return \(\s*<SecondaryBannerSkeletons count=\{SECONDARY_BANNER_SKELETON_COUNT\} \/>\s*\);/,
  );
  assert.match(secondary, /if \(view === "hidden"\) \{\s*return null;/);
  for (const source of [primary, secondary]) {
    assert.match(source, /homeBannerView\(\{ isPending, isError, banners \}\)/);
    assert.doesNotMatch(source, /Loading/);
  }
});

test("the category rows render skeleton cards inside the real container", () => {
  for (const [name, component, count] of [
    ["GenderCategoriesLayout", "GenderCategoryCardSkeletons", "GENDER_CATEGORY_SKELETON_COUNT"],
    ["AccordCategoriesLayout", "AccordCategoryCardSkeletons", "ACCORD_CATEGORY_SKELETON_COUNT"],
  ]) {
    const source = home(name);
    assert.match(source, /homeCategoryView\(\{ isPending, error \}\)/);
    assert.match(source, /if \(view === "error"\) \{\s*return <Error \/>;/);
    assert.match(
      source,
      new RegExp(`\\{view === "loading" \\? \\(\\s*<${component} count=\\{${count}\\} />\\s*\\) : \\(`),
    );
    assert.doesNotMatch(source, /Loading/);
  }
});

// Every geometry class of the real element must be on its skeleton.
const geometry = (source, marker) => {
  const line = source.split("\n").find((l) => l.includes(marker));
  assert.ok(line, `found ${marker}`);
  return line.match(/className="([^"]+)"/)[1].split(/\s+/)
    .filter((c) => /^(?:[\w-[\]:!/.]+:)?(?:h-|w-|size-|aspect-|rounded|border|banner--|p[xytblr]?-|mx-|mt-|my-|m[xy]?-|gap-|flex|container|max-w|justify|items|self-|bg-|dark:bg-|sm:snap|snap-)/.test(c));
};
const assertCovers = (classes, skeleton, label) => {
  for (const c of classes) assert.ok(skeleton.includes(c), `${label}: skeleton lacks ${c}`);
};

test("banner skeletons keep the banner height, aspect ratio, radius and container", () => {
  const sk = skeletons();
  const card = read("../components/PrimaryBannerCard.jsx");
  assertCovers(geometry(card, "banner--primary").filter((c) => c !== "flex" && !/^items|^justify/.test(c)), sk, "primary card");
  assertCovers(geometry(home("PrimaryBannerLayout"), "<section className="), sk, "primary section");
  const secondary = home("SecondaryBannerLayout");
  assertCovers(geometry(secondary, "<section className="), sk, "secondary section");
  assertCovers(["banner--secondary", "rounded-2xl", "xl:rounded-3xl"], sk, "secondary banner");
  assert.match(secondary, /if \(index > 1\) return;/);
  assert.equal(SECONDARY_BANNER_SKELETON_COUNT, 2);
  // Swiper dots/arrows are overlays; the skeleton draws none of them.
  assert.doesNotMatch(sk, /<Swiper|<button|Chevron|swiper-pagination/);
});

test("category skeletons keep the card box and the image shape", () => {
  const sk = skeletons();
  const gender = home("GenderCategoriesLayout");
  assertCovers(geometry(gender, "max-[365px]:aspect-6/2"), sk, "gender card");
  assertCovers(["aspect-8/10", "md:aspect-10/13", "w-16", "md:w-21", "rounded-b-xl", "sm:snap-center"], sk, "gender image");
  const accord = home("AccordCategoriesLayout");
  assertCovers(geometry(accord, "sm:aspect-5/2"), sk, "accord card");
  assertCovers(["aspect-square", "h-16", "md:h-20", "rounded-xl", "snap-center"], sk, "accord image");
  // Both real cards show text (title + product count): two text lines each.
  assert.match(gender, /\{label\}[\s\S]*محصول/);
  assert.match(accord, /\{label\}[\s\S]*محصول/);
  assert.equal(GENDER_CATEGORY_SKELETON_COUNT, 3);
  assert.equal(ACCORD_CATEGORY_SKELETON_COUNT, 4);
});

test("skeletons reuse the generic Skeleton; no second primitive", () => {
  const sk = skeletons();
  assert.match(sk, /import Skeleton from "@\/ui\/Skeleton";/);
  assert.doesNotMatch(sk, /animate-|before:|shimmer/);
});
