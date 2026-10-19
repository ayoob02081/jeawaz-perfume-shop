"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useGetAllProducts } from "@/hooks/useProducts";
import {
  useGetAllBrandCategories,
  useGetAllCategories,
} from "@/hooks/useCategories";
import NotExisted from "@/components/NotExisted";
import Loading from "@/components/Loading";
import ProductsListTable from "./ProductsListTable";
import ProductsFilters from "./ProductsFilters";
import BulkPriceDialog from "./BulkPriceDialog";
import { setVisibleSelection, toggleSelectedId } from "./bulkPriceContract.mjs";
import { toPersianNumbersWithComma } from "@/utils/toPersianNumbers";
import PagesNumber from "@/components/PagesNumber";
import {
  adminProductRowNumbers,
  adminProductsApiFilters,
  adminProductsListParams,
  canonicalAdminProductsSearch,
  clearAdminProductFilters,
  correctedAdminProductsPage,
  filterUpdatesFromDraft,
  nextAdminProductsSearch,
  parseAdminProductsQuery,
} from "@/utils/adminProductsListContract.mjs";
import { PlusIcon } from "@heroicons/react/24/outline";

function ProductsLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  // The URL is the list state: refresh, links, Back/Forward and the return
  // from the edit page restore it.
  const query = useMemo(() => parseAdminProductsQuery(searchParams), [searchParams]);
  const filters = useMemo(() => adminProductsApiFilters(query), [query]);

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [lastApplied, setLastApplied] = useState(null);

  // Latest URL query, so successive updates compose before the router commits.
  const searchRef = useRef(search);
  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  // User actions add a history entry (Back/Forward step through table
  // states); automatic corrections replace the current one.
  const navigate = useCallback(
    (next, { replace = false } = {}) => {
      if (next === searchRef.current) return;
      searchRef.current = next;
      const href = next ? `${pathname}?${next}` : pathname;
      if (replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    },
    [router, pathname],
  );

  // Invalid or default values in a link are rewritten once.
  useEffect(() => {
    const canonical = canonicalAdminProductsSearch(search);
    if (canonical !== null) navigate(canonical, { replace: true });
  }, [search, navigate]);

  const applyFilters = useCallback(
    (draft) =>
      navigate(nextAdminProductsSearch(searchRef.current, filterUpdatesFromDraft(draft))),
    [navigate],
  );
  const resetFilters = useCallback(
    () => navigate(clearAdminProductFilters(searchRef.current)),
    [navigate],
  );
  const setPage = useCallback(
    (page) => navigate(nextAdminProductsSearch(searchRef.current, { page })),
    [navigate],
  );

  const { data, isPending, isFetching, isPlaceholderData, error } =
    useGetAllProducts(adminProductsListParams(query));
  const { data: brands = [] } = useGetAllBrandCategories();
  const { data: categories = [] } = useGetAllCategories();
  const products = data?.data || [];
  const meta = data?.meta;
  const rowNumbers = adminProductRowNumbers(data);
  const visibleIds = products.map((product) => product.id);
  const genders = categories.filter((category) => category.type === "gender");
  const families = categories.filter(
    (category) => category.type === "fragrance_family",
  );

  // A page past the last one (after a deletion, or an old link) moves to the
  // last existing page with the same filters, once its own answer is in.
  useEffect(() => {
    if (isFetching || isPlaceholderData || !meta || meta.page !== query.page) return;
    const target = correctedAdminProductsPage({
      page: query.page,
      totalPages: meta.totalPages,
    });
    if (target) {
      navigate(nextAdminProductsSearch(searchRef.current, { page: target }), {
        replace: true,
      });
    }
  }, [isFetching, isPlaceholderData, meta, query.page, navigate]);

  return (
    <div className="space-y-4 w-full max-lg:py- px-4 pb-10 overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 max-[37rem]:justify-center justify-between">
        <h1 className="font-bold text-stroke-800 text-xl">محصولات</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/products/price-history"
            prefetch={false}
            className="btn border py-1.5 px-3 max-[33rem]:w-full"
          >
            تاریخچه قیمت‌ها
          </Link>
          <button
            type="button"
            className="btn btn--primary--2 border py-1.5 px-3 max-[33rem]:w-full"
            onClick={() => setBulkOpen(true)}
          >
            مدیریت گروهی قیمت
          </button>
          <Link
            href="/admin/products/add"
            prefetch={false}
            className="btn btn--primary gap-2 border py-1.5 px-3 max-[33rem]:w-full"
          >
            <PlusIcon className="size-5 stroke-3"/>
            <p>اضافه کردن محصول</p>
          </Link>
        </div>
      </div>

      <ProductsFilters
        query={query}
        onApply={applyFilters}
        onReset={resetFilters}
        brands={brands}
        genders={genders}
        families={families}
      />

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          className="btn btn--primary px-3 py-1"
          disabled={!visibleIds.length || isFetching}
          onClick={() =>
            setSelectedIds((ids) => setVisibleSelection(ids, visibleIds, true))
          }
        >
          انتخاب صفحهٔ فعلی
        </button>
        <span>
          محصولات انتخاب‌شده: {toPersianNumbersWithComma(selectedIds.length)}
        </span>
        {isFetching && !isPending && <span>در حال به‌روزرسانی…</span>}
      </div>

      {lastApplied && (
        <p
          role="status"
          className="rounded-lg bg-success/10 p-3 text-success text-sm"
        >
          تغییر قیمت انجام شد: {lastApplied.changedVariants} واریانت تغییر کرد و{" "}
          {lastApplied.unchangedVariants} بدون تغییر ماند.
        </p>
      )}
      {error && (
        <p role="alert" className="text-red-600">
          دریافت فهرست محصولات ناموفق بود.
        </p>
      )}
      {isPending ? (
        <Loading />
      ) : (
        <ProductsListTable
          products={products}
          rowNumbers={rowNumbers}
          selectionDisabled={isFetching}
          selectedIds={selectedIds}
          onToggleSelected={(id) =>
            setSelectedIds((ids) => toggleSelectedId(ids, id))
          }
          onSelectVisible={(select) =>
            setSelectedIds((ids) =>
              setVisibleSelection(ids, visibleIds, select),
            )
          }
          onDeleted={(id) =>
            setSelectedIds((ids) => ids.filter((value) => value !== id))
          }
        />
      )}
      {!isPending && !error && products.length === 0 && (
        <NotExisted className="h-40">محصولی یافت نشد.</NotExisted>
      )}
      <PagesNumber
        page={query.page}
        setPage={setPage}
        totalPages={meta?.totalPages}
        isLoading={isFetching}
      />

      {bulkOpen && (
        <BulkPriceDialog
          isOpen={bulkOpen}
          selectedIds={selectedIds}
          filters={filters}
          onClose={() => setBulkOpen(false)}
          onApplied={(result) => {
            setLastApplied(result.summary);
            setSelectedIds([]);
            setBulkOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default ProductsLayout;
