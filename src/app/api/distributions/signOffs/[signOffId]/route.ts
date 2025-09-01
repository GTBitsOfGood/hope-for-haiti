import { auth } from "@/auth";
import { ArgumentError, AuthenticationError, AuthorizationError, NotFoundError } from "@/util/errors";
import { errorResponse } from "@/util/errors";
import { NextRequest } from "next/server";
import { z } from "zod";
import UserService from "@/services/userService";
import { SignOffService } from "@/services/signOffService";
import { NextResponse } from "next/server";
import { format } from "date-fns";

const paramSchema = z.object({
  signOffId: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().int().positive("Sign off ID must be a positive integer")),
});

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ signOffId: string }> }
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
    const parsed = paramSchema.safeParse({
      signOffId: resolvedParams.signOffId,
    });
    
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const { signOffId } = parsed.data;
    
    const signOff = await SignOffService.getSignOffById(signOffId);
    if (!signOff) {
      throw new NotFoundError("Sign off not found");
    }
    
    return NextResponse.json({
      itemDistributions: signOff.distributions,
      signOff: {
        date: format(signOff.date, "MM/dd/yyyy"),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
