import ImageFrame from "@/components/ImageFrame";

function Badge({ title, onClick }) {
  return (
    <div className="flex items-center justify-between gap-2 w-[7.45rem] h-11 px-4 rounded-[40px] bg-primary/5 border border-primary/10 text-primary">
      <p>{title}</p>
      <button onClick={onClick}>
        <ImageFrame
          src="/images/close-icon-red.svg"
          alt="close icon"
          className="size-3"
        />
      </button>
    </div>
  );
}

export default Badge;
