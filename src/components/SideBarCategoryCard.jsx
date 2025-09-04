import RadioButton from "@/ui/RadioButton";
import ImageFrame from "./ImageFrame";

function SideBarCategoryCard({ fieldsetId, children }) {
  return (
    <fieldset
      id={fieldsetId}
      className="flex items-center justify-evenly border-t border-[#E6EAF3] bg-secondary2 h-[5.45rem]"
    >
      {children}
    </fieldset>
  );
}

export default SideBarCategoryCard;
