import Skeleton from "@/ui/Skeleton";

function ProfileLoadingFrame({ label, children, className = "" }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="w-full">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className={className}>{children}</div>
    </div>
  );
}

export function ProfileInfoSkeleton() {
  return (
    <ProfileLoadingFrame label="در حال بارگذاری اطلاعات کاربری" className="w-full border md:border-[1.5px] border-stroke-200 rounded-2xl p-4 bg-stroke-0">
      <div className="flex items-center justify-between w-full pb-4">
        <Skeleton animate={false} className="w-28 h-6" />
        <Skeleton animate={false} className="w-24 h-6" />
      </div>
      <div className="flex max-md:flex-col max-md:justify-center md:justify-between md:items-center border-t border-stroke-200 pt-4 max-md:gap-6">
        {[0, 1, 2].map((column) => (
          <div key={column} className={`flex flex-col items-start justify-between gap-6 md:gap-10 md:py-2 w-full ${column ? "md:border-r border-stroke-200 md:pr-10" : ""}`}>
            {[0, 1].map((row) => (
              <span key={row} className="flex md:flex-col items-center md:items-start justify-between md:justify-center gap-2 w-full">
                <Skeleton animate={false} className="w-24 h-5 md:h-6" />
                <Skeleton animate={false} className="w-28 h-5 max-w-full" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </ProfileLoadingFrame>
  );
}

export function ProfileAddressesSkeleton() {
  return (
    <ProfileLoadingFrame label="در حال بارگذاری آدرس‌ها" className="flex flex-col gap-3 w-full border md:border-[1.5px] border-stroke-200 rounded-2xl bg-stroke-0 p-4">
      <div className="flex items-center justify-between w-full pb-4">
        <Skeleton animate={false} className="w-24 h-5 md:h-6" />
        <Skeleton animate={false} className="w-32 h-6" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-6 w-full border-t border-stroke-200 pt-4">
        <div className="flex flex-col gap-4 md:col-span-2">
          <Skeleton animate={false} className="w-24 h-6" />
          <Skeleton animate={false} className="w-full max-w-80 h-5 md:h-6" />
        </div>
        <div className="flex justify-between md:justify-end gap-4 w-full">
          <Skeleton animate={false} className="w-20 h-6 max-md:h-10" />
          <Skeleton animate={false} className="w-20 h-6 max-md:h-10" />
        </div>
        <div className="flex flex-col md:col-span-3 md:flex-row md:flex-wrap gap-6 md:gap-4 w-full">
          {[0, 1, 2, 3, 4].map((index) => <Skeleton key={index} animate={false} className="w-full md:w-32 h-5 md:h-8" />)}
        </div>
      </div>
    </ProfileLoadingFrame>
  );
}
