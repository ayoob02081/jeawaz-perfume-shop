import React from "react";
import AllOrderStatus from "./AllOrderStatus";
import ProfileInfo from "./ProfileInfo";
import AddressInfo from "./AddressInfo";

function ProfileInfoLayout({className}) {
  return (
    <div className={`flex flex-col justify-center gap-4 md:gap-6 pb-28 px-4 ${className}`}>
      <div className="max-md:hidden">
        <AllOrderStatus />
      </div>
      <ProfileInfo />
      <AddressInfo />
    </div>
  );
}

export default ProfileInfoLayout;
