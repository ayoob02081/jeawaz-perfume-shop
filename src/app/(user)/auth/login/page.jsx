import Login from "../_components/Login";

function page() {
  return (
    <main className="flex flex-col items-center justify-start w-full">
      <div className="flex items-center justify-center max-lg:w-fit md:w-135 max-md:h-80 md:h-120 md:border border-stroke-300 md:shadow-lg rounded-2xl">
        <Login closeBtn={false} />
      </div>
    </main>
  );
}

export default page;
