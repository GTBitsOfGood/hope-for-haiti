import { auth } from "@/auth";
import { errorResponse, ok } from "@/util/errors";
import { SignOffService } from "@/services/signOffService";
import { AuthenticationError, AuthorizationError, ArgumentError } from "@/util/errors";
import { NextRequest } from "next/server";
import { z } from "zod";
import UserService from "@/services/userService";

const createSignOffSchema = z.object({
  partnerId: z.union([z.string(), z.number()]).transform((val) => 
    typeof val === 'string' ? parseInt(val) : val
  ),
  staffName: z.string(),
  partnerName: z.string(),
  date: z.string(),
  signatureBlob: z.string(),
  distributions: z.array(z.object({
    allocationType: z.enum(["unallocated", "donorOffer"]),
    allocationId: z.number(),
    actualQuantity: z.number(),
  })),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    const reqBody = await req.json();
    const parsed = createSignOffSchema.safeParse(reqBody);
    
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    await SignOffService.createSignOff({
      ...parsed.data,
      date: new Date(parsed.data.date),
    });

    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}
