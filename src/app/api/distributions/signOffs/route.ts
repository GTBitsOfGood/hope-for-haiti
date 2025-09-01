import { auth } from "@/auth";
import { ArgumentError, AuthenticationError, AuthorizationError, NotFoundError } from "@/util/errors";
import { errorResponse } from "@/util/errors";
import { NextRequest } from "next/server";
import { z } from "zod";
import UserService from "@/services/userService";
import { PartnerService } from "@/services/partnerService";
import { SignOffService } from "@/services/signOffService";
import { NextResponse } from "next/server";

const paramSchema = z.object({
  partnerId: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().int().positive("Partner ID must be a positive integer")),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    const params = request.nextUrl.searchParams;
    const parsed = paramSchema.safeParse({
      partnerId: params.get("partnerId"),
    });
    
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const { partnerId } = parsed.data;
    
    const partner = await PartnerService.getPartnerById(partnerId);
    if (!partner) {
      throw new NotFoundError("Partner not found");
    }
    
    const signOffs = await SignOffService.getSignOffsByPartner(partnerId);
    
    return NextResponse.json({ items: signOffs });
  } catch (error) {
    return errorResponse(error);
  }
}
