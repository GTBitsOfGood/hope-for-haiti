import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import FileService from "@/services/fileService";
import UserService from "@/services/userService";
import {
  ArgumentError,
  AuthenticationError,
  errorResponse,
} from "@/util/errors";

const paramSchema = z.object({
  filename: z
    .string()
    .min(1, "File name is required")
    .trim(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    UserService.checkPermission(session.user, "requestRead");

    const params = req.nextUrl.searchParams;
    const parsed = paramSchema.safeParse({
      filename: params.get("filename"),
    });
    
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const result = await FileService.generateReadUrl(parsed.data.filename);
    
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
