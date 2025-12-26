"use client";

import { useRouter } from "next/navigation";
import Login from "../_components/Login";

function page() {
  const router = useRouter();
  return (
    <main className="flex flex-col items-center justify-start h-screen w-screen mt-40 md:mt-32">
      <div className="flex items-center justify-center max-md:w-[23rem] md:w-[33.8rem] max-md:h-80 md:h-[30rem]">
        <Login
          closeBtn={false}
          toggleLoginOpen={() => {
            router.back();
          }}
        />
      </div>
    </main>
  );
}

export default page;
