import FooterDetail from "./FooterDetail";

function OptionsFooter() {
  return (
    <section className="bg-stroke-50">
      <div className="flex items-center justify-center lg:justify-between flex-wrap gap-4 p-6 max-md:pb-32">
        <FooterDetail
          src="/images/24-hours-icon.svg"
          width="max-sm:size-6 sm:size-7"
          title="پشتیبانی ۲۴ ساعته"
          discription="پاسخ‌گویی سریع، همیشه آنلاین"
        />
        <FooterDetail
          src="/images/special-prodcts-icon.svg"
          width="max-sm:size-6 sm:size-7"
          title="محصولات منحصر به فرد"
          discription="رایحه‌هایی خاص و کمیاب"
        />
        <FooterDetail
          src="/images/certificate-badge-icon.svg"
          width="max-sm:size-6 sm:size-7"
          title="تضمین کیفیت"
          discription="اصل بودن با ضمانت"
        />
        <FooterDetail
          src="/images/fast-deliver-icon.svg"
          width="max-sm:size-6 sm:size-7"
          title="ارسال به سراسر کشور"
          discription="تحویل سریع، مطمئن، سراسری"
        />
      </div>
    </section>
  );
}

export default OptionsFooter;
