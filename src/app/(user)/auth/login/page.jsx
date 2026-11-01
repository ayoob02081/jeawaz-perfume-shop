import Login from "../_components/Login";
import { utilityRobots } from "@/lib/seo.mjs";

// The layout is a client component, so the route metadata lives here.
export const metadata = {
  title: "ورود | ثبت نام",
  robots: utilityRobots(),
};

function page() {
  return (
    <main className="flex flex-col items-center justify-start w-full">
      <div className="flex items-center justify-center max-md:w-full md:w-135 max-md:h-80 md:h-120 md:border border-stroke-300 md:shadow-lg rounded-2xl">
        {/* A direct load has no page to return to: go home after login. */}
        <Login closeBtn={false} afterLoginHref="/" />
      </div>
    </main>
  );
}

export default page;
