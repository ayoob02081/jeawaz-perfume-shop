"use client";

import { usePathname, useRouter } from "next/navigation";

function NotifTypes() {
  return (
    <div className="flex items-center justify-start max-lg:p-6 gap-4 snap-x overflow-x-scroll scrollbar-none">
      <NotifType type="all" />
      <NotifType type="offProducts" />
      <NotifType type="suggestion" />
    </div>
  );
}

export default NotifTypes;

function NotifType({ type }) {
  const pathName = usePathname();
  const router = useRouter();
  const types = {
    all: { title: "همه پیام ها" },
    offProducts: { title: "تخفیف ها" },
    suggestion: { title: "پیشنهادات لحظه آخر" },
  };

  return (
    <button
      onClick={() => router.replace(`/profile/notifs/${type}`)}
      className={`flex items-center justify-center px-4 max-md:rounded-lg md:rounded-3xl w-fit h-9
        ${
          pathName.endsWith(type)
            ? "md:border md:border-primary max-md:bg-primary md:bg-white max-md:text-white md:font-bold md:text-primary"
            : "md:border md:border-stroke-2 max-md:bg-primary/10 md:bg-grey text-text"
        } snap-center`}
    >
      <p className="text-sm text-nowrap font-bold">{types[type].title}</p>
    </button>
  );
}

function NotifTypePage({ type }) {
  return (
    <div className="flex items-start justify-center gap-2 max-lg:px-6">
      <div className="bg-red/30">notif image</div>
      <div className="flex flex-col items-start justify-start gap-2 ">
        <div className="flex items-center justify-start gap-2">
          <div>آخرین محصولات تخفیف خورده سال</div>
          <div>1404/02/25</div>
        </div>
        <div className="flex items-center justify-start">
          لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با
          استفاده از طراحان گرافیک است، چاپگرها و متون بلکه روزنامه و مجله در
          ستون و سطرآنچنان که لازم است، و برای شرایط فعلی تکنولوژی مورد نیاز، و
          کاربردهای
        </div>
      </div>
    </div>
  );
}
