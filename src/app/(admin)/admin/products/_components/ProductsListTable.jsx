"use client";

import AppImage from "@/components/AppImage";
import {
  productDesktopTHeads,
  productMobileTHeads,
} from "@/constants/tableHeads";
import { useRemoveProduct } from "@/hooks/useProducts";
import ConfirmModal from "@/ui/ConfirmModal";
import { runProductDelete } from "./productDeleteContract.mjs";
import Table from "@/ui/Table";
import {
  toPersianNumbers,
  toPersianNumbersWithComma,
} from "@/utils/toPersianNumbers";
import { getVariantsByType } from "@/utils/priceCalculator";
import { EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useState } from "react";
import CheckBox from "@/ui/CheckBox";
import { CheckIcon } from "@heroicons/react/24/outline";

function ProductsListTable({
  products,
  selectedIds = [],
  onToggleSelected,
  onSelectVisible,
  onDeleted,
}) {
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [product, setProduct] = useState(false);
  const { isDeleting, removeProduct } = useRemoveProduct();

  const removeProductHandler = async () => {
    if (isDeleting) return;

    await runProductDelete({
      id: product.id,
      removeProduct,
      onDeleted,
      close: () => setConfirmModalOpen(false),
    });
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
    <div className="w-full overflow-x-auto h-fit pb-0.5 rounded-xl shadow-xl scrollbar-none">
      <>
        <Table className="overflow-auto md:hidden">
          <Table.Header className="">
            <th className="table__th px-2">
              <CheckBox
                value={product.id}
                name="productIds"
                checked={
                  products.length > 0 &&
                  products.every((item) => selectedIds.includes(item.id))
                }
                className="flex flex-row! items-center justify-between font-bold"
                onChange={(event) => onSelectVisible?.(event.target.checked)}
              >
                <div
                  className={`flex items-center justify-center size-4 border rounded-sm  ${
                    products.length > 0 &&
                    products.every((item) => selectedIds.includes(item.id))
                      ? "border-primary bg-white text-primary"
                      : "border-stroke-0 text-transparent "
                  } transition-all duration-200`}
                >
                  <CheckIcon className=" size-2.5 stroke-4 " />
                </div>
              </CheckBox>
            </th>
            {productMobileTHeads.map((item) => (
              <th className="whitespace-nowrap table__th" key={item.id}>
                {item.label}
              </th>
            ))}
          </Table.Header>
          <Table.body>
            {products &&
              products?.map((product, index) => {
                return (
                  <Table.Row key={product.id} className="even:bg-primary/5">
                    <td className="table__td px-2 rounded-r-xl">
                      <CheckBox
                        value={product.id}
                        name="productIds"
                        checked={selectedIds.includes(product.id)}
                        className="flex flex-row! items-center justify-between font-bold"
                        onChange={() => onToggleSelected?.(product.id)}
                      >
                        <div
                          className={`flex items-center justify-center size-4 border rounded-sm  ${selectedIds.includes(product.id) ? "border-primary bg-primary text-white" : "border-stroke-600 text-transparent "} transition-all duration-200`}
                        >
                          <CheckIcon className=" size-2.5 stroke-4 " />
                        </div>
                      </CheckBox>
                    </td>
                    <td className="table__td px-3 font-bold">
                      <p>{toPersianNumbers(index + 1)}</p>
                    </td>
                    <td className="table__td p-2 max-w-70 text-wrap">
                      <div className="flex items-center justify-start gap-2">
                        <AppImage
                          src={product?.images?.[0]}
                          alt={
                            product?.perTitle
                              ? `${product.perTitle}-icon`
                              : "product-icon"
                          }
                          width="w-16"
                          sizes="10vw"
                        />
                        <p className="font-bold text-start">
                          {product.perTitle}
                        </p>
                      </div>
                    </td>
                    <td className="table__td px-2 max-w-70 truncate">
                      <div className="flex items-center justify-center flex-col gap-2 text-xs">
                        <AppImage
                          src={product?.brand?.iconUrl || "/brand-icon"}
                          alt={`${product?.brand?.value}-icon` || "brand-icon"}
                          ratio="aspect-[4/1]"
                          className="dark:invert"
                          width="w-16"
                          sizes="10vw"
                        />
                        <p className="text-stroke-800">
                          {product?.categories?.gender?.title}
                        </p>
                      </div>
                    </td>
                    <td className="table__td px-3 py-2! truncate">
                      <div className="min-w-24 max-w-48 overflow-hidden">
                        <div className="flex flex-wrap items-center justify-start gap-1 h-full w-fit">
                          {product?.categories?.fragranceFamilies?.map(
                            (fragranceFamily, index) => (
                              <p
                                className="text-sm font-bold"
                                key={fragranceFamily.id}
                              >
                                {index >= 1 && " - "} {fragranceFamily.title}
                              </p>
                            ),
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="table__td px-2">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p className="badge badge--primary font-bold">
                          %{toPersianNumbers(product.offValue)} تخفیف
                        </p>
                        <p
                          className={`badge badge--primary border ${product.stock >= 100 ? "border-success bg-success/10 text-success" : "border-red-600 bg-red-600/10 text-red-600"} font-bold`}
                        >
                          {toPersianNumbers(product.stock)} میل
                        </p>
                      </div>
                    </td>
                    <td className="table__td gap-2 p-2 flex flex-col justify-center max-h-full">
                      <div className="flex items-center justify-center overflow-hidden h-full">
                        <div className="flex flex-col items-center justify-start gap-2 overflow-auto scrollbar-none h-full">
                          <VariantPriceList
                            product={product}
                            type="decant"
                            showType
                          />
                          <VariantPriceList
                            product={product}
                            type="sealed"
                            showType
                          />
                        </div>
                      </div>
                    </td>
                    <td className="table__td px-3 rounded-l-xl">
                      <div className="flex gap-2 items-center">
                        <Link
                          href={`/products/${product.id}`}
                          className="text-stroke-450 hover:text-blue duration-200"
                        >
                          <EyeIcon className=" size-5" />
                        </Link>
                        <Link
                          href={`/admin/products/edit/${product.id}`}
                          prefetch={false}
                          className="text-stroke-450 hover:text-success duration-200"
                        >
                          <PencilIcon className=" size-5" />
                        </Link>
                        <button
                          onClick={() => handleModal(product)}
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
        <Table className="overflow-auto max-md:hidden">
          <Table.Header className="">
            <th className="table__th px-2">
              <CheckBox
                value={product.id}
                name="productIds"
                checked={
                  products.length > 0 &&
                  products.every((item) => selectedIds.includes(item.id))
                }
                className="flex flex-row! items-center justify-between font-bold"
                onChange={(event) => onSelectVisible?.(event.target.checked)}
              >
                <div
                  className={`flex items-center justify-center size-4 border rounded-sm  ${
                    products.length > 0 &&
                    products.every((item) => selectedIds.includes(item.id))
                      ? "border-primary bg-white text-primary"
                      : "border-stroke-0 text-transparent "
                  } transition-all duration-200`}
                >
                  <CheckIcon className=" size-2.5 stroke-4 " />
                </div>
              </CheckBox>
            </th>
            {productDesktopTHeads.map((item) => (
              <th className="whitespace-nowrap table__th" key={item.id}>
                {item.label}
              </th>
            ))}
          </Table.Header>
          <Table.body>
            {products &&
              products?.map((product, index) => {
                return (
                  <Table.Row key={product.id} className="even:bg-primary/5">
                    <td className="table__td px-2 rounded-r-xl">
                      <CheckBox
                        value={product.id}
                        name="productIds"
                        checked={selectedIds.includes(product.id)}
                        className="flex flex-row! items-center justify-between font-bold"
                        onChange={() => onToggleSelected?.(product.id)}
                      >
                        <div
                          className={`flex items-center justify-center size-4 border rounded-sm  ${selectedIds.includes(product.id) ? "border-primary bg-primary text-white" : "border-stroke-600 text-transparent "} transition-all duration-200`}
                        >
                          <CheckIcon className=" size-2.5 stroke-4 " />
                        </div>
                      </CheckBox>
                    </td>
                    <td className="table__td px-3 font-bold">
                      <p>{toPersianNumbers(index + 1)}</p>
                    </td>
                    <td className="table__td px-2">
                      <div className="flex items-center justify-start gap-2">
                        <AppImage
                          src={product?.images?.[0]}
                          alt={
                            product?.perTitle
                              ? `${product.perTitle}-icon`
                              : "product-icon"
                          }
                          width="w-16"
                          sizes="10vw"
                        />
                        <p className="font-bold">{product.perTitle}</p>
                      </div>
                    </td>
                    <td className="table__td px-2 max-w-70 truncate">
                      <div className="flex items-center justify-center flex-col gap-2 text-xs">
                        <AppImage
                          src={product?.brand?.iconUrl || "/brand-icon"}
                          alt={`${product?.brand?.value}-icon` || "brand-icon"}
                          ratio="aspect-[4/1]"
                          className="dark:invert"
                          width="w-20"
                          sizes="10vw"
                        />
                        <p className="text-stroke-600">
                          {product?.brand?.title}
                        </p>
                      </div>
                    </td>
                    <td className="table__td px-2 truncate font-bold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AppImage
                          src={product?.categories?.gender?.iconUrl}
                          alt={
                            product?.categories?.gender?.title
                              ? `${product.categories.gender.title}-icon`
                              : "gender-icon"
                          }
                          width="w-7"
                          sizes="10vw"
                        />
                        <p className="font-bold">
                          {product?.categories?.gender?.title}
                        </p>
                      </div>
                    </td>
                    <td className="table__td p-2 truncate">
                      <div className="min-w-24 max-w-44 overflow-hidden">
                        <div className="flex flex-wrap items-center justify-start gap-1 h-full w-fit">
                          {product?.categories?.fragranceFamilies?.map(
                            (fragranceFamily, index) => (
                              <p
                                className="text-sm font-bold"
                                key={fragranceFamily.id}
                              >
                                {index >= 1 && " - "} {fragranceFamily.title}
                              </p>
                            ),
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="table__td px-2">
                      <p
                        className={`badge badge--primary border ${product.stock >= 100 ? "border-success bg-success/10 text-success" : "border-red-600 bg-red-600/10 text-red-600"} font-bold`}
                      >
                        {toPersianNumbers(product.stock)} میل
                      </p>
                    </td>
                    <td className="table__td gap-2 py-2! px-2">
                      <div className="flex items-center justify-center overflow-hidden h-18">
                        <div className="flex flex-col items-center justify-start gap-2 overflow-auto scrollbar-none h-full">
                          <VariantPriceList product={product} type="decant" />
                        </div>
                      </div>
                    </td>
                    <td className="table__td gap-2 py-2! px-2">
                      <div className="flex items-center justify-center overflow-hidden h-18">
                        <div className="flex flex-col items-center justify-start gap-2 overflow-auto scrollbar-none h-full">
                          <VariantPriceList product={product} type="sealed" />
                        </div>
                      </div>
                    </td>
                    <td className="table__td px-2">
                      <p className="badge badge--primary font-bold">
                        %{toPersianNumbers(product.offValue)}
                      </p>
                    </td>
                    <td className="table__td px-3 rounded-l-xl">
                      <div className="flex gap-2 items-center">
                        <Link
                          href={`/products/${product.id}`}
                          className="text-stroke-450 hover:text-blue duration-200"
                        >
                          <EyeIcon className=" size-5" />
                        </Link>
                        <Link
                          href={`/admin/products/edit/${product.id}`}
                          prefetch={false}
                          className="text-stroke-450 hover:text-success duration-200"
                        >
                          <PencilIcon className=" size-5" />
                        </Link>
                        <button
                          onClick={() => handleModal(product)}
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
      </>

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

function VariantPriceList({ product, type, showType = false }) {
  const variants = getVariantsByType(product, type);
  if (!variants.length) return <span className="text-stroke-500">—</span>;

  return variants.map((variant) => (
    <div
      key={variant.id ?? `${type}-${variant.volume}`}
      className="flex items-center justify-center gap-2 py-1 text-xs rounded-full badge bg-blue/10 text-blue border border-blue font-bold"
    >
      <p className="text-stroke-800">
        {showType ? (type === "decant" ? "دکانت " : "پلمپ ") : ""}
        {toPersianNumbers(variant.volume)} میل
      </p>
      <p>{toPersianNumbersWithComma(variant.price)} تومان</p>
    </div>
  ));
}
