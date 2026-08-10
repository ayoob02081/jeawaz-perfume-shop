import ProfileLayout from "@/components/ProfileLayout";
import ProfileInfo from "../_components/ProfileInfo";
import AddressLayout from "../_components/AddressLayout";

export default function Home() {
  return (
    <ProfileLayout className="">
      <ProfileInfo />
      <AddressLayout />
    </ProfileLayout>
  );
}
