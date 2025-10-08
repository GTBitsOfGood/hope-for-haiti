import { auth } from "@/auth";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from "@/util/errors";
import { errorResponse, ok } from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import UserService from "@/services/userService";
import DistributionService from "@/services/distributionService";

const paramSchema = z.object({
  distributionId: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(
      z.number().int().positive("Distribution ID must be a positive integer")
    ),
});

const patchSchema = z.object({
  partnerId: z.number().int().positive().optional(),
  pending: z.boolean().optional(),
});

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ distributionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    const user = session.user;

    const resolvedParams = await params;
    const parsed = paramSchema.safeParse({
      distributionId: resolvedParams.distributionId,
    });
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const { distributionId } = parsed.data;

    const distribution =
      await DistributionService.getDistribution(distributionId);

    if (user.type === "PARTNER") {
      const partnerId = parseInt(user.id);
      if (distribution.partnerId !== partnerId) {
        throw new NotFoundError("Distribution not found"); // Don't reveal existence
      }
      return NextResponse.json(distribution);
    }

    if (!UserService.isAdmin(user.type)) {
      throw new AuthorizationError("You are not allowed to view this");
    }

    return NextResponse.json(distribution);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ distributionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isAdmin(session.user.type)) {
      throw new AuthorizationError("Admin access required");
    }

    const parsedParams = paramSchema.safeParse({
      distributionId: (await params).distributionId,
    });

    if (!parsedParams.success) {
      throw new ArgumentError(parsedParams.error.message);
    }

    const form = await request.formData();
    const formObj = {
      partnerId: form.get("partnerId")
        ? parseInt(form.get("partnerId") as string)
        : undefined,
      pending: form.get("pending") ? form.get("pending") === "true" : undefined,
    };
    const parsedBody = patchSchema.safeParse(formObj);
    if (!parsedBody.success) {
      throw new ArgumentError(parsedBody.error.message);
    }

    const { distributionId } = parsedParams.data;

    const updatedDistribution = await DistributionService.updateDistribution(
      distributionId,
      parsedBody.data
    );

    return NextResponse.json(updatedDistribution);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ distributionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isAdmin(session.user.type)) {
      throw new AuthorizationError("Must be ADMIN or SUPER_ADMIN");
    }

    const parsed = paramSchema.safeParse({
      distributionId: (await params).distributionId,
    });

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const { distributionId } = parsed.data;

    await DistributionService.deleteDistribution(distributionId);

    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}
