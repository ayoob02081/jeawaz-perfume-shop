import { sessionLifecycle } from "@/utils/sessionLifecycle.mjs";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  cartKeys,
  useAddToCart,
  useGetAllCartItems,
  useRemoveFromCart,
  useUpdateQuantity,
} from "./useCart";
import { findCartLine } from "@/utils/addedToCartContract.mjs";
import {
  createLineGuard,
  createQuantityFlow,
  lineScopeFor,
} from "@/utils/cartQuantityFlow.mjs";

export function useQuantityHandler(
  product,
  defaultVolume,
  volumeMode,
  cartItem,
  { onAdded, onRejected } = {},
) {
  const queryClient = useQueryClient();
  const generation = sessionLifecycle.generation();
  const [selectedVolume, setSelectedVolume] = useState(defaultVolume);
  const [quantity, setQuantity] = useState(0);
  // One change of this line at a time; "+" and "-" wait for it.
  const [isPending, setIsPending] = useState(false);
  const guardRef = useRef(null);
  if (!guardRef.current) guardRef.current = createLineGuard();

  const request = { productId: product?.id, mode: volumeMode, volume: selectedVolume };
  const scope = lineScopeFor(guardRef.current, request);
  // `onAdded` only covers a new cart line; quantity updates keep their toast.
  const { addToCart } = useAddToCart({ onAdded, scope });
  const { removeFromCart } = useRemoveFromCart({ scope });
  const { data: cart } = useGetAllCartItems();
  const { updateQuantity } = useUpdateQuantity({ scope });

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
  }, [cartItem, defaultCartItem, cart, generation]);

  useEffect(() => { setIsPending(false); }, [generation]);

  const flow = createQuantityFlow({
    guard: guardRef.current,
    quantity,
    setQuantity: (value) => { if (sessionLifecycle.current(generation)) setQuantity(value); },
    line: cartItem || defaultCartItem,
    request,
    readCart: () => queryClient.getQueryData(cartKeys.items()),
    add: addToCart,
    update: updateQuantity,
    remove: removeFromCart,
    onRejected: (error) => { if (sessionLifecycle.current(generation)) onRejected?.(error); },
    onPendingChange: (pending) => { if (sessionLifecycle.current(generation)) setIsPending(pending); },
  });

  const RemoveFromCartHandler = () => {
    if (!sessionLifecycle.ready()) return;
    return flow.decrement();
  };

  const AddToCartHandler = () => {
    if (!sessionLifecycle.ready()) return;
    if (!selectedVolume || !product?.id) return;
    if (selectedVolume > product?.stock) return;
    flow.increment();
  };

  return {
    RemoveFromCartHandler,
    AddToCartHandler,
    selectedVolume,
    setSelectedVolume,
    quantity,
    setQuantity,
    defaultCartItem,
    isPending: isPending || !sessionLifecycle.ready(),
  };
}
