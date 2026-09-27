"use client";

import { useParams } from "next/navigation";
import SingleContactMessagePage from "../_components/SingleContactMessagePage";

function page() {
  const params = useParams();

  return <SingleContactMessagePage messageId={params?.id} />;
}

export default page;
