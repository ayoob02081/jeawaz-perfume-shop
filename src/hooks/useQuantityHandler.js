import { useState, useEffect } from "react";
import {
  useAddToCart,
  useGetAllCartItems,
  useRemoveFromCart,
  useUpdateQuantity,
} from "./useCart";
import {
  findCartLine,
  resolveDecrement,
  resolveIncrement,
} from "@/utils/addedToCartContract.mjs";

export function useQuantityHandler(
  product,
  defaultVolume,
  volumeMode,
  cartItem,
  { onAdded } = {},
) {
  // `onAdded` only covers a new cart line; quantity updates keep their toast.
  const { addToCart } = useAddToCart({ onAdded });
  const { removeFromCart } = useRemoveFromCart();
  const { data: cart } = useGetAllCartItems();
  const { updateQuantity } = useUpdateQuantity();

  const [selectedVolume, setSelectedVolume] = useState(defaultVolume);
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    if (defaultVolume !== undefined) {
      setSelectedVolume(defaultVolume);
    }
  }, [defaultVolume]);

  const defaultCartItem = findCartLine(cart, {
    productId: product?.id,
    mode: volumeMode,
    volume: selectedVolume,
  });

  useEffect(() => {
    if (cartItem?.quantity !== undefined) {
      setQuantity(cartItem.quantity);
    } else if (defaultCartItem?.quantity !== undefined) {
      setQuantity(defaultCartItem.quantity);
    } else {
      setQuantity(0);
    }
  }, [cartItem, defaultCartItem]);

  const RemoveFromCartHandler = async () => {
    const action = resolveDecrement({
      line: cartItem || defaultCartItem,
      quantity,
    });
    if (!action) return;

    if (action.type === "update") {
      updateQuantity({
        itemId: action.itemId,
        quantity: action.quantity,
      });
    } else {
      await removeFromCart(action.itemId);
    }

    setQuantity((q) => Math.max(0, q - 1));
  };

  const AddToCartHandler = () => {
    if (!selectedVolume || !product?.id) return;
    if (selectedVolume > product?.stock) return;

    const onError = () => setQuantity((q) => Math.max(0, q - 1));
    const action = resolveIncrement({
      line: cartItem || defaultCartItem,
      quantity,
      request: { productId: product.id, mode: volumeMode, volume: selectedVolume },
    });

    if (action.type === "update") {
      updateQuantity(
        { itemId: action.itemId, quantity: action.quantity },
        { onError },
      );
    } else {
      addToCart(action.payload, { onError });
    }

    setQuantity((q) => q + 1);
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
