import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import DonorOfferService from "@/services/donorOfferService";
import FileService from "@/services/fileService";
import UserService from "@/services/userService";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  errorResponse,
  ok,
} from "@/util/errors";
import { $Enums } from "@prisma/client";
import { tableParamsSchema } from "@/schema/tableParams";
import { formDataToObject } from "@/util/formData";

/**
 * Schema for getting offer ID from URL params
 */
const paramSchema = z.object({
  donorOfferId: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(
      z.number().int().positive("Donor offer ID must be a positive integer")
    ),
});

const requestParamSchema = z.object({
  requests: z.coerce.boolean().optional().nullable(),
});

const previewParamSchema = z.object({
  preview: z.coerce.boolean().optional().nullable(),
});

const updateSchema = z.object({
  offerName: z.string().min(1, "Offer name is required").optional(),
  donorName: z.string().min(1, "Donor name is required").optional(),
  partnerResponseDeadline: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format for partnerResponseDeadline",
    })
    .transform((date) => new Date(date))
    .optional(),
  donorResponseDeadline: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format for donorResponseDeadline",
    })
    .transform((date) => new Date(date))
    .optional(),
  partners: z.array(z.number().int().positive()).optional(),
  state: z
    .enum(Object.values($Enums.DonorOfferState) as [string, ...string[]])
    .transform((val) => val as $Enums.DonorOfferState)
    .optional(),
  file: z.any().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ donorOfferId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    const { donorOfferId } = await params;
    const parsed = paramSchema.safeParse({ donorOfferId });

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const parsedParams = tableParamsSchema.merge(requestParamSchema).safeParse({
      requests: request.nextUrl.searchParams.get("requests"),
      filters: request.nextUrl.searchParams.get("filters"),
      page: request.nextUrl.searchParams.get("page"),
      pageSize: request.nextUrl.searchParams.get("pageSize"),
    });

    if (!parsedParams.success) {
      throw new ArgumentError(parsedParams.error.message);
    }

    const { filters, page, pageSize, requests } = parsedParams.data;

    let result;

    if (session.user.type === "PARTNER") {
      result = await DonorOfferService.getPartnerDonorOfferDetails(
        parsed.data.donorOfferId,
        session.user.id,
        filters ?? undefined,
        page ?? undefined,
        pageSize ?? undefined
      );
    } else if (UserService.isStaff(session.user.type)) {
      const includeRequests = requests ?? undefined;
      result = await DonorOfferService.getAdminDonorOfferDetails(
        parsed.data.donorOfferId,
        includeRequests
      );

      const donorOffer = result.donorOffer;

      return NextResponse.json({
        donorOffer,
        partners: result.partners,
        items: result.items,
        offerName: donorOffer.offerName,
        donorName: donorOffer.donorName,
        partnerResponseDeadline: donorOffer.partnerResponseDeadline,
        donorResponseDeadline: donorOffer.donorResponseDeadline,
        state: donorOffer.state,
      });
    } else {
      throw new AuthorizationError("Unauthorized user type");
    }

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ donorOfferId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    const { donorOfferId } = await params;
    const parsed = paramSchema.safeParse({ donorOfferId });

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    // Check if the donor offer is archived
    const { donorOffer } = await DonorOfferService.getAdminDonorOfferDetails(
      parsed.data.donorOfferId,
      false
    );
    if (donorOffer.state === $Enums.DonorOfferState.ARCHIVED) {
      throw new ArgumentError(
        "Cannot delete an archived donor offer. Archived offers are read-only."
      );
    }

    await DonorOfferService.deleteDonorOffer(parsed.data.donorOfferId);
    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ donorOfferId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("You are not allowed to edit this");
    }

    const { donorOfferId } = await params;
    const parsed = paramSchema.safeParse({ donorOfferId });
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    // Check if the donor offer is archived
    const { donorOffer } = await DonorOfferService.getAdminDonorOfferDetails(
      parsed.data.donorOfferId,
      false
    );
    if (donorOffer.state === $Enums.DonorOfferState.ARCHIVED) {
      throw new ArgumentError(
        "Cannot edit an archived donor offer. Archived offers are read-only."
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    const previewParsed = previewParamSchema.safeParse({
      preview: req.nextUrl.searchParams.get("preview"),
    });
    if (!previewParsed.success) {
      throw new ArgumentError(previewParsed.error.message);
    }
    const { preview } = previewParsed.data;

    if (file && file instanceof File) {
      const parsedFileData = await FileService.parseFinalizedFile(file);
      const result = await DonorOfferService.finalizeDonorOffer(
        parsed.data.donorOfferId,
        parsedFileData,
        preview ?? false,
      );

      if (preview) {
        return NextResponse.json({
          donorOfferItems: result.donorOfferItems ?? [],
        });
      }

      return NextResponse.json(result);
    }

    const formObj = formDataToObject(formData) as typeof updateSchema._input;

    if ("partners" in formObj) {
      formObj.partners = formObj.partners?.map(partnerId => Number(partnerId));
    }

    const updateParsed = updateSchema.safeParse(formObj);
    if (!updateParsed.success) {
      throw new ArgumentError(updateParsed.error.message);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { file: _, ...updateData } = updateParsed.data;

    const result = await DonorOfferService.updateDonorOffer(
      parsed.data.donorOfferId,
      updateData
    );
    
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
