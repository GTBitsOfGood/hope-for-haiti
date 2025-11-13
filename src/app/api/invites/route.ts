import { NextRequest } from "next/server";
import { z } from "zod";
import { UserType } from "@prisma/client";

import { auth } from "@/auth";
import UserService from "@/services/userService";
import {
  ArgumentError,
  AuthenticationError,
  errorResponse,
  ok,
} from "@/util/errors";

import {
  EDITABLE_PERMISSION_FIELDS,
  PermissionFlags,
} from "@/types/api/user.types";

const permissionShape = EDITABLE_PERMISSION_FIELDS.reduce(
  (shape, field) => {
    shape[field] = z.boolean().optional();
    return shape;
  },
  {} as Record<
    (typeof EDITABLE_PERMISSION_FIELDS)[number],
    z.ZodOptional<z.ZodBoolean>
  >
);

const permissionsSchema = z.object(permissionShape).partial();

const schema = z
  .object({
    email: z.string().email(),
    name: z.string(),
    userType: z.nativeEnum(UserType),
    partnerDetails: z.string().optional(),
    permissions: permissionsSchema.optional(),
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

    UserService.checkPermission(session.user, "userWrite");

    const payload = await request.json();
    const parseResult = schema.safeParse(payload);
    if (!parseResult.success) {
      throw new ArgumentError(parseResult.error.message);
    }

    const { email, name, userType, partnerDetails, permissions } =
      parseResult.data;

    await UserService.createUserInvite({
      email,
      name,
      userType,
      partnerDetails,
      origin: request.nextUrl.origin,
      permissions: permissions as Partial<PermissionFlags> | undefined,
    });

    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}
