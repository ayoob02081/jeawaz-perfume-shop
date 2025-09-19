import Link from "next/link";
import Logo from "./Logo";

function Footer() {
  return (
    <div className="bg-black h-[43.5rem] w-full max-sm:hidden">
      <div className="flex flex-col items-center gap-6 p-16">
        <Link href={"/"} className="flex flex-col items-center justify-center gap-4 text-white">
          <Logo width="w-28 h-[4.25rem]" className="justify-center" />
          <p className="text-sm">جیواز، دنیای رایحه‌های خاصه</p>
        </Link>
        <div className="flex flex-col items-center justify-evenly gap-2 text-text-secondary text-xs">
          <p>
            ما اینجاییم تا کمک کنیم عطری رو پیدا کنی که با شخصیتت هم‌صدا باشه.
          </p>
          <p>
            چون باور داریم عطر فقط یک انتخاب روزمره نیست؛ یک امضای شخصیه، بخشی
            از تو که قبل از گفتن هر کلمه‌ای، دیده و حس می‌شه.
          </p>
          <p>
            در دنیای رایحه‌ها، هر بو یک داستانه. بعضی‌ها خاطره‌ان، بعضی‌ها
            انگیزه، بعضی‌ها آرامش. و ما در جیواز، همه‌ی این داستان‌ها رو برات
            جمع کردیم
          </p>
        </div>
        <div className="flex items-center justify-evenly w-full text-white gap-6 pb-10 border-b border-text-secondary/60">
          <div className="flex flex-col items-start gap-2">
            <h4 className="text-lg">عطر فروشی</h4>
            <div className="footerLink grid-cols-2">
              <Link href={"/"}>درباره ما</Link>
              <Link href={"/"}>ارتباط باما</Link>
              <Link href={"/"}>قوانین و مقررات</Link>
              <Link href={"/"}>ادرس ها</Link>
            </div>
          </div>
          {/* <div className="flex flex-col items-start gap-2">
            <h4 className="text-lg">خدمات ما</h4>
            <div className="grid grid-cols-1 max-w-48 gap-x-4 gap-y-1 text-base text-text-secondary">
              <p>item1</p>
              <p>item2</p>
            </div>
          </div> */}
          <div className="flex flex-col items-start gap-2">
            <h4 className="text-lg">فروشگاه</h4>
            <div className="footerLink grid-cols-3 *:even:col-span-2">
              <Link href={"/products"} >جدیدترین</Link>
              <Link href={"/products"} >محصولات پر تخفیف</Link>
              <Link href={"/products"} >محصولات</Link>
              <Link href={"/products"} >محصولات پرفروش</Link>
            </div>
          </div>
        </div>
        <div className="flex  items-center justify-between w-full px-16 text-white">
          <div className="flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <p>09181231234</p>
              <p>09181231234</p>
            </div>
            <p>منتظر صدای گرم شما هستیم !! اگر سوالی داشتید با ماتماس بگیرید</p>
          </div>
          <div className="flex flex-col justify-between gap-4">
            <p>به ما اعتماد کنید</p>
            <div>trust icons</div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between w-full px-16 text-white">
        <p>تمامی حقوق مادی و معنوی برای این سایت محفوظ می باشد</p>
        <div>insta</div>
      </div>
    </div>
  );
}

export default Footer;
