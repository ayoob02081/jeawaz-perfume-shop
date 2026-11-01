import { MinusIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { toPersianNumbers } from "@/utils/toPersianNumbers";

function CardEvents({
  RemoveFromCartHandler,
  AddToCartHandler,
  // "+" is disabled while one more unit cannot be bought.
  addDisabled = false,
  // Both wait while the line's previous change is in flight.
  pending = false,
  quantity,
  className,
  btnStyle = "max-lg:size-8 lg:size-12",
  quantityStyle = "max-lg:size-8 lg:size-12 max-lg:text-xs lg:text-lg",
}) {
  return (
    <div className="flex w-full items-center justify-center gap-4">
      <div
        aria-busy={pending}
        className={`${className} flex items-center gap-2 justify-between text-stroke-800 duration-200`}
      >
        <button
          onClick={AddToCartHandler}
          disabled={addDisabled || pending}
          className={` btn-card-event btn-card-event--success ${btnStyle} disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none`}
        >
          <PlusIcon className="max-md:size-3.5 size-6" />
        </button>
        <span
          className={`btn-card-event border-[1.5px] border-stroke-300 rounded-full ${quantityStyle}`}
        >
          {toPersianNumbers(quantity)}
        </span>
        <button
          onClick={RemoveFromCartHandler}
          disabled={pending}
          className={`btn-card-event btn-card-event--error ${btnStyle} duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none`}
        >
          {quantity > 1 ? (
            <MinusIcon className="max-md:size-3.5 size-6" />
          ) : (
            <TrashIcon className="max-md:size-3.5 size-6" />
          )}
        </button>
      </div>
    </div>
  );
}

export default CardEvents;
