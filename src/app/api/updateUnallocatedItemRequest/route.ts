import { auth } from "@/auth";
import { errorResponse, ok } from "@/util/errors";
import { UnallocatedItemRequestService } from "@/services/unallocatedItemRequestService";
import { AuthenticationError, AuthorizationError, ArgumentError } from "@/util/errors";
import { NextRequest } from "next/server";
import { zfd } from "zod-form-data";
import { z } from "zod";
import { RequestPriority } from "@prisma/client";

const updateUnallocatedItemRequestSchema = zfd.formData({
  id: zfd.numeric(z.number().int().positive()),
  priority: zfd.text(z.nativeEnum(RequestPriority)),
  quantity: zfd.text(z.string().min(1)),
  comments: zfd.text(z.string().optional()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (session.user.type !== "PARTNER") {
      throw new AuthorizationError("User must be a partner");
    }

    const parsed = updateUnallocatedItemRequestSchema.safeParse(await req.formData());
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const { id, priority, quantity, comments } = parsed.data;
    await UnallocatedItemRequestService.updateRequest({
      id: Number(id),
      priority: priority as RequestPriority,
      quantity: String(quantity),
      comments: comments || "",
    });

    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}
