"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Loading from "@/components/Loading";
import { useGetProductById } from "@/hooks/useProducts";
import ProductForm from "./ProductForm";
import {
  COPY_FROM_PARAM,
  cloneSourceSummary,
  duplicateView,
  isCopyRequested,
  mapProductToCloneDefaults,
  parseCopyFromId,
} from "./productCloneContract.mjs";

// /admin/products/add — a blank create form, or with ?copyFrom=<id> a create
// form prefilled from that Product ("ساخت محصول مشابه"). Both POST a new Product.
function AddProductPage() {
  const copyFrom = useSearchParams().get(COPY_FROM_PARAM);

  if (!isCopyRequested(copyFrom)) return <ProductForm key="blank" />;
  return <DuplicateProductForm key={copyFrom} copyFrom={copyFrom} />;
}

function DuplicateProductForm({ copyFrom }) {
  const id = parseCopyFromId(copyFrom);
  const { data: source, isLoading, error } = useGetProductById(id ?? undefined);
  const cloneDefaults = useMemo(
    () => (source?.id ? mapProductToCloneDefaults(source) : null),
    [source],
  );
  const { view, message } = duplicateView({ copyFrom, isLoading, error, source });

  if (view === "loading") return <Loading />;
  if (view === "error") return <CopySourceError message={message} />;

  // Create mode: the source is never `productToEdit`. Defaults are read once at
  // mount, so a background refetch of the source never overwrites edits.
  return (
    <ProductForm
      key={`copy-${id}`}
      cloneDefaults={cloneDefaults}
      copySource={cloneSourceSummary(source)}
    />
  );
}

function CopySourceError({ message }) {
  return (
    <div className="max-w-6xl px-4 w-full">
      <div
        role="alert"
        className="flex flex-col items-start gap-4 p-6 rounded-2xl border border-error bg-error/10 text-stroke-800"
      >
        <p className="font-bold">ساخت محصول مشابه ممکن نیست</p>
        <p className="text-sm text-stroke-600">
          {message} هیچ محصولی ساخته نشده است.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/products/add"
            prefetch={false}
            className="btn btn--primary border py-1.5 px-3"
          >
            شروع محصول خالی
          </Link>
          <Link
            href="/admin/products"
            prefetch={false}
            className="btn border py-1.5 px-3"
          >
            بازگشت به محصولات
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AddProductPage;
