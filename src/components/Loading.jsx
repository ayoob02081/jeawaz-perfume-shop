import { PulseLoader } from "react-spinners";

function Loading({ size = 15, height = 3, width = 200, speed = 1, className }) {
  return (
    <div
      className={`flex w-full items-center justify-center ${className} h-60`}
    >
      <PulseLoader
        color="rgb(204, 49, 45)"
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
