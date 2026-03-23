"use client";

import { CardIconResponsive } from "@/app/(user)/_components/ProductCard";
import AppImage from "@/components/AppImage";
import { productTHeads } from "@/constants/tableHeads";
import {
  useGetAllBrandCategories,
  useGetAllCategories,
} from "@/hooks/useCategories";
import { useRemoveProduct } from "@/hooks/useProducts";
import Table from "@/ui/Table";
import {
  toPersianNumbers,
  toPersianNumbersWithComma,
} from "@/utils/toPersianNumbers";
import { EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import toast from "react-hot-toast";
import findCategories from "@/utils/findCategories";

function ProductsListTable({ products }) {
  const {
    data: brands,
    isLoading: brandsLoading,
    error: brandsError,
  } = useGetAllBrandCategories();
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useGetAllCategories();

  const { isDeleting, removeProduct } = useRemoveProduct();
  const queryClient = useQueryClient();

  const removeProductHandler = async (product) => {
    const { id, perTitle } = product;
    try {
      await removeProduct(id);
      toast.success(`${perTitle} با موفقیت حذف شد.`);
      queryClient.invalidateQueries(["products"]);
    } catch (error) {
      toast.error(error?.response?.data?.message);
    }
  };

  return (
    <div className="w-full overflow-auto max-h-screen pb-0.5 rounded-xl shadow-xl scrollbar--primary scrollbar-h-1 scrollbar-w-1 scrollbar-track-stroke-100/0">
      <Table className="overflow-auto">
        <Table.Header className="">
          {productTHeads.map((item) => (
            <th className="whitespace-nowrap table__th" key={item.id}>
              {item.label}
            </th>
          ))}
        </Table.Header>
        <Table.body>
          {products &&
            products?.map((product, index) => {
              const { productAccords, productBrand, productGender } =
                findCategories({ product, brands, categories });
              return (
                <Table.Row key={product.id} className="even:bg-primary/5">
                  <td className="table__td px-3 font-bold rounded-r-full">
                    <p>{toPersianNumbers(index + 1)}</p>
                  </td>
                  <td className="table__td px-6 max-w-[280px] truncate">
                    <p className="font-bold">{product.perTitle}</p>
                  </td>
                  <td className="table__td px-2 max-w-[280px] truncate">
                    <div className="flex items-center justify-center flex-col gap-2 text-xs">
                      <AppImage
                        src={productBrand?.iconUrl || "/brand-icon"}
                        alt={`${productBrand?.value}-icon` || "brand-icon"}
                        ratio="aspect-[4/1]"
                        width="w-16"
                        sizes="10vw"
                      />
                      <p className="text-stroke-600">{productBrand?.title}</p>
                    </div>
                  </td>
                  <td className="table__td px-2 max-w-[280px] truncate">
                    <div className="flex items-center justify-start gap-2 h-full w-fit">
                      <CardIconResponsive
                        src={productGender?.iconUrl || "/gender-icon"}
                        alt={`${productGender?.value}-icon` || "gender-icon"}
                        title={productGender?.title}
                        type={productGender?.value}
                        className="max-md:h-8 md:h-10"
                        size="max-md:size-4 md:size-6"
                        accord
                      />
                    </div>
                  </td>
                  <td className="table__td px-3 py-3 max-w-[280px] truncate">
                    <div className="flex items-center justify-start gap-2 h-full w-fit">
                      {productAccords &&
                        productAccords?.map((accord) => (
                          <CardIconResponsive
                            key={accord.id}
                            accord={accord}
                            src={accord.iconUrl || "/accord-icon"}
                            alt={`${accord?.value}-icon` || "accord-icon"}
                            title={accord.title}
                            type={accord.value}
                            className="max-md:h-8 md:h-10"
                            size="max-md:size-4 md:size-6"
                          />
                        ))}
                    </div>
                  </td>
                  <td className="table__td px-2">
                    <p className=" badge badge--secondary--2 font-bold">
                      {toPersianNumbers(product.stock)} میل
                    </p>
                  </td>
                  <td className="table__td px-6 overflow-auto ">
                    <p className="badge bg-blue/10 text-blue font-bold">
                      {toPersianNumbersWithComma(
                        product.modes.decant.pricePerMl,
                      )}
                    </p>
                  </td>
                  <td className="table__td py-3 gap-2 px-6 flex flex-col justify-center scrollbar--primary scrollbar-w-1">
                    {product.modes.sealed.variants.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-center gap-2 py-1 text-xs rounded-full badge bg-blue/10 text-blue font-bold"
                      >
                        <p className=" text-stroke-800">
                          {toPersianNumbers(p.volume)} میل
                        </p>
                        <p>{toPersianNumbersWithComma(p.price)}</p>
                      </div>
                    ))}
                  </td>
                  <td className="table__td px-2">
                    <p className="badge badge--primary font-bold">
                      %{toPersianNumbers(product.offValue)}
                    </p>
                  </td>
                  <td className="table__td px-3 rounded-l-full">
                    <div className="flex gap-2 items-center">
                      <Link
                        href={`/products/${product.id}`}
                        className="text-blue/70 hover:text-blue duration-200"
                      >
                        <EyeIcon className=" size-5" />
                      </Link>
                      <Link
                        href={`/admin/products/edit/${product.id}`}
                        className="text-success/70 hover:text-success duration-200"
                      >
                        <PencilIcon className=" size-5" />
                      </Link>
                      <button
                        onClick={() => removeProductHandler(product)}
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

export default ProductsListTable;
