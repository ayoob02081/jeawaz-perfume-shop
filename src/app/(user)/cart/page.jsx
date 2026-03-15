import CartLayout from "./_components/CartLayout";

export const metadata = {
  title: "سبد خرید",
  description: "سبد خرید",
};

function CartPage() {
  return (
    <div className="mt-48 md:mt-40">
      <CartLayout />
    </div>
  );
}

export default CartPage;
