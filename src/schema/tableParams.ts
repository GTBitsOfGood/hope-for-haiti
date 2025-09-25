import { z } from "zod";
import type { Filters, FilterValue } from "@/types/api/filter.types";

const filterValueSchema: z.ZodType<FilterValue> = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("string"),
    value: z.string(),
  }),
  z.object({
    type: z.literal("number"),
    gte: z.coerce.number(),
    lte: z.coerce.number().optional(),
  }),
  z.object({
    type: z.literal("date"),
    gte: z.string(),
    lte: z.string().optional(),
  }),
  z.object({
    type: z.literal("enum"),
    values: z.array(z.string()),
  }),
]);

export const filtersSchema: z.ZodType<Filters> = z.record(filterValueSchema);

export const tableParamsSchema = z.object({
  pageSize: z.coerce.number().int().positive().optional().nullable(),
  page: z.coerce.number().int().positive().optional().nullable(),
  filters: z
    .string()
    .transform((s) => {
      try {
        const parsed = JSON.parse(s.trim());
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
        return z.NEVER;
      } catch {
        return z.NEVER;
      }
    })
    .pipe(filtersSchema)
    .optional().nullable(),
});
