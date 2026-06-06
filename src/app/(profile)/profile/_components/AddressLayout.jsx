"use client";

import AppImage from "@/components/AppImage";
import Loading from "@/components/Loading";
import { useGetAddresses, useRemoveAddress } from "@/hooks/useAddress";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

function AddressLayout() {
  const { data, isLoading } = useGetAddresses();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col items-cente justify-start gap-3 w-full border md:border-[1.5px] border-stroke-200 rounded-2xl p-4">
      <div className="flex items-center justify-between w-full pb-4">
        <p className="text-sm md:text-base text-stroke-800 font-bold">
          لیست آدرس ها
        </p>
        <Link
          href={"/profile/me/address/add"}
          className="flex items-center justify-center gap-2 text-primary hover:text-blue active:text-blue duration-200"
        >
          <PlusIcon className="size-4" />
          <p>افزودن آدرس جدید</p>
        </Link>
      </div>
      {data.map((item) => (
        <Address
          key={item.id}
          label={item.label}
          fullName={item.fullName}
          ostan={item.ostan}
          shahr={item.shahr}
          phoneNumber={item.phoneNumber}
          postalCode={item.postalCode}
          addressLine={item.addressLine}
        >
          <AddressBtn id={item.id} />
        </Address>
      ))}
    </div>
  );
}

export default AddressLayout;

function FullAddress({ address }) {
  return (
    <span className="md:col-span-2 flex items-center justify-between md:justify-start gap-2 w-full">
      <p className="text-sm md:text-base text-stroke-800 md:hidden">آدرس :</p>
      <AppImage
        src="/images/map-marker-nearby-icon.svg"
        alt="map-marker-nearby-icon"
        className="max-md:hidden"
        width="size-6"
        sizes="10vw"
      />
      <p className="text-sm text-stroke-800">{address}</p>
    </span>
  );
}

function AddressDeatails({ title, des }) {
  return (
    <span className="flex items-center justify-between md:justify-center md:rounded-2.5xl md:bg-stroke-150 md:h-8 gap-2 max-md:w-full text-sm md:text-xs text-stroke-800 md:px-4">
      <p>{title}</p>
      <p>{des}</p>
    </span>
  );
}

export function Address({
  fullName,
  phoneNumber,
  ostan,
  shahr,
  postalCode,
  addressLine,
  label,
  children,
}) {
  return (
    <div className=" grid grid-cols-1 md:grid-cols-3 gap-x-4 flex-col md:flex-row items-center md:items-start justify-between md:justify-between gap-6 w-full border-t border-stroke-200 pt-4">
      <div className="flex flex-col items-start justify-start gap-4">
        <h2 className="font-bold text-md">{label}</h2>
        <FullAddress address={addressLine} />
      </div>
      <div className="flex flex-col md:col-span-3 md:flex-row md:flex-wrap md:items-start max-md:justify-between md:justify-start w-full gap-6 md:gap-4 ">
        <AddressDeatails title="نام تحویل گیرنده :" des={fullName} />
        <AddressDeatails
          title="شماره تماس :"
          des={toPersianNumbers(phoneNumber)}
        />
        <AddressDeatails title="استان :" des={ostan} />
        <AddressDeatails title="شهر :" des={shahr} />
        <AddressDeatails title="کد پستی :" des={toPersianNumbers(postalCode)} />
      </div>
      {children}
    </div>
  );
}

function AddressBtn({ id }) {
  const { isDeleting, removeAddress } = useRemoveAddress();

  const removeAddressHandler = async (id) => {
    await removeAddress(id);
  };
  return (
    <div className="md:col-start-3 md:row-start-1 flex items-center justify-between md:justify-end gap-4 w-full text-nowrap">
      <Link
        href={`/profile/me/address/edit/${id}`}
        className="flex items-center justify-center gap-1 max-md:h-12 max-md:border max-md:border-stroke-200 text-stroke-800 hover:text-success active:text-success max-md:px-6 max-md:rounded-full max-md:w-full max-md:font-bold duration-200"
      >
        <div className="flex flex-col items-center justify-center gap-0.5 size-5">
          <PencilIcon className="rotate-[-8de]" />
          <span className="border w-4/5 rounded-full"></span>
        </div>
        <p>ویرایش</p>
      </Link>
      <button
        type="button"
        onClick={() => removeAddressHandler(id)}
        className="flex items-center justify-center gap-1 max-md:h-12 max-md:bg-primary/10 max-md:border max-md:border-primary/10 text-primary hover:text-stroke-800 active:text-stroke-800 max-md:px-6 max-md:rounded-full max-md:w-full max-md:font-bold duration-200"
      >
        <TrashIcon className="size-5" />
        <p>حذف</p>
      </button>
    </div>
  );
}
