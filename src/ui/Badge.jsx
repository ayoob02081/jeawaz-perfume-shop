import ImageFrame from "@/components/ImageFrame";

export function Badge({ title, onClick, error }) {
  return (
    <div
      className={`flex items-center justify-center max-md:gap-3 md:gap-4 px-3 w-fit max-md:h-8 md:h-11 rounded-full ${
        error
          ? "bg-secondary-2 border border-primary/10 text-primary"
          : " bg-secondary text-text-secondary"
      } snap-center`}
    >
      <p className="max-md:text-xs text-nowrap w-ful">{title}</p>
      {error && (
        <button
          type="button"
          className="flex items-center justify-center size-4 md:size-7"
          onClick={onClick}
        >
          <ImageFrame
            src="/images/close-icon-red.svg"
            alt="close icon"
            className="size-2 md:size-5"
          />
        </button>
      )}
    </div>
  );
}
