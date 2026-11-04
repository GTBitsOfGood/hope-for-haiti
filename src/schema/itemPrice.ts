import { z } from "zod";
import { isValidMoneyString } from "@/util/itemPrice";
import { parseItemCode } from "@/util/ndc";

export const itemPriceInputSchema = z.object({
  ndc: z.string().transform((value, ctx) => {
    const result = parseItemCode(value);
    if (result.status === "normalized") return result.value;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        result.status === "empty"
          ? "NDC or UPC is required."
          : "Enter a recognizable NDC or UPC; ambiguous 10-digit undashed values are not accepted.",
    });
    return z.NEVER;
  }),
  name: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional(),
  unitPrice: z.string().refine(isValidMoneyString, "Enter a non-negative price with no more than two decimal places, within the supported money range."),
}).strict();
