import { auth } from "@/auth";
import { errorResponse } from "@/util/errors";
import { AuthenticationError, AuthorizationError, ArgumentError } from "@/util/errors";
import { NextRequest } from "next/server";
import { z } from "zod";
import UserService from "@/services/userService";

const finalizedAutomatedSuggestionSchema = z.object({
  generalItems: z.array(
    z.object({
      totalQuantity: z.number(),
      lineItems: z.array(
        z.object({
          lineItemId: z.number(),
          quantity: z.number(),
        })
      ),
      requests: z.array(
        z.object({
          partnerId: z.number(),
          quantity: z.number(),
        })
      ),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isAdmin(session.user.type)) {
      throw new AuthorizationError("Must be ADMIN, or SUPER_ADMIN");
    }

    const reqBody = await request.json();
    const parsed = finalizedAutomatedSuggestionSchema.safeParse(reqBody);
    
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    /*
    Response:
    {
    allocations: { 
        lineItemId: number,
        quantity: number, // the lineItem’s quantity,
        partnerId: number
    }[]
    }
    */

    // TODO: 
  } catch (error) {
    return errorResponse(error);
  }
}
