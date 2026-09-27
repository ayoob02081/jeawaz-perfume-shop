import { Suspense } from "react";
import PaymentResult from "./_components/PaymentResult";

export const metadata = {
  title: "نتیجه پرداخت",
  robots: { index: false, follow: false },
};

function PaymentResultPage() {
  return (
    <Suspense fallback={null}>
      <PaymentResult />
    </Suspense>
  );
}

export default PaymentResultPage;
