import ImageFrame from "@/components/ImageFrame";

function Badge({ title, onClick }) {
  return (
    <div className="flex items-center justify-center max-md:gap-3 md:gap-4 max-md:min-w-[4.2rem] md:min-w-[7.45rem] max-md:h-8 md:h-11 px- rounded-[40px] bg-primary/5 border border-primary/10 text-primary snap-center">
      <p className="max-md:text-xs">{title}</p>
      <button
        className="flex items-center justify-center size-4"
        onClick={onClick}
      >
        <ImageFrame
          src="/images/close-icon-red.svg"
          alt="close icon"
          className="size-2"
        />
      </button>
    </div>
  );
}

export default Badge;
