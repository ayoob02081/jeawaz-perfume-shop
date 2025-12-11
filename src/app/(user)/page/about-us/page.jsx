import FooterDetail from "@/components/FooterDetail";
import ImageFrame from "@/components/ImageFrame";
import SupportBox from "@/components/SupportBox";

function AboutUsPage() {
  return (
    <div className="container mx-auto xl:max-w-7xl my-8">
      <div className="flex flex-col w-full">
        {/* about us */}
        <div className="flex flex-col items-center w-full gap-6 px-6 mb-20 md:mb-28 lg:mb-36 xl:mb-48">
          <h1 className="text-xs md:text-base text-primary font-bold">
            کمی درباره ما بدانید ...
          </h1>
          <p className="text-center text-2xl md:text-3xl font-bold text-text ">
            چطور شروع کردیم و چرا به دنیای عطر علاقه‌مند شدیم؟
          </p>
          <p className="leading-7 text-xs md:text-sm text-text-secondary text-center ">
            همه چیز از یک حس شروع شد، نه یک تصمیم جدی یا برنامه‌ریزی دقیق، فقط
            یک حس عمیق نسبت به رایحه‌ها؛ اون لحظه‌ای که بوی یک عطر ما رو برای
            چند ثانیه برد به گذشته، به یک آدم، به یک خاطره‌ی گمشده. همون‌جا
            فهمیدیم عطر فقط یک بو نیست، بلکه زبانیه برای گفتن حرف‌هایی که شاید
            نشه با کلمات بیانشون کرد. از همون روزها علاقه‌مون به دنیای عطر جدی
            شد؛ شروع کردیم به تست کردن، خوندن، شناختن ترکیب‌ها و نت‌ها، و کم‌کم
            دیدیم که این علاقه فقط برای خودمون نیست؛ دوست‌ها و اطرافیانمون هم
            ازمون مشورت می‌خواستن !
          </p>
        </div>
        <div className="relative aspect-3/1 h-1/2 mt-24 md:mt-28 lg:mt-36 w-full px-6 bg-background-app sm:rounded-t-xl">
          <ImageFrame
            src="/images/caucasian-woman-applying-perfume-her-neck.webp"
            alt="caucasian-woman-applying-perfume-her-neck"
            className="absolute -top-2/3 aspect-2/1 w-full rounded-xl md:rounded-3xl overflow-hidden"
            objectFit="cover"
            objectPosition="top"
          />
        </div>
        {/* why us */}
        <div className="flex flex-col items-center justify-center gap-16 bg-background-app sm:rounded-b-3xl pb-16">
          <div className="flex flex-col items-center w-full gap-6 px-6 md:mt-8 ">
            <p className="text-center text-xl md:text-2xl font-bold text-text">
              چرا ما را انتخاب می کنید؟
            </p>
            <p className="leading-7 text-xs md:text-sm text-text-secondary text-center ">
              تنوع فوق‌العاده، قیمت‌های رقابتی، ارسال سریع و ضمانت اصالت کالا؛
              این‌ها تنها بخشی از دلایلی‌ست که مشتریان ما را به دوستان وفادارمان
              تبدیل کرده است.
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <FooterDetail
              src="/images/24-hours-icon.svg"
              alt="24 hours icon"
              className="max-sm:size-6 sm:size-7"
              title="پشتیبانی ۲۴ ساعته"
              discription="پاسخ‌گویی سریع، همیشه آنلاین"
              direction="flex-col h-full bg-white px-6 py-8 rounded-[20px]"
              bg="bg-background-app"
              items="items-center"
            />
            <FooterDetail
              src="/images/24-hours-icon.svg"
              alt="24 hours icon"
              className="max-sm:size-6 sm:size-7"
              title="محصولات منحصر به فرد"
              discription="رایحه‌هایی خاص و کمیاب"
              direction="flex-col h-full bg-white px-6 py-8 rounded-[20px]"
              bg="bg-background-app"
              items="items-center"
            />
            <FooterDetail
              src="/images/24-hours-icon.svg"
              alt="24 hours icon"
              className="max-sm:size-6 sm:size-7"
              title="تضمین کیفیت"
              discription="اصل بودن با ضمانت"
              direction="flex-col h-full bg-white px-6 py-8 rounded-[20px]"
              bg="bg-background-app"
              items="items-center"
            />
            <FooterDetail
              src="/images/24-hours-icon.svg"
              alt="24 hours icon"
              className="max-sm:size-6 sm:size-7"
              title="ارسال به سراسر کشور"
              discription="تحویل سریع، مطمئن، سراسری"
              direction="flex-col h-full bg-white px-6 py-8 rounded-[20px]"
              bg="bg-background-app"
              items="items-center"
            />
          </div>
        </div>
        {/* our mission */}
        <div className="flex flex-col items-center justify-center gap-6 p-6 pt-16">
          <div className="flex justify-center items-center gap-1 w-full px-6 mb-6 text-base sm:text-[28px] font-bold">
            <p className="text-text">جایی که عطر</p>
            <ImageFrame
              src="/images/star-8-primary-icon.svg"
              alt="star icon"
              className="max-sm:size-4 text-text sm:size-9"
            />
            <p className="text-text-primary">تبدیل به تجربه شد</p>
          </div>
          <div className="flex flex-col items-center justify-between gap-10 md:flex-row">
            <div className="flex flex-col items-start justify-start gap-4">
              <div className="flex items-center justify-start gap-2">
                <div className="flex items-end justify-center size-10 md:size-16 bg-primary/10 px-2 pt-4 md:pt-3 rounded-b-full">
                  <ImageFrame
                    alt="number-1"
                    src="/images/number-1.svg"
                    className="h-full w-2.5 md:w-5"
                  />
                </div>
                <p className="text-lg md:text-[27px] font-bold text-text">
                  رسالت ما
                </p>
              </div>
              <p className="max-md:text-xs text-text-secondary">
                ما به شما کمک می‌کنیم تا رایحه‌ای را پیدا کنید که کاملاً با
                شخصیت شما هماهنگ باشد. کیفیت و اصالت عطرها، ارزشمندترین رسالت
                ماست و به همین دلیل، فقط بهترین‌ها را انتخاب می‌کنیم.
              </p>
            </div>
            <div className="flex flex-col items-start justify-start gap-4">
              <div className="flex items-center justify-start gap-2">
                <div className="flex items-end justify-center size-10 md:size-16 bg-primary/10 px-2 pt-4 md:pt-3 rounded-b-full">
                  <ImageFrame
                    alt="number-1"
                    src="/images/number-2.svg"
                    className="h-full w-2.5 md:w-5"
                  />
                </div>
                <p className="text-lg md:text-[27px] font-bold text-text">
                  رسالت ما
                </p>
              </div>
              <p className="max-md:text-xs text-text-secondary">
                از مشاوره‌ی رایگان قبل از خرید تا بسته‌بندی شیک و ارسال به عنوان
                هدیه، تمام جزئیات برای ما مهمه. ما فقط عطر نمی‌فروشیم؛ کنار شما
                هستیم تا مطمئن شیم تجربه‌ای که از خرید دارید، دقیقاً همون چیزی
                باشه که لایقش هستید.
              </p>
            </div>
          </div>
        </div>
        {/* Support */}
        <div className="py-16 px-6">
          <SupportBox />
        </div>
      </div>
    </div>
  );
}

export default AboutUsPage;
