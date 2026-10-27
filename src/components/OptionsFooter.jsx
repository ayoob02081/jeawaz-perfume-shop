import FooterDetail from "./FooterDetail";

function OptionsFooter() {
  return (
    <section className="bg-stroke-50">
      <div className="max-sm:grid max-[22.5rem]:grid-cols-1 max-sm:grid-cols-2 max-sm:justify-items-center flex items-center justify-center md:justify-evenly flex-wrap max-sm:gap-y-6 sm:gap-6 max-sm:p-4 p-6 ">
        <FooterDetail
          src="/images/24-hours-icon.svg"
          width="max-sm:size-6 sm:size-7"
          className="dark:invert"
          title="پشتیبانی ۲۴ ساعته"
          discription="پاسخ‌گویی سریع، همیشه آنلاین"
          direction="max-lg:flex-col h-full w-fit"
          items="max-lg:items-center"
        />
        <FooterDetail
          src="/images/fast-deliver-icon.svg"
          width="max-sm:size-6 sm:size-7"
          className="dark:invert"
          title="ارسال به سراسر کشور"
          discription="تحویل سریع، مطمئن، سراسری"
          direction="max-lg:flex-col h-full w-fit"
          items="max-lg:items-center"
        />
        <FooterDetail
          src="/images/special-prodcts-icon.svg"
          width="max-sm:size-6 sm:size-7"
          className="dark:invert"
          title="محصولات منحصر به فرد"
          discription="رایحه‌هایی خاص و کمیاب"
          direction="max-lg:flex-col h-full w-fit"
          items="max-lg:items-center"
        />
        <FooterDetail
          src="/images/certificate-badge-icon.svg"
          width="max-sm:size-6 sm:size-7"
          className="dark:invert"
          title="تضمین کیفیت"
          discription="اصل بودن با ضمانت"
          direction="max-lg:flex-col h-full w-fit"
          items="max-lg:items-center"
        />
      </div>
    </section>
  );
}

export default OptionsFooter;
