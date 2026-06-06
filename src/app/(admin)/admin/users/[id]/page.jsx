"use client";

import { useParams } from "next/navigation";
import SingleUserPage from "../_components/SingleUserPage";

function page() {
  const params = useParams();

  return <SingleUserPage userId={params?.id} />;
}

export default page;
