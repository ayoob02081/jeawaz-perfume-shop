"use client";

import { useRouter } from "next/navigation";
import Login from "../_components/Login";

function page() {
  const router = useRouter();
  return (
    <main className="flex flex-col items-center justify-start h-screen w-screen">
      <div className="flex items-center justify-center max-md:w-[23rem] md:w-[33.8rem] max-md:h-80 md:h-96 bg-white  rounded-3xl shadow-xl animate__animated mt-20">
        <Login
          toggleLoginOpen={() => {
            router.back();
          }}
        />
      </div>
    </main>
  );
}

export default page;
