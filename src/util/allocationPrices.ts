import { centsToMoneyString, moneyStringToCents } from "@/util/priceCheck";
import { formatMoney } from "@/util/format";

export const NO_SAVED_PRICE = "No saved price";

type ValueLine = { quantity: number; savedUnitPrice?: string | null };

/**
 * One price when every line agrees, "low to high" when they differ,
 * null when no line has a price.
 */
export function describeLinePrices(
  prices: (string | null | undefined)[]
): string | null {
  const cents = [
    ...new Set(
      prices
        .filter((price): price is string => price != null)
        .map((price) => moneyStringToCents(price))
    ),
  ].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  if (cents.length === 0) return null;
  const low = formatMoney(centsToMoneyString(cents[0]));
  if (cents.length === 1) return low;
  return `${low} to ${formatMoney(centsToMoneyString(cents[cents.length - 1]))}`;
}

/**
 * Saved price × # of containers, added up over the lines that have a saved
 * price (the same math as the offer's saved total). Null when no line has one.
 */
export function describeSavedValue(lines: ValueLine[]): string | null {
  let cents = BigInt(0);
  let hasPrice = false;
  for (const line of lines) {
    if (line.savedUnitPrice != null) {
      cents += moneyStringToCents(line.savedUnitPrice) * BigInt(line.quantity);
      hasPrice = true;
    }
  }
  return hasPrice ? formatMoney(centsToMoneyString(cents)) : null;
}
