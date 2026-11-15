import { z } from "zod";

export const codeOverridesSchema = z
  .array(
    z
      .object({
        row: z.number().int().positive("Code override row must be a positive integer"),
        code: z.string().trim().min(1, "Code override cannot be empty").max(128),
      })
      .strict()
  )
  .superRefine((overrides, ctx) => {
    const rows = new Set<number>();
    for (const override of overrides) {
      if (rows.has(override.row)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Row ${override.row}: code was provided more than once.`,
        });
      }
      rows.add(override.row);
    }
  });
