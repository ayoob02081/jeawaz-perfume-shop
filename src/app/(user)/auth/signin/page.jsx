"use client";

import { useRouter } from "next/navigation";
import Signin from "../_components/Signin";

function page() {
  const router = useRouter();
  return (
    <main className="flex flex-col items-center justify-start h-auto w-screen">
      <div className="flex items-center justify-center max-md:w-[23rem] md:w-[33.8rem] bg-white  rounded-3xl shadow-xl animate__animated mt-20">
        <Signin
          toggleLoginOpen={() => {
            router.back();
          }}
        />
      </div>
    </main>
  );
}

export default page;
