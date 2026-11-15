/**
 * When a partner changes how many they're requesting, staff's revised number
 * (finalQuantity) follows only while staff haven't changed it: it still equals
 * the old request, or was never set. Returns the finalQuantity to save, or
 * undefined to leave it alone.
 */
export function finalQuantityAfterPartnerEdit(
  current: { quantity: number; finalQuantity: number | null },
  newQuantity: number | undefined
): number | undefined {
  if (newQuantity === undefined || newQuantity === current.quantity) return undefined;
  const unrevised =
    current.finalQuantity === null || current.finalQuantity === current.quantity;
  return unrevised ? newQuantity : undefined;
}
