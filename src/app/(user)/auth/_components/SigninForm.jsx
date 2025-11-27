import ImageFrame from "@/components/ImageFrame";

function SigninForm({ children, toggleLoginOpen, handleSubmit }) {
  return (
    <form
      className="flex flex-col items-center justify-between md:gap-4 size-full"
      onSubmit={handleSubmit()}
    >
      <button
        className="absolute md:left-6 max-md:top-3 md:top-6 btn max-md:border-0 max-md:h-1.5 max-md:w-10 max-md:rounded-4xl max-md:bg-[#F1F1F1]  md:border-[1.5px] border-stroke md:size-10 rounded-full md:p-0"
        onClick={toggleLoginOpen}
      >
        <ImageFrame
          src="/images/close-simple-icon.svg"
          alt="close icon"
          className="size-3.5 max-md:hidden"
        />
      </button>

      <div className="flex flex-col items-stretch justify-between gap-6 md:gap-8 max-md:mt-4 w-full">
        <div className="relative flex flex-col items-center justify-between gap-2 md:gap-4">
          <span className="md:text-2xl text-text-primary font-bold">
            به وبسایت <span className="text-primary">عطر جیاواز</span> خوش
            آمدید!
          </span>
          <p className="text-xs md:text-sm text-text-secondary">
            برای عضویت در سایت اطلاعات خود را وارد کنید
          </p>
        </div>

        {children}
      </div>
      <button
        type="submit"
        className="bg-primary btn btn--primary w-full h-12 border-0"
      >
        تایید اطلاعات
      </button>
      <div className="max-md:hidden text-text-primary pt-4">
        <span className="*:text-primary flex items-center justify-center gap-1.5 flex-wrap">
          ثبت‌نام شما به معنای پذیرش <p> شرایط عطر جیاواز </p> و
          <p> قوانین حریم خصوصی </p> است
        </span>
      </div>
    </form>
  );
}

export default SigninForm;
