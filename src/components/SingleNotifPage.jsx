import { toLocalDateString } from "@/utils/toLocalDate";
import Loading from "./Loading";
import Error from "./Error";

function SingleNotifPage({
  title,
  createdAt,
  message,
  isPending,
  error,
  children,
}) {
  if (isPending) {
    return <Loading />;
  }

  if (error) {
    return <Error />;
  }

  return (
    <div className="flex flex-col items-center justify-strat gap-6 h-full bg-stroke-0 rounded-2xl p-4 border border-stroke-200">
      <span
        className={`flex flex-col items-center justify-start gap-2 size-full rounded-xl px-4 `}
      >
        <p className="font-bold text-lg text-stroke-800">{title}</p>
        <p className="text-stroke-400 text-sm">
          {toLocalDateString(createdAt)}
        </p>
        <p className="flex items-center justify-start text-md text-stroke-600">
          {message}
        </p>
      </span>
      {children}
    </div>
  );
}

export default SingleNotifPage;
