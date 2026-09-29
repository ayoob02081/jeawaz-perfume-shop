"use client";

import Table from "@/ui/Table";
import {
  toPersianNumbers,
  toPersianNumbersWithComma,
} from "@/utils/toPersianNumbers";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { checkoutAndPay } from "@/utils/paymentFlowContract.mjs";
import {
  createPaymentApi,
  paymentErrorMessage,
  redirectToGateway,
} from "@/hooks/usePayment";
import RadioButton from "@/ui/RadioButton";
import {
  CheckCircleIcon,
  CheckIcon,
  ShoppingBagIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {
  ShoppingBagIcon as ShoppingBagSolidIcon,
  CheckCircleIcon as CheckCircleSolidIcon,
  UserIcon as UserSolidIcon,
} from "@heroicons/react/24/solid";
import { CheckoutCartSummery, OrderSummaryCard } from "./CartSummery";
import AdaptiveOverlayPage from "@/components/AdaptiveOverlayPage";
import Loading from "@/components/Loading";
import Accordion from "@/ui/Accordion";
import { useGetAllCartItems, useUpdateShippingMethod } from "@/hooks/useCart";
import CartItemsLayout from "./CartItemsLayout";
import Link from "next/link";
import { useAuth } from "@/contexts/auth/AuthContext";
import RHFTextField from "@/ui/RHFTextField";
import { useForm } from "react-hook-form";
import { AllAddresses } from "./AddressModals";
import AddressForm from "@/components/AddressForm";
import {
  useCreateAddress,
  useGetAddressById,
  useGetAddresses,
} from "@/hooks/useAddress";
import { useCreateOrder } from "@/hooks/useOrders";

const shippingOptions = [
  {
    id: 1,
    value: "post",
    title: "پست پیشتاز(۳ تا ۵ روز کاری)",
    price: 150000,
  },
  {
    id: 2,
    value: "tipax",
    title: "تیپاکس با بیمه(۱ تا ۳ روز کاری)",
    price: 0,
  },
  {
    id: 3,
    value: "chapar",
    title: "چاپار با بیمه(۳ تا ۵ روز کاری)",
    price: 0,
  },
  { id: 4, value: "barbari", title: "باربری و ترمینال(۲۴ ساعته)", price: 0 },
];

function CartLayout() {
  const pathName = usePathname();
  const [cartOpen, setCartOpen] = useState(false);
  const [addressId, setAddressId] = useState(null);
  const [isListOpen, setIsListOpen] = useState(false);

  const { loading } = useAuth();
  const { data: cart, isLoading, isError } = useGetAllCartItems();
  const { data: addresses, isLoading: addressesLoading } = useGetAddresses();

  const [shippingMethod, setShippingMethod] = useState("tipax");
  const [step, setStep] = useState(1);

  const toggleCart = () => {
    setCartOpen((prevState) => !prevState);
  };

  if (pathName === "/cart" && cartOpen === false) {
    setCartOpen(true);
  }

  useEffect(() => {
    if (cart?.shippingCost !== undefined) {
      setShippingMethod(cart.shippingMethod);
    }
  }, [cart?.shippingCost]);

  useEffect(() => {
    if (!cart || cart.totalProducts === 0) {
      setStep(1);
    }
  }, [cart]);

  const renderSteps = () => {
    switch (step) {
      case 1:
        return <CartOverview cart={cart} step={step} setStep={setStep} />;
      case 2:
        return (
          <Checkout
            cart={cart}
            setStep={setStep}
            shippingMethod={shippingMethod}
            setShippingMethod={setShippingMethod}
            addresses={addresses}
            setIsListOpen={setIsListOpen}
            addressId={addressId}
            setAddressId={setAddressId}
          />
        );
      default:
        return null;
    }
  };

  const renderCartContent = () => {
    if (loading || isLoading) {
      return <Loading />;
    }

    if (isError) {
      return (
        <div className="flex items-center justify-center max-md:h-dvh md:h-92 w-full">
          <span className="flex flex-col items-center justify-center max-md:gap-4 md:gap-6 text-stroke-800">
            <p className="font-bol max-md:text-xl md:text-2xl text-stroke-600">
              خطا در دریافت سبد خرید
            </p>
          </span>
        </div>
      );
    }

    if (!cart || cart.totalProducts === 0) {
      return (
        <div className="flex items-center justify-center max-md:h-dvh md:h-92 w-full">
          <span className="flex flex-col items-center justify-center max-md:gap-4 md:gap-6 text-stroke-800">
            <p className="font-bol max-md:text-xl md:text-2xl text-stroke-600">
              سبد خرید شما خالی است!
            </p>
            <Link
              href="/products"
              className="btn btn--primary px-3 py-1.5 max-md:text-sm"
            >
              صفحه محصولات
            </Link>
          </span>
        </div>
      );
    }

    return (
      <>
        <div className="flex items-center justify-center md:container md:mx-auto size-full h-[7.15rem] md:h-40 bg-stroke-100 md:rounded-3xl duration-200">
          <CheckoutStepper step={step} setStep={setStep} />
        </div>

        <div className="flex items-center justify-center w-full max-sm:px-4 px-6">
          <div
            className={`container ${step !== 3 ? "md:flex-row" : ""} ${
              step === 2
                ? "lg:p-6 lg:py-8 lg:border-[1.5px] lg:rounded-2.5xl"
                : "md:p-6 md:py-8 md:border-[1.5px] md:rounded-2.5xl"
            } flex flex-col items-start md:items-center md:justify-between xl:justify-normal gap-5 border-stroke-200 size-full duration-200`}
          >
            {renderSteps()}
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <AdaptiveOverlayPage
        isOpen={cartOpen}
        onClick={toggleCart}
        label="سبد خرید"
        side="right"
        className="size-5.5"
        overflow="overflow-y-auto"
        bgColor=""
        cart
      >
        {renderCartContent()}
      </AdaptiveOverlayPage>

      {/* Modal */}
      {isListOpen && (
        <AllAddresses
          addresses={addresses}
          isListOpen={isListOpen}
          onClose={() => setIsListOpen(false)}
          addressId={addressId}
          setAddressId={setAddressId}
          isLoading={addressesLoading}
        />
      )}
    </>
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
      <div className="badge badge--primary h-8 w-23 text-sm text-nowrap">
        {toPersianNumbers(productValue)} محصول
      </div>
    </div>
  );
}

function CheckoutStepper({ step, setStep }) {
  return (
    <div className="flex items-center justify-center max-sm:gap-1 sm:gap-4 size-full max-w-200 px-10 h-[7.15rem] md:h-40">
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
      <div className="grow flex items-center justify-start bg-stroke-0 max-md:h-0.75 md:h-1.5 rounded-2xl max-md:-translate-y-3 md:-translate-y-3.5">
        <div
          className={`max-md:bg-stroke-800 md:bg-stroke-900 dark:md:bg-stroke-800 max-md:h-0.75 md:h-1.5 rounded-2xl ${
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
      <div className="grow flex items-center justify-start bg-stroke-0 max-md:h-0.75 md:h-1.5 rounded-2xl max-md:-translate-y-3 md:-translate-y-3.5">
        <div
          className={`max-md:bg-stroke-800 md:bg-stroke-900 dark:md:bg-stroke-800 max-md:h-0.75 md:h-1.5 rounded-2xl ${
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

function CartOverview({ cart, step, setStep }) {
  const { totalProducts = 0 } = cart;

  return (
    <div className="flex flex-col md:flex-row justify-center gap-6 w-full">
      {/* CartItems */}
      <div className="flex flex-col md:items-center md:justify-between gap-5 size-full max-lg:overflow-hidden max-lg:*:first:hidden">
        <Table className="">
          <Table.Header className="*:pb-6">
            <th className="text-right px-2">
              <Title
                titleOne="سبد خرید"
                titleTwo="شما"
                productValue={totalProducts}
                className="flex-row items-center justify-start"
              />
            </th>
            <th className="px-2 text-stroke-800 text-nowrap">حجم و نوع</th>
            <th className="px-2 text-stroke-800">تعداد</th>
            <th className="text-left px-2 text-stroke-800">قیمت نهایی</th>
          </Table.Header>
          <Table.body>
            {cart?.items.map((item) => (
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

        {/* MobileCartItems */}
        <div
          dir="ltr"
          className="max-lg:flex items-center justify-start flex-col gap-4 size-full scrollbar-none overflow-auto max-h-dvh lg:hidden"
        >
          {cart?.items.map((item) => (
            <CartItemsLayout.Mobile key={item.id} cartItem={item} />
          ))}
        </div>
      </div>

      {/* CartSummery */}
      <div className="flex items-center justify-center size-full max-md:mx-auto md:max-w-92">
        <OrderSummaryCard cart={cart} setStep={setStep} />
      </div>
    </div>
  );
}

function Checkout({
  cart,
  setStep,
  shippingMethod,
  addresses,
  setIsListOpen,
  addressId,
  setAddressId,
}) {
  const { data: address, isLoading: isAddressLoading } =
    useGetAddressById(addressId);
  const { createAddress, isCreating: isAddressCreating } = useCreateAddress();
  const { createOrder } = useCreateOrder();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const router = useRouter();
  const selectedAddress = addresses?.find((a) => a.id === addressId);

  const { totalProducts = 0 } = cart;
  const [isSave, setIsSave] = useState(false);
  const [isLabel, setIsLabel] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      label: "",
      fullName: "",
      phoneNumber: "",
      ostan: "",
      shahr: "",
      postalCode: "",
      addressLine: "",
    },
  });
  const finalAddress =
    watch("addressLine") === address?.addressLine &&
    watch("fullName") === address?.fullName &&
    watch("label") === address?.label &&
    watch("ostan") === address?.ostan &&
    watch("phoneNumber") === address?.phoneNumber &&
    watch("postalCode") === address?.postalCode &&
    watch("shahr") === address?.shahr;

  useEffect(() => {
    if (!addresses || addressId) return;

    const def = addresses.find((a) => a.isDefault);

    if (def) setAddressId(def.id);
  }, [addresses, addressId]);

  useEffect(() => {
    if (!selectedAddress) return;

    reset({
      label: selectedAddress.label ?? "",
      fullName: selectedAddress.fullName ?? "",
      phoneNumber: selectedAddress.phoneNumber ?? "",
      ostan: selectedAddress.ostan ?? "",
      shahr: selectedAddress.shahr ?? "",
      postalCode: selectedAddress.postalCode ?? "",
      addressLine: selectedAddress.addressLine ?? "",
    });
  }, [selectedAddress, reset]);

  const onSubmit = async (data) => {
    // One checkout at a time: a double submit must never create two Orders.
    if (isCheckingOut) return;
    setIsCheckingOut(true);

    try {
      let finalAddressId = addressId;

      if (isSave) {
        const addressData = await createAddress(data);
        finalAddressId = addressData.id;
      }

      const orderPayload = finalAddress
        ? { addressId: finalAddressId, shippingMethod }
        : {
            receiverName: data.fullName,
            receiverPhone: data.phoneNumber,
            ostan: data.ostan,
            shahr: data.shahr,
            fullAddress: data.addressLine,
            postalCode: data.postalCode,
            shippingMethod,
          };

      const result = await checkoutAndPay({
        createOrder: () => createOrder(orderPayload),
        createPayment: createPaymentApi,
        redirect: redirectToGateway,
      });

      if (result.stage === "redirected") return;

      if (result.stage === "payment-failed") {
        // The Order exists; send the user to it to retry payment there.
        toast.error(
          `${paymentErrorMessage(result.error)}. سفارش ثبت شده است؛ از صفحه سفارش دوباره پرداخت کنید.`,
          { id: "checkout-payment" },
        );
        router.push(
          result.orderId
            ? `/profile/orders/${result.orderId}`
            : "/profile/orders",
        );
      }
    } catch (err) {
      console.error("Checkout error:", err);
    }
    setIsCheckingOut(false);
  };

  const onError = (errors) => {
    console.log("FORM ERRORS", errors);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onError)}
      className="flex flex-col lg:flex-row justify-center gap-6 w-full"
    >
      <div className="flex flex-col max-sm:gap-4 gap-6 size-full">
        {/* CartItems */}
        <Accordion
          titleStyle="text-stroke-800"
          className="max-lg:flex lg:hidden w-full"
          label="نمایش سبد خرید شما"
        >
          <div className="max-lg:flex items-center justify-center flex-col gap-4 lg:hidden w-full">
            {cart?.items?.map((item) => (
              <CartItemsLayout.Mobile key={item.id} cartItem={item} />
            ))}
          </div>
        </Accordion>

        {/* UserInfo */}
        <div className="flex flex-col items-center justify-between gap-4 size-full max-lg:border-[1.5px] border-stroke-200 rounded-2.5xl max-sm:p-4 sm:p-6">
          <div className="flex items-center justify-start gap-1 text-stroke-800 border-b border-stroke-200 w-full pb-4">
            <h2 className="max-md:text-lg md:text-[1.375rem]">
              اطلاعات کاربری
            </h2>
            <p className="max-md:text-sm md:text-xl">شما</p>
          </div>
          <AddressForm
            control={control}
            errors={errors}
            register={register}
            watch={watch}
            onChange={() => setIsSave((prev) => !prev)}
            isChecked={isSave}
            isPrimary={true}
            checkBoxLabel="ذخیره آدرس برای خریدهای بعدی"
            checkBoxName="saveAddress"
            checkBoxId="saveAddress"
            reset={reset}
            setIsListOpen={setIsListOpen}
            checkout
          />
          {isSave && (
            <RHFTextField
              isRequired
              register={register}
              errors={errors}
              label="عنوان آدرس"
              name="label"
              className="w-full"
              textClassName="font-bold"
              placeholder="مثال : آدرس خانه"
              validationSchema={{
                required: "نام آدرس الزامی است",
              }}
            />
          )}
          <div className="w-full mt-6">
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
          <div className="flex items-center flex-wrap gap-4 w-full max-sm:mb-2 mb-6">
            {shippingOptions.map((item) => (
              <ShippingOption key={item.id} item={item} cart={cart} />
            ))}
          </div>
        </div>
      </div>

      {/* CartSummery */}
      <div className="flex items-center justify-center md:justify-end size-full">
        <CheckoutCartSummery cart={cart} setStep={setStep} />
      </div>

      {/* MobileButtons */}
      <div className="size-full md:hidden flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="btn btn--secondary--2 size-full py-2 max-sm:max-w-1/3"
        >
          مرحله قبل
        </button>
        <button
          type="submit"
          disabled={isCheckingOut}
          className="btn btn--primary border hover:bg-stroke-0 active:bg-stroke-0 size-full py-2 disabled:opacity-50"
        >
          {isCheckingOut ? "در حال انتقال به درگاه..." : "پرداخت و خرید محصول"}
        </button>
      </div>
    </form>
  );
}

function ShippingOption({ cart, item }) {
  const { isUpdatingShipping, updateShippingMethod } =
    useUpdateShippingMethod();

  const { shippingMethod } = cart;

  const { value, title, price } = item;
  const onChange = () => {
    updateShippingMethod(value);
  };

  const isChecked = shippingMethod === value;
  return (
    <RadioButton
      onChange={onChange}
      checked={shippingMethod === value}
      id={value}
      name="post"
      value={value}
      className={`flex items-center justify-between gap-4 w-full lg:w-fit 
             text-xs md:text-sm max-md:rounded-lg md:rounded-5xl
             px-4 py-3 text-stroke-800
             border-[1.5px] 
            ${isChecked ? "border-primary font-bold bg-stroke-0" : "border-stroke-100 bg-stroke-100"}
             duration-200`}
      childrenClassName="justify-between w-full"
    >
      <div className="flex items-center justify-between gap-2 overflow-hidden">
        <div
          className={`flex items-center justify-center size-4 aspect-square
          ${isChecked ? "bg-primary border-primary" : "border-stroke-600/50"} rounded-sm border-[1.25px]  `}
        >
          <CheckIcon className="size-2.5 stroke-4 text-stroke-100" />
        </div>
        <p className="text-xs text-nowrap whitespace-nowrap overflow-auto w-full py-1 scrollbar-none">
          {title}
        </p>
      </div>
      <span className="flex items-center justify-between gap-1">
        {price <= 0 ? (
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
