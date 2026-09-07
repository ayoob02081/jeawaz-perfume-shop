import clsx from "clsx";

function Skeleton({ className, rounded = "rounded-lg", animate = true }) {
  return (
    <div
      className={clsx(
        "bg-stroke-150 dark:bg-stroke-100",
        rounded,
        animate && "animate-pulse",
        className,
      )}
    />
  );
}

export default Skeleton;
