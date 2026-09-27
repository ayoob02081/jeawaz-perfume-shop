import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { HOME_SECTION_SKELETON_COUNT, homeSectionView } from "./homeProductSection.mjs";
import { offProductsSectionView, resolveOffProductsSource } from "./homeCampaignSection.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const section = (name) => read(`../app/(user)/_components/${name}.jsx`);

const loaded = (data) => ({ isPending: false, error: null, data });
const pending = { isPending: true, error: null, data: undefined };
const failed = { isPending: false, error: new Error("x"), data: undefined };
const list = (count) => ({ data: Array.from({ length: count }, (_, id) => ({ id })) });

test("Recent/Popular: loading shows skeletons, then products or the error", () => {
  assert.equal(homeSectionView({ isLoading: true, error: null }), "loading");
  assert.equal(homeSectionView({ isLoading: false, error: null }), "products");
  assert.equal(homeSectionView({ isLoading: false, error: new Error("x") }), "error");
  // Settled with zero products is the (unchanged) empty row, not skeletons.
  assert.equal(homeSectionView({ isLoading: false, error: null, data: list(0) }), "products");
});

test("most discounted: skeletons until the source and its list settle, no fallback flash", () => {
  const view = (activeCampaign, campaignProducts, fallback) => {
    const source = resolveOffProductsSource({ activeCampaign, campaignProducts });
    const shown = source === "campaign" ? campaignProducts : fallback;
    return { source, view: offProductsSectionView({ source, section: shown }) };
  };
  const campaign = loaded({ id: 3 });

  // Campaign unresolved: loading even if a fallback list were already cached.
  assert.deepEqual(view(pending, pending, loaded(list(8))), { source: "loading", view: "loading" });
  // Campaign known, its products pending: still loading, still no fallback.
  assert.deepEqual(view(campaign, pending, loaded(list(8))), { source: "loading", view: "loading" });
  // Campaign with products.
  assert.deepEqual(view(campaign, loaded(list(3)), pending), { source: "campaign", view: "products" });
  // No campaign: fallback list loading, then shown.
  assert.deepEqual(view(loaded(null), pending, pending), { source: "fallback", view: "loading" });
  assert.deepEqual(view(loaded(null), pending, loaded(list(8))), { source: "fallback", view: "products" });
  // Empty campaign falls back; empty fallback keeps the existing empty row.
  assert.deepEqual(view(campaign, loaded(list(0)), loaded(list(0))), { source: "fallback", view: "products" });
  // Failures.
  assert.deepEqual(view(failed, pending, failed), { source: "fallback", view: "error" });
});

test("skeleton count fills the initial row without over-rendering", () => {
  assert.equal(HOME_SECTION_SKELETON_COUNT, 4);
  for (const name of ["RecentProducts", "PopularProducts", "CampaignsProducts"]) {
    const source = section(name);
    // Same limit-8 request; fewer skeletons than the loaded list.
    assert.match(source, /limit: 8/);
    assert.ok(HOME_SECTION_SKELETON_COUNT < 8);
    // The section layout (header, row) stays mounted; only the row contents swap.
    assert.match(
      source,
      /\{view === "loading" \? \(\s*<ProductCardSkeletons count=\{HOME_SECTION_SKELETON_COUNT\} \/>\s*\) : \(\s*products\?\.map\(/,
    );
    assert.match(source, /if \(view === "error"\) \{\s*return <Error \/>;/);
    assert.doesNotMatch(source, /<Loading|import Loading/);
  }
  assert.match(section("RecentProducts"), /homeSectionView\(\{ isLoading, error \}\)/);
  assert.match(section("PopularProducts"), /homeSectionView\(\{ isLoading, error \}\)/);
  assert.match(section("CampaignsProducts"), /offProductsSectionView\(\{ source, section \}\)/);
});

test("the placeholders are the existing ProductCardSkeleton, sized like ProductCard", () => {
  const skeleton = read("../app/(user)/_components/skeleton/ProductCardSkeletons.jsx");
  const card = section("ProductCard");
  assert.match(skeleton, /import Skeleton from "@\/ui\/Skeleton";/);
  assert.match(skeleton, /export function ProductCardSkeletons\(\{ count \}\) \{\s*return Array\.from\(\{ length: count \}, \(_, index\) => \(\s*<ProductCardSkeleton key=\{index\} \/>/);
  for (const size of ["h-54", "md:h-115.5", "aspect-2/3", "max-md:min-w-78", "rounded-2xl", "border-[1.5px]"]) {
    assert.ok(skeleton.includes(size), `skeleton has ${size}`);
    assert.ok(card.includes(size), `card has ${size}`);
  }
});
