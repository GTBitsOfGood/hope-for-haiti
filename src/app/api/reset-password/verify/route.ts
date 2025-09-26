import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import PasswordResetService from "@/services/passwordResetService";
import { ArgumentError, errorResponse } from "@/util/errors";

const searchParamsSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    const parsed = searchParamsSchema.safeParse({ token });

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const result = await PasswordResetService.verifyPasswordResetToken(
      parsed.data.token
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
