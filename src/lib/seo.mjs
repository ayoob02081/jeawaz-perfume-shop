export const SITE_ORIGIN = "https://jeawaz.com";
export const SITEMAP_REVALIDATE_SECONDS = 3600;
export const PUBLIC_PATHS = [
  "/", "/products", "/page/about-us", "/page/contact-us", "/page/terms",
];
const PAGE_SIZE = 100;
const MAX_URLS = 50_000;
const CATEGORY_TYPES = {
  gender: "gender",
  fragranceFamilies: "fragrance_family",
  seasons: "season",
  temperature: "temperature",
  characters: "character",
  occasions: "occasion",
};

export function productUrl(id) {
  if (!/^\d+$/.test(String(id)) || !Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
    throw new Error("Invalid public product ID in sitemap data");
  }
  return `${SITE_ORIGIN}/products/${Number(id)}`;
}

function lastModified(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(T|$)/.test(value)) return undefined;
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : undefined;
}

export function robotsMetadata() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/profile", "/auth", "/cart", "/payment"],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
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
  const entries = [
    ...PUBLIC_PATHS.map((path) => ({ url: `${SITE_ORIGIN}${path}`, priority: path === "/" ? 1 : 0.7 })),
    ...products.values(), ...[...categories.values()].sort((a, b) => a.url.localeCompare(b.url)),
  ];
  if (entries.length > MAX_URLS) throw new Error("Catalog needs split sitemaps before exceeding 50,000 URLs");
  return entries;
}
