"use client";

import { useState } from "react";
import AppImage from "@/components/AppImage";
import { useDebounce } from "@/hooks/useDebounce";
import { useProductPickerSearch } from "@/hooks/useProducts";
import { useGetAllBrandCategories } from "@/hooks/useCategories";
import { toPersianNumbersWithComma } from "@/utils/toPersianNumbers";
import {
  PICKER_SEARCH_DEBOUNCE_MS,
  buildProductPickerParams,
  mergePages,
  productVariantTypes,
  toProductSnapshot,
} from "@/utils/entityPickerContract.mjs";
import EntityPickerModal from "./EntityPickerModal";

const VARIANT_TYPE_LABELS = { decant: "دکانت", sealed: "پلمپ" };

export const productDisplayName = (snapshot) =>
  snapshot.perTitle || snapshot.enTitle || "";

// One Product line: thumbnail, titles and brand (results, selected tab and
// the form list share it).
export function ProductSummary({ product, variantTypes = [] }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <AppImage
        src={product.image}
        alt=""
        width="w-10"
        sizes="40px"
        className="shrink-0 rounded-lg bg-stroke-50"
      />
      <div className="min-w-0">
        <p className="font-bold text-sm truncate">{product.perTitle}</p>
        {product.enTitle && (
          <p dir="ltr" className="text-xs text-stroke-500 truncate text-right">
            {product.enTitle}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-stroke-500">
          {product.brandTitle && <span>{product.brandTitle}</span>}
          {variantTypes.map((type) => (
            <span
              key={type}
              className="px-1.5 rounded-full border border-stroke-250 text-stroke-600"
            >
              {VARIANT_TYPE_LABELS[type]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// `forcedType` locks the Variant type (a sealed/decant Campaign scope).
function ProductPicker({ isOpen, onClose, value, onConfirm, forcedType }) {
  const [search, setSearch] = useState("");
  const [brandId, setBrandId] = useState("");
  const [type, setType] = useState("");
  const [inStock, setInStock] = useState(false);
  const debouncedSearch = useDebounce(search, PICKER_SEARCH_DEBOUNCE_MS);
  const { data: brands = [] } = useGetAllBrandCategories();

  const params = buildProductPickerParams({
    search: debouncedSearch,
    brandId,
    type: forcedType || type,
    inStock,
  });
  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useProductPickerSearch(params, { enabled: isOpen });

  const products = mergePages(data?.pages);
  const total = data?.pages?.[0]?.meta?.total;

  const filters = (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <label className="flex items-center gap-1.5">
        <span className="text-stroke-600">برند</span>
        <select
          value={brandId}
          onChange={(event) => setBrandId(event.target.value)}
          className="textField__input rounded-xl py-1.5 px-2"
        >
          <option value="">همه</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.title || brand.value}
            </option>
          ))}
        </select>
      </label>
      {forcedType ? (
        <span className="px-2 py-1 rounded-full border border-primary text-primary">
          فقط محصولات دارای بخش {VARIANT_TYPE_LABELS[forcedType]}
        </span>
      ) : (
        <label className="flex items-center gap-1.5">
          <span className="text-stroke-600">نوع</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="textField__input rounded-xl py-1.5 px-2"
          >
            <option value="">همه</option>
            <option value="decant">دکانت</option>
            <option value="sealed">پلمپ</option>
          </select>
        </label>
      )}
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(event) => setInStock(event.target.checked)}
          className="size-4 accent-primary"
        />
        <span>فقط موجود</span>
      </label>
    </div>
  );

  return (
    <EntityPickerModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      value={value}
      title="انتخاب محصولات"
      entityLabel="محصول"
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="جستجوی نام فارسی یا انگلیسی، برند…"
      filters={filters}
      items={products}
      getSnapshot={toProductSnapshot}
      getItemName={productDisplayName}
      renderItem={(product) => (
        <ProductSummary
          product={toProductSnapshot(product)}
          variantTypes={productVariantTypes(product)}
        />
      )}
      renderSelectedItem={(snapshot) => <ProductSummary product={snapshot} />}
      emptyText="محصولی پیدا نشد"
      status={{
        isLoading,
        isFetching,
        isError,
        onRetry: () => refetch(),
        hasNextPage,
        onLoadMore: () => fetchNextPage(),
        isLoadingMore: isFetchingNextPage,
        summary:
          total !== undefined
            ? `${toPersianNumbersWithComma(total)} محصول یافت شد`
            : "",
      }}
    />
  );
}

export default ProductPicker;
