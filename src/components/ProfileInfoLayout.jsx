import OrderStatusButton from "@/ui/OrderStatusButton";

function ProfileInfoLayout({ className, children }) {
  return (
    <div
      className={`flex flex-col justify-center gap-4 md:gap-6 pb-28 max-lg:px-4 ${className}`}
    >
      <div className="max-lg:hidden w-full">
        <OrderStatusButton />
      </div>
      {children}
    </div>
  );
}

export default ProfileInfoLayout;
