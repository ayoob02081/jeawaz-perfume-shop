"use client";

import { useRouter } from "next/navigation";
import Signin from "../_components/Signin";

function page() {
  const router = useRouter();
  return (
    <main className="flex flex-col items-center justify-start h-auto w-screen mt-40 md:mt-32">
      <div className="flex items-center justify-center max-md:w-[23rem] md:w-[33.8rem] bg-white">
        <Signin
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
