import GoBack from "@/ui/GoBack";
import ImageFrame from "@/components/ImageFrame";
import {
  toPersianNumbers,
  toPersianNumbersWithComma,
} from "@/utils/toPersianNumbers";
import CartOrders from "./CartOrders";

function CartSummery({ items, date, totalPrice, setStep, step }) {
  const renderSteps = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex items-center justify-center size-full max-md:mx-auto max-md:max-w-[22rem] md:max-w-[23rem]">
            <CartSummeryAccept
              items={items}
              totalPrice={totalPrice}
              date={date}
              step={step}
              setStep={setStep}
            />
          </div>
        );

      case 2:
        return (
          <div className="flex items-center justify-center size-full md:max-w-max">
            <CartSummeryPay
              items={items}
              totalPrice={totalPrice}
              date={date}
              step={step}
              setStep={setStep}
            />
            <div className="size-full max-md:flex md:hidden items-center justify-between gap-4">
              <button
                onClick={() => setStep(1)}
                className="btn btn--secondary--2 size-full py-2 max-sm:max-w-1/3"
              >
                مرحله قبل
              </button>
              <CartSummeryBtn step={step} setStep={setStep} />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="flex max-md:flex-col items-center justify-between gap-4 size-full max-md:px-6">
            <button
              onClick={() => setStep(3)}
              className="btn btn--primary--2 border size-full py-2 md:max-w-60"
            >
              دریافت فاکتور
            </button>
            <div className="btn btn--secondary--2 size-full py-2 duration-200 md:max-w-60">
              <GoBack side="left" label="بازگشت به سایت" className="size-4" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return <>{renderSteps()}</>;
}

export default CartSummery;

function CartSummeryAccept({ items, date, totalPrice, step, setStep }) {
  return (
    <div className="flex flex-col items-start justify-between gap-6 max-md:bg-secondary md:bg-grey p-4 rounded-xl size-full">
      <div className="flex items-center justify-start gap-4 size-full">
        <div className="flex items-center justify-center size-14 rounded-xl bg-white">
          <ImageFrame
            src="/images/cart-order-icon.svg"
            alt="cart order icon"
            className="size-7"
          />
        </div>
        <span className="flex flex-col items-start justify-between gap-2">
          <p className="font-semibold text-text">پرداخت سفارش</p>
          <p className="text-xs text-text-secondary-light">
            متن کوتاهی در این بخش قرار میگیرد
          </p>
        </span>
      </div>
      <div className="flex flex-col items-start justify-between gap-4 size-full border-t-[1.5px] border-dashed border-text-secondary-light pt-3">
        <div className="flex items-center gap-2">
          <ImageFrame
            src="/images/percent-badge-icon.svg"
            alt="percent badge icon"
            className="size-6"
          />
          <span className="text-sm">اگر کد تخفیف دارید وارد کنید</span>
        </div>
        <div className="size-full">
          <label
            htmlFor=""
            className="flex items-center justify-between siz-full bg-white py-2 px-2 rounded-xl"
          >
            <input
              type="text"
              name=""
              id=""
              // value={value}
              className="size-full outline-0"
              placeholder="کد تخفیف را وارد کنید"
            />
            <button className="text-nowrap text-primary text-sm">
              اعمال کد
            </button>
          </label>
        </div>
      </div>
      <div className="flex flex-col items-center justify-between gap-4 size-full border-t max-md:border-stroke md:border-stroke-2 pt-3">
        <span className="flex items-center justify-between size-full">
          <p className="text-sm">تعداد محصولات</p>
          <div className="flex items-center gap-1">
            <p className="text-sm">
              {toPersianNumbers((items && items?.length) || 0)}
            </p>
            <p className="text-xs text-text-secondary-light">محصول</p>
          </div>
        </span>
        <span className="flex items-center justify-between size-full">
          <p className="text-sm">سود شما از این خرید</p>
          <div className="flex items-center gap-1">
            <p className="text-sm">{toPersianNumbersWithComma(100000)}</p>
            <p className="text-xs text-text-secondary-light">تومان</p>
          </div>
        </span>
      </div>
      <div className="flex flex-col items-center justify-between gap-4 size-full border-t max-md:border-stroke md:border-stroke-2 pt-3">
        <span className="flex items-center justify-between size-full">
          <p className="text-sm">مجموع سبد خرید</p>
          <div className="flex items-center gap-1">
            <p className="text-lg font-bold">
              {toPersianNumbersWithComma(totalPrice && totalPrice)}
            </p>
            <p className="text-xs text-text-secondary-light">تومان</p>
          </div>
        </span>
        <CartSummeryBtn step={step} setStep={setStep} />
      </div>
    </div>
  );
}
function CartSummeryPay({ items, date, totalPrice, step, setStep }) {
  return (
    <div className="max-md:hidden md:flex flex-col items-center justify-between gap-4 max-md:bg-secondary md:bg-grey p-4 rounded-xl ">
      <span className="flex items-center justify-start gap-1 size-full text-text-primary">
        <p className="text-[1.375rem] font-bold">اطلاعات</p>
        <p className="text-lg">خرید</p>
      </span>
      <div className="flex flex-col items-center justify-between size-full overflow-x-auto">
        {items?.map((item) => (
          <CartOrders.Summery
            key={item.id}
            src={item.src}
            alt={item.alt}
            enTitle={item.enTitle}
            perTitle={item.perTitle}
            price={item.price}
            offValue={item.offValue}
          />
        ))}
      </div>
      <div className="flex flex-col items-center justify-between gap-4 size-full p-4 bg-white rounded-xl">
        <span className="flex items-center justify-between size-full">
          <p className="text-sm"> سود خرید شما:</p>
          <div className="flex items-center gap-1">
            <p className="text-sm">{toPersianNumbersWithComma(1450000)}</p>
            <p className="text-xs text-text-secondary-light">تومان</p>
          </div>
        </span>
        <span className="flex items-center justify-between size-full">
          <p className="text-sm">هزینه ارسال:</p>
          <div className="flex items-center gap-1">
            <p className="text-sm">{toPersianNumbersWithComma(80000)}</p>
            <p className="text-xs text-text-secondary-light">تومان</p>
          </div>
        </span>
        <span className="flex items-center justify-between size-full border-t md:border-stroke-3 pt-3">
          <p className="text-sm">مبلغ قابل پرداخت:</p>
          <div className="flex items-center gap-1">
            <p className="text-lg font-bold">
              {toPersianNumbersWithComma(totalPrice && totalPrice)}
            </p>
            <p className="text-xs text-text-secondary-light">تومان</p>
          </div>
        </span>
      </div>
      <div className="flex items-center justify-start gap-4 size-full p-4 bg-white rounded-xl">
        <div className="size-12 flex items-center justify-center">
          <ImageFrame
            src="/images/zarinpal-icon.svg"
            alt="zarinpal icon"
            className="size-12"
          />
        </div>
        <span className="text-xs text-text-primary w-full flex items-center justify-start gap-1">
          <p>
            پرداخت امن با کارت‌های عضو شتاب از طریق{" "}
            <strong className="font-bold">درگاه زیبال</strong>
          </p>
        </span>
      </div>
      <CartSummeryBtn step={step} setStep={setStep} />
    </div>
  );
}

function CartSummeryBtn({ step, setStep }) {
  return (
    <>
      {step === 1 && (
        <button
          onClick={() => setStep(2)}
          className="btn btn--success size-full py-2"
        >
          تایید و تکمیل سفارش
        </button>
      )}
      {step === 2 && (
        <button
          onClick={() => setStep(3)}
          className="btn btn--primary border hover:bg-white active:bg-white size-full py-2"
        >
          پرداخت و خرید محصول
        </button>
      )}
    </>
  );
}
