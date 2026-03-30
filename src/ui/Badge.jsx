import { XMarkIcon } from "@heroicons/react/24/outline";

export function Badge({ title, onClick, error }) {
  return (
    <div
      className={`flex items-center justify-center max-md:gap-3 md:gap-4 px-3 w-fit max-md:h-8 md:h-11 rounded-full ${
        error
          ? "bg-stroke-50 dark:bg-stroke-800/5 border border-primary/10 dark:border-stroke-200/40 text-primary dark:text-stroke-200"
          : " bg-stroke-150 text-stroke-600"
      } snap-center`}
    >
      <p className="max-md:text-xs text-nowrap w-ful">{title}</p>
      {error && (
        <button
          type="button"
          className="flex items-center justify-center size-4 md:size-7"
          onClick={onClick}
        >
          <XMarkIcon className="size-4 md:size-5" />
        </button>
      )}
    </div>
  );
}
