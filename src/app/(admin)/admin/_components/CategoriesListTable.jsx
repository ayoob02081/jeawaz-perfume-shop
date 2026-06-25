"use client";

import AppImage from "@/components/AppImage";
import { categoryTHeads } from "@/constants/tableHeads";
import { useRemoveBrand, useRemoveCategory } from "@/hooks/useCategories";
import { useGetAllProducts } from "@/hooks/useProducts";
import Table from "@/ui/Table";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useMemo } from "react";
import toast from "react-hot-toast";

function CategoriesListTable({ categories, brands, accords, genders }) {
  const { data, isPending, error } = useGetAllProducts();
  const { isDeleting: isDeletingCategory, removeCategory } =
    useRemoveCategory();
  const { isDeleting: isDeletingBrand, removeBrand } = useRemoveBrand();
  const products = data?.data || [];

  const productCounts = useMemo(() => {
    if (!Array.isArray(products)) {
      return { genders: {}, brands: {}, accords: {} };
    }

    const counts = {
      genders: {},
      brands: {},
      accords: {},
    };

    for (const p of products) {
      const categories = p?.categories;

      if (!categories) continue;

      if (categories.gender) {
        counts.genders[categories.gender] =
          (counts.genders[categories.gender] || 0) + 1;
      }

      if (categories.brand) {
        counts.brands[categories.brand] =
          (counts.brands[categories.brand] || 0) + 1;
      }

      if (Array.isArray(categories.accords)) {
        for (const acc of categories.accords) {
          counts.accords[acc] = (counts.accords[acc] || 0) + 1;
        }
      }
    }

    return counts;
  }, [products]);

  const removeCategoryHandler = async (category) => {
    const { id } = category;

    if (accords || genders) {
      await removeCategory(id);
    } else {
      await removeBrand(id);
    }
  };

  if (isPending) {
    return <div className="p-6 text-center">در حال دریافت محصولات...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">خطا در دریافت محصولات</div>
    );
  }

  return (
    <div className="w-full overflow-auto max-h-[50vh] pb-0.5 rounded-xl shadow-xl scrollbar--primary scrollbar-h-1 scrollbar-w-1 scrollbar-track-stroke-100/0">
      <Table className="overflow-auto">
        <Table.Header>
          {categoryTHeads.map((item) => (
            <th className="whitespace-nowrap table__th" key={item.id}>
              {item.label}
            </th>
          ))}
        </Table.Header>

        <Table.body>
          {categories?.map((category, index) => {
            const gendersQuantity = productCounts.genders[category.value] || 0;
            const brandsQuantity = productCounts.brands[category.title] || 0;
            const accordsQuantity = productCounts.accords[category.value] || 0;
            const type = brands ? "brands" : accords ? "accords" : "genders";

            return (
              <Table.Row key={category.id} className="even:bg-primary/5">
                <td className="table__td px-3 font-bold rounded-r-full">
                  {toPersianNumbers(index + 1)}
                </td>

                <td className="table__td px-6 max-w-70 truncate font-bold">
                  {category.title}
                </td>

                <td className="table__td px-6 max-w-70 truncate font-bold">
                  {category.value}
                </td>

                <td className="table__td px-6 max-w-70 truncate font-bold">
                  {category.description}
                </td>

                <td className="table__td px-2">
                  <div className="flex items-center justify-center">
                    <AppImage
                      src={category?.iconUrl}
                      alt={category?.value || "category-icon"}
                      ratio={brands ? "aspect-[4/1]" : "aspect-square"}
                      width={brands ? "w-16" : "w-7"}
                      className={brands ? "dark:invert" : ""}
                      sizes="10vw"
                    />
                  </div>
                </td>

                <td className="table__td px-6">
                  <span className="badge badge--primary font-bold">
                    {accords && toPersianNumbers(accordsQuantity)}
                    {brands && toPersianNumbers(brandsQuantity)}
                    {genders && toPersianNumbers(gendersQuantity)}
                  </span>
                </td>

                <td className="table__td px-3 rounded-l-full">
                  <div className="flex gap-2 items-center">
                    <Link
                      href={`/admin/categories/${type}/edit/${category.id}`}
                      className="text-stroke-450 hover:text-success duration-200"
                    >
                      <PencilIcon className="size-5" />
                    </Link>

                    <button
                      disabled={isDeletingCategory || isDeletingBrand}
                      onClick={() => removeCategoryHandler(category)}
                      className="text-stroke-450 hover:text-primary duration-200 disabled:opacity-40"
                    >
                      <TrashIcon className="size-5" />
                    </button>
                  </div>
                </td>
              </Table.Row>
            );
          })}
        </Table.body>
      </Table>
    </div>
  );
}

export default CategoriesListTable;
