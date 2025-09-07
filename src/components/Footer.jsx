import Logo from "./Logo";

function Footer() {
  return (
    <div className="bg-black h-[43.5rem] w-full max-sm:hidden">
      <div className="flex flex-col items-center gap-6 p-16">
        <div className="flex flex-col items-center justify-center gap-4 text-white">
          <Logo width="w-28 h-[4.25rem]" />
          <p className="text-sm">جیواز، دنیای رایحه‌های خاصه</p>
        </div>
        <div className="flex flex-col items-center justify-evenly gap-2 text-text-secondary text-xs">
          <p>
            ما اینجاییم تا کمک کنیم عطری رو پیدا کنی که با شخصیتت هم‌صدا باشه.
          </p>
          <p>
            چون باور داریم عطر فقط یک انتخاب روزمره نیست؛ یک امضای شخصیه، بخشی
            از تو که قبل از گفتن هر کلمه‌ای، دیده و حس می‌شه.
          </p>
          <p>
            در دنیای رایحه‌ها، هر بو یک داستانه. بعضی‌ها خاطره‌ان، بعضی‌ها
            انگیزه، بعضی‌ها آرامش. و ما در جیواز، همه‌ی این داستان‌ها رو برات
            جمع کردیم
          </p>
        </div>
        <div className="flex items-center justify-evenly w-full text-white gap-6 pb-10 border-b border-text-secondary/60">
          <div className="flex flex-col items-start gap-2">
            <h4 className="text-lg">عطر فروشی</h4>
            <div className="grid grid-cols-2 max-w-48 gap-x-4 gap-y-1 text-base text-text-secondary">
              <p>item1</p>
              <p>item2</p>
              <p>item3</p>
              <p>item4</p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2">
            <h4 className="text-lg">خدمات ما</h4>
            <div className="grid grid-cols-1 max-w-48 gap-x-4 gap-y-1 text-base text-text-secondary">
              <p>item1</p>
              <p>item2</p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2">
            <h4 className="text-lg">3</h4>
            <div className="grid grid-cols-2 max-w-48 gap-x-4 gap-y-1 text-base text-text-secondary">
              <p>item1</p>
              <p>item2</p>
              <p>item3</p>
              <p>item4</p>
            </div>
          </div>
        </div>
        <div className="flex  items-center justify-between w-full px-16 text-white">
          <div className="flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <p>09181231234</p>
              <p>09181231234</p>
            </div>
            <p>Lorem ipsum dolor sit amet, consectetur adipisicing.</p>
          </div>
          <div className="flex flex-col justify-between gap-4">
            <p>trust us</p>
            <div>trust icons</div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between w-full px-16 text-white">
        <p>Rules Lorem ipsum dolor sit amet.</p>
        <div>insta</div>
      </div>
    </div>
  );
}

export default Footer;
