import CartLayout from "./_components/CartLayout";
import { utilityRobots } from "@/lib/seo.mjs";

export const metadata = {
  title: "سبد خرید",
  description: "سبد خرید",
  robots: utilityRobots(),
};

function CartPage() {
  return <CartLayout />;
}

export default CartPage;
