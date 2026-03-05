import AppImage from "@/components/AppImage";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

const addressData = [
  {
    id: 1,
    address: "تهران، خیابان ولیعصر، منطقه ۱۲، بلوار کاوه، کوچه ابوذر، پلاک ۱۵",
    name: "رضا جنیدی",
    phoneNumber: "09123456789",
    province: "تهران",
    city: "تهران",
    postNo: "3919856324",
  },
  {
    id: 2,
    address: "بانه، کوی فرهنگیان، کوچه البرز ۱۰",
    name: "ایوب محمودیان",
    phoneNumber: "09180522273",
    province: "کردستان",
    city: "بانه",
    postNo: "6691963617",
  },
];

function AddressLayout() {
  return (
    <div className="flex flex-col items-cente justify-start gap-3 w-full border md:border-[1.5px] border-stroke rounded-2xl p-4">
      <div className="flex items-center justify-between w-full pb-4">
        <p className="text-sm md:text-base text-text">لیست آدرس ها</p>
        <button className="flex items-center justify-center gap-2 text-primary hover:text-blue active:text-blue duration-200">
          <PlusIcon className="size-4" />
          <p>افزودن آدرس جدید</p>
        </button>
      </div>
      {addressData.map((item) => (
        <Address
          key={item.id}
          address={item.address}
          name={item.name}
          phoneNumber={item.phoneNumber}
          province={item.province}
          city={item.city}
          postNo={item.postNo}
        />
      ))}
    </div>
  );
}

export default AddressLayout;

function FullAddress({ address }) {
  return (
    <span className="md:col-span-2 flex items-center justify-between md:justify-start gap-2 w-full">
      <p className="text-sm md:text-base text-text md:hidden">آدرس :</p>
      <AppImage
        src="/images/map-marker-nearby-icon.svg"
        alt="map-marker-nearby-icon"
        className="max-md:hidden"
        width="size-6"
        sizes="10vw"
      />
      <p className="text-sm text-text">{address}</p>
    </span>
  );
}

function AddressDeatails({ titleOne, titleTwo }) {
  return (
    <span className="flex items-center justify-between md:justify-center md:rounded-2.5xl md:bg-secondary md:h-8 gap-2 max-md:w-full text-sm md:text-xs text-text md:px-4">
      <p>{titleOne}</p>
      <p>{titleTwo}</p>
    </span>
  );
}

function Address({ name, phoneNumber, province, city, postNo, address }) {
  const AddressTitles = {
    nameTitle: "نام تحویل گیرنده :",
    phoneNumberTitle: "شماره تماس :",
    provinceTitle: "استان :",
    cityTitle: "شهر :",
    postNoTitle: "کد پستی :",
  };
  return (
    <div className="fle grid grid-cols-1 md:grid-cols-3 gap-x-4 flex-col md:flex-row items-center md:items-start justify-between md:justify-between gap-6 w-full border-t border-stroke pt-4">
      <FullAddress address={address} />
      <div className="flex flex-col md:col-span-3 md:flex-row md:flex-wrap md:items-start max-md:justify-between md:justify-start w-full gap-6 md:gap-4 ">
        <AddressDeatails titleOne={AddressTitles.nameTitle} titleTwo={name} />
        <AddressDeatails
          titleOne={AddressTitles.phoneNumberTitle}
          titleTwo={toPersianNumbers(phoneNumber)}
        />
        <AddressDeatails
          titleOne={AddressTitles.provinceTitle}
          titleTwo={province}
        />
        <AddressDeatails titleOne={AddressTitles.cityTitle} titleTwo={city} />
        <AddressDeatails
          titleOne={AddressTitles.postNoTitle}
          titleTwo={toPersianNumbers(postNo)}
        />
      </div>
      <div className="md:col-start-3 md:row-start-1 flex items-center justify-between md:justify-end gap-4 w-full text-nowrap">
        <button className="flex items-center justify-center gap-1 max-md:h-12 max-md:border max-md:border-stroke text-text hover:text-success active:text-success max-md:px-6 max-md:rounded-full max-md:w-full max-md:font-bold duration-200">
          <div className="flex flex-col items-center justify-center gap-0.5 size-5">
            <PencilIcon className="-rotate-[8de]" />
            <span className="border w-4/5 rounded-full"></span>
          </div>
          <p>ویرایش</p>
        </button>
        <button className="flex items-center justify-center gap-1 max-md:h-12 max-md:bg-primary/10 max-md:border max-md:border-primary/10 text-primary hover:text-text active:text-text max-md:px-6 max-md:rounded-full max-md:w-full max-md:font-bold duration-200">
          <TrashIcon className="size-5" />
          <p>حذف</p>
        </button>
      </div>
    </div>
  );
}
