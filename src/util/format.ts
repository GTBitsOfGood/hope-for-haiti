import { Decimal } from "@prisma/client/runtime/library";

export const formatTableValue = (
  value: string | number | null | undefined | Decimal
) => {
  if (value === null || value === undefined) return "-";
  return value.toString();
};

/** Shows a money string like "1234.5" as "$1,234.50" (string math, no float rounding). */
export function formatMoney(value: string): string {
  const [whole, fraction = ""] = value.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `$${grouped}${fraction ? `.${fraction.padEnd(2, "0")}` : ".00"}`;
}
