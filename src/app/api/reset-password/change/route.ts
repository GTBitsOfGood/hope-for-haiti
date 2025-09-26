import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import PasswordResetService from "@/services/passwordResetService";
import { ArgumentError, errorResponse } from "@/util/errors";

const requestBodySchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = requestBodySchema.safeParse(body);

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    await PasswordResetService.changePassword(parsed.data);

    return NextResponse.json(
      { message: "Password successfully changed" },
      { status: 200 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
