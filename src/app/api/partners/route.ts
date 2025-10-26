import { auth } from "@/auth";
import { errorResponse } from "@/util/errors";
import { PartnerService } from "@/services/partnerService";
import { AuthenticationError, AuthorizationError, ArgumentError } from "@/util/errors";
import { NextResponse } from "next/server";
import { z } from "zod";
import UserService from "@/services/userService";

const searchParamsSchema = z.object({
  term: z.string().optional().nullable(),
});

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    const { searchParams } = new URL(request.url);
    const parsed = searchParamsSchema.safeParse({
      term: searchParams.get("term"),
    });
    
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const partners = await PartnerService.getPartners({
      term: parsed.data.term ?? undefined
    });

    return NextResponse.json({ partners }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
