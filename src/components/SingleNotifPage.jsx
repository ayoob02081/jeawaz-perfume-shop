import { toLocalDateString } from "@/utils/toLocalDate";
import Loading from "./Loading";
import Error from "./Error";
import NotificationMessage from "./NotificationMessage";

function SingleNotifPage({
  title,
  createdAt,
  message,
  audience,
  isPending,
  error,
  onRetry,
  children,
}) {
  if (isPending) {
    return <Loading />;
  }

  // The data belongs to a client query: retry refetches it.
  if (error) {
    return <Error onRetry={onRetry} />;
  }

  return (
    <div className="h-full lg:w-[calc(100%-88px)] px-4">
 
    <div className="flex flex-col items-center justify-strat gap-6 h-full bg-stroke-0 rounded-2xl p-4 border border-stroke-200">
      <span
        className={`flex flex-col items-center justify-start gap-2 size-full rounded-xl px-4 `}
      >
        <p className="font-bold text-lg text-stroke-800">{title}</p>
        <p className="text-stroke-400 text-sm">
          {toLocalDateString(createdAt)}
        </p>
        <NotificationMessage
          message={message}
          audience={audience}
          className="text-md text-stroke-600"
        />
      </span>
      {children}
    </div>
    </div>
  );
}

export default SingleNotifPage;
