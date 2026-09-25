import { Suspense } from "react";
import Loading from "@/components/Loading";
import ContactMessagesLayout from "./_components/ContactMessagesLayout";

export default function ContactMessagesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ContactMessagesLayout />
    </Suspense>
  );
}
