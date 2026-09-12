import clsx from "clsx";

function Skeleton({
  className,
  rounded = "rounded-lg",
  animation = "shimmer",
  animate = true,
}) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        "relative isolate overflow-hidden",
        "bg-stroke-250 dark:bg-stroke-0",
        rounded,

        // Pulse
        animate &&
          animation === "pulse" &&
          "animate-pulse",

        // Shimmer
        animate &&
          animation === "shimmer" &&
          [
            "before:absolute",
            "before:inset-0",
            "before:-translate-x-full",
            "before:bg-gradient-to-r",
            "before:from-transparent",
            "before:via-white/90",
            "before:to-transparent",
            "dark:before:via-white/10",
            "before:animate-[shimmer_1.2s_ease-in-out_infinite]",
          ],

        className,
      )}
    />
  );
}

export default Skeleton;