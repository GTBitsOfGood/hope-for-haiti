import { auth } from "@/auth";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  errorResponse,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import UserService from "@/services/userService";
import AllocationSuggestionService from "@/services/allocationSuggestionService";

export const runtime = "nodejs";

const requestSchema = z
  .object({
    donorOfferId: z.number().int().positive().optional(),
    generalItemIds: z.array(z.number().int().positive()).optional(),
  })
  .refine(
    (value) =>
      (value.donorOfferId && !value.generalItemIds) ||
      (!value.donorOfferId && value.generalItemIds?.length),
    "Provide either donorOfferId or generalItemIds, but not both."
  );

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isAdmin(session.user.type)) {
      throw new AuthorizationError("Admin access required");
    }

    const body = await request.json().catch(() => ({}));
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const { donorOfferId, generalItemIds } = parsed.data;

    const allocations = donorOfferId
      ? await AllocationSuggestionService.suggestForDonorOffer(donorOfferId)
      : await AllocationSuggestionService.suggestForGeneralItems(
          generalItemIds ?? []
        );

    return NextResponse.json(
      {
        allocations,
      },
      { status: 200 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
