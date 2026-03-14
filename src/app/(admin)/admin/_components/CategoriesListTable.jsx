"use client";

import AppImage from "@/components/AppImage";
import { categoryTHeads } from "@/constants/tableHeads";
import { useRemoveBrand, useRemoveCategory } from "@/hooks/useCategories";
import { useGetAllProducts } from "@/hooks/useProducts";
import Table from "@/ui/Table";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import toast from "react-hot-toast";

function CategoriesListTable({ categories, brands, accords, genders }) {
  const { data: products, isPending, error } = useGetAllProducts();
  const { isDeleting: isDeletingCategory, removeCategory } =
    useRemoveCategory();
  const { isDeleting: isDeletingBrand, removeBrand } = useRemoveBrand();
  const queryClient = useQueryClient();

  const removeCategoryHandler = async (category) => {
    const { id, title } = category;
    try {
      if (accords || genders) {
        await removeCategory(id);
      } else {
        await removeBrand(id);
      }
      toast.success(`${title} با موفقیت حذف شد.`);
      queryClient.invalidateQueries(["categories", "brands"]);
    } catch (error) {
      toast.error(error?.response?.data?.message);
    }
  };

  return (
    <div className="w-full overflow-x-auto pb-0.5 rounded-xl shadow-xl scrollbar--primary scrollbar-h-1 scrollbar-track-grey/0">
      <Table className="overflow-auto">
        <Table.Header className="">
          {categoryTHeads.map((item) => (
            <th className="whitespace-nowrap table__th px-2" key={item.id}>
              {item.label}
            </th>
          ))}
        </Table.Header>
        <Table.body>
          {categories &&
            categories?.map((category, index) => {
              const genderProduct = products?.filter(
                (p) => p.categories.gender === category.value,
              );
              const gendersQuantity = Number(genderProduct?.length);
              const brandProduct = products?.filter(
                (p) => p.categories.brand === category.title,
              );
              const brandsQuantity = Number(brandProduct?.length);
              const accordsProduct = products?.filter((p) =>
                p.categories.accords.includes(category.value),
              );
              const accordsQuantity = Number(accordsProduct?.length);

              return (
                <Table.Row key={category.id} className="even:bg-primary/5">
                  <td className="table__td px-3 font-bold rounded-r-full">
                    <p>{toPersianNumbers(index + 1)}</p>
                  </td>
                  <td className="table__td px-6 max-w-[280px] truncate">
                    <p className="font-bold">{category.title}</p>
                  </td>
                  <td className="table__td px-6 max-w-[280px] truncate">
                    <p className="font-bold">{category.value}</p>
                  </td>
                  <td className="table__td px-6 max-w-[280px] truncate">
                    <p className="font-bold">{category.description}</p>
                  </td>
                  <td className="table__td px-2 max-w-[280px] truncate">
                    <div className="flex items-center justify-center flex-col gap-2 text-xs">
                      <AppImage
                        src={category?.iconUrl}
                        alt={`${category?.value}-icon` || "category-icon"}
                        ratio={brands ? "aspect-[4/1]" : "aspect-square"}
                        width={brands ? "w-16" : "w-7"}
                        sizes="10vw"
                      />
                    </div>
                  </td>
                  <td className="table__td px-6">
                    <p className="badge badge--primary font-bold">
                      {accords && toPersianNumbers(accordsQuantity)}
                      {brands && toPersianNumbers(brandsQuantity)}
                      {genders && toPersianNumbers(gendersQuantity)}
                    </p>
                  </td>
                  <td className="table__td px-3 rounded-l-full">
                    <div className="flex gap-2 items-center">
                      <Link
                        href={`/admin/categories/${(brands && "brands") || (accords && "accords") || (genders && "genders")}/edit/${category.id}`}
                        className="text-success/70 hover:text-success duration-200"
                      >
                        <PencilIcon className=" size-5" />
                      </Link>
                      <button
                        onClick={() => removeCategoryHandler(category)}
                        className="text-primary/70 hover:text-primary duration-200"
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
