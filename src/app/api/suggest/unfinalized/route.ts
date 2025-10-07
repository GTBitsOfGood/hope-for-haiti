import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, AuthenticationError, AuthorizationError, ArgumentError } from "@/util/errors";
import UserService from "@/services/userService";
import { UnfinalizedSuggestionService } from "@/services/unfinalizedSuggestionService";

const bodySchema = z.object({
  generalItems: z.array(
    z.object({
      title: z.string().min(1),
      type: z.string().min(1),
      description: z.string().min(1),
      expirationDate: z.string().min(1), // ISO date string
      unitType: z.string().min(1),
      quantityPerUnit: z.number().int().positive(),
      totalQuantity: z.number().int().nonnegative(),
      requests: z.array(
        z.object({
          partnerId: z.number().int(),
          quantity: z.number().int().nonnegative(),
        })
      ).min(1),
    })
  ).min(1),
  includeDetails: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN or SUPER_ADMIN");
    }

    const json = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

  const result = await UnfinalizedSuggestionService.suggestAllocations(parsed.data.generalItems, { includeDetails: parsed.data.includeDetails });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
