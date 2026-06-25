import FooterDetail from "./FooterDetail";

function OptionsFooter() {
  return (
    <section className="bg-stroke-50">
      <div className="flex items-center justify-center lg:justify-betwee flex-wrap gap-8 max-md:gap-y- p-6 max-md:pb-32">
        <FooterDetail
          src="/images/24-hours-icon.svg"
          width="max-sm:size-6 sm:size-7"
          className="dark:invert"
          title="پشتیبانی ۲۴ ساعته"
          discription="پاسخ‌گویی سریع، همیشه آنلاین"
          direction="max-md:flex-col h-full w-fit"
          items="max-md:items-center"
        />
        <FooterDetail
          src="/images/special-prodcts-icon.svg"
          width="max-sm:size-6 sm:size-7"
          className="dark:invert"
          title="محصولات منحصر به فرد"
          discription="رایحه‌هایی خاص و کمیاب"
          direction="max-md:flex-col h-full w-fit"
          items="max-md:items-center"

        />
        <FooterDetail
          src="/images/fast-deliver-icon.svg"
          width="max-sm:size-6 sm:size-7"
          className="dark:invert"
          title="ارسال به سراسر کشور"
          discription="تحویل سریع، مطمئن، سراسری"
          direction="max-md:flex-col h-full w-fit"
          items="max-md:items-center"

        />
        <FooterDetail
          src="/images/certificate-badge-icon.svg"
          width="max-sm:size-6 sm:size-7"
          className="dark:invert"
          title="تضمین کیفیت"
          discription="اصل بودن با ضمانت"
          direction="max-md:flex-col h-full w-fit"
          items="max-md:items-center"

        />
      </div>
    </section>
  );
}

export default OptionsFooter;
