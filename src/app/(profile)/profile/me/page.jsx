import ProfileInfoLayout from "@/components/ProfileInfoLayout";
import ProfileInfo from "../_components/ProfileInfo";
import AddressInfo from "../_components/AddressLayout";

export default function Home() {
  return (
    <ProfileInfoLayout className="w-full">
      <ProfileInfo />
      <AddressInfo />
    </ProfileInfoLayout>
  );
}
