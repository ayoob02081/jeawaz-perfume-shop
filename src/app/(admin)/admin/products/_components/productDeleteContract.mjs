// Runs a confirmed Product delete. The mutation's onError already shows the
// backend message (e.g. a 409 dependency conflict), so a failure is handled
// here instead of escaping as an unhandled rejection. The dialog always closes;
// success-only effects run only after the backend confirms the delete.
export async function runProductDelete({ id, removeProduct, onDeleted, close }) {
  let deleted = false;
  try {
    await removeProduct(id);
    deleted = true;
  } catch {
    // Error toast is owned by useRemoveProduct.
  }
  if (deleted) onDeleted?.(id);
  close?.();
  return deleted;
}
