import { $Enums } from "@prisma/client";
import { z } from "zod";

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
 * The create schema, but every field is optional and there's a mandatory ID field.
 * I tried to automatically map fields from createObj, but it caused type errors.
 * @see createWishlistSchema
 */
export const updateWishlistSchema = z.object({
  id: z.number().min(1),
  name: createObj.name.optional(),
  unitSize: createObj.unitSize.optional(),
  quantity: createObj.quantity.optional(),
  priority: createObj.priority.optional(),
  comments: createObj.comments.optional(),
});
