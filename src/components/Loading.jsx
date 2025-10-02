import { BarLoader, SyncLoader } from "react-spinners";

function Loading({
  size = 10,
  height = 3,
  width = 200,
  margin = 3,
  speed = 2,
  className,
}) {
  return (
    <div className={`flex w-full items-center justify-center ${className}`}>
      {/* <SyncLoader
        className="flex"
        color="rgb(var(--color-primary-700))"
        cssOverride={{ justifyItems: "center" }}
        margin={margin}
        size={size}
        speedMultiplier={speed}
      /> */}
      <BarLoader
        // className="flex"
        color="rgb(var(--color-primary-700))"
        cssOverride={{ justifyItems: "center" }}
        speedMultiplier={speed}
        height={height}
        loading
        width={width}
      />
    </div>
  );
}

export default Loading;
