import FooterDetail from "./FooterDetail";

function OptionsFooter() {
  return (
    <div className=" bg-secondary mb-20 sm:m-0">
      <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:justify-items-center gap-4 p-6 max-sm:hidden">
        <FooterDetail
          src="/images/24-hours-icon.svg"
          alt="24 hours icon"
          className=""
          width={28}
          title="پشتیبانی ۲۴ ساعته"
          desc="پاسخ‌گویی سریع، همیشه آنلاین"
        />
        <FooterDetail
          src="/images/special-prodcts-icon.svg"
          alt="spcial products icon"
          className=""
          width={28}
          title="محصولات منحصر به فرد"
          desc="رایحه‌هایی خاص و کمیاب"
        />
        <FooterDetail
          src="/images/certificate-badge-icon.svg"
          alt="certificate badge icon"
          className=""
          width={28}
          title="تضمین کیفیت"
          desc="اصل بودن با ضمانت"
        />
        <FooterDetail
          src="/images/truck-icon.svg"
          alt="truck icon icon"
          className=""
          width={28}
          title="ارسال به سراسر کشور"
          desc="تحویل سریع، مطمئن، سراسری"
        />
      </div>
      <div className="flex flex-col flex-wrap items-start justify-evenly gap-4 p-6 sm:hidden">
        <FooterDetail
          src="/images/24-hours-icon.svg"
          alt="24 hours icon"
          className=""
          width={24}
          title="پشتیبانی ۲۴ ساعته"
          desc="پاسخ‌گویی سریع، همیشه آنلاین"
        />
        <FooterDetail
          src="/images/special-prodcts-icon.svg"
          alt="spcial products icon"
          className=""
          width={24}
          title="محصولات منحصر به فرد"
          desc="رایحه‌هایی خاص و کمیاب"
        />
        <FooterDetail
          src="/images/certificate-badge-icon.svg"
          alt="certificate badge icon"
          className=""
          width={24}
          title="تضمین کیفیت"
          desc="اصل بودن با ضمانت"
        />
        <FooterDetail
          src="/images/truck-icon.svg"
          alt="truck icon icon"
          className=""
          width={24}
          title="ارسال به سراسر کشور"
          desc="تحویل سریع، مطمئن، سراسری"
        />
      </div>
    </div>
  );
}

export default OptionsFooter;
