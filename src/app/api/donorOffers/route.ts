import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import DonorOfferService from "@/services/donorOfferService";
import UserService from "@/services/userService";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  errorResponse,
} from "@/util/errors";
import FileService from "@/services/fileService";
import { tableParamsSchema } from "@/schema/tableParams";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isAdmin(session.user.type)) {
      throw new AuthorizationError(
        "You are not allowed to create donor offers"
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const preview = formData.get("preview") === "true";

    if (!file) {
      throw new ArgumentError("File is required");
    }

    const parsedFileData = await FileService.parseDonorOfferFile(file);
    const result = await DonorOfferService.createDonorOffer(
      formData,
      parsedFileData,
      preview
    );
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
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

    let result;

    if (session.user.type === "PARTNER") {
      result = await DonorOfferService.getPartnerDonorOffers(
        parseInt(session.user.id),
        filters ?? undefined,
        page ?? undefined,
        pageSize ?? undefined
      );
    } else if (UserService.isStaff(session.user.type)) {
      result = await DonorOfferService.getAdminDonorOffers(
        filters ?? undefined,
        page ?? undefined,
        pageSize ?? undefined
      );
    } else {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
