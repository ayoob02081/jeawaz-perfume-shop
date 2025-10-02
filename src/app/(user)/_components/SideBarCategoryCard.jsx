function SideBarCategoryCard({ fieldsetId, children }) {
  return (
    <fieldset id={fieldsetId} className="md:rounded-r-3xl md:overflow-hidden">
      <div className="md:h-[30rem] border-t border-[#E6EAF3] bg-grey max-md:h-[5.45rem]">
        {children}
      </div>
    </fieldset>
  );
}

export default SideBarCategoryCard;
