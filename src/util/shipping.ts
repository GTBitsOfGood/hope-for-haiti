export type ShippingTuple = {
  donorShippingNumber?: string | null;
  hfhShippingNumber?: string | null;
};

export const normalizeShippingTuple = (tuple: ShippingTuple) => ({
  donorShippingNumber:
    tuple.donorShippingNumber === undefined ||
    tuple.donorShippingNumber === null ||
    tuple.donorShippingNumber === ""
      ? null
      : tuple.donorShippingNumber,
  hfhShippingNumber:
    tuple.hfhShippingNumber === undefined ||
    tuple.hfhShippingNumber === null ||
    tuple.hfhShippingNumber === ""
      ? null
      : tuple.hfhShippingNumber,
});

export const hasShippingIdentifier = (tuple: ShippingTuple): boolean => {
  const normalized = normalizeShippingTuple(tuple);
  return Boolean(normalized.donorShippingNumber || normalized.hfhShippingNumber);
};

const NULL_SENTINEL = "__NULL__";

export const shippingTupleKey = (tuple: ShippingTuple): string => {
  const normalized = normalizeShippingTuple(tuple);
  return `${normalized.donorShippingNumber ?? NULL_SENTINEL}|${normalized.hfhShippingNumber ?? NULL_SENTINEL}`;
};

export const shippingTupleEquals = (
  a: ShippingTuple,
  b: ShippingTuple
): boolean => {
  const left = normalizeShippingTuple(a);
  const right = normalizeShippingTuple(b);
  return (
    left.donorShippingNumber === right.donorShippingNumber &&
    left.hfhShippingNumber === right.hfhShippingNumber
  );
};
