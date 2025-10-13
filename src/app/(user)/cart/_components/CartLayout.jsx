"use client";

import Table from "@/ui/Table";
import {
  toPersianNumbers,
  toPersianNumbersWithComma,
} from "@/utils/toPersianNumbers";
import { useState } from "react";
import { usePathname } from "next/navigation";
import TextField from "@/ui/TextField";
import TextAreaField from "@/ui/TextAreaField";
import RadioButton from "@/ui/RadioButton";
import {
  CheckIcon,
  ChevronDownIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import ImageFrame from "@/components/ImageFrame";
import CartSummery from "./CartSummery";
import CartOrders from "./CartOrders";
import PriceSection from "@/components/PriceSection";
import AdaptiveOverlayPage from "@/components/AdaptiveOverlayPage";

function CartLayout() {
  const pathName = usePathname();
  const [cartOpen, setCartOpen] = useState(false);
  const toggleCart = () => {
    setCartOpen((prevState) => !prevState);
  };

  if (pathName === "/cart" && cartOpen === false) {
    setCartOpen(true);
  }

  const [step, setStep] = useState(1);

  const renderSteps = () => {
    switch (step) {
      case 1:
        return <CartFirstStep />;

      case 2:
        return <CartSecondStep />;

      case 3:
        return <CartLastStep />;

      default:
        return null;
    }
  };

  return (
    <AdaptiveOverlayPage
      isOpen={cartOpen}
      onClick={toggleCart}
      label="سبد خرید"
      side="right"
      className="size-4"
    >
      <div className="flex items-center justify-center md:container md:mx-auto size-full h-[7.15rem] md:h-40 bg-grey md:rounded-b-3xl">
        <CardStepsIcon step={step} setStep={setStep} />
      </div>
      <div
        className={`${step === 3 ? "" : "md:flex-row"}
            flex flex-col items-start xl:items-start md:justify-between xl:justify-normal gap-5 mx-6 md:p-6 md:py-8 md:border-[1.5px] border-stroke md:rounded-[20px]`}
      >
        <>{renderSteps()}</>
        <CartSummery setStep={setStep} step={step} />
      </div>
    </AdaptiveOverlayPage>
  );
}

export default CartLayout;

function CardTitle({
  productValue,
  className,
  label1,
  label2,
  label3,
  dir = "rtl",
}) {
  return (
    <div
      className={`flex lg:justify-star gap-2 lg:gap-4 size-full ${className}`}
    >
      <div className="flex items-center justify-center gap-1 text-nowrap ">
        {dir === "rtl" ? (
          <h2 className="text-lg md:text-[1.38rem] text-text-primary font-bold">
            {label1}
          </h2>
        ) : (
          <p className="text-text-primary text-sm md:text-xl">{label1}</p>
        )}
        {dir === "rtl" ? (
          <p className="text-text-primary text-sm md:text-xl">{label2}</p>
        ) : (
          <h2 className="text-lg md:text-[1.38rem] text-text-primary font-bold">
            {label2}
          </h2>
        )}
      </div>
      <div className="badge badge--primary h-8 w-[5.75rem] text-sm text-nowrap">
        {toPersianNumbers(productValue)} {label3}
      </div>
    </div>
  );
}

function CardStepsIcon({ productValue, className, step, setStep }) {
  return (
    <div className="flex items-center justify-center max-sm:gap-1 sm:gap-4 size-full max-w-[50rem] px-10 h-[7.15rem] md:h-40">
      <button
        onClick={() => {
          step === 2 && setStep(1);
        }}
        className="flex flex-col items-center justify-center gap-2"
      >
        <div
          className={`flex flex-none items-center justify-center max-md:size-10 md:size-14 rounded-xl ${
            step === 1 ? "bg-text-primary" : "bg-text-primary/20"
          } `}
        >
          <ImageFrame
            src={`/images/bag-fill-level-${step === 1 ? "2" : "3"}-icon.svg`}
            alt="bag-fill-icon"
            className="size-6"
          />
        </div>
        <p className="text-xs md:text-base max-md:text-text-primary md:text-icon-brown font-semibold">
          سبد خرید
        </p>
      </button>
      <div className="grow flex items-center justify-start bg-secondary-2 max-md:h-[0.1875rem] md:h-1.5 rounded-2xl max-md:-translate-y-3 md:-translate-y-3.5">
        <div
          className={`max-md:bg-text-primary md:bg-icon-brown max-md:h-[0.1875rem] md:h-1.5 rounded-2xl ${
            step === 1 ? "w-3/4" : "w-full"
          }`}
        ></div>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 max-sm:max-w-16">
        <div
          className={`flex flex-none items-center justify-center max-md:size-10 md:size-14 rounded-xl ${
            step === 1
              ? "bg-white"
              : step === 2
              ? "bg-text-primary"
              : "bg-text-primary/20"
          } `}
        >
          <ImageFrame
            src={`/images/user-level-${
              step === 3 ? "3" : step === 2 ? "2" : "1"
            }-icon.svg`}
            alt="user-icon"
            className="size-6"
          />
        </div>
        <p className="text-xs md:text-base max-md:text-text-primary md:text-icon-brown font-semibold text-center max-sm:max-h-4">
          ثبت اطلاعات کاربری
        </p>
      </div>
      <div className="grow flex items-center justify-start bg-secondary-2 max-md:h-[0.1875rem] md:h-1.5 rounded-2xl max-md:-translate-y-3 md:-translate-y-3.5">
        <div
          className={`max-md:bg-text-primary md:bg-icon-brown max-md:h-[0.1875rem] md:h-1.5 rounded-2xl ${
            step === 3 ? "w-full" : step === 2 ? "w-3/4" : "w-0"
          }`}
        ></div>
      </div>
      <div className="flex flex-col items-center justify-center gap-2">
        <div
          className={`flex flex-none items-center justify-center max-md:size-10 md:size-14 rounded-xl ${
            step === 3 ? "bg-text-primary" : "bg-white"
          } `}
        >
          <ImageFrame
            src={`/images/checked-level-${step === 3 ? "2" : "1"}-icon.svg`}
            alt="checked-icon"
            className="size-6"
          />
        </div>
        <p className="text-xs md:text-base max-md:text-text-primary md:text-icon-brown font-semibold">
          تکمیل خرید
        </p>
      </div>
    </div>
  );
}

function MobileOrderCard() {
  return (
    <div className="max-lg:flex items-center justify-center flex-col gap-4 lg:hidden w-full">
      <CartOrders.Mobile />
      <CartOrders.Mobile />
      <CartOrders.Mobile />
      <CartOrders.Mobile />
    </div>
  );
}

function CartFirstStep() {
  return (
    <div className="flex flex-col md:items-center md:justify-between gap-5 size-full max-lg:*:first:hidden">
      <Table className="">
        <Table.Header className="*:pb-6">
          <th className="text-right">
            <CardTitle
              label1="سبد خرید"
              label2="شما"
              label3="محصول"
              productValue={3}
              className="lg:flex-col xl:flex-row items-center justify-center"
            />
          </th>
          <th className="max-xl:-translate-y-6">حجم</th>
          <th className="max-xl:-translate-y-6">تعداد</th>
          <th className="text-left max-xl:-translate-y-6">قیمت نهایی </th>
        </Table.Header>
        <Table.body>
          <CartOrders.Desk />
          <CartOrders.Desk />
          <CartOrders.Desk />
          {/* {orders.map((order, index) => (
            <CartOrderRow key={order._id} order={order} index={index} />
          ))} */}
        </Table.body>
      </Table>
      <CardTitle
        label1="سبد خرید"
        label2="شما"
        label3="محصول"
        productValue={3}
        className="justify-between lg:hidden"
      />
      <MobileOrderCard />
    </div>
  );
}

function CartSecondStep() {
  const [ordersOpen, setOrdersOpen] = useState(false);
  const toggleOrders = () => {
    setOrdersOpen((prevState) => !prevState);
  };
  return (
    <div className="flex flex-col gap-8 size-full">
      <div
        className={`max-md:flex md:hidden flex-col max-md:border-[1.5px] border-stroke rounded-[20px] w-full max-md:px-6 ${
          ordersOpen ? "justify-between" : "items-center justify-center"
        } transition-all duration-200`}
      >
        <button
          onClick={toggleOrders}
          className="flex items-center justify-between gap-4 size-full max-md:py-6"
        >
          <p className="text-base">نمایش سبد خرید شما</p>
          <ChevronDownIcon
            className={`size-4 ${ordersOpen && "rotate-180"} duration-200`}
          />
        </button>
        {ordersOpen && <MobileOrderCard />}
      </div>
      <div className="flex flex-col items-center justify-between gap-4 w-full h-full max-md:border-[1.5px] border-stroke rounded-[20px] max-md:p-6">
        <div className="flex items-center justify-start gap-1 text-text-primary border-b border-stroke w-full pb-4">
          <h2 className="max-md:text-lg md:text-[1.375rem]">اطلاعات کاربری</h2>
          <p className="max-md:text-sm md:text-xl">شما</p>
        </div>
        <form className="flex flex-col gap-6 w-full ">
          <div className="flex flex-col gap-6 w-full">
            <p className="max-md:text-sm md:text-base font-bold text-text-primary">
              اطلاعات تحویل گیرنده
            </p>
            <div className="flex flex-col lg:flex-row gap-4 w-full">
              <TextField
                isRequired
                label="نام و نام خانوادگی"
                name="fullName"
                className="w-full"
                placeholder="مثال : رضا جنیدی"
              />
              <TextField
                isRequired
                label="نام و نام خانوادگی"
                name="fullName"
                className="w-full"
                placeholder="مثال : رضا جنیدی"
              />
            </div>
          </div>
          <div className="flex flex-col gap-6 w-full">
            <span className="flex items-center justify-between w-full">
              <p className="max-md:text-sm md:text-base font-bold text-text-primary">
                آدرس تحویل
              </p>
              <button className="flex items-center justify-center gap-1">
                <PlusIcon className="size-4 text-primary" />
                <p className="text-primary text-xs font-bold">انتخاب آدرس</p>
              </button>
            </span>
            <div className="flex flex-col gap-4 w-full">
              <div className="flex flex-col lg:flex-row w-full gap-4">
                <TextField
                  isRequired
                  label="استان"
                  name="ostan"
                  className="w-full"
                  placeholder="انتخاب کنید"
                />
                <TextField
                  isRequired
                  label="شهر"
                  name="city"
                  className="w-full"
                  placeholder="انتخاب کنید"
                />
              </div>
              <div className="flex flex-col lg:flex-row w-full gap-4">
                <TextField
                  isRequired
                  label="پلاک"
                  name="No"
                  className="w-full"
                  placeholder=" مثال :۱۰"
                />
                <TextField
                  isRequired
                  label="کدپستی"
                  name="postCode"
                  className="w-full"
                  placeholder=" مثال : ۳۲۱۲۵۶۳۷۴۹۰"
                  type="number"
                />
              </div>
              <div className="max-md:h-28 md:h-32 w-full">
                <TextAreaField
                  isRequired
                  label="نشانی پستی"
                  name="address"
                  className="w-full h-full resize-none"
                  placeholder=" مثال : تهران، خیابان ولیعصر، منطقه ۱۲، بلوار کاوه، کوچه ابوذر، پلاک ۱۵"
                />
              </div>
            </div>
          </div>
        </form>
        <div className="w-full mt-14">
          <div className="size-full border-b border-stroke pb-4 mb-4">
            <CardTitle
              dir="ltr"
              label1="انتخاب"
              label2="نحوه ارسال"
              label3="محصول"
              productValue={3}
              className="justify-between "
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-4 w-full mb-6">
          <RadioButton
            id="tipax"
            name="post"
            value="tipax"
            className="flex items-center justify-between gap-4 w-full
             text-xs md:text-sm max-md:rounded-lg md:rounded-[40px]
             px-4 py-3 text-text-primary bg-grey has-checked:*:even:*:first:bg-primary
             has-checked:*:even:*:first:border-primary
             border-[1.5px] border-grey has-checked:border-primary has-checked:font-bold has-checked:bg-white
             duration-200"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center justify-center size-4 rounded-sm border-[1.25px] border-text-secondary/50 ">
                <CheckIcon className="size-2.5 text-grey" />
              </div>
              <p className="text-xs">
                تیپاکس با بیمه ({toPersianNumbers(1)} تا {toPersianNumbers(3)}{" "}
                روز کاری)
              </p>
            </div>
            <span className="flex items-center justify-between gap-1">
              <p className="text-base">{toPersianNumbersWithComma(80000)}</p>
              <p className="text-text-secondary-light text-xs">تومان</p>
            </span>
          </RadioButton>
          <RadioButton
            id="post"
            name="post"
            value="post"
            className="flex items-center justify-between gap-4 w-full
             text-xs md:text-sm max-md:rounded-lg md:rounded-[40px]
             px-4 py-3 text-text-primary bg-grey has-checked:*:even:*:first:bg-primary
             has-checked:*:even:*:first:border-primary
             border-[1.5px] border-grey has-checked:border-primary has-checked:font-bold has-checked:bg-white
             duration-200"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center justify-center size-4 rounded-sm border-[1.25px] border-text-secondary/50 ">
                <CheckIcon className="size-2.5 text-grey" />
              </div>
              <p className="text-xs">
                پست پیشتاز ({toPersianNumbers(2)} تا {toPersianNumbers(5)} روز
                کاری)
              </p>
            </div>
            <span className="flex items-center justify-between gap-1">
              <p className="text-base">{toPersianNumbersWithComma(45000)}</p>
              <p className="text-text-secondary-light text-xs">تومان</p>
            </span>
          </RadioButton>
        </div>
      </div>
    </div>
  );
}
function CartLastStep() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 size-full">
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between size-full">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-start gap-2 size-full">
          <ImageFrame
            src="/images/success-badge-icon.svg"
            alt="success-badge-icon"
            className="max-md:size-12 md:size-16"
          />
          <div className="flex flex-col items-center md:items-start justify-between gap-4 md:gap-2">
            <p className="md:text-lg font-bold">
              خرید شما با <strong className="text-success">موفقیت</strong> انجام
              شد
            </p>
            <p className="text-text-secondary">
              جهت دریافت جزئیات بیشتر، لطفاً ایمیل یا پیامک خود را بررسی کنید
            </p>
          </div>
        </div>
        <div className="md:flex flex-col items-start justify-between gap-2 max-md:hidden">
          <p className="text-text-secondary">مبلغ پرداختی</p>
          <PriceSection
            offPrice={1450000}
            offValue={0}
            price={1550000}
            priceClassName="text-3xl"
            textClassName="text-sm text-text-primary font-normal"
          />
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 flex-wrap bg-grey rounded-2xl py-4 px-6 w-full">
        <Table className="text-right max-sm:hidden">
          <Table.Header className="*:text-text-secondary-light *:font-normal">
            <th>کد سفارش شما</th>
            <th>تاریخ تراکنش</th>
            <th>تعداد سفارشات</th>
            <th>آدرس</th>
          </Table.Header>
          <Table.body>
            <Table.Row className="*:pt-2 *:text-text-primary">
              <td>#{toPersianNumbers(123456789)}</td>
              <td>25 اردیبهشت 1404</td>
              <td>{toPersianNumbers(3)} سفارش</td>
              <td>
                تهران، خیابان ولیعصر، منطقه ۱۲، بلوار کاوه، کوچه ابوذر، پلاک ۱۵
              </td>
            </Table.Row>
            {/* {orders.map((order, index) => (
            <CartOrderRow key={order._id} order={order} index={index} />
          ))} */}
          </Table.body>
        </Table>
        <Table className="sm:hidden *:*:*:odd:text-right *:*:*:even:text-left *:*:*:pt-6">
          <Table.body>
            <tr className="*:pt-0">
              <th className="text-text-secondary-light font-normal">
                کد سفارش شما
              </th>
              <td className="text-text-primary">
                #{toPersianNumbers(123456789)}
              </td>
            </tr>
          </Table.body>
          <Table.body>
            <tr>
              <th className="text-text-secondary-light font-normal">
                تاریخ تراکنش
              </th>
              <td className="text-text-primary">25 اردیبهشت 1404</td>
            </tr>
          </Table.body>
          <Table.body>
            <tr>
              <th className="text-text-secondary-light font-normal">
                تعداد سفارشات
              </th>
              <td className="text-text-primary">{toPersianNumbers(3)} سفارش</td>
            </tr>
          </Table.body>
          <Table.body>
            <tr>
              <th className="text-text-secondary-light font-normal">آدرس</th>
              <td className="text-text-primary">
                تهران، خیابان ولیعصر، منطقه ۱۲، بلوار کاوه، کوچه ابوذر، پلاک ۱۵
              </td>
            </tr>
          </Table.body>
        </Table>
      </div>
      <div className="flex flex-col md:flex-row md:flex-wrap items-center lg:items-start justify-center lg:justify-start gap-4 w-full ">
        <CartOrders.SuccessMobile />
        <CartOrders.SuccessMobile />
        <CartOrders.SuccessMobile />
        <CartOrders.SuccessDesk />
        <CartOrders.SuccessDesk />
        <CartOrders.SuccessDesk />
      </div>
    </div>
  );
}
