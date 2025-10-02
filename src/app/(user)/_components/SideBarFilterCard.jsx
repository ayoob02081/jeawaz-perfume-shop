import ImageFrame from "@/components/ImageFrame";

function SideBarFilterCard({ title, fieldsetId, children, className }) {
  return (
    <div className={`flex flex-col items-start gap-5 text-sm ${className}`}>
      <div className="flex items-center gap-1">
        <ImageFrame
          src="/images/star-2-primery-icon.svg"
          alt="star icon"
          className="size-4"
        />
        <h5 className="text-text-primary">{title}</h5>
      </div>
      <fieldset id={fieldsetId} className="flex flex-col items-start gap-5">
        {children}
      </fieldset>
    </div>
  );
}

export default SideBarFilterCard;
