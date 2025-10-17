import ImageFrame from "@/components/ImageFrame";

function NotifTypePage({ type, className, text }) {
  return (
    <div className={`flex items-start justify-center gap-2 py-4 ${className}`}>
      <div className="flex items-center justify-center bg-red/10 max-md:size-10 md:size-9 rounded-lg max-md:min-w-10 md:min-w-9">
        <ImageFrame
          alt={"bolt-icon"}
          className="md:size-4 max-md:size-5"
          src={"/images/bolt-icon.svg"}
        />
      </div>
      <div className="flex flex-col items-start justify-start gap-3 ">
        <div className="flex items-center justify-start gap-2">
          <div className="max-md:text-sm">آخرین محصولات تخفیف خورده سال</div>
          <div className="text-text-secondary-light max-md:text-xs md:text-sm">
            1404/02/25
          </div>
        </div>
        <div className="flex items-center justify-start max-md:text-xs md:text-sm text-text-secondary">
          لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با
          استفاده از طراحان گرافیک است، چاپگرها و متون بلکه روزنامه و مجله در
          ستون و سطرآنچنان که لازم است، و برای شرایط فعلی تکنولوژی مورد نیاز، و
          کاربردهای
        </div>
      </div>
    </div>
  );
}
export default NotifTypePage;
