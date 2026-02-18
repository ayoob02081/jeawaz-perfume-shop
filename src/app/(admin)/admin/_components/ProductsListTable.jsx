"use client";

import { productTHeads } from "@/constants/tableHeads";
// import { useRemoveProduct } from "@/hooks/useProducts";
import Table from "@/ui/Table";
import {
  toPersianNumbers,
  toPersianNumbersWithComma,
} from "@/utils/toPersianNumbers";
import { EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import toast from "react-hot-toast";

function ProductsListTable({ products }) {
  // const { isDeleting, removeProduct } = useRemoveProduct();
  const queryClient = useQueryClient();
  // console.log(products);

  const removeProductHandler = async (id) => {
    // try {
    //   const { message } = await removeProduct(id);
    //   toast.success(message);
    //   queryClient.invalidateQueries(["get-products"]);
    // } catch (error) {
    //   toast.error(error?.response?.data?.message);
    // }
  };
  return (
    <div className="w-full overflow-x-auto pb-0.5 rounded-xl shadow-xl scrollbar--primary scrollbar-h-1 scrollbar-track-grey/0">
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
              console.log(product);
              return (
                <Table.Row key={product.id} className="even:bg-primary/5">
                  <td className="table__td px-2 font-bold rounded-r-full">
                    {toPersianNumbers(index + 1)}
                  </td>
                  <td className="table__td px-6 max-w-[280px] truncate">
                    {product.perTitle}
                  </td>
                  <td className="table__td px-2 max-w-[280px] truncate">
                    <p className=" badge badge--secondary--2">
                      {product.categories.brand}
                    </p>
                  </td>
                   <td className="table__td px-2 max-w-[280px] truncate">
                    <p className=" badge badge--secondary--2">
                      {product.categories.gender}
                    </p>
                  </td>
                  <td className="table__td px-6 max-w-[280px] truncate">
                    {/* {product.categories.gender} */}
                  </td>
                  <td className="table__td px-2">
                    <p className=" badge badge--secondary--2">
                      {toPersianNumbers(product.stock)} میل
                    </p>
                  </td>
                  <td className="table__td px-6 overflow-auto ">
                    <p className="badge bg-blue/10 text-blue">
                      {toPersianNumbersWithComma(
                        product.modes.decant.pricePerMl,
                      )}
                    </p>
                  </td>
                  <td className="table__td gap-2 px-6 flex flex-col justify-start scrollbar--primary scrollbar-w-1">
                    {product.modes.sealed.variants.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-center gap-2 text-xs rounded-full badge bg-blue/10 text-blue"
                      >
                        <p className=" text-text">
                          {toPersianNumbers(p.volume)} میل
                        </p>
                        <p>{toPersianNumbersWithComma(p.price)}</p>
                      </div>
                    ))}
                  </td>
                  <td className="table__td px-2">
                    <p className="badge badge--primary">
                      %{toPersianNumbers(product.offValue)}
                    </p>
                  </td>
                  <td className="table__td px-2 rounded-l-full">
                    <div className="flex gap-2 items-center">
                      <Link
                        href={`/admin/products/${product.id}`}
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
                        onClick={() => removeProductHandler(product.id)}
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
