import { z } from "zod";
import { PRICE_FORMAT_MESSAGE, isValidMoneyString } from "@/util/itemPrice";
import { parseItemCode, unreadableCodeMessage } from "@/util/ndc";

export const itemPriceInputSchema = z.object({
  ndc: z.string().transform((value, ctx) => {
    const result = parseItemCode(value);
    if (result.status === "normalized") return result.value;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        result.status === "empty"
          ? "NDC or UPC is required."
          : unreadableCodeMessage(value),
    });
    return z.NEVER;
  }),
  name: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional(),
  unitPrice: z.string().refine(isValidMoneyString, PRICE_FORMAT_MESSAGE),
}).strict();
