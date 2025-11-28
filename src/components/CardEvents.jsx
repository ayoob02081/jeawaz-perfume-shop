"use client";

// import Loading from "@/components/Loading";
// import { useAddToCart, useRemoveFromCart } from "@/hooks/useCardEvents";
// import { useGetUser } from "@/hooks/useAuth";
import { MinusIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
// import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
// import toast from "react-hot-toast";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { useGetUser } from "@/hooks/useUsers";

function CardEvents({
  product,
  className,
  btnStyle = "max-lg:size-8 lg:size-12",
  quantityStyle = "max-lg:size-8 lg:size-12 max-lg:text-xs lg:text-lg",
}) {
  //   const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const { data } = useGetUser();
  //   const { isPending: isAdding, mutateAsync: AddToCartFn } = useAddToCart();
  //   const { isPending, mutateAsync: RemoveFromCart } = useRemoveFromCart();
  //   const { user } = data || {};

  //   const AddToCartHandler = async () => {
  //     if (!user) {
  //       router.push("/auth");
  //       toast.error("Please Loggin!!");
  //       return;
  //     }
  //     try {
  //       const { message } = await AddToCartFn(product._id);
  //       toast.success(message);
  //       queryClient.invalidateQueries({ queryKey: ["get-user"] });
  //     } catch (error) {
  //       console.log(error);
  //       toast.error(error.response.data.message);
  //     }
  //   };
  //   const RemoveFromCartHandler = async () => {
  //     if (!user) {
  //       router.push("/auth");
  //       toast.error("Please Loggin!!");
  //       return;
  //     }
  //     try {
  //       const { message } = await RemoveFromCart(product._id);
  //       toast.success(message);
  //       queryClient.invalidateQueries({ queryKey: ["get-user"] });
  //     } catch (error) {
  //       console.log(error);
  //       toast.error(error.response.data.message);
  //     }
  //   };
  //   const isInCart = (product, user) => {
  //     if (!user) return false;
  //     return user?.cart?.products.some((p) => p.productId === product._id);
  //   };
  const quantityCount = (user, product) => {
    // if (!user) return false;
    // const singleProduct = user?.cart?.products.filter(
    //   (p) => p.productId === product._id
    // );
    // const singleProduct = user?.cart?.products.filter(
    //   (p) => p.productId === product._id
    // );
    // return singleProduct[0].quantity;
  };

  return (
    <div className="flex w-full items-center justify-center gap-4">
      {/* {isInCart(product, user) ? ( */}
      <div
        className={`${className} flex items-center gap-2 justify-between text-text-primary 
            `}
        //     ${
        //     !isInCart(product, user)
        //       ? "shadow-lg shadow-secondary-300"
        //       : "border-2 border-primary-800"
        //   }
      >
        <button
          // onClick={AddToCartHandler}

          className={` btn-card-event btn-card-event--success ${btnStyle}`}
          // className={`cardEventsBtn  hover:bg-success active:bg-success text-text-primary hover:text-white active:text-white`}
        >
          <PlusIcon className="max-md:size-3.5 size-6" />
        </button>
        <span
          className={`btn-card-event border-[1.5px] border-stroke-3 rounded-full ${quantityStyle}`}
        >
          {toPersianNumbers(1)}
        </span>
        <button
          // onClick={RemoveFromCartHandler}
          // className={`cardEventsBtn  hover:bg-error active:bg-error text-error hover:text-white active:text-white`}
          className={`btn-card-event btn-card-event--error ${btnStyle}`}
        >
          {/* {quantityCount(user, product) > 1 ? ( */}
          {/* <MinusIcon className="max-md:size-3.5 size-6" /> */}
          {/* ) : ( */}
          <TrashIcon className="max-md:size-3.5 size-6" />
          {/* )} */}
        </button>
      </div>
      {/* ) : ( */}
      {/* <div className="w-full">
        {isAdding ? (
            <Loading />
          ) : (
        <button
            onClick={AddToCartHandler}
          className="btn btn--primary py-3 px-2 w-full border"
        >
          اضافه کردن محصول
        </button>
        )}
      </div>
      )   }
      {isInCart(product, user) && pathname !== "/cart" ? (
      <div className=" hover:bg-primary-800 bg-primary-900 px-4 rounded-xl text-white duration-300 font-bold py-3">
        <Link href={"/cart"}>ادامه سفارش</Link>
      </div>
      ) : null} */}
    </div>
  );
}

export default CardEvents;
