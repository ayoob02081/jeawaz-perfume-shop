import { brandLandingFromProducts } from "./brandSeo.mjs";

export const SITE_ORIGIN = "https://jeawaz.com";
export const SITE_NAME = "جیاواز پرفیوم";
export const SITE_DESCRIPTION =
  "خرید آنلاین ادکلن و دکانت با بهترین قیمت و ارسال به سراسر ایران";
export const SITEMAP_REVALIDATE_SECONDS = 3600;
export const PUBLIC_PATHS = [
  "/", "/products", "/page/about-us", "/page/contact-us", "/page/terms",
];
const PAGE_SIZE = 100;
const MAX_URLS = 50_000;
export const CATEGORY_TYPES = {
  gender: "gender",
  fragranceFamilies: "fragrance_family",
  seasons: "season",
  temperature: "temperature",
  characters: "character",
  occasions: "occasion",
};

export function isValidProductId(id) {
  return /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0;
}

export function productUrl(id) {
  if (!isValidProductId(id)) {
    throw new Error("Invalid public product ID in sitemap data");
  }
  return `${SITE_ORIGIN}/products/${Number(id)}`;
}

function lastModified(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(T|$)/.test(value)) return undefined;
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : undefined;
}

// Utility pages anyone can load (cart, login): kept out of the index, but
// crawlable — a robots.txt Disallow would hide the noindex from crawlers.
export const utilityRobots = () => ({ index: false, follow: true });
// Account areas: defense in depth behind proxy.js and backend authorization.
export const privateRobots = () => ({ index: false, follow: false });

export function robotsMetadata() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private areas and payment callbacks are not crawled. /auth and /cart
      // are crawlable so their noindex can be seen.
      disallow: ["/admin", "/profile", "/payment"],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}

const plainText = (value) => typeof value === "string" ? value.trim() : "";

// A static public page (home, information pages): its self-referencing
// canonical and the share preview, both from one URL so they never differ.
// Only for indexable public pages; never for utility, private or error pages.
export function publicPageMetadata({ title, description, path }) {
  if (typeof path !== "string" || !/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/.test(path)) {
    throw new Error("Public page metadata needs a plain route path");
  }
  const url = SITE_ORIGIN + path;
  return {
    alternates: { canonical: url },
    ...socialMetadata({ title, description, url }),
  };
}

// Explicit share previews from the page's own title, description, canonical
// URL and real public images; unknown values are left out, never invented.
// Next replaces a parent's openGraph instead of merging it, so every indexable
// page sets its own (an inherited og:url would point at another page).
// A Next `{ absolute }` title is used as is, matching the document title.
export function socialMetadata({ title, description, url, images = [] } = {}) {
  if (typeof url !== "string" || (url !== SITE_ORIGIN && !url.startsWith(SITE_ORIGIN + "/"))) {
    throw new Error("Social metadata needs a canonical jeawaz.com URL");
  }
  const absolute = plainText(title?.absolute);
  const pageTitle = absolute ||
    (plainText(title) ? `${SITE_NAME} | ${plainText(title)}` : SITE_NAME);
  const summary = plainText(description);
  const image = (Array.isArray(images) ? images : []).find((value) => /^https?:\/\//i.test(value ?? ""));
  return {
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "fa_IR",
      title: pageTitle,
      url,
      ...(summary ? { description: summary } : {}),
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: pageTitle,
      ...(summary ? { description: summary } : {}),
      ...(image ? { images: [image] } : {}),
    },
  };
}

// Only the public catalog is consulted: the current API has no draft/published
// field. Stock availability does not determine whether a product page exists.
// Category URLs are the real storefront filters, not invented category routes.
export async function buildSitemap(apiUrl, fetchImpl = fetch) {
  const api = new URL(apiUrl);
  if (!["https:", "http:"].includes(api.protocol) || api.username || api.password || api.search || api.hash) {
    throw new Error("Sitemap requires a public HTTP API base URL without credentials/query/fragment");
  }
  const products = new Map();
  const categories = new Map();
  const brandProducts = new Map();
  let total;
  let totalPages = 1;

  for (let page = 1; page <= totalPages; page += 1) {
    const url = new URL(`${api.href.replace(/\/$/, "")}/products`);
    url.search = new URLSearchParams({
      page: String(page), limit: String(PAGE_SIZE), sort: "oldest", availabilityFirst: "false",
    }).toString();
    const response = await fetchImpl(url, {
      cache: "no-store", signal: AbortSignal.timeout(10_000),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Sitemap catalog request failed (${response.status})`);
    const payload = await response.json();
    const meta = payload?.meta;
    if (!Array.isArray(payload?.data) || !Number.isSafeInteger(meta?.total) || meta.total < 0 ||
      meta.page !== page || meta.limit !== PAGE_SIZE ||
      meta.totalPages !== Math.ceil(meta.total / PAGE_SIZE) ||
      payload.data.length !== Math.min(PAGE_SIZE, Math.max(0, meta.total - (page - 1) * PAGE_SIZE))) {
      throw new Error("Invalid public catalog pagination for sitemap");
    }
    total ??= meta.total;
    if (meta.total !== total) throw new Error("Catalog changed while generating sitemap; retry required");
    if (total + PUBLIC_PATHS.length > MAX_URLS) throw new Error("Catalog needs split sitemaps before exceeding 50,000 URLs");
    totalPages = meta.totalPages;

    for (const product of payload.data) {
      const url = productUrl(product?.id);
      const modified = lastModified(product.updatedAt) ?? lastModified(product.createdAt);
      products.set(url, { url, ...(modified ? { lastModified: modified } : {}), changeFrequency: "weekly", priority: 0.8 });
      // Reuse the existing traversal; no brand API or per-brand product reads.
      if (product.brand?.id != null) {
        const id = Number(product.brand.id);
        if (!brandProducts.has(id)) brandProducts.set(id, []);
        // Keep only identity/timestamps, not each product's variants and images.
        brandProducts.get(id).push({
          brand: { id: product.brand.id, title: product.brand.title, updatedAt: product.brand.updatedAt },
          updatedAt: product.updatedAt, createdAt: product.createdAt,
        });
      }
      for (const [key, type] of Object.entries(CATEGORY_TYPES)) {
        const value = product.categories?.[key];
        for (const category of Array.isArray(value) ? value : value ? [value] : []) {
          if (category?.isActive !== true || category.type !== type || typeof category.slug !== "string" || !category.slug.trim()) continue;
          const params = new URLSearchParams({ [key]: category.slug.trim() });
          const url = `${SITE_ORIGIN}/products?${params}`;
          const categoryModified = lastModified(category.updatedAt);
          const filterModified = categoryModified && (!modified || categoryModified > modified)
            ? categoryModified : modified;
          const prior = categories.get(url);
          // No fabricated "updated today" timestamps for static/filter pages.
          if (!prior || (filterModified && (!prior.lastModified || filterModified > prior.lastModified))) {
            categories.set(url, { url, ...(filterModified ? { lastModified: filterModified } : {}), changeFrequency: "weekly", priority: 0.6 });
          }
        }
      }
    }
  }
  if (products.size !== total) throw new Error("Catalog pagination repeated products; retry required");
  const brands = [];
  for (const [id, rows] of brandProducts) {
    const brand = brandLandingFromProducts(id, rows);
    if (!brand) continue;
    const dates = rows.flatMap((product) => [lastModified(product.updatedAt) ?? lastModified(product.createdAt), lastModified(product.brand.updatedAt)]).filter(Boolean).sort();
    brands.push({ url: SITE_ORIGIN + brand.href, ...(dates.length ? { lastModified: dates.at(-1) } : {}), changeFrequency: "weekly", priority: 0.6 });
  }
  const entries = [
    ...PUBLIC_PATHS.map((path) => ({ url: `${SITE_ORIGIN}${path}`, priority: path === "/" ? 1 : 0.7 })),
    ...products.values(), ...[...categories.values(), ...brands].sort((a, b) => a.url.localeCompare(b.url)),
  ];
  if (entries.length > MAX_URLS) throw new Error("Catalog needs split sitemaps before exceeding 50,000 URLs");
  return entries;
}
