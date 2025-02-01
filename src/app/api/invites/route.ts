import { NextRequest } from "next/server";
import { zfd } from "zod-form-data";
import { auth } from "@/auth";
import {
  argumentError,
  authenticationError,
  authorizationError,
  conflictError,
  ok,
} from "@/util/responses";
import { UserType } from "@prisma/client";
import { db } from "@/db";
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "@/util/email";
import { render } from "@react-email/render";
import UserInviteTemplate from "@/email/UserInviteTemplate";
import { z } from "zod";

const schema = zfd.formData({
  email: zfd.text(z.string().email()),
  userType: zfd.text(z.nativeEnum(UserType)),
});

/**
 * Handles POST requests for creating user invites
 * @param {NextRequest} request - The incoming request object
 * @returns {Promise<Response>} Response indicating success or failure
 * @throws {Response} 401 if no valid session
 * @throws {Response} 403 if user is not SUPER_ADMIN
 * @throws {Response} 400 if form data is invalid
 * @throws {Response} 409 if email is already registered
 *
 * This endpoint:
 * 1. Validates the user has SUPER_ADMIN privileges
 * 2. Validates the email and userType from form data
 * 3. Checks if email is already registered
 * 4. Creates a new user invite with 24 hour expiration
 * 5. Sends invite email with registration link
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return authenticationError("Session required");

  if (session.user.type !== UserType.SUPER_ADMIN) {
    return authorizationError("You are not allowed to create an invite");
  }

  const formData = await request.formData();
  let email, userType;
  try {
    const parsedData = schema.parse(formData);
    email = parsedData.email;
    userType = parsedData.userType;
  } catch {
    return argumentError("Invalid form data");
  }

  const existingUser = await db.user.findFirst({ where: { email } });
  if (existingUser) {
    return conflictError("Email already registered");
  }

  const token = uuidv4();
  const expiration = new Date();
  expiration.setDate(expiration.getDate() + 1);

  await db.userInvite.create({
    data: {
      email,
      token,
      expiration,
      userType,
    },
  });

  const inviteUrl = `${request.nextUrl}register?token=${token}`;
  const html = await render(UserInviteTemplate({ inviteUrl }));
  await sendEmail(email, "Your Invite Link", html);

  return ok();
}
