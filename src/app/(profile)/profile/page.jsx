import ProfileInfoLayout from "@/components/ProfileInfoLayout";
import ProfileInfo from "./_components/ProfileInfo";
import AddressLayout from "./_components/AddressLayout";

export default function Home() {
  return (
    <ProfileInfoLayout className="w-full overflow-y-auto p-6 rounded-3xl bg-stroke-100 border border-stroke-200 shadow-xl">
      <ProfileInfo />
      <AddressLayout />
    </ProfileInfoLayout>
  );
}
