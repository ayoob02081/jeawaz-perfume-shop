import { useState, useEffect } from "react";
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
  const { removeFromCart } = useRemoveFromCart();
  const { data: cart } = useGetAllCartItems();
  const { mutate: updateQuantity } = useUpdateQuantity();

  const [selectedVolume, setSelectedVolume] = useState(defaultVolume);
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    if (defaultVolume !== undefined) {
      setSelectedVolume(defaultVolume);
    }
  }, [defaultVolume]);

  const defaultCartItem = cart?.items?.find(
    (item) =>
      item.product.id === product?.id &&
      item.mode === volumeMode &&
      item.volume === selectedVolume,
  );

  useEffect(() => {
    if (cartItem?.quantity !== undefined) {
      setQuantity(cartItem.quantity);
    } else if (defaultCartItem?.quantity !== undefined) {
      setQuantity(defaultCartItem.quantity);
    } else {
      setQuantity(0);
    }
  }, [cartItem, defaultCartItem]);

  const RemoveFromCartHandler = () => {
    const item = cartItem || defaultCartItem;
    if (!item) return;

    if (quantity > 1) {
      updateQuantity({
        itemId: item.id,
        quantity: quantity - 1,
      });
    } else {
      removeFromCart(item.id);
    }

    setQuantity((q) => Math.max(0, q - 1));
  };

  const AddToCartHandler = () => {
    if (!selectedVolume || !product?.id) return;

    const orderData = {
      productId: product.id,
      quantity: quantity + 1,
      mode: volumeMode,
      volume: selectedVolume,
    };

    addToCart(orderData);

    if ((quantity + 1) * selectedVolume <= product?.stock) {
      setQuantity((q) => q + 1);
    }
  };

  return {
    RemoveFromCartHandler,
    AddToCartHandler,
    selectedVolume,
    setSelectedVolume,
    quantity,
    setQuantity,
    defaultCartItem,
  };
}
