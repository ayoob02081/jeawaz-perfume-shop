import { ArrowLeftIcon } from "@heroicons/react/24/outline";

function BannerCard() {
  return (
    <div className="relative w-[21.5rem] h-56 border-2 border-primary-10 rounded-2xl">
      <div>backgrond</div>

      <button className="absolute bottom-8 right-5 flex items-center justify-between gap-2 px-3 py-2 text-xs text-white bg-primary hover:text-primary hover:bg-white ring-4 ring-primary-10 rounded-4xl duration-200">
        <p className="">watch products</p>
        <div>
          <ArrowLeftIcon className=" size-4" />
        </div>
      </button>
    </div>
  );
}

export default BannerCard;
