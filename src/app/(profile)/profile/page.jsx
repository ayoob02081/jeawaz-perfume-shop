import ProfileInfoLayout from "@/components/ProfileInfoLayout";
import ProfileInfo from "./_components/ProfileInfo";
import AddressLayout from "./_components/AddressLayout";

export default function Home() {
  return (
    <ProfileInfoLayout className="w-fit overflow-y-auto">
      <ProfileInfo />
      <AddressLayout />
    </ProfileInfoLayout>
  );
}
