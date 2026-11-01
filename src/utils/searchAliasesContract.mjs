// Admin search aliases of a brand or a Product: one per line. They are only
// searched (e.g. آمواج / آمواژ / امواج for Amouage), never shown to customers.
// Mirrors the backend bounds (parseSearchAliases); the backend still cleans
// and de-duplicates them and is authoritative.

export const SEARCH_ALIASES_MAX_COUNT = 20;
export const SEARCH_ALIAS_MAX_LENGTH = 60;

// Lines trimmed with inner spaces collapsed (ZWNJ kept), empty lines dropped.
export function searchAliasLines(text) {
  return String(text ?? "")
    .split(/\r\n|\r|\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

// The `searchAliases` value of a create/update payload: the lines joined by
// "\n", or null to clear them. `error` explains an out-of-bounds list.
export function searchAliasesPayload(text) {
  const lines = searchAliasLines(text);

  if (lines.length > SEARCH_ALIASES_MAX_COUNT) {
    return { value: null, error: `حداکثر ${SEARCH_ALIASES_MAX_COUNT} نام جایگزین مجاز است` };
  }
  if (lines.some((line) => line.length > SEARCH_ALIAS_MAX_LENGTH)) {
    return { value: null, error: `هر نام جایگزین حداکثر ${SEARCH_ALIAS_MAX_LENGTH} نویسه است` };
  }

  return { value: lines.length ? lines.join("\n") : null, error: null };
}

export const SEARCH_ALIASES_HELP =
  "هر نام در یک خط، مثل املاهای دیگر یا نام فارسی/انگلیسی. فقط برای جستجو است و به مشتری نمایش داده نمی‌شود.";
