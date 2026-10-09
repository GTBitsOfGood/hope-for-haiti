import { z } from "zod";
import { isCanonicalNdc, isValidMoneyString } from "@/util/itemPrice";

export const itemPriceInputSchema = z.object({
  ndc: z.string().trim().min(1, "NDC is required").refine(isCanonicalNdc, "Enter an NDC in canonical format: 00000-0000-00."),
  unitPrice: z.string().refine(isValidMoneyString, "Enter a non-negative price with no more than two decimal places, within the supported money range."),
}).strict();
