import ProfileInfoLayout from "@/components/ProfileInfoLayout";
import ProfileInfo from "../_components/ProfileInfo";
import AddressInfo from "../_components/AddressInfo";

export default function Home() {
  return (
    <ProfileInfoLayout className="w-full">
      <ProfileInfo />
      <AddressInfo />
    </ProfileInfoLayout>
  );
}
