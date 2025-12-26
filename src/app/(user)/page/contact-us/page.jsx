import ImageFrame from "@/components/ImageFrame";
import SupportBox from "@/components/SupportBox";
import Accordion from "@/ui/Accordion";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import Link from "next/link";

function ContactUsPage() {
  return (
    <div className="mt-48 md:mt-40">
      {/* Contact Us */}
      <div className="flex flex-col items-center justify-center container mx-auto size-full xl:max-w-7xl bg-[#FEF8FA] sm:px-6 md:p-6 rounded-2.5xl sm:rounded-3xl md:rounded-t-5xl">
        <div className="flex flex-col justify-start gap-6 md:gap-15 w-full p-6 ">
          <span className="flex max-md:flex-col md:flex-row items-center max-md:justify-center md:justify-between max-md:gap-8 md:gap-10 w-full">
            <span className="flex flex-col max-md:items-center md:items-start justify-center font-bold max-md:gap-4 md:gap-6">
              <h1 className="text-xs md:text-base text-primary ">تماس با ما</h1>
              <span className="flex items-center justify-center gap-1 max-md:text-2xl md:text-[2rem] text-text text-nowrap">
                تجربه‌ای بی‌نظیر با <p className="text-primary">جیاواز</p>
              </span>
            </span>
            <p className="text-text-secondary leading-7">
              در صورت وجود هرگونه سؤال، ابهام، پیشنهاد یا بازخورد، با کمال میل
              منتظر شنیدن صدای شما هستیم. تیم پشتیبانی جیواز همواره در تلاش است
              تا با پاسخ‌گویی دقیق و به‌موقع، تجربه‌ای مطمئن، دل‌پذیر و حرفه‌ای
              از خرید عطر برای شما فراهم کند
            </p>
          </span>
          <div className="flex flex-col md:flex-row md:gap-8 md:items-center md:justify-between bg-white max-md:ring-4 md:ring-8 ring-black/5 !rounded-b-none max-md:rounded-2.5xl md:rounded-5xl p-6">
            <div className="flex flex-col justify-start gap-8 md:gap-12 ">
              <div className="flex flex-col items-start justify-start gap-4">
                <div className="flex items-center justify-center bg-grey rounded-xl size-12">
                  <ImageFrame
                    src="/images/map-marker-nearby-2-icon.svg"
                    alt="map-marker-nearby"
                    className="size-6"
                  />
                </div>
                <span className="flex flex-col items-start justify-start gap-2">
                  <p className="max-md:text-xs md:text-sm text-text-secondary font-bold">
                    آدرس فروشگاه
                  </p>
                  <p className="max-md:text-sm md:text-base text-text font-bold leading-7">
                    کردستان، بانه، بلوار ورزش، مجتمع تجاری آربابا، طبقه اول،
                    پلاک ۵۹ و ۶۰
                  </p>
                </span>
              </div>
              <div className="flex flex-col items-start justify-start gap-4">
                <div className="flex items-center justify-center bg-grey rounded-xl size-12">
                  <ImageFrame
                    src="/images/call-ringing-4-primary-2-icon.svg"
                    alt="call-ringing"
                    className="size-6"
                  />
                </div>
                <span className="flex flex-col items-start justify-start gap-4">
                  <p className="max-md:text-xs md:text-sm text-text-secondary font-bold">
                    شماره های تماس
                  </p>
                  <div className="flex items-center justify-start">
                    <Link
                      href={"tel:+982191016979"}
                      className="flex items-center pl-4 text-xl md:text-[22px] font-bold  border-l-[1.5px] border-stroke-2"
                    >
                      <p className=" text-text ">
                        {toPersianNumbers("91016979")}-
                      </p>
                      <p className=" text-primary ">
                        {toPersianNumbers("021")}
                      </p>
                    </Link>
                    <Link
                      href={"tel:+989180522273"}
                      className="flex items-center pr-4 text-xl md:text-[22px] font-bold"
                    >
                      <p className=" text-text ">
                        {toPersianNumbers("0522273")}-
                      </p>
                      <p className=" text-primary ">
                        {toPersianNumbers("0918")}
                      </p>
                    </Link>
                  </div>
                </span>
              </div>
              <div className="flex flex-col items-start justify-start gap-4">
                <div className="flex items-center justify-center bg-grey rounded-xl size-12">
                  <ImageFrame
                    src="/images/social-earth-icon.svg"
                    alt="social-earth"
                    className="size-6"
                  />
                </div>
                <span className="flex flex-col items-start justify-start gap-4 w-full">
                  <p className="max-md:text-xs md:text-sm text-text-secondary font-bold">
                    شبکه های اجتماعی
                  </p>
                  <div className="flex items-center justify-start gap-4 w-full">
                    <Link
                      href="https://t.me/jeaawazperfume"
                      className="flex items-center justify-center gap-2 px-4 h-12 w-full rounded-full border border-stroke-2 max-w-36 md:max-w-40"
                    >
                      <ImageFrame
                        src="/images/telegram-icon.svg"
                        alt="telegram-icon"
                        className="size-6"
                      />
                      <p className="text-sm text-dark-brown font-bold">
                        تلگرام
                      </p>
                    </Link>
                    <Link
                      href="https://www.instagram.com/jeawaz_perfume/"
                      className="flex items-center justify-center gap-2 px-4 h-12 w-full rounded-full border border-stroke-2 max-w-36 md:max-w-40"
                    >
                      <ImageFrame
                        src="/images/instagram-icon.svg"
                        alt="instagram-icon"
                        className="size-6"
                      />
                      <p className="text-sm text-dark-brown font-bold">
                        اینستاگرام
                      </p>
                    </Link>
                  </div>
                </span>
              </div>
            </div>
            <div className="max-md:hidden md:flex ">Form</div>
          </div>
        </div>
      </div>
      {/* Support */}
      <div className="relative w-full max-md:h-36 md:h-48 bg-white z-10">
        <div className="absolute max-md:bottom-8 md:bottom-13 size-full bg-white -z-1"></div>
        <div className="h-fit flex flex-col items-center justify-center container mx-auto w-full xl:max-w-7xl p-6">
          <SupportBox />
          <div></div>
        </div>
      </div>
      {/* FAQ */}
      <div className="p-6 container mx-auto xl:max-w-7xl max-md:mt-8">
        <div className="flex items-start justify-between gap-4 w-full mb-6">
          <span className="flex flex-col items-start justify-start gap-4">
            <p className="text-text font-bold text-xl md:text-2xl">
              سوالات متداول
            </p>
            <p className="text-text-cap-2 text-xs md:text-sm ">
              برای پاسخ به پرسش‌های رایج شما، مجموعه‌ای از سؤالات متداول را
              آماده کرده‌ایم تا تجربه خریدی ساده‌تر، شفاف‌تر و سریع‌تر داشته
              باشید.
            </p>
          </span>
          <ImageFrame
            src="/images/star-8-icon.svg"
            alt="star-icon"
            className="size-[18px] md:size-10 rotate-6"
          />
        </div>
        <div className="flex flex-col gap-6">
          <Accordion
            titleStyle="text-sm md:text-lg font-bold text-text"
            label="۱- آیا همه مدل‌ها اورجینال هستند؟"
            plus
          >
            <p className="leading-7 text-text-secondary border-t-[1.5px] border-stroke-2 pt-6">
              در فروشگاه جیاواز دو نوع محصول — اورجینال و مستر کوالیتی — ارائه
              می‌شود. تمامی کالاها با ذکر دقیق نوع کیفیت (اورجینال یا مستر
              کوالیتی) در صفحه محصول مشخص شده‌اند تا مشتری با آگاهی کامل انتخاب
              کند. هدف ما ارائه گزینه‌های متنوع با سطح کیفیت و قیمت متفاوت است
              تا هر مشتری بتواند مطابق نیاز و بودجه خود خریدی مطمئن و رضایت‌بخش
              داشته باشد.
            </p>
          </Accordion>
          <Accordion
            titleStyle="text-sm md:text-lg font-bold text-text"
            label="۲- پخش و ماندگاری ادکلن یا عطر چگونه هست؟"
            plus
          >
            <p className="leading-7 text-text-secondary border-t-[1.5px] border-stroke-2 pt-6">
              پخش بو و ماندگاری عطرها بسته به نوع رایحه، غلظت (مانند ادوپرفیوم
              یا ادوتویلت)، کیفیت اسانس و حتی نوع پوست افراد متفاوت است. در
              فروشگاه جیاواز، برای هر محصول میزان پخش و ماندگاری به‌صورت دقیق و
              واقعی در بخش توضیحات درج شده است تا مشتری بتواند با اطمینان کامل
              انتخاب کند. <br /> بر اساس منابع تخصصی عطر، غلظت عطر یکی از
              مهم‌ترین عوامل تأثیرگذار بر ماندگاری و پخش بو است. <br /> همچنین
              ساختار رایحه، فصل استفاده و نحوه اسپری کردن نیز نقش مهمی در عملکرد
              نهایی عطر دارند. <br />
              ما تلاش می‌کنیم اطلاعات هر محصول را بر اساس تست‌های واقعی، تجربه
              کاربران و استانداردهای رایج صنعت عطر ارائه دهیم تا انتخابی دقیق و
              مطمئن داشته باشید.
            </p>
          </Accordion>
          <Accordion
            titleStyle="text-sm md:text-lg font-bold text-text"
            label="۳- نحوه ارسال سفارش از چه طریق و چه مدتی به طول می‌انجامد؟"
            plus
          >
            <p className="leading-7 text-text-secondary border-t-[1.5px] border-stroke-2 pt-6">
              تمامی سفارش‌های ثبت‌شده در فروشگاه از طریق پست پیشتاز و تیپاکس
              ارسال می‌شوند. <br /> نوع ارسال بر اساس شهر مقصد، وزن بسته و
              انتخاب مشتری تعیین می‌شود تا سریع‌ترین و مطمئن‌ترین روش برای تحویل
              انتخاب گردد. زمان تحویل سفارش‌ها معمولاً بین ۲ تا ۴ روز کاری متغیر
              است.
              <br /> برای شهرهای دورتر، زمان تحویل ممکن است کمی بیشتر باشد که
              این موضوع به شرکت حمل‌ونقل انتخابی بستگی دارد. ما تلاش می‌کنیم
              سفارش‌ها در کوتاه‌ترین زمان ممکن پردازش و ارسال شوند و وضعیت
              مرسوله تا زمان تحویل قابل پیگیری است.
            </p>
          </Accordion>
          <Accordion
            titleStyle="text-sm md:text-lg font-bold text-text"
            label="۴- مهلت تست محصول و شرایط بازگشت کالا به چه صورت است؟"
            plus
          >
            <p className="leading-7 text-text-secondary border-t-[1.5px] border-stroke-2 pt-6">
              در فروشگاه جیاواز، تمامی محصولات شامل مهلت تست و امکان بازگشت کالا
              تا ۷ روز پس از تحویل، مطابق قوانین حمایت از مصرف‌کننده هستند.
              مشتریان می‌توانند در صورت وجود هرگونه ایراد فنی، مغایرت با توضیحات
              محصول، یا عدم رضایت از خرید، درخواست بازگشت کالا ثبت کنند.
            </p>
          </Accordion>
        </div>
      </div>
    </div>
  );
}

export default ContactUsPage;
