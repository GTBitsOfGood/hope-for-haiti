import { auth } from "@/auth";
import { errorResponse } from "@/util/errors";
import { SignOffService } from "@/services/signOffService";
import {
  AuthenticationError,
  AuthorizationError,
  ArgumentError,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import UserService from "@/services/userService";
import { isPartner } from "@/lib/userUtils";
import { tableParamsSchema } from "@/schema/tableParams";

const createSignOffSchema = z.object({
  partnerId: z.number().int().positive(),
  staffName: z.string(),
  partnerName: z.string(),
  date: z.string().transform((str) => new Date(str)),
  signatureUrl: z.string(),
  allocations: z.array(z.number()),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (isPartner(session.user.type)) {
      const signOffs = await SignOffService.getSignOffsByPartner(
        parseInt(session.user.id!)
      );
      return NextResponse.json(signOffs);
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    const parsedParams = tableParamsSchema.safeParse({
      filters: request.nextUrl.searchParams.get("filters"),
      page: request.nextUrl.searchParams.get("page"),
      pageSize: request.nextUrl.searchParams.get("pageSize"),
    });

    if (!parsedParams.success) {
      throw new ArgumentError(parsedParams.error.message);
    }

    const { filters, page, pageSize } = parsedParams.data;

    const signOffs = await SignOffService.getAllSignOffs(
      filters ?? undefined,
      page ?? undefined,
      pageSize ?? undefined
    );
    return NextResponse.json(signOffs);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    const form = await req.formData();
    const formObj = {
      partnerId:
        form.get("partnerId") != null
          ? Number(form.get("partnerId"))
          : undefined,
      staffName:
        form.get("staffName") != null
          ? String(form.get("staffName"))
          : undefined,
      partnerName:
        form.get("partnerName") != null
          ? String(form.get("partnerName"))
          : undefined,
      date: form.get("date") != null ? String(form.get("date")) : undefined,
      signatureUrl:
        form.get("signatureUrl") != null
          ? String(form.get("signatureUrl"))
          : undefined,
      allocations:
        form.getAll("allocation").length > 0
          ? (form
              .getAll("allocation")
              .map((val) =>
                typeof val === "string" ? parseInt(val) : NaN
              ) as number[])
          : [],
    };

    const parsed = createSignOffSchema.safeParse(formObj);
    if (!parsed.success) {
      throw new ArgumentError("Invalid form data: " + parsed.error.message);
    }

    const signOff = await SignOffService.createSignOff(parsed.data);
    return NextResponse.json(signOff, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
