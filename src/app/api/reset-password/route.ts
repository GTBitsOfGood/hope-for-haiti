import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import PasswordResetService from "@/services/passwordResetService";
import { ArgumentError, errorResponse } from "@/util/errors";

const requestBodySchema = z.object({
  email: z.string().email("Invalid email format"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = requestBodySchema.safeParse(body);

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    await PasswordResetService.createPasswordResetToken(parsed.data);

    return NextResponse.json(
      { message: "Password reset email sent" },
      { status: 200 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
