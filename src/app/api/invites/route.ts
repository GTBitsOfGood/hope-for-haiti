import { NextRequest } from "next/server";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { UserType } from "@prisma/client";

import { auth } from "@/auth";
import UserService from "@/services/userService";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  errorResponse,
  ok,
} from "@/util/errors";

const schema = zfd
  .formData({
    email: zfd.text(z.string().email()),
    name: zfd.text(z.string()),
    userType: zfd.text(z.nativeEnum(UserType)),
    partnerDetails: zfd.text().optional(),
  })
  .refine(
    (data) => !(data.userType === UserType.PARTNER && !data.partnerDetails),
    {
      message: "Partner details are required for PARTNER user type",
      path: ["partnerDetails"],
    }
  );

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isSuperAdmin(session.user.type)) {
      throw new AuthorizationError("You are not allowed to create an invite");
    }

    const formData = await request.formData();
    const parseResult = schema.safeParse(formData);
    if (!parseResult.success) {
      throw new ArgumentError(parseResult.error.message);
    }

    const { email, name, userType, partnerDetails } = parseResult.data;

    const existingUser = await UserService.getUserByEmail(email);
    if (existingUser) {
      throw new ConflictError("Email already registered");
    }

    await UserService.createUserInvite({
      email,
      name,
      userType,
      partnerDetails,
      origin: request.nextUrl.origin,
    });

    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}
