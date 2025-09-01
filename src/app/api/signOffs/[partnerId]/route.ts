import { auth } from "@/auth";
import { errorResponse } from "@/util/errors";
import { SignOffService } from "@/services/signOffService";
import { AuthenticationError, AuthorizationError, ArgumentError } from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import UserService from "@/services/userService";

const paramSchema = z.object({
  partnerId: z.string().transform((val) => {
    const parsed = parseInt(val);
    if (isNaN(parsed)) {
      throw new Error("partnerId must be a valid number");
    }
    return parsed;
  }),
});

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    const resolvedParams = await params;
    const parsed = paramSchema.safeParse(resolvedParams);
    
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const signOffs = await SignOffService.getSignOffsByPartner(parsed.data.partnerId);

    return NextResponse.json(signOffs, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
