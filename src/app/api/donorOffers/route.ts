import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import DonorOfferService from "@/services/donorOfferService";
import UserService from "@/services/userService";
import {
  ArgumentError,
  AuthenticationError,
  InternalError,
  errorResponse,
} from "@/util/errors";
import FileService from "@/services/fileService";
import { tableParamsSchema } from "@/schema/tableParams";
import { GeneralItemService } from "@/services/generalItemService";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    UserService.checkPermission(session.user, "offerWrite");
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

      const uniqueItems = new Map<
        string,
        { title: string; unitType: string }
      >();
      parsedItems.forEach((item) => {
        const title = toSafeString(item["title"]).trim();
        const unitType = toSafeString(item["unitType"]).trim();
        const key = `${title}|${unitType}`;
        if (!uniqueItems.has(key)) {
          uniqueItems.set(key, { title, unitType });
        }
      });

      const itemDescriptionInput = Array.from(uniqueItems.values());

      let metadata: Array<{
        description: string;
        type: string;
        category: string;
      }> = [];
      try {
        metadata = await GeneralItemService.getOrGenerateMetadata(
          itemDescriptionInput
        );
      } catch {
        throw new InternalError("Failed to generate item metadata");
      }

      if (metadata.length !== itemDescriptionInput.length) {
        throw new InternalError(
          "Metadata generation returned unexpected result"
        );
      }

      const metadataMap = new Map<
        string,
        { description: string; type: string; category: string }
      >();
      Array.from(uniqueItems.keys()).forEach((key, index) => {
        metadataMap.set(key, metadata[index]);
      });

      return {
        ...parsedFileData,
        data: parsedItems.map((item) => {
          const title = toSafeString(item["title"]).trim();
          const unitType = toSafeString(item["unitType"]).trim();
          const key = `${title}|${unitType}`;
          const meta = metadataMap.get(key);
          return {
            ...item,
            description: meta?.description ?? null,
            type: meta?.type ?? null,
            category: meta?.category ?? null,
          };
        }),
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
    } else {
      UserService.checkAnyPermission(session.user, [
        "requestRead",
        "allocationRead",
        "archivedRead",
      ]);
      result = await DonorOfferService.getAdminDonorOffers(
        filters ?? undefined,
        page ?? undefined,
        pageSize ?? undefined
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
