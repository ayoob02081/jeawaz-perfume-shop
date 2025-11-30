import FooterDetail from "./FooterDetail";

function OptionsFooter() {
  return (
    <div className=" bg-secondar bg-footer md:m-0 max-md:pb-24">
      <div className="flex flex-col flex-wrap items-start justify-evenly sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:justify-items-center gap-4 p-6">
        <FooterDetail
          src="/images/24-hours-icon.svg"
          alt="24 hours icon"
          className="max-sm:size-6 sm:size-7"
        >
          <div className="grow flex flex-col items-start justify-between gap-1 ">
            <p className="font-bold">پشتیبانی ۲۴ ساعته</p>
            <p className="text-text-secondary">پاسخ‌گویی سریع، همیشه آنلاین</p>
          </div>
        </FooterDetail>
        <FooterDetail
          src="/images/special-prodcts-icon.svg"
          alt="spcial products icon"
          className="max-sm:size-6 sm:size-7"
        >
          <div className="grow flex flex-col items-start justify-between gap-1 ">
            <p className="font-bold">محصولات منحصر به فرد</p>
            <p className="text-text-secondary">رایحه‌هایی خاص و کمیاب</p>
          </div>
        </FooterDetail>
        <FooterDetail
          src="/images/certificate-badge-icon.svg"
          alt="certificate badge icon"
          className="max-sm:size-6 sm:size-7"
        >
          <div className="grow flex flex-col items-start justify-between gap-1 ">
            <p className="font-bold">تضمین کیفیت</p>
            <p className="text-text-secondary">اصل بودن با ضمانت</p>
          </div>
        </FooterDetail>
        <FooterDetail
          src="/images/truck-icon.svg"
          alt="truck icon icon"
          className="max-sm:size-6 sm:size-7"
        >
          <div className="grow flex flex-col items-start justify-between gap-1 ">
            <p className="font-bold">ارسال به سراسر کشور</p>
            <p className="text-text-secondary">تحویل سریع، مطمئن، سراسری</p>
          </div>
        </FooterDetail>
      </div>
    </div>
  );
}

export default OptionsFooter;
