import { auth } from "@/auth";
import { ArgumentError, AuthenticationError, AuthorizationError } from "@/util/errors";
import { errorResponse, ok } from "@/util/errors";
import { NextRequest } from "next/server";
import { z } from "zod";
import UserService from "@/services/userService";
import DistributionService from "@/services/distributionService";

const paramSchema = z.object({
  distributionId: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().int().positive("Distribution ID must be a positive integer")),
});

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ distributionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isAdmin(session.user.type)) {
      throw new AuthorizationError("Must be ADMIN or SUPER_ADMIN");
    }

    const resolvedParams = await params;
    const parsed = paramSchema.safeParse({
      distributionId: resolvedParams.distributionId,
    });
    
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const { distributionId } = parsed.data;
    
    await DistributionService.deleteDistribution(distributionId);
    
    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}
