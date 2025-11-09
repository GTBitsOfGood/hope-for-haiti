import { auth } from "@/auth";
import { errorResponse, ok } from "@/util/errors";
import { SignOffService } from "@/services/signOffService";
import {
  AuthenticationError,
  AuthorizationError,
  ArgumentError,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import UserService from "@/services/userService";

const paramSchema = z.object({
  signOffId: z.string().transform((val) => {
    const parsed = parseInt(val);
    if (isNaN(parsed)) {
      throw new Error("signOffId must be a valid number");
    }
    return parsed;
  }),
});

const patchSchema = z.object({
  staffName: z.string().optional(),
  partnerId: z.number().int().positive().optional(),
  partnerName: z.string().optional(),
  date: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  signatureUrl: z.string().optional(),
  allocations: z.array(z.number().int().positive()).optional(),
});

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ signOffId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    const resolvedParams = await params;
    const parsed = paramSchema.safeParse(resolvedParams);

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const signOff = await SignOffService.getSignOffById(parsed.data.signOffId);

    if (UserService.isPartner(session.user)) {
      if (signOff?.partnerId !== parseInt(session.user.id!)) {
        throw new AuthorizationError("Access denied to this sign-off");
      }
    } else {
      UserService.checkPermission(session.user, "shipmentRead");
    }

    return NextResponse.json(signOff, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ signOffId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    UserService.checkPermission(session.user, "signoffWrite");

    const resolvedParams = await params;
    const paramsParsed = paramSchema.safeParse(resolvedParams);

    if (!paramsParsed.success) {
      throw new ArgumentError(paramsParsed.error.message);
    }

    const form = await request.formData();
    const formObj = {
      staffName:
        form.get("staffName") !== null
          ? String(form.get("staffName"))
          : undefined,
      partnerId:
        form.get("partnerId") !== null
          ? Number(form.get("partnerId"))
          : undefined,
      partnerName:
        form.get("partnerName") !== null
          ? String(form.get("partnerName"))
          : undefined,
      date: form.get("date") !== null ? String(form.get("date")) : undefined,
      signatureUrl:
        form.get("signatureUrl") !== null
          ? String(form.get("signatureUrl"))
          : undefined,
      allocations:
        form.getAll("allocation").length > 0
          ? form.getAll("allocation").map((val) => Number(val))
          : undefined,
    };
    const parsed = patchSchema.safeParse(formObj);

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const updatedSignOff = await SignOffService.updateSignOff(
      paramsParsed.data.signOffId,
      parsed.data
    );

    return NextResponse.json(updatedSignOff);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ signOffId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    UserService.checkPermission(session.user, "signoffWrite");

    const resolvedParams = await params;
    const parsed = paramSchema.safeParse(resolvedParams);

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    await SignOffService.deleteSignOff(parsed.data.signOffId);

    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}
