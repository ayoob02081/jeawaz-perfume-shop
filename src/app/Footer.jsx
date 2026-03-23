import Link from "next/link";
import AppImage from "../components/AppImage";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import OptionsFooter from "@/components/OptionsFooter";

function Footer() {
  return (
    <article className="max-w-[120rem] mx-auto 2xl:rounded-t-4xl overflow-hidden">
      <OptionsFooter />
      <section className="bg-black size-full max-md:hidden px-16 py-8">
        <div className="flex flex-col items-center gap-6 py-6">
          <Link
            href={"/"}
            className="flex flex-col items-center justify-center gap-4 text-white"
          >
            <AppImage
              src="/images/Jeaawaz-Logo-red-v5.0.webp"
              alt="jeawaz-brand-icon"
              width="w-28 h-[4.25rem]"
              sizes="20vw"
            />
            <p className="text-sm">جیاواز، دنیای رایحه‌های خاصه</p>
          </Link>
          <div className="flex flex-col items-center justify-evenly gap-2 text-stroke-600 dark:text-stroke-600/50 text-xs">
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
          <section className="flex items-center justify-evenly w-full text-white gap-6 pb-10">
            <nav className="flex flex-col items-start gap-2">
              <ul>
                <li>
                  <h4 className="text-lg">عطر فروشی</h4>
                </li>
                <div className="footer--link grid-cols-2">
                  <li>
                    <Link href={"/page/about-us"}>درباره ما</Link>
                  </li>
                  <li>
                    <Link href={"/page/contact-us"}>ارتباط باما</Link>
                  </li>
                  <li>
                    <Link href={"/page/terms"}>قوانین و مقررات</Link>
                  </li>
                  <li>
                    <Link href={"/"}>ادرس ها</Link>
                  </li>
                </div>
              </ul>
            </nav>
            <nav className="flex flex-col items-start gap-2">
              <ul>
                <li>
                  <h4 className="text-lg">فروشگاه</h4>
                </li>
                <div className="footer--link grid-cols-3 *:even:col-span-2">
                  <li>
                    <Link href={"/products"}>جدیدترین</Link>
                  </li>
                  <li>
                    <Link href={"/products"}>محصولات پر تخفیف</Link>
                  </li>
                  <li>
                    <Link href={"/products"}>محصولات</Link>
                  </li>
                  <li>
                    <Link href={"/products"}>محصولات پرفروش</Link>
                  </li>
                </div>
              </ul>
            </nav>
          </section>
          <article className="flex  items-center justify-between w-full px-16 text-white">
            <section className="flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <Link href={"tel:+989180522273"} className="flex items-center">
                  <p className="text-3xl text-white ">
                    {toPersianNumbers("2273")}
                  </p>
                  <p className="text-3xl text-primary ">
                    {toPersianNumbers("052")}
                  </p>
                  <p className="text-xl text-stroke-450 ">
                    {toPersianNumbers("0918")}
                  </p>
                </Link>
                <Link href={"tel:+989180522273"} className="flex items-center">
                  <p className="text-3xl text-white ">
                    {toPersianNumbers("2273")}
                  </p>
                  <p className="text-3xl text-primary ">
                    {toPersianNumbers("052")}
                  </p>
                  <p className="text-xl text-stroke-450 ">
                    {toPersianNumbers("0918")}
                  </p>
                </Link>
              </div>
              <span className="flex items-center text-sm gap-0.5">
                <p className="font-bold ">منتظر صدای گرم شما هستیم!! </p>
                <p className="text-stroke-550 dark:text-stroke-200 font-semibod">
                  اگر سوالی داشتید با ما تماس بگیرید
                </p>
              </span>
            </section>
            <section className="flex flex-col justify-between gap-4">
              <p>به ما اعتماد کنید</p>
              <div className="flex items-center justify-between gap-2">
                <Link href={"/"}>
                  <AppImage
                    width="size-12"
                    src="/images/trust-1-icon.svg"
                    alt="trust-icon"
                    sizes="10vw"
                  />
                </Link>
                <Link href={"/"}>
                  <AppImage
                    width="size-12"
                    src="/images/trust-2-icon.svg"
                    alt="trust-icon"
                    sizes="10vw"
                  />
                </Link>
              </div>
            </section>
          </article>
        </div>
        <section className="flex items-center justify-between w-full pt-6 border-t border-stroke-600/60">
          <p className="text-white">
            تمامی حقوق مادی و معنوی برای جیاواز محفوظ می‌باشد
          </p>
          <nav>
            <ul className="flex items-center justify-between gap-2">
              <li>
                <Link href={"/"}>
                  <AppImage
                    width="size-7"
                    src="/images/whatsapp-icon.svg"
                    alt="whatsapp-icon"
                    sizes="10vw"
                  />
                </Link>
              </li>
              <li>
                <Link href="https://t.me/jeaawazperfume">
                  <AppImage
                    width="size-7"
                    src="/images/telegram-icon.svg"
                    alt="telegram-icon"
                    sizes="10vw"
                  />
                </Link>
              </li>
              <li>
                <Link href="https://www.instagram.com/jeawaz_perfume/">
                  <AppImage
                    width="size-7"
                    src="/images/insta-icon.svg"
                    alt="insta-icon"
                    sizes="10vw"
                  />
                </Link>
              </li>
              <li>
                <Link href={"/"}>
                  <AppImage
                    width="size-7"
                    src="/images/facebook-icon.svg"
                    alt="facebook-icon"
                    sizes="10vw"
                  />
                </Link>
              </li>
            </ul>
          </nav>
        </section>
      </section>
    </article>
  );
}

export default Footer;
