import ImageFrame from "./ImageFrame";

function Logo({ width="w-[5.75rem] h-12", className }) {
  return (
    <div className={`flex items-center w-full ${className}`}>
      <ImageFrame
        src="/images/Jeaawaz-Logo-red-v5.0.webp"
        alt="jeawaz brand icon"
        className={width}
      />
    </div>
  );
}

export default Logo;
