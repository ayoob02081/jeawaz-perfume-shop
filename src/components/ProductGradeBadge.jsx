import AppImage from "@/components/AppImage";
import { gradeLabel, productGrade } from "@/utils/productGrade.mjs";

// The one Product grade badge. ORIGINAL keeps the prominent original seal;
// SUPER_MASTER is a quieter neutral chip; an unknown grade renders nothing.
// `variant`: "card" (ProductCard), "detail" (Product page) or "admin" (tables).
function ProductGradeBadge({ product, variant = "card" }) {
  const grade = productGrade(product);
  if (!grade) return null;
  const label = gradeLabel(grade);

  if (variant === "admin") {
    return (
      <span
        className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold ${grade === "ORIGINAL" ? "border-primary bg-primary/10 text-primary" : "border-stroke-200 bg-stroke-200 text-stroke-500"}`}
      >
        {label}
      </span>
    );
  }

  if (grade === "ORIGINAL") {
    return variant === "detail" ? (
      <AppImage
        src="/images/bg-original.svg"
        alt="original-icon"
        ratio="aspect-[5/2]"
        width="w-32"
        sizes="10vw"
        className="self-end"
      />
    ) : (
      <AppImage
        src="/images/bg-original.svg"
        alt="original-icon"
        ratio="aspect-6/1"
        className="justify-center"
        width="max-md:w-16 h-full md:w-[4.815rem]"
        sizes="10vw"
      />
    );
  }

  return variant === "detail" ? (
    <div className="h-full py-2">
      <span className="inline-flex items-center h-full rounded-full border border-stroke-200 bg-stroke-200 px-4 py-2 text-sm font-bold text-stroke-500">
        {label}
      </span>
    </div>
  ) : (
    <span className="inline-flex items-center rounded-full border border-stroke-200 bg-stroke-200 px-2 py-1.5 text-[10px] font-bold text-stroke-500">
      {label}
    </span>
  );
}

export default ProductGradeBadge;
