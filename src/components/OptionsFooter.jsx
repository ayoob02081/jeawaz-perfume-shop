import FooterDetail from "./FooterDetail";

function OptionsFooter() {
  return (
    <div className=" bg-secondary md:m-0 max-md:mb-20">
      <div className="flex flex-col flex-wrap items-start justify-evenly sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:justify-items-center gap-4 p-6">
        <FooterDetail
          src="/images/24-hours-icon.svg"
          alt="24 hours icon"
          className="max-sm:size-6 sm:size-7"
          title="پشتیبانی ۲۴ ساعته"
          desc="پاسخ‌گویی سریع، همیشه آنلاین"
        />
        <FooterDetail
          src="/images/special-prodcts-icon.svg"
          alt="spcial products icon"
          className="max-sm:size-6 sm:size-7"
          title="محصولات منحصر به فرد"
          desc="رایحه‌هایی خاص و کمیاب"
        />
        <FooterDetail
          src="/images/certificate-badge-icon.svg"
          alt="certificate badge icon"
          className="max-sm:size-6 sm:size-7"
          title="تضمین کیفیت"
          desc="اصل بودن با ضمانت"
        />
        <FooterDetail
          src="/images/truck-icon.svg"
          alt="truck icon icon"
          className="max-sm:size-6 sm:size-7"
          title="ارسال به سراسر کشور"
          desc="تحویل سریع، مطمئن، سراسری"
        />
      </div>
    </div>
  );
}

export default OptionsFooter;
