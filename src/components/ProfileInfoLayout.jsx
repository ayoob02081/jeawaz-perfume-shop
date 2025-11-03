import AllOrderStatus from "./AllOrderStatus";

function ProfileInfoLayout({ className, children }) {
  return (
    <div
      className={`flex flex-col justify-center gap-4 md:gap-6 pb-28 px-4 ${className}`}
    >
      <div className="max-md:hidden">
        <AllOrderStatus />
      </div>
      {children}
    </div>
  );
}

export default ProfileInfoLayout;
