import AppImage from "@/components/AppImage";
import {
  toPersianNumbers,
  toPersianNumbersWithComma,
} from "@/utils/toPersianNumbers";
import CartItemsLayout from "./CartItemsLayout";
import Loading from "@/components/Loading";

export function OrderSummaryCard({
  cart,
  date,
  totalPrice,
  step,
  setStep,
}) {
  const { itemsTotal = 0, discountAmount = 0, totalProducts = 0 } = cart;
  return (
    <div className="flex flex-col items-start justify-between gap-6 max-md:bg-stroke-150 md:bg-stroke-100 p-4 rounded-xl size-full">
      <div className="flex items-center justify-start gap-4 size-full">
        <div className="flex items-center justify-center size-14 rounded-xl bg-stroke-0 dark:bg-stroke-800/50">
          <AppImage
            src="/images/cart-order-icon.svg"
            alt="cart-order-icon"
            width="size-7"
            sizes="10vw"
          />
        </div>
        <span className="flex flex-col items-start justify-between gap-2">
          <p className="font-semibold text-stroke-800">پرداخت سفارش</p>
          {/* <p className="text-xs text-stroke-400">
            متن کوتاهی در این بخش قرار میگیرد
          </p> */}
        </span>
      </div>
      <div className="flex flex-col items-start justify-between gap-4 size-full border-t-[1.5px] border-dashed border-stroke-400 pt-3">
        <div className="flex items-center gap-2">
          <AppImage
            src="/images/percent-badge-icon.svg"
            alt="percent-badge-icon"
            width="size-6"
            sizes="10vw"
          />
          <span className="text-sm text-stroke-800">
            اگر کد تخفیف دارید وارد کنید
          </span>
        </div>
        <div className="size-full">
          <label
            htmlFor=""
            className="flex items-center justify-between bg-stroke-0 p-2 rounded-xl"
          >
            <input
              type="text"
              name=""
              id=""
              // value={value}
              className="size-full outline-0 text-stroke-800"
              placeholder="کد تخفیف را وارد کنید"
            />
            <button className="text-nowrap text-primary text-sm">
              اعمال کد
            </button>
          </label>
        </div>
      </div>
      <div className="flex flex-col items-center justify-between gap-4 size-full border-t max-md:border-stroke-200 md:border-stroke-250 pt-3">
        <Details textStyle="text-sm" title="تعداد محصولات" des="محصول">
          {toPersianNumbers(totalProducts)}
        </Details>
        <Details textStyle="text-sm" title="سود شما از این خرید" des="تومان">
          {toPersianNumbersWithComma(discountAmount)}
        </Details>
      </div>
      <div className="flex flex-col items-center justify-between gap-4 size-full border-t max-md:border-stroke-200 md:border-stroke-250 pt-3">
        <Details
          textStyle="text-lg font-bold"
          className="max-md:items-center max-md:h-fit"
          title="مجموع سبد خرید"
          des="تومان"
        >
          {toPersianNumbersWithComma(itemsTotal)}
        </Details>
      </div>
      <div className="max-md:sticky bottom-9 flex items-center justify-center w-full">
        <button
          type="submit"
          onClick={() => setStep(2)}
          className=" h-12 btn btn--success size-full py-2 "
        >
          تایید و تکمیل سفارش
        </button>
      </div>
    </div>
  );
}
export function CheckoutCartSummery({ cart, post, setStep, isPending }) {
  const {
    totalPriceBeforeDiscount = 0,
    shippingMethod = null,
    shippingCost = 0,
    payableTotal = 0,
    discountAmount = 0,
  } = cart;

  return (
    <div className="max-md:hidden md:flex flex-col items-center justify-between gap-4 max-md:bg-stroke-150 md:bg-stroke-100 p-4 rounded-xl w-full h-full">
      <span className="flex items-center justify-start gap-1 size-full text-stroke-800">
        <p className="text-[22px] font-bold">اطلاعات</p>
        <p className="text-lg">خرید</p>
      </span>
      <div className="flex flex-col items-center justify-between size-full max-lg:hidden">
        {cart?.items.map((item) => (
          <CartItemsLayout.Summery key={item.id} cartItem={item} />
        ))}
      </div>
      <div className="flex flex-col items-center justify-between gap-4 size-full p-4 bg-stroke-0 rounded-xl">
        <Details textStyle="text-sm" title="سود خرید شما:" des="تومان">
          {toPersianNumbersWithComma(discountAmount)}
        </Details>
        <Details textStyle="text-sm" title="هزینه ارسال:" des="تومان">
          {toPersianNumbersWithComma(post)}
        </Details>
        <Details
          className="border-t md:border-stroke-300 pt-3"
          textStyle="text-lg font-bold"
          title="مبلغ قابل پرداخت:"
          des="تومان"
        >
          {toPersianNumbersWithComma(payableTotal)}
        </Details>
      </div>
      <div className="flex items-center justify-start gap-4 size-full p-4 bg-stroke-0 rounded-xl">
        <div className="size-12 flex items-center justify-center">
          <AppImage
            src="/images/zarinpal-icon.svg"
            alt="zarinpal-icon"
            width="size-12"
            sizes="20vw"
          />
        </div>
        <span className="text-xs text-stroke-800 w-full flex items-center justify-start gap-1">
          <p className="">
            پرداخت امن با کارت‌های عضو شتاب از طریق{" "}
            <strong className="font-bold">درگاه زیبال</strong>
          </p>
        </span>
      </div>
      <div className="size-full flex items-center justify-between gap-4">
        <button
          onClick={() => setStep(1)}
          className="btn btn--secondary--2 bg-stroke-0 size-full py-2 max-sm:max-w-1/3"
        >
          مرحله قبل
        </button>
        <button
          type="submit"
          className="btn btn--primary border hover:bg-stroke-0 active:bg-stroke-0 size-full py-2"
        >
          پرداخت و خرید محصول
        </button>
      </div>
    </div>
  );
}

function Details({ title, des, children, className, textStyle }) {
  return (
    <span
      className={`flex items-center justify-between size-full ${className}`}
    >
      <p className="text-sm text-stroke-800">{title}</p>
      <div className="flex items-center gap-1">
        <p className={`${textStyle} text-stroke-800`}>{children}</p>
        <p className="text-xs text-stroke-400 ">{des}</p>
      </div>
    </span>
  );
}
