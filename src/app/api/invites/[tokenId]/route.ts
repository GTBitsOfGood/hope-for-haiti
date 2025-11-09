import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import UserService from "@/services/userService";
import {
  ArgumentError,
  AuthenticationError,
  errorResponse,
  ok,
} from "@/util/errors";
import { auth } from "@/auth";

const paramSchema = z.object({
  tokenId: z.string().min(1, "Token is required").trim(),
});

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params;

    const parsed = paramSchema.safeParse({ tokenId });
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const invite = await UserService.getUserInviteByToken(parsed.data.tokenId);

    return NextResponse.json(
      {
        email: invite.email,
        name: invite.name,
      },
      { status: 200 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    UserService.checkPermission(session.user, "userWrite");

    const { tokenId } = await params;
    
    const parsed = paramSchema.safeParse({ tokenId });
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    await UserService.deleteUserInvite(parsed.data.tokenId);
    
    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}
