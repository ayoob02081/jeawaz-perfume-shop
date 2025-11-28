import { PulseLoader } from "react-spinners";

function Loading({
  size = 15,
  height = 3,
  width = 200,
  speed = 1,
  className,
  bgColor = "primary",
}) {
  const color = {
    primary: "rgb(204, 49, 45)",
    white: "rgb(255, 255, 255)",
  };
  return (
    <div
      className={`flex w-full items-center justify-center ${className} h-60`}
    >
      <PulseLoader
        color={color[bgColor]}
        cssOverride={{ justifyItems: "center" }}
        speedMultiplier={speed}
        height={height}
        size={size}
        loading
        width={width}
      />
    </div>
  );
}

export default Loading;
