import Link from "next/link";
import { parseNotificationMessage } from "@/utils/notificationMessage.mjs";

// A notification's message: React text nodes only, so content stays escaped.
// Trusted order URLs become in-app links for the reader's `audience`
// ("customer" → their order page, "admin" → the admin order detail); without
// a known audience the message stays plain text. Line breaks are kept and
// long URLs wrap instead of overflowing.
function NotificationMessage({ message, audience, className = "" }) {
  return (
    <p className={`whitespace-pre-line wrap-anywhere ${className}`}>
      {parseNotificationMessage(message, { audience }).map((segment, index) =>
        segment.type === "orderLink" ? (
          <Link
            key={index}
            href={segment.href}
            prefetch={false}
            // A URL reads left to right; a Persian label keeps the RTL flow.
            dir={segment.label === segment.text ? "ltr" : undefined}
            className="text-primary underline underline-offset-4"
          >
            {segment.label}
          </Link>
        ) : (
          segment.text
        ),
      )}
    </p>
  );
}

export default NotificationMessage;
