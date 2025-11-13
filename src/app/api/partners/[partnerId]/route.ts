import { auth } from "@/auth";
import { errorResponse } from "@/util/errors";
import { PartnerService } from "@/services/partnerService";
import { AuthenticationError, ArgumentError } from "@/util/errors";
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
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    UserService.checkPermission(session.user, "userRead");

    const resolvedParams = await params;
    const parsed = paramSchema.safeParse(resolvedParams);
    
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const partner = await PartnerService.getPartnerById(parsed.data.partnerId);

    return NextResponse.json(partner, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
