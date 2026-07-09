"use client";

import AppImage from "@/components/AppImage";
import { categoryTHeads } from "@/constants/tableHeads";
import { useRemoveBrand, useRemoveCategory } from "@/hooks/useCategories";
import ConfirmModal from "@/ui/ConfirmModal";
import Table from "@/ui/Table";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useState } from "react";

function CategoriesListTable({ categories, brands, accords, genders }) {
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [category, setCategory] = useState(false);

  const { isDeleting: isDeletingCategory, removeCategory } =
    useRemoveCategory();
  const { isDeleting: isDeletingBrand, removeBrand } = useRemoveBrand();

  const removeCategoryHandler = async () => {
    const { id } = category;

    if (accords || genders) {
      await removeCategory(id);
    } else {
      await removeBrand(id);
    }
    setConfirmModalOpen(false);
  };

  const handleModal = (data) => {
    if (!data.id) {
      setConfirmModalOpen(false);
    }
    if (data?.id) {
      setConfirmModalOpen(true);
      setCategory(data);
    }
  };

  return (
    <div className="w-full overflow-x-auto max-h-screen pb-0.5 rounded-xl max-lg:shadow-xl scrollbar--primary scrollbar-h-1 scrollbar-w-1 scrollbar-track-stroke-100/0">
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
                    {toPersianNumbers(category?.productsCount || 0)}
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
                      onClick={() => handleModal(category)}
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
      {confirmModalOpen && (
        <ConfirmModal
          cancellBtn={handleModal}
          confirmBtn={removeCategoryHandler}
          isOpen={confirmModalOpen}
          onClose={setConfirmModalOpen}
        >
          <span className="flex flex-wrap items-center justify-center gap-2 text-stroke-800 max-md:text-xl md:text-2xl">
            <p>{category.description}</p>
            <p>حذف شود؟</p>
          </span>
        </ConfirmModal>
      )}
    </div>
  );
}

export default CategoriesListTable;
