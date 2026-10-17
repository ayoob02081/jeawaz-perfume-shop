import Link from "next/link";
import { approvedBrandLanding } from "@/lib/brandSeo.mjs";

// Keep the existing logo layout; only approved, named brands gain navigation.
export default function BrandLandingLink({ brand, className, children }) {
  const landing = approvedBrandLanding(brand);
  return landing ? (
    <Link href={landing.href} prefetch={false} className={className + " block"}
      aria-label={"عطر و ادکلن " + landing.title}>
      {children}
    </Link>
  ) : <div className={className}>{children}</div>;
}
