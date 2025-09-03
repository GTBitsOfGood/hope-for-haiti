import { UpdateWishlistData } from "@/types/api/wishlist.types";
import { $Enums } from "@prisma/client";
import { z, ZodObject } from "zod";

const createObj = {
  name: z.string().min(3).max(100),
  unitSize: z.string().min(2).max(100),
  quantity: z.number().min(1),
  priority: z.enum(
    Object.values($Enums.RequestPriority) as [string, ...string[]]
  ),
  comments: z.string().max(500),
};

export const createWishlistSchema = z.object(createObj);

/**
 * The create schema, but every field is optional.
 *
 * @see createWishlistSchema
 */
export const updateWishlistSchema: ZodObject<
  Partial<typeof createObj>, // Input type
  "strip",
  z.ZodTypeAny,
  Omit<UpdateWishlistData, "id"> // Output type
> = z.object({
  ...Object.fromEntries(
    Object.entries(createObj).map(([key, value]) => [key, value.optional()])
  ),
});
