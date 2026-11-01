import Link from "next/link";

// A product page's link to a single-category listing landing. Like the brand
// logo link, it does not prefetch: a product page shows several of these, and
// each would otherwise request another catalog listing merely on view.
export default function CategoryLandingLink({ href, className, children }) {
  return (
    <Link href={href} prefetch={false} className={className}>
      {children}
    </Link>
  );
}
