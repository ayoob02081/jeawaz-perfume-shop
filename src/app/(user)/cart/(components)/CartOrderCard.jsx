import CartEvents from "@/components/CartEvents";
import ImageFrame from "@/components/ImageFrame";
import PriceSection from "@/components/PriceSection";
import { toPersianNumbers } from "@/utils/toPersianNumbers";

function CartOrderCard() {
  return (
    <div className="flex items-center justify-center p-3 gap-4 border border-stroke rounded-2xl w-full ">
      <div className="flex items-center justify-start gap-4 size-full">
        <div className="flex items-start justify-center h-full">
          <ImageFrame
            src="/images/perfume2.svg"
            alt="perfume"
            className="size-16"
          />
        </div>
        <div className="flex flex-col gap-3 size-full">
          <div className="flex items-start justify-between size-full flex-col gap-1">
            <p className="text-text-secondary text-xs">logo</p>
            <span className="text-text-primary text-base font-bold">
              Hugo Just Different
            </span>
            <span className="text-text-primary text-sm font-semibold">
              هوگو بوس جاست دیفرنت
            </span>
          </div>
          <div className="badge badge--secondary w-max h-6">{toPersianNumbers(100)} میل</div>
          <div className="flex items-center justify-between size-full">
            <div>
              <PriceSection offPrice={1450000} offValue={40} price={1550000} />
            </div>
            <div className="flex items-center justify-center">
              <CartEvents BtnBackgroundColor="bg-grey" strokeColor="stroke" className="lg:*:*:size-5 *:*:size-4"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartOrderCard;
