import { Decimal } from "@prisma/client/runtime/library";

export const formatTableValue = (
  value: string | number | null | undefined | Decimal
) => {
  if (value === null || value === undefined) return "-";
  return value.toString();
};
