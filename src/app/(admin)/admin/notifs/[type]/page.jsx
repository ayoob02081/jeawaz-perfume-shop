import { Suspense } from "react";
import Loading from "@/components/Loading";
import AdminNotificationsLayout from "../_components/AdminNotificationsLayout";

// Admin management list (GET /admin/notifications); the customer inbox is
// /profile/notifs.
export default function AdminNotificationsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminNotificationsLayout />
    </Suspense>
  );
}
