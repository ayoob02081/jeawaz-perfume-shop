import FooterDetail from "./FooterDetail";

function OptionsFooter() {
  return (
    <div className=" bg-secondar bg-secondary-2 md:m-0 max-md:pb-24">
      <div className="flex items-center justify-center lg:justify-between flex-wrap gap-4 p-6">
        <FooterDetail
          src="/images/24-hours-icon.svg"
          alt="24 hours icon"
          className="max-sm:size-6 sm:size-7"
          title="پشتیبانی ۲۴ ساعته"
          discription="پاسخ‌گویی سریع، همیشه آنلاین"
        />
        <FooterDetail
          src="/images/24-hours-icon.svg"
          alt="24 hours icon"
          className="max-sm:size-6 sm:size-7"
          title="محصولات منحصر به فرد"
          discription="رایحه‌هایی خاص و کمیاب"
        />
        <FooterDetail
          src="/images/24-hours-icon.svg"
          alt="24 hours icon"
          className="max-sm:size-6 sm:size-7"
          title="تضمین کیفیت"
          discription="اصل بودن با ضمانت"
        />
        <FooterDetail
          src="/images/24-hours-icon.svg"
          alt="24 hours icon"
          className="max-sm:size-6 sm:size-7"
          title="ارسال به سراسر کشور"
          discription="تحویل سریع، مطمئن، سراسری"
        />
      </div>
    </div>
  );
}

export default OptionsFooter;
