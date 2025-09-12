import ImageFrame from "@/components/ImageFrame";

function BrandFilter({ title, src, alt, onClick, className }) {
  return (
    <div className="flex items-center justify-between gap-2 h-12 px-2 rounded-[40px] ">
      <p>{title}</p>
      <button
        onClick={onClick}
        className="flex items-center justify-center px-2 py-1 bg-white rounded-full size-9 "
      >
        <ImageFrame src={src} alt={alt} className={`size-6 ${className}`} objectFit="cover" />
      </button>
    </div>
  );
}

export default BrandFilter;
