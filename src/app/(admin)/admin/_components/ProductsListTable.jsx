"use client";

import { CardIconResponsive } from "@/app/(user)/_components/ProductCard";
import AppImage from "@/components/AppImage";
import { productTHeads } from "@/constants/tableHeads";
import { useRemoveProduct } from "@/hooks/useProducts";
import ConfirmModal from "@/ui/ConfirmModal";
import Table from "@/ui/Table";
import {
  toPersianNumbers,
  toPersianNumbersWithComma,
} from "@/utils/toPersianNumbers";
import { EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useState } from "react";

function ProductsListTable({ products }) {
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [product, setProduct] = useState(false);
  const { isDeleting, removeProduct } = useRemoveProduct();

  const removeProductHandler = async () => {
    const { id } = product;

    await removeProduct(id);

    setConfirmModalOpen(false);
  };

  const handleModal = (data) => {
    if (!data.id) {
      setConfirmModalOpen(false);
    }
    if (data?.id) {
      setConfirmModalOpen(true);
      setProduct(data);
    }
  };
  return (
    <div className="w-full overflow-auto max-h-screen pb-0.5 rounded-xl max-lg:shadow-xl scrollbar--primary scrollbar-h-1 scrollbar-w-1 scrollbar-track-stroke-100/0">
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
              const productAccords = product.categories?.filter(
                (i) => i.type === "accord",
              );
              const productGender = product.categories?.find(
                (i) => i.type === "gender",
              );
              const productBrand = product?.brand;
              return (
                <Table.Row key={product.id} className="even:bg-primary/5">
                  <td className="table__td px-3 font-bold rounded-r-full">
                    <p>{toPersianNumbers(index + 1)}</p>
                  </td>
                  <td className="table__td px-6 max-w-70 truncate">
                    <p className="font-bold">{product.perTitle}</p>
                  </td>
                  <td className="table__td px-2 max-w-70 truncate">
                    <div className="flex items-center justify-center flex-col gap-2 text-xs">
                      <AppImage
                        src={productBrand?.iconUrl || "/brand-icon"}
                        alt={`${productBrand?.value}-icon` || "brand-icon"}
                        ratio="aspect-[4/1]"
                        className="dark:invert"
                        width="w-16"
                        sizes="10vw"
                      />
                      <p className="text-stroke-600">{productBrand?.title}</p>
                    </div>
                  </td>
                  <td className="table__td px-2 max-w-70 truncate">
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
                  <td className="table__td px-3 py-3 max-w-70 truncate">
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
                  <td className="table__td py-3! gap-2 px-6 flex flex-col justify-center scrollbar--primary scrollbar-w-1">
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
                        className="text-stroke-450 hover:text-blue duration-200"
                      >
                        <EyeIcon className=" size-5" />
                      </Link>
                      <Link
                        href={`/admin/products/edit/${product.id}`}
                        className="text-stroke-450 hover:text-success duration-200"
                      >
                        <PencilIcon className=" size-5" />
                      </Link>
                      <button
                        onClick={() => handleModal(product)}
                        // onClick={() => removeProductHandler(product)}
                        className="text-stroke-450 hover:text-primary duration-200"
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
          confirmBtn={removeProductHandler}
          isOpen={confirmModalOpen}
          onClose={setConfirmModalOpen}
        >
          <span className="flex flex-wrap items-center justify-center gap-2 text-stroke-800 max-md:text-xl md:text-2xl">
            <p>{product.perTitle}</p>
            <p>حذف شود؟</p>
          </span>
        </ConfirmModal>
      )}
    </div>
  );
}

export default ProductsListTable;
