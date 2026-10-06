"use client";

import { useState } from "react";
import Link from "next/link";
import { useGetAllProducts } from "@/hooks/useProducts";
import {
  useGetAllBrandCategories,
  useGetAllCategories,
} from "@/hooks/useCategories";
import NotExisted from "@/components/NotExisted";
import Loading from "@/components/Loading";
import ProductsListTable from "./ProductsListTable";
import BulkPriceDialog from "./BulkPriceDialog";
import {
  setVisibleSelection,
  supportedBulkFilters,
  toggleSelectedId,
} from "./bulkPriceContract.mjs";
import { toPersianNumbersWithComma } from "@/utils/toPersianNumbers";
import PagesNumber from "@/components/PagesNumber";
import CheckBox from "@/ui/CheckBox";
import { CheckIcon } from "@heroicons/react/24/outline";

const initialFilters = {
  search: "",
  brandId: "",
  original: "",
  gender: "",
  fragranceFamilies: [],
};

function ProductsLayout() {
  const [draft, setDraft] = useState(initialFilters);
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [lastApplied, setLastApplied] = useState(null);
  const { data, isPending, isFetching, error } = useGetAllProducts({
    ...filters,
    page,
    limit: 12,
    availabilityFirst: false,
  });
  const { data: brands = [] } = useGetAllBrandCategories();
  const { data: categories = [] } = useGetAllCategories();
  const products = data?.data || [];
  const meta = data?.meta;
  const visibleIds = products.map((product) => product.id);
  const genders = categories.filter((category) => category.type === "gender");
  const families = categories.filter(
    (category) => category.type === "fragrance_family",
  );

  const applyFilters = (event) => {
    event.preventDefault();
    setFilters(
      supportedBulkFilters({
        search: draft.search,
        brandIds: draft.brandId ? [Number(draft.brandId)] : [],
        original: draft.original === "" ? undefined : draft.original === "true",
        gender: draft.gender,
        fragranceFamilies: draft.fragranceFamilies,
      }),
    );
    setPage(1);
  };

  const resetFilters = () => {
    setDraft(initialFilters);
    setFilters({});
    setPage(1);
  };

  const toggleFamily = (slug) => {
    setDraft((current) => ({
      ...current,
      fragranceFamilies: current.fragranceFamilies.includes(slug)
        ? current.fragranceFamilies.filter((value) => value !== slug)
        : [...current.fragranceFamilies, slug],
    }));
  };

  return (
    <div className="space-y-4 w-full max-lg:py-4 px-4 pb-10 overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 max-[33rem]:justify-center justify-between">
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
            className="btn btn--primary border py-1.5 px-3 max-[33rem]:w-full"
            onClick={() => setBulkOpen(true)}
          >
            مدیریت گروهی قیمت
          </button>
          <Link
            href="/admin/products/add"
            prefetch={false}
            className="btn btn--primary border py-1.5 px-3 max-[33rem]:w-full"
          >
            اضافه کردن محصول
          </Link>
        </div>
      </div>

      <form
        onSubmit={applyFilters}
        className="flex flex-col items-cente justify-stretch gap-3 rounded-xl border border-stroke-200 shadow p-3 text-sm w-full"
      >
        <div className="flex max-md:flex-wrap gap-3 size-full">
          <div className="flex items-center gap-4 w-full">
            <div className="flex grow flex-col gap-2 sm:w-full">
              <label className="flex flex-col gap-1">
                <p className="pr-2 sm:text-lg font-bold">جستجو</p>
                <input
                  className="textField__input rounded-xl p-2"
                  value={draft.search}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      search: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                <p className="pr-2 sm:text-lg font-bold">برند</p>
                <select
                  className="textField__input rounded-xl p-2"
                  value={draft.brandId}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      brandId: event.target.value,
                    }))
                  }
                >
                  <option value="">همه</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.title || brand.value}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex max-sm:flex-none sm:grow flex-col gap-2 sm:w-full">
              <label className="flex flex-col gap-1">
                <p className="pr-2 sm:text-lg font-bold">اصالت</p>
                <select
                  className="textField__input rounded-xl p-2"
                  value={draft.original}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      original: event.target.value,
                    }))
                  }
                >
                  <option value="">همه</option>
                  <option value="true">اصل</option>
                  <option value="false">غیراصل</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <p className="pr-2 sm:text-lg font-bold">جنسیت</p>
                <select
                  className="textField__input rounded-xl p-2"
                  value={draft.gender}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      gender: event.target.value,
                    }))
                  }
                >
                  <option value="">همه</option>
                  {genders.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <details className="relative btn w-full flex-col items-start justify-start rounded-md border border-stroke-200 p-2 transition-all duration-200">
            <summary className="cursor-pointer sm:text-lg font-bold">
              خانواده‌های بویایی (
              {toPersianNumbersWithComma(draft.fragranceFamilies.length)})
            </summary>
            <div className="flex grow items-start flex-wrap justify-center gap-4 max-h-44 overflow-auto p-2 max-w-full transition-all duration-200">
              {families.map((category) => (
                <CheckBox
                  key={category.id}
                  checked={draft.fragranceFamilies.includes(category.slug)}
                  className=" flex-row whitespace-nowrap"
                  label={category.title}
                  onChange={() => toggleFamily(category.slug)}
                  textClassName="text-base"
                >
                  <div
                    className={`flex items-center justify-center size-4 border rounded-sm  ${draft.fragranceFamilies.includes(category.slug) ? "border-primary bg-primary text-white" : "border-stroke-600 text-transparent "} transition-all duration-200`}
                  >
                    <CheckIcon className=" size-2.5 stroke-4 " />
                  </div>
                </CheckBox>
              ))}
            </div>
          </details>
        </div>
        <div className="flex items-center justify-between gap-2 max-sm:w-full w-full h-full">
          <button
            type="submit"
            className="btn btn--primary px-3 py-2 text-nowrap max-sm:w-full"
          >
            اعمال فیلتر
          </button>
          <button
            type="button"
            className="btn btn--secondary--2 px-3 py-2 text-nowrap max-sm:w-full"
            onClick={resetFilters}
          >
            پاک کردن فیلتر
          </button>
        </div>
      </form>

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
        page={page}
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
