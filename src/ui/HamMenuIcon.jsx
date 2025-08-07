function HamMenuIcon({ open, className }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-1 ${className} `}>
      <div
        className={`bg-black w-7 h-1 rounded-lg transition-all duration-300 ${
          open ? "rotate-45 translate-y-2" : ""
        }`}
      ></div>
      <div
        className={`bg-black w-7 h-1 rounded-lg transition-all duration-200  ${
          open ? "translate-x-96" : ""
        }`}
      ></div>
      <div
        className={`bg-black w-7 h-1 rounded-lg transition-all duration-300  ${
          open ? "-rotate-45 -translate-y-2" : ""
        }`}
      ></div>
    </div>
  );
}

export default HamMenuIcon;
