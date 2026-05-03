import { useState } from "react";
import {
  useAddToCart,
  useGetAllCartItems,
  useRemoveFromCart,
  useUpdateQuantity,
} from "./useCart";

export function useQuantityHandler(
  product,
  defaultVolume,
  volumeMode,
  cartItem,
) {
  const { addToCart } = useAddToCart();
  const { isDeleting, removeFromCart } = useRemoveFromCart();
  const { data: cart } = useGetAllCartItems();
  const { mutate: updateQuantity } = useUpdateQuantity();

  const [selectedVolume, setSelectedVolume] = useState(defaultVolume);
  const defaultQuantity = cart?.items.find(
    (item) =>
      item.product.id === product.id &&
      item.mode === volumeMode &&
      item.volume === selectedVolume,
  );
  const [quantity, setQuantity] = useState(
    cartItem?.quantity || defaultQuantity,
  );

  const RemoveFromCartHandler = () => {
    const itemToDelete =
      cartItem || cart?.items.find((item) => item.volume === selectedVolume);
    if (quantity > 1) {
      updateQuantity({
        itemId: itemToDelete?.id,
        quantity: quantity - 1,
      });
    } else {
      removeFromCart(itemToDelete?.id);
    }
    setQuantity((i) => i > 0 && --i);
  };

  const AddToCartHandler = () => {
    const orderData = {
      productId: product.id, //1
      quantity: quantity + 1, // 1
      mode: volumeMode, //"sealed"
      volume: selectedVolume, // 105
    };

    addToCart(orderData);
    if (orderData.quantity * selectedVolume < product.stock) {
      setQuantity((i) => ++i);
    }
  };

  return {
    RemoveFromCartHandler,
    AddToCartHandler,
    selectedVolume,
    setSelectedVolume,
    quantity,
    setQuantity,
    defaultQuantity,
  };
}
