import NotifTypePage from "@/components/NotifTypePage";
import NotifTypes from "@/components/NotifTypes";

function NotifLayout({ type }) {
  return (
    <div className="flex flex-col items-start justify-start gap-4 lg:border-[1.5px] border-stroke-250 lg:rounded-2.5xl lg:p-4 pb-28">
      <h1 className="max-lg:hidden font-bold text-stroke-800">پیام ها</h1>
      <div className="flex flex-col justify-center lg:gap-6 max-md:border-t-[1.5px] border-stroke-250 w-full">
        <NotifTypes />
        <div className="w-full max-lg:px-4">
          <div className="flex flex-col items-start justify-start w-full max-lg:border border-stroke-200 max-lg:px-4 max-lg:rounded-2xl">
            <NotifTypePage
              type={type}
              className="lg:border-t border-stroke-200"
            />
            <NotifTypePage type={type} className="border-t border-stroke-200" />
            <NotifTypePage type={type} className="border-t border-stroke-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotifLayout;
