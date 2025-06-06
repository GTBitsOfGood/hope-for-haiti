import { NextRequest } from "next/server";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { v4 as uuidv4 } from "uuid";
import { UserType } from "@prisma/client";
import { render } from "@react-email/render";

import { auth } from "@/auth";
import { db } from "@/db";
import { sendEmail } from "@/util/email";
import UserInviteTemplate from "@/email/UserInviteTemplate";
import {
  argumentError,
  authenticationError,
  authorizationError,
  conflictError,
  ok,
} from "@/util/responses";

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

/**
 * Create a new user invite (expires in 1 day) and sends email to user.
 * Parameters are passed via form data.
 * @params email Email address to send the invite to
 * @params userType Type of user to create (ADMIN, etc.)
 * @returns 401 if no valid session
 * @returns 403 if session user is not SUPER_ADMIN
 * @returns 400 if form data is invalid
 * @returns 409 if email is already registered
 * @returns 200 if invite was created successfully
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return authenticationError("Session required");

  if (session.user.type !== UserType.SUPER_ADMIN) {
    return authorizationError("You are not allowed to create an invite");
  }

  const formData = await request.formData();
  const parseResult = schema.safeParse(formData);
  if (!parseResult.success) {
    console.log(parseResult.error);
    return argumentError("Invalid form data");
  }
  const { email, name, userType, partnerDetails } = parseResult.data;
  // TODO validate partner details

  const existingUser = await db.user.findFirst({ where: { email } });
  if (existingUser) {
    return conflictError("Email already registered");
  }

  const token = uuidv4();
  const expiration = new Date();
  expiration.setDate(expiration.getDate() + 1);

  await db.$transaction(async (tx) => {
    await tx.userInvite.create({
      data: {
        email,
        name,
        token,
        expiration,
        userType,
        partnerDetails: JSON.parse(partnerDetails || "{}"),
      },
    });

    const inviteUrl = `${request.nextUrl.origin}/register?token=${token}`;
    const html = await render(UserInviteTemplate({ inviteUrl }));
    await sendEmail(email, "Your Invite Link", html);
  });

  return ok();
}
