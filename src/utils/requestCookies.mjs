// Cookie request-header merging for server-side retries (middlewareAuth).
//
// A Cookie request header is `name=value` pairs separated by ";". A
// Set-Cookie response header carries one cookie: its leading `name=value`
// pair followed by attributes (Path, Domain, Max-Age, Expires, HttpOnly, …)
// that describe how the browser stores it and never belong in a request.
//
// The backend's cookie parser keeps the FIRST value of a repeated name, so a
// retried request must carry each name once, with the refreshed value.

// Name and value of one `name=value` fragment, or null for an empty or
// malformed fragment (no "=", empty name). The value is kept as sent.
function parseCookiePair(fragment) {
  const text = String(fragment ?? "").trim();
  const separator = text.indexOf("=");
  if (separator <= 0) return null;
  const name = text.slice(0, separator).trim();
  if (!name) return null;
  return { name, value: text.slice(separator + 1).trim() };
}

// Cookie request header → ordered Map of name → value. A repeated name keeps
// its first value, as the backend reads it.
export function parseCookieHeader(header) {
  const cookies = new Map();
  for (const fragment of String(header ?? "").split(";")) {
    const pair = parseCookiePair(fragment);
    if (pair && !cookies.has(pair.name)) cookies.set(pair.name, pair.value);
  }
  return cookies;
}

// The request cookie a Set-Cookie header sets: only its leading pair, never
// its attributes.
export function cookiePairFromSetCookie(setCookie) {
  return parseCookiePair(String(setCookie ?? "").split(";")[0]);
}

export function serializeCookieHeader(cookies) {
  return Array.from(cookies, ([name, value]) => `${name}=${value}`).join("; ");
}

// The Cookie header for a retry after a refresh: the original request cookies
// with every name set by `setCookies` replaced by its new value (in place),
// names only in `setCookies` appended, and each name exactly once.
export function mergeCookieHeader(originalCookie, setCookies = []) {
  const cookies = parseCookieHeader(originalCookie);
  for (const setCookie of setCookies) {
    const pair = cookiePairFromSetCookie(setCookie);
    if (pair) cookies.set(pair.name, pair.value);
  }
  return serializeCookieHeader(cookies);
}
