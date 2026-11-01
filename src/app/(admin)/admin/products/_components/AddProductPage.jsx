"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Loading from "@/components/Loading";
import { useGetProductById, useGetProductSearchAliases } from "@/hooks/useProducts";
import ProductForm from "./ProductForm";
import {
  COPY_FROM_PARAM,
  cloneSourceSummary,
  duplicateView,
  isCopyRequested,
  mapProductToCloneDefaults,
  parseCopyFromId,
} from "./productCloneContract.mjs";
import {
  ADMIN_PRODUCTS_RETURN_PARAM,
  adminProductCreateHref,
  adminProductsReturnHref,
  adminProductsReturnQuery,
} from "@/utils/adminProductsListContract.mjs";

// /admin/products/add — a blank create form, or with ?copyFrom=<id> a create
// form prefilled from that Product ("ساخت محصول مشابه"). Both POST a new Product.
// `returnTo` holds the list query it was opened from (none: the plain list).
function AddProductPage() {
  const searchParams = useSearchParams();
  const copyFrom = searchParams.get(COPY_FROM_PARAM);
  const returnQuery = adminProductsReturnQuery(
    searchParams.get(ADMIN_PRODUCTS_RETURN_PARAM),
  );

  if (!isCopyRequested(copyFrom)) {
    return <ProductForm key="blank" returnQuery={returnQuery} />;
  }
  return (
    <DuplicateProductForm
      key={copyFrom}
      copyFrom={copyFrom}
      returnQuery={returnQuery}
    />
  );
}

function DuplicateProductForm({ copyFrom, returnQuery }) {
  const id = parseCopyFromId(copyFrom);
  const { data: source, isLoading, error } = useGetProductById(id ?? undefined);
  const {
    data: aliases,
    isLoading: aliasesLoading,
    error: aliasesError,
  } = useGetProductSearchAliases(id ?? undefined);
  const cloneDefaults = useMemo(
    () => (source?.id ? mapProductToCloneDefaults(source, aliases?.searchAliases) : null),
    [source, aliases],
  );
  const { view, message } = duplicateView({
    copyFrom,
    isLoading: isLoading || aliasesLoading,
    error: error || aliasesError,
    source,
  });

  if (view === "loading") return <Loading />;
  if (view === "error") {
    return <CopySourceError message={message} returnQuery={returnQuery} />;
  }

  // Create mode: the source is never `productToEdit`. Defaults are read once at
  // mount, so a background refetch of the source never overwrites edits.
  return (
    <ProductForm
      key={`copy-${id}`}
      cloneDefaults={cloneDefaults}
      copySource={cloneSourceSummary(source)}
      returnQuery={returnQuery}
    />
  );
}

function CopySourceError({ message, returnQuery }) {
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
            href={adminProductCreateHref(returnQuery)}
            prefetch={false}
            className="btn btn--primary border py-1.5 px-3"
          >
            شروع محصول خالی
          </Link>
          <Link
            href={adminProductsReturnHref(returnQuery)}
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
