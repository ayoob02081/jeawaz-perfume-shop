"use client";

import Loading from "@/components/Loading";
import Modal from "@/components/Modal";
import RadioButton from "@/ui/RadioButton";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export function AllAddresses({
  addresses,
  isListOpen,
  onClose,
  addressId,
  setAddressId,
  isLoading,
}) {
  const [select, setSelect] = useState(addressId);

  const HandleSelectAddress = () => {
    setAddressId(select);
    onClose();
  };

  useEffect(() => {
  if (isListOpen) setSelect(addressId);
}, [isListOpen, addressId]);


  if (isLoading) {
    return <Loading />;
  }

  return (
    <Modal className="h-1/2" isOpen={isListOpen} onClose={onClose}>
      <div className="flex flex-col items-center justify-between gap-2 text-stroke-800 bg-stroke-0 h-full w-full p-6 pb-2 pl-2">
        <div className="flex items-center justify-between pb-4 border-b border-stroke-250  w-full h-fit pl-4">
          <h2 className="flex items-center justify-start gap-1 text-stroke-800 font-bold md:text-xl"><p className="md:font-normal">انتخاب</p><p>آدرس</p></h2>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center size-5 aspect-square rounded-full border border-stroke-250"
          >
            <XMarkIcon className="size-3 text-stroke-800 stroke-2" />
          </button>
        </div>
        <div className="flex flex-col justify-start gap-4 size-full overflow-auto scrollbar--primary scrollbar-w-2 pl-4">
          {(!addresses || addresses?.length === 0) && (
            <p>هنوز آدرسی ثبت نشده است</p>
          )}
          {addresses &&
            addresses?.map((item) => {
              const hasChcked = select === item.id;
              return (
                <RadioButton
                  key={item.id}
                  className="w-full flex flex-col items-start gap-4 border rounded-xl border-stroke-200 has-checked:border-2 has-checked:border-primary p-4 transition-all duration-200"
                  name="addresses"
                  id={item.id}
                  value={item.id}
                  onChange={() => setSelect(item.id)}
                  checked={hasChcked}
                >
                  <div className="flex items-center justify-start gap-2">
                    <div
                      className={`flex items-center justify-center size-5 md:size-5.5 aspect-square border-[1.5px] rounded-sm ${hasChcked ? "border-primary md:bg-primary" : "border-stroke-300"} transition-all duration-200`}
                    >
                      <CheckIcon
                        className={`size-3 md:size-3.5 ${hasChcked ? "max-md:text-primary" : ""} text-stroke-0 stroke-4 transition-all duration-200`}
                      />
                    </div>
                    <h3 className="font-bold md:text-lg">{item.label}</h3>
                  </div>
                  <p className="font-bold">{item.addressLine}</p>
                  <div>
                    <div className="flex flex-row flex-wrap items-start justify-start w-full gap-4 ">
                      <AddressDeatails
                        title="نام تحویل گیرنده :"
                        des={item.fullName}
                      />
                      <AddressDeatails
                        title="شماره تماس :"
                        des={toPersianNumbers(item.phoneNumber)}
                      />
                      <AddressDeatails title="استان :" des={item.ostan} />
                      <AddressDeatails title="شهر :" des={item.shahr} />
                      <AddressDeatails
                        title="کد پستی :"
                        des={toPersianNumbers(item.postalCode)}
                      />
                    </div>
                  </div>
                </RadioButton>
              );
            })}
        </div>
        <div className="relative flex items-center justify-end w-full h-fit pl-4 pt-2">
          <button
            type="button"
            disabled={!select}
            onClick={HandleSelectAddress}
            className="absolute bottom-3 btn btn--primary py-2 px-3 md:px-10 max-md:w-1/3"
          >
            انتخاب آدرس
          </button>
        </div>
      </div>
    </Modal>
  );
}

function AddressDeatails({ title, des }) {
  return (
    <span className="flex items-center justify-center rounded-2.5xl bg-stroke-150 h-8 gap-2 text-sm md:text-xs text-stroke-800 px-4">
      <p>{title}</p>
      <p>{des}</p>
    </span>
  );
}
