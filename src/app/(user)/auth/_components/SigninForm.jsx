import FormModalLayout from "@/components/FormModalLayout";
import Loading from "@/components/Loading";
import { useRouter } from "next/navigation";
import AuthLayout from "./AuthLayout";

function SigninForm({
  children,
  toggleModalOpen,
  handleSubmit,
  isPending,
  closeBtn,
  isAllFieldesSet,
}) {
  return (
    <FormModalLayout
      onClose={toggleModalOpen}
      handleSubmit={handleSubmit}
      closeBtn={closeBtn}
    >
      <AuthLayout isPending={isPending} isAllFieldesSet={isAllFieldesSet}>
        {children}
      </AuthLayout>
    </FormModalLayout>
  );
}

export default SigninForm;
