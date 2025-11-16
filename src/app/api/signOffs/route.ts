import { auth } from "@/auth";
import { errorResponse } from "@/util/errors";
import { SignOffService } from "@/services/signOffService";
import {
  AuthenticationError,
  ArgumentError,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import UserService from "@/services/userService";
import { tableParamsSchema } from "@/schema/tableParams";

const createSignOffSchema = z.object({
  partnerId: z.number().int().positive(),
  staffName: z.string(),
  partnerName: z.string(),
  date: z.string().transform((str) => new Date(str)),
  signatureUrl: z.string(),
  allocations: z.array(z.number()),
  staffUserId: z.number().int().positive().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (UserService.isPartner(session.user)) {
      const signOffs = await SignOffService.getSignOffsByPartner(
        parseInt(session.user.id!)
      );
      return NextResponse.json(signOffs);
    }

    UserService.checkPermission(session.user, "shipmentRead");

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

    UserService.checkPermission(session.user, "signoffWrite");

    const form = await req.formData();
    const userId = parseInt(session.user.id!);

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
      staffUserId: userId,
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
