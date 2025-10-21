import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import DonorOfferService from "@/services/donorOfferService";
import UserService from "@/services/userService";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  InternalError,
  errorResponse,
} from "@/util/errors";
import FileService from "@/services/fileService";
import { tableParamsSchema } from "@/schema/tableParams";
import { DescriptionService } from "@/services/descriptionService";

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
    const params = req.nextUrl.searchParams;
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const preview = params.get("preview") === "true";

    if (!file) {
      throw new ArgumentError("File is required");
    }

    const toSafeString = (value: unknown) =>
      typeof value === "string" ? value : value == null ? "" : String(value);

    const parsedFileData = await FileService.parseDonorOfferFile(file);
    const parsedItems = parsedFileData.data;
    if (parsedItems.length === 0) {
      throw new ArgumentError("Uploaded file contains no valid rows");
    }

    const needsDescriptions = !preview;
    const donorOfferInput = async () => {
      if (!needsDescriptions) {
        return parsedFileData;
      }

      const itemDescriptionInput = parsedItems.map((item) => ({
        title: toSafeString(item["title"]).trim(),
        type: toSafeString(item["type"]).trim(),
        unitType: toSafeString(item["unitType"]).trim(),
      }));

      let descriptions: string[] = [];
      try {
        descriptions = await DescriptionService.getOrGenerateDescriptions(
          itemDescriptionInput
        );
      } catch {
        throw new InternalError("Failed to generate item descriptions");
      }

      if (descriptions.length !== parsedItems.length) {
        throw new InternalError(
          "Description generation returned unexpected result"
        );
      }

      return {
        ...parsedFileData,
        data: parsedItems.map((item, index) => ({
          ...item,
          description: descriptions[index] ?? null,
        })),
      };
    };

    const result = await DonorOfferService.createDonorOffer(
      formData,
      await donorOfferInput(),
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
