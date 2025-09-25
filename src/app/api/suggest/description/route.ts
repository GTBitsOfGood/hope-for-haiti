import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, AuthenticationError, AuthorizationError, ArgumentError } from "@/util/errors";
import UserService from "@/services/userService";
import { DescriptionService } from "@/services/descriptionService";

const bodySchema = z.object({
  items: z.array(
    z.object({
      title: z.string().min(1),
      type: z.string().min(1),
      unitType: z.string().min(1),
    })
  ).min(1),
  language: z
    .string()
    .regex(/^[A-Za-z-]{2,10}$/)
    .optional(),
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

  const descriptions = await DescriptionService.getOrGenerateDescriptions(parsed.data.items, parsed.data.language);

    return NextResponse.json({ items: descriptions }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
