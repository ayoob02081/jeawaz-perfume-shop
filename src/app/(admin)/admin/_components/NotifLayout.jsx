import NotifTypes from "./NotifTypes";
import NotifTypePage from "./NotifTypePage";

function NotifLayout({ type }) {
  return (
    <div className="flex flex-col items-start justify-start gap-4 lg:border-[1.5px] border-stroke-2 lg:rounded-2.5xl lg:p-4 pb-28">
      <h1 className="max-lg:hidden font-bold">پیام ها</h1>
      <div className="flex flex-col justify-center lg:gap-6 max-md:border-t-[1.5px] border-stroke-2 w-full">
        <NotifTypes />
        <div className="w-full max-lg:px-4">
          <div className="flex flex-col items-start justify-start w-full max-lg:border border-stroke max-lg:px-4 max-lg:rounded-2xl">
            <NotifTypePage type={type} className="lg:border-t border-stroke" />
            <NotifTypePage type={type} className="border-t border-stroke" />
            <NotifTypePage type={type} className="border-t border-stroke" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotifLayout;
