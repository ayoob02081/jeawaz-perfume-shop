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
  CheckCircleIcon,
  CheckIcon,
  PlusIcon,
  ShoppingBagIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {
  ShoppingBagIcon as ShoppingBagSolidIcon,
  CheckCircleIcon as CheckCircleSolidIcon,
  UserIcon as UserSolidIcon,
} from "@heroicons/react/24/solid";
import AppImage from "@/components/AppImage";
import CartSummery from "./CartSummery";
import PriceSection from "@/components/PriceSection";
import AdaptiveOverlayPage from "@/components/AdaptiveOverlayPage";
import Loading from "@/components/Loading";
import Accordion from "@/ui/Accordion";
import { useGetAllCartItems } from "@/hooks/useCart";
import CartItemsLayout from "./CartItemsLayout";
import Link from "next/link";

const postOptions = [
  {
    id: 1,
    value: "post",
    title: "پست پیشتاز(۲ تا ۴ روز کاری)",
    price: 50000,
  },
  {
    id: 2,
    value: "tipax",
    title: "تیپاکس با بیمه(۱ تا ۳ روز کاری)",
    price: 80000,
  },
  { id: 3, value: "terminal", title: "باربری و ترمینال(۲۴ ساعته)", price: 0 },
];

function CartLayout() {
  const pathName = usePathname();
  const [cartOpen, setCartOpen] = useState(false);
  const [post, setPost] = useState(0);
  const { data: cartItems = [], isLoading } = useGetAllCartItems();

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
        return <AcceptCart cartItems={cartItems} />;

      case 2:
        return <Checkout cartItems={cartItems} post={post} setPost={setPost} />;

      case 3:
        return <PaymentResault cartItems={cartItems} post={post} />;

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
      overflow="overflow-y-auto"
    >
      {cartItems?.totalProducts === 0 ? (
        <div className="flex items-center justify-center max-md:h-screen md:h-92 w-full">
          <span className="flex flex-col items-center justify-center max-md:gap-4 md:gap-6 text-stroke-800">
            <p className="font-bol max-md:text-xl md:text-2xl text-stroke-600">
              سبد خرید شما خالی است!
            </p>
            <Link
              href="/products"
              className="btn btn--primary px-3 py-1.5 max-md:text-sm "
            >
              صفحه محصولات
            </Link>
          </span>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center md:container md:mx-auto size-full h-[7.15rem] md:h-40 bg-stroke-100 md:rounded-3xl duration-200">
            <CartStepsIcon step={step} setStep={setStep} />
          </div>
          {isLoading ? (
            <Loading />
          ) : (
            <div className="px-6">
              <div
                className={`${step !== 3 && "md:flex-row"}
          flex flex-col items-start xl:items-start md:justify-between xl:justify-normal gap-5 px-6 md:p-6 md:py-8 md:border-[1.5px] border-stroke-200 md:rounded-2.5xl size-full duration-200`}
              >
                <>{renderSteps()}</>
                {
                  <CartSummery
                    cartItems={cartItems}
                    setStep={setStep}
                    step={step}
                    post={post}
                  />
                }
              </div>
            </div>
          )}
        </>
      )}
    </AdaptiveOverlayPage>
  );
}

export default CartLayout;

function Title({ productValue, className, titleOne, titleTwo, dir = "rtl" }) {
  return (
    <div
      className={`flex lg:justify-star gap-2 lg:gap-4 size-full ${className}`}
    >
      <div className="flex items-center justify-center gap-1 text-nowrap ">
        {dir === "rtl" ? (
          <h2 className="text-lg md:text-[22px] text-stroke-800 font-bold">
            {titleOne}
          </h2>
        ) : (
          <p className="text-stroke-800 text-sm md:text-xl">{titleOne}</p>
        )}
        {dir === "rtl" ? (
          <p className="text-stroke-800 text-sm md:text-xl">{titleTwo}</p>
        ) : (
          <h2 className="text-lg md:text-[22px] text-stroke-800 font-bold">
            {titleTwo}
          </h2>
        )}
      </div>
      <div className="badge badge--primary h-8 w-[5.75rem] text-sm text-nowrap">
        {toPersianNumbers(productValue)} محصول
      </div>
    </div>
  );
}

function CartStepsIcon({ productValue, className, step, setStep }) {
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
            step === 1 ? "bg-stroke-800" : "bg-stroke-800/20"
          } `}
        >
          {step === 1 ? (
            <ShoppingBagIcon className="size-6 text-stroke-0" />
          ) : (
            <ShoppingBagSolidIcon className="size-6 text-stroke-800" />
          )}
        </div>
        <p className="text-xs md:text-base max-md:text-stroke-800 md:text-stroke-900 dark:md:text-stroke-800 font-semibold">
          سبد خرید
        </p>
      </button>
      <div className="grow flex items-center justify-start bg-stroke-0 max-md:h-[3px] md:h-1.5 rounded-2xl max-md:-translate-y-3 md:-translate-y-3.5">
        <div
          className={`max-md:bg-stroke-800 md:bg-stroke-900 dark:md:bg-stroke-800 max-md:h-[3px] md:h-1.5 rounded-2xl ${
            step === 1 ? "w-3/4" : "w-full"
          }`}
        ></div>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 max-sm:max-w-16">
        <div
          className={`flex flex-none items-center justify-center max-md:size-10 md:size-14 rounded-xl ${
            step === 1
              ? "bg-stroke-0"
              : step === 2
                ? "bg-stroke-800"
                : "bg-stroke-800/20"
          } `}
        >
          {step === 3 ? (
            <UserSolidIcon className="size-6 text-stroke-800" />
          ) : step === 2 ? (
            <UserIcon className="size-6 text-stroke-0" />
          ) : (
            <UserIcon className="size-6 text-stroke-500 dark:text-stroke-400" />
          )}
        </div>
        <p
          className={`text-xs md:text-base max-md:text-stroke-800 md:text-stroke-900 dark:md:text-stroke-800 font-semibold text-center max-sm:max-h-4 ${
            step === 1 && "opacity-50 dark:opacity-30"
          } `}
        >
          ثبت اطلاعات کاربری
        </p>
      </div>
      <div className="grow flex items-center justify-start bg-stroke-0 max-md:h-[3px] md:h-1.5 rounded-2xl max-md:-translate-y-3 md:-translate-y-3.5">
        <div
          className={`max-md:bg-stroke-800 md:bg-stroke-900 dark:md:bg-stroke-800 max-md:h-[3px] md:h-1.5 rounded-2xl ${
            step === 3 ? "w-full" : step === 2 ? "w-3/4" : "w-0"
          }`}
        ></div>
      </div>
      <div className="flex flex-col items-center justify-center gap-2">
        <div
          className={`flex flex-none items-center justify-center max-md:size-10 md:size-14 rounded-xl ${
            step === 3 ? "bg-stroke-800" : "bg-stroke-0"
          } `}
        >
          {step === 3 ? (
            <CheckCircleSolidIcon className="size-7 text-stroke-0 " />
          ) : (
            <CheckCircleIcon className="size-6 text-stroke-500 dark:text-stroke-400" />
          )}
        </div>
        <p
          className={`text-xs md:text-base max-md:text-stroke-800 md:text-stroke-900 dark:md:text-stroke-800 font-semibold ${
            step !== 3 && "opacity-50 dark:opacity-30"
          } `}
        >
          تکمیل خرید
        </p>
      </div>
    </div>
  );
}

function CartMobaileLayout({ cartItems }) {
  return (
    <div className="max-lg:flex items-center justify-center flex-col gap-4 lg:hidden w-full">
      {cartItems?.items.map((item) => (
        <CartItemsLayout.Mobile key={item.id} cartItem={item} />
      ))}
    </div>
  );
}

function AcceptCart({ cartItems }) {
  const { totalProducts = 0 } = cartItems;

  return (
    <div className="flex flex-col md:items-center md:justify-between gap-5 size-full max-lg:*:first:hidden">
      <Table className="">
        <Table.Header className="*:pb-6">
          <th className="text-right px-2">
            <Title
              titleOne="سبد خرید"
              titleTwo="شما"
              productValue={totalProducts}
              className="lg:flex-co xl: flex-row items-center justify-start"
            />
          </th>
          <th className="px-2 text-stroke-800 text-nowrap">حجم و نوع</th>
          <th className="px-2 text-stroke-800">تعداد</th>
          <th className="text-left px-2 text-stroke-800">قیمت نهایی</th>
        </Table.Header>
        <Table.body>
          {cartItems?.items.map((item) => (
            <CartItemsLayout.Desktop key={item.id} cartItem={item} />
          ))}
        </Table.body>
      </Table>
      <Title
        titleOne="سبد خرید"
        titleTwo="شما"
        productValue={totalProducts}
        className="justify-between lg:hidden"
      />
      <CartMobaileLayout cartItems={cartItems} />
    </div>
  );
}

function Checkout({ cartItems, date, setPost, post }) {
  const { totalProducts = 0 } = cartItems;

  return (
    <div className="flex flex-col gap-8 size-full">
      <Accordion
        titleStyle="text-stroke-800"
        className="max-md:flex md:hidden w-full"
        label="نمایش سبد خرید شما"
      >
        <CartMobaileLayout cartItems={cartItems} />
      </Accordion>
      <div className="flex flex-col items-center justify-between gap-4 size-full max-md:border-[1.5px] border-stroke-200 rounded-2.5xl max-md:p-6">
        <div className="flex items-center justify-start gap-1 text-stroke-800 border-b border-stroke-200 w-full pb-4">
          <h2 className="max-md:text-lg md:text-[1.375rem]">اطلاعات کاربری</h2>
          <p className="max-md:text-sm md:text-xl">شما</p>
        </div>
        <form className="flex flex-col gap-6 w-full ">
          <div className="flex flex-col gap-6 w-full">
            <p className="max-md:text-sm md:text-base font-bold text-stroke-800">
              اطلاعات تحویل گیرنده
            </p>
            <div className="flex flex-col lg:flex-row gap-4 w-full">
              <TextField
                isRequired
                label="نام و نام خانوادگی"
                name="fullName"
                className="textField__input w-full"
                placeholder="مثال : رضا جنیدی"
              />
              <TextField
                isRequired
                label="نام و نام خانوادگی"
                name="fullName"
                className="textField__input w-full"
                placeholder="مثال : رضا جنیدی"
              />
            </div>
          </div>
          <div className="flex flex-col gap-6 w-full">
            <span className="flex items-center justify-between w-full">
              <p className="max-md:text-sm md:text-base font-bold text-stroke-800">
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
                  className="textField__input w-full"
                  placeholder="انتخاب کنید"
                />
                <TextField
                  isRequired
                  label="شهر"
                  name="city"
                  className="textField__input w-full"
                  placeholder="انتخاب کنید"
                />
              </div>
              <div className="flex flex-col lg:flex-row w-full gap-4">
                <TextField
                  isRequired
                  label="پلاک"
                  name="No"
                  className="textField__input w-full"
                  placeholder=" مثال :۱۰"
                />
                <TextField
                  isRequired
                  label="کدپستی"
                  name="postCode"
                  className="textField__input w-full"
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
          <div className="size-full border-b border-stroke-200 pb-4 mb-4">
            <Title
              dir="ltr"
              titleOne="انتخاب"
              titleTwo="نحوه ارسال"
              productValue={totalProducts}
              className="justify-between "
            />
          </div>
        </div>
        <div className="flex items-center flex-wrap gap-4 w-full mb-6">
          {postOptions.map((item) => (
            <SendOptoins
              key={item.id}
              item={item}
              setPost={setPost}
              post={post}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SendOptoins({ item, setPost, post }) {
  const { value, title, price } = item;
  return (
    <RadioButton
      onChange={() => setPost(price)}
      checked={post === price}
      id={value}
      name="post"
      value={value}
      className="flex items-center justify-between gap-4 w-full lg:w-fit
             text-xs md:text-sm max-md:rounded-lg md:rounded-5xl
             px-4 py-3 text-stroke-800 bg-stroke-100 has-checked:*:even:*:first:bg-primary
             has-checked:*:even:*:first:border-primary
             border-[1.5px] border-stroke-100 has-checked:border-primary has-checked:font-bold has-checked:bg-stroke-0
              duration-200"
    >
      <div className="flex items-center justify-between gap-2 overflow-hidden">
        <div className="flex items-center justify-center size-4 aspect-square rounded-sm border-[1.25px] border-stroke-600/50 ">
          <CheckIcon className="size-2.5 stroke-4 text-stroke-100 checked:text-success" />
        </div>
        <p className="text-xs text-nowrap whitespace-nowrap overflow-auto w-full py-0.5">
          {title}
        </p>
      </div>
      <span className="flex items-center justify-between gap-1">
        {value === "terminal" ? (
          <p className="text-sm text-nowrap">پس کرایه</p>
        ) : (
          <>
            <p className="text-base">{toPersianNumbersWithComma(price)}</p>
            <p className="text-stroke-400 text-xs">تومان</p>
          </>
        )}
      </span>
    </RadioButton>
  );
}
function PaymentResault({ cartItems, date, totalPrice }) {
  const {
    totalPriceBeforeDiscount = 0,
    shippingMethod = null,
    shippingCost = 0,
    payableTotal = 0,
    discountAmount = 0,
    totalProducts = 0,
  } = cartItems;
  return (
    <div className="flex flex-col items-center justify-center gap-6 size-full">
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between size-full">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-start gap-2 size-full">
          <AppImage
            src="/images/success-badge-icon.svg"
            alt="success-badge-icon"
            width="max-md:size-12 md:size-16"
            sizes="30vw"
          />
          <div className="flex flex-col items-center md:items-start justify-between gap-4 md:gap-2 text-stroke-800">
            <p className="md:text-lg font-bold">
              خرید شما با <strong className="text-success">موفقیت</strong> انجام
              شد
            </p>
            <p className="text-stroke-600">
              جهت دریافت جزئیات بیشتر، لطفاً ایمیل یا پیامک خود را بررسی کنید
            </p>
          </div>
        </div>
        <div className="md:flex flex-col items-start justify-between gap-2 max-md:hidden">
          <p className="text-stroke-600">مبلغ پرداختی</p>
          <PriceSection
            offValue={0}
            basePrice={payableTotal}
            unitPrice={payableTotal}
            priceClassName="text-3xl"
            textClassName="text-sm text-stroke-800 font-normal"
          />
        </div>
      </div>
      <div className="flex items-center justify-start overflow-auto gap-4 flex-wrap bg-stroke-100 rounded-2xl py-4 px-6 w-full scrollbar--primary scrollbar-h-1 duration-200">
        <Table className="text-right max-sm:hidden">
          <Table.Header className="*:text-stroke-400 *:font-normal w-full h-fit">
            <th className="pl-2 truncate">کد سفارش شما</th>
            <th className="px-2 truncate">تاریخ تراکنش</th>
            <th className="px-2 truncate">تعداد سفارشات</th>
            <th className="pr-2 truncate">آدرس</th>
          </Table.Header>
          <Table.body>
            <Table.Row className="*:pt-2 *:text-stroke-800 w-full h-fit">
              <td className="pl-2 whitespace-nowrap text-ellipsis w-full">
                #{toPersianNumbers(123456789)}
              </td>
              <td className="px-2 whitespace-nowrap text-ellipsis w-full">
                25 اردیبهشت 1404
              </td>
              <td className="px-2 whitespace-nowrap text-ellipsis w-full">
                {toPersianNumbers(totalProducts)} سفارش
              </td>
              <td className="pr-2 whitespace-nowrap overflow-x-auto w-full py-0.5">
                تهران، خیابان ولیعصر، منطقه ۱۲، بلوار کاوه، کوچه ابوذر، پلاک ۱۵
              </td>
            </Table.Row>
          </Table.body>
        </Table>
        <Table className="sm:hidden *:*:*:odd:text-right *:*:*:even:text-left *:*:*:pt-6">
          <Table.body>
            <tr className="*:pt-0">
              <th className="text-stroke-400 font-normal">کد سفارش شما</th>
              <td className="text-stroke-800">
                #{toPersianNumbers(123456789)}
              </td>
            </tr>
          </Table.body>
          <Table.body>
            <tr>
              <th className="text-stroke-400 font-normal">تاریخ تراکنش</th>
              <td className="text-stroke-800">25 اردیبهشت 1404</td>
            </tr>
          </Table.body>
          <Table.body>
            <tr>
              <th className="text-stroke-400 font-normal">تعداد سفارشات</th>
              <td className="text-stroke-800">
                {toPersianNumbers(cartItems?.items.length)} سفارش
              </td>
            </tr>
          </Table.body>
          <Table.body>
            <tr>
              <th className="text-stroke-400 font-normal">آدرس</th>
              <td className="text-stroke-800">
                تهران، خیابان ولیعصر، منطقه ۱۲، بلوار کاوه، کوچه ابوذر، پلاک ۱۵
              </td>
            </tr>
          </Table.body>
        </Table>
      </div>
      <div className="flex flex-col md:flex-row md:flex-wrap items-center lg:items-start justify-center lg:justify-start gap-4 w-full ">
        {cartItems?.items.map((item) => (
          <CartItemsLayout.Success key={item.id} cartItem={item} />
        ))}
      </div>
    </div>
  );
}
