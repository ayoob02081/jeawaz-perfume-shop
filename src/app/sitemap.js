import { unstable_cache } from "next/cache";
import { buildSitemap, SITEMAP_REVALIDATE_SECONDS } from "../lib/seo.mjs";

// Do not require the live catalog during next build. Cache only complete,
// successful catalog snapshots, keyed by the configured backend origin.
export const dynamic = "force-dynamic";
const catalogSitemap = unstable_cache(
  (apiUrl) => buildSitemap(apiUrl),
  ["public-sitemap-v1"],
  { revalidate: SITEMAP_REVALIDATE_SECONDS },
);

export default function sitemap() {
  return catalogSitemap(process.env.NEXT_PUBLIC_API_URL);
}
