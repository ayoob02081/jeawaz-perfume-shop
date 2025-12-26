import ImageFrame from "@/components/ImageFrame";
import Accordion from "@/ui/Accordion";

function TermsPage() {
  return (
    <div className="mb-8 mt-48 md:mt-40">
      {/* Terms */}
      <div className="flex flex-col items-cente justify-center container mx-auto size-full xl:max-w-7xl bg-[#FEF8FA] sm:px-6 md:p-6 rounded-2.5xl sm:rounded-3xl md:rounded-t-5xl">
        <div className="flex flex-col justify-start gap-6 md:gap-15 w-full p-6 ">
          <span className="flex max-md:flex-col md:flex-row items-center max-md:justify-center md:justify-between max-md:gap-8 md:gap-10 w-full">
            <span className="flex flex-col max-md:items-center md:items-start justify-center font-bold max-md:gap-4 md:gap-6">
              <h1 className="text-xs md:text-base text-primary ">
                قوانین و مقررات
              </h1>
              <span className="flex items-center justify-center gap-1 max-md:text-2xl md:text-[2rem] text-text text-nowrap">
                تجربه‌ای بی‌نظیر با <p className="text-primary">جیاواز</p>
              </span>
              <p className="text-text-secondary leading-7">
                به منظور ایجاد تجربه‌ای امن، شفاف و حرفه‌ای برای مشتریان عزیز،
                استفاده از خدمات و خرید از فروشگاه جیاواز منوط به پذیرش و رعایت
                قوانین زیر است:
              </p>
            </span>
          </span>
        </div>
        <div className="flex flex-col md:gap-8 bg-white max-md:ring-4 md:ring-8 ring-black/5  max-md:rounded-2.5xl md:rounded-5xl p-6">
          <div className="flex flex-col items-start justify-center px-6">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-2xl font-bold text-primary">قوانین عمومی</h2>
              <ImageFrame
                src="/images/star-8-icon.svg"
                alt="star-icon"
                className="size-[18px] md:size-10 rotate-6"
              />
            </div>
            <span className="leading-7 text-text-secondary pt-6">
              <p>
                - توجه داشته باشید کلیه اصول و سیاست‌های جیاواز منطبق با قوانین
                جمهوری اسلامی ایران، قانون تجارت الکترونیک و قانون حمایت از حقوق
                مصرف کننده است و متعاقبا کاربر نیز موظف به رعایت قوانین مرتبط با
                کاربر است.
              </p>
              <p>
                در صورتی که در قوانین مندرج و سیاست‌های جیاواز تغییراتی در آینده
                ایجاد شود، در همین صفحه منتشر و به‌روزرسانی می شود و شما توافق
                می‌کنید که استفاده مستمر شما از سایت به معنی پذیرش هرگونه تغییر
                است.
              </p>
            </span>
          </div>
          <Accordion
            titleStyle="text-sm md:text-lg font-bold text-text"
            label="تعریف مشتری یا کاربر"
            plus
          >
            <span className="leading-7 text-text-secondary border-t-[1.5px] border-stroke-2 pt-6">
              <p>
                - مشتری یا کاربر به شخصی گفته می‌شود که با اطلاعات کاربری خود که
                در فرم ثبت‌نام درج کرده است، به ثبت سفارش یا هرگونه استفاده از
                خدمات جیاواز اقدام کند.
              </p>
              <p>
                - همچنین از آنجا که جیاواز یک وب‌سایت خرده‌فروشی آنلاین است، طبق
                قانون تجارت الکترونیک، مشتری یا مصرف کننده هر شخصی است که به
                منظوری جز تجارت یا شغل حرفه‌ای به خرید کالا یا خدمات اقدام
                می‌کند.
              </p>
            </span>
          </Accordion>
          <Accordion
            titleStyle="text-sm md:text-lg font-bold text-text"
            label="اصالت و کیفیت محصولات"
            plus
          >
            <div className="flex flex-col items-start leading-7 text-text-secondary border-t-[1.5px] border-stroke-2 pt-6">
              <span>
                <h3>🔹 محصولات اورجینال (Original)</h3>
                <p>
                  - تمامی کالاهای اورجینال جیاواز وارداتی بوده و همراه با ضمانت
                  اصالت ارائه می‌شوند.
                </p>
                <p>
                  - کیفیت محصولات اورجینال کاملاً مطابق با استانداردهای جهانی
                  است.
                </p>
                <p>
                  - مشتریان می‌توانند با اطمینان کامل از اصالت و ماندگاری کالا
                  خرید کنند.
                </p>
              </span>
              <span>
                <h3>🔹 محصولات مستر (Master)</h3>
                <p>
                  - محصولات مستر نسخه‌های باکیفیت و نزدیک به اورجینال هستند که
                  با جزئیات دقیق و استاندارد بالا تولید شده‌اند.
                </p>
                - در صفحه‌ی هر محصول، نوع کیفیت (اورجینال یا مستر) به‌طور شفاف
                ذکر می‌شود تا مشتری با آگاهی کامل انتخاب کند.
              </span>
              <p>
                - جیاواز متعهد است هیچ‌گونه کالای تقلبی یا درجه‌دو به جز موارد
                بالا را عرضه نکند.
              </p>
            </div>
          </Accordion>
          <Accordion
            titleStyle="text-sm md:text-lg font-bold text-text"
            label="حقوق مشتریان"
            plus
          >
            <span className="flex flex-col items-start leading-7 text-text-secondary border-t-[1.5px] border-stroke-2 pt-6">
              <p>
                - اطلاعات شخصی مشتریان نزد جیاواز محفوظ بوده و تنها برای پردازش
                سفارش‌ها استفاده می‌شود.
              </p>
              <p>
                - مشتریان حق دارند در هر زمان درخواست حذف یا ویرایش اطلاعات حساب
                کاربری خود را ارائه دهند.
              </p>
              <p>- امکان بازگشت کالا مطابق با شرایط بازگشت جیاواز فراهم است.</p>
            </span>
          </Accordion>
          <Accordion
            titleStyle="text-sm md:text-lg font-bold text-text"
            label="سفارش و پرداخت"
            plus
          >
            <span className="flex flex-col items-start leading-7 text-text-secondary border-t-[1.5px] border-stroke-2 pt-6">
              <p>
                - قیمت‌ها و موجودی کالا ممکن است بدون اطلاع قبلی تغییر کنند.
              </p>
              <p>
                - سفارش‌ها تنها پس از ثبت در سیستم و تأیید پرداخت معتبر خواهند
                بود.
              </p>
              <p>
                - در صورت لغو یا بازگشت کالا، هزینه‌ها طبق سیاست‌های جیاواز
                بازگردانده می‌شود.
              </p>
            </span>
          </Accordion>
          <Accordion
            titleStyle="text-sm md:text-lg font-bold text-text"
            label="مالکیت معنوی"
            plus
          >
            <span className="flex flex-col items-start leading-7 text-text-secondary border-t-[1.5px] border-stroke-2 pt-6">
              <p>
                - تمامی محتوا، شامل متن‌ها، تصاویر، لوگو و طراحی‌های جیاواز،
                متعلق به جیاواز بوده و هرگونه استفاده غیرمجاز از آن پیگرد قانونی
                دارد.
              </p>
              <p>
                - استفاده از نام و نشان تجاری جیاواز تنها با مجوز کتبی
                امکان‌پذیر است.
              </p>
            </span>
          </Accordion>
          <Accordion
            titleStyle="text-sm md:text-lg font-bold text-text"
            label="محدودیت مسئولیت"
            plus
          >
            <span className="flex flex-col items-start leading-7 text-text-secondary border-t-[1.5px] border-stroke-2 pt-6">
              <p>
                - جیاواز مسئولیتی در قبال مشکلات ناشی از اختلالات اینترنت،
                خطاهای سیستمی یا عوامل خارج از کنترل خود ندارد.
              </p>
              <p>
                - انتخاب و استفاده از محصولات بر عهده‌ی مشتری است و جیاواز صرفاً
                متعهد به ارائه‌ی اطلاعات دقیق و شفاف می‌باشد.
              </p>
            </span>
          </Accordion>
        </div>
      </div>
    </div>
  );
}

export default TermsPage;
