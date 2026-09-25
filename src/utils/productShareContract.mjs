// Product Detail share: native Web Share when the browser offers it, the
// clipboard otherwise. Browser objects are passed in, so nothing here touches
// `window` during SSR and the flow is testable.

// Public product URL: current origin + the canonical `/products/:id` path
// (drops query strings, hashes and intercepted-route paths).
export function buildProductShareUrl(productId, location) {
  if (!location?.origin) return null;
  if (productId == null || productId === "") {
    return location.href ? location.href.split("#")[0] : null;
  }
  return `${location.origin}/products/${encodeURIComponent(productId)}`;
}

export async function copyText(text, { navigator, document } = {}) {
  if (typeof navigator?.clipboard?.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Denied or unavailable: try the legacy path below.
    }
  }

  // The Clipboard API is missing outside secure contexts (plain HTTP).
  if (!document?.body || typeof document.execCommand !== "function") return false;
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  try {
    field.select();
    return document.execCommand("copy") === true;
  } catch {
    return false;
  } finally {
    field.remove();
  }
}

// Resolves to "shared" | "cancelled" | "copied" | "failed"; never rejects.
export async function shareProduct({ title, url }, env = {}) {
  if (!url) return "failed";
  const { navigator } = env;
  const data = title ? { title, url } : { url };

  if (
    typeof navigator?.share === "function" &&
    (typeof navigator.canShare !== "function" || navigator.canShare(data))
  ) {
    try {
      await navigator.share(data);
      return "shared";
    } catch (error) {
      // The user closed the share sheet: not an error.
      if (error?.name === "AbortError") return "cancelled";
      // Any other rejection (policy, unsupported target): copy instead.
    }
  }

  return (await copyText(url, env)) ? "copied" : "failed";
}
