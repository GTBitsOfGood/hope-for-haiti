import { auth } from "@/auth";
import { db } from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { DonorOfferState, ItemCategory, UserType } from "@prisma/client";
import {
  authenticationError,
  authorizationError,
  notFoundError,
  argumentError,
} from "@/util/responses";
import { z } from "zod";
import * as XLSX from "xlsx";
import Papa from "papaparse";

// Required keys for both preview and creation
const requiredKeys = [
  "title",
  "type",
  "expirationDate",
  "unitType",
  "quantityPerUnit",
  "category",
  "quantity",
  "datePosted",
  "lotNumber",
  "palletNumber",
  "boxNumber",
  "donorShippingNumber",
  "hfhShippingNumber",
  "unitPrice",
  "maxRequestLimit",
  "ndc",
  "notes",
  "visible",
  "allowAllocations",
  "gik",
];

const containsRequiredKeys = (fields?: string[]) =>
  fields ? requiredKeys.every((key) => fields.includes(key)) : false;

// Schema for donor offer item validation
const DonorOfferItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string(),
  expirationDate: z
    .union([
      z.coerce.date(),
      z.string().transform((val) => (val.trim() === "" ? undefined : val)),
    ])
    .transform((d) => {
      if (d instanceof Date) {
        d.setUTCHours(0);
      }

      return d;
    })
    .optional(),
  unitType: z.string(),
  quantityPerUnit: z
    .string()
    .transform((val) => (val.trim() === "" ? undefined : Number(val)))
    .pipe(z.number().int().min(0, "Quantity must be non-negative")),
  category: z.nativeEnum(ItemCategory),
  quantity: z
    .string()
    .transform((val) => (val.trim() === "" ? undefined : Number(val)))
    .pipe(z.number().int().min(0, "Quantity must be non-negative")),
  datePosted: z.coerce.date(),
  lotNumber: z.string(),
  palletNumber: z.string(),
  boxNumber: z.string(),
  donorShippingNumber: z.string(),
  hfhShippingNumber: z.string(),
  unitPrice: z
    .string()
    .transform((val) => (val.trim() === "" ? undefined : Number(val)))
    .pipe(z.number().min(0)),
  maxRequestLimit: z.string(),
  ndc: z.string().optional(),
  visible: z
    .string()
    .optional()
    .transform((val) => (val || "false").toLowerCase())
    .refine((val) => val === "true" || val === "false", {
      message: "Invalid boolean value",
    })
    .transform((val) => val === "true"),
  allowAllocations: z
    .string()
    .optional()
    .transform((val) => (val || "true").toLowerCase())
    .refine((val) => val === "true" || val === "false", {
      message: "Invalid boolean value",
    })
    .transform((val) => val === "true"),
  gik: z
    .string()
    .optional()
    .transform((val) => (val || "true").toLowerCase())
    .refine((val) => val === "true" || val === "false", {
      message: "Invalid boolean value",
    })
    .transform((val) => val === "true"),
});

// Define the type for donor offer items
type DonorOfferItem = z.infer<typeof DonorOfferItemSchema>;

// Schema for the donor offer itself
const DonorOfferSchema = z.object({
  partnerResponseDeadline: z.date(),
  donorResponseDeadline: z.date(),
  state: z.nativeEnum(DonorOfferState).default(DonorOfferState.FINALIZED),
});

/**
 * GET handler for retrieving donor offer details for finalization
 * @param request The incoming request
 * @param params The route parameters containing donorOfferId
 * @returns 200 with donor offer details if successful
 * @returns 401 if not authenticated
 * @returns 403 if not authorized
 * @returns 404 if donor offer not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ donorOfferId: string }> }
) {
  const session = await auth();
  if (!session?.user) return authenticationError("Session required");

  // Only staff members can finalize donor offers
  if (
    session.user.type !== UserType.STAFF &&
    session.user.type !== UserType.ADMIN &&
    session.user.type !== UserType.SUPER_ADMIN
  ) {
    return authorizationError("Only staff members can finalize donor offers");
  }

  const donorOfferId = parseInt((await params).donorOfferId);
  if (isNaN(donorOfferId)) {
    return NextResponse.json(
      { errors: ["Invalid donor offer ID"] },
      { status: 400 }
    );
  }

  // Fetch the donor offer with its partner visibilities
  const donorOffer = await db.donorOffer.findUnique({
    where: { id: donorOfferId },
    include: {
      partnerVisibilities: {
        include: {
          partner: true,
        },
      },
    },
  });

  if (!donorOffer) {
    return notFoundError("Donor offer not found");
  }

  // Format dates for display
  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toISOString().split("T")[0]; // Format as YYYY-MM-DD for input fields
  };

  return NextResponse.json({
    offerName: donorOffer.offerName,
    donorName: donorOffer.donorName,
    partnerRequestDeadline: formatDate(donorOffer.partnerResponseDeadline),
    donorRequestDeadline: formatDate(donorOffer.donorResponseDeadline),
    partners: donorOffer.partnerVisibilities.map((visibility) => ({
      id: visibility.partner.id,
      name: visibility.partner.name,
    })),
  });
}

/**
 * POST handler for finalizing a donor offer
 * @param request The incoming request
 * @param params The route parameters containing donorOfferId
 * @returns 200 if successful
 * @returns 401 if not authenticated
 * @returns 403 if not authorized
 * @returns 404 if donor offer not found
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ donorOfferId: string }> }
) {
  const session = await auth();
  if (!session?.user) return authenticationError("Session required");

  // Only staff members can finalize donor offers
  if (
    session.user.type !== UserType.STAFF &&
    session.user.type !== UserType.ADMIN &&
    session.user.type !== UserType.SUPER_ADMIN
  ) {
    return authorizationError("Only staff members can finalize donor offers");
  }

  const donorOfferId = parseInt((await params).donorOfferId);
  if (isNaN(donorOfferId)) {
    return NextResponse.json(
      { errors: ["Invalid donor offer ID"] },
      { status: 400 }
    );
  }

  // Check if the donor offer exists
  const existingDonorOffer = await db.donorOffer.findUnique({
    where: { id: donorOfferId },
  });

  if (!existingDonorOffer) {
    return notFoundError("Donor offer not found");
  }

  let validDonorOfferItems: DonorOfferItem[] = [];
  const formData = await request.formData();

  // Extract donor offer data from form
  const partnerRequestDeadline = formData.get(
    "partnerRequestDeadline"
  ) as string;
  const donorRequestDeadline = formData.get("donorRequestDeadline") as string;
  const state = formData.get("state") as DonorOfferState;

  // Extract partner IDs
  const partnerIds: number[] = [];
  formData.getAll("partnerIds").forEach((id) => {
    const parsedId = parseInt(id as string);
    if (!isNaN(parsedId)) {
      partnerIds.push(parsedId);
    }
  });

  // Validate dates
  if (!partnerRequestDeadline || !donorRequestDeadline) {
    return NextResponse.json(
      {
        errors: [
          "Partner request deadline and donor request deadline are required",
        ],
      },
      { status: 400 }
    );
  }

  // Create Date objects and validate them
  const partnerDeadline = new Date(partnerRequestDeadline);
  const donorDeadline = new Date(donorRequestDeadline);

  if (isNaN(partnerDeadline.getTime()) || isNaN(donorDeadline.getTime())) {
    return NextResponse.json(
      { errors: ["Invalid date format for deadlines"] },
      { status: 400 }
    );
  }

  // Validate donor offer data
  const donorOfferData = {
    partnerResponseDeadline: partnerDeadline,
    donorResponseDeadline: donorDeadline,
    state: state || DonorOfferState.FINALIZED,
  };
  const preview = request.nextUrl.searchParams.get("preview") === "true";

  try {
    const file = formData.get("file") as File;

    const donorOfferValidation = DonorOfferSchema.safeParse(donorOfferData);
    if (!donorOfferValidation.success) {
      const errorMessages = donorOfferValidation.error.issues
        .map((issue) => {
          const field = issue.path.join(".");
          return `Field '${field}': ${issue.message}`;
        })
        .join("; ");
      return NextResponse.json(
        { errors: [`Error validating donor offer: ${errorMessages}`] },
        { status: 400 }
      );
    }

    // Process the file if provided
    if (file) {
      // Get file extension
      const fileName = file.name;
      const fileExt = fileName.split(".").pop()?.toLowerCase();

      if (!fileExt || (fileExt !== "csv" && fileExt !== "xlsx")) {
        return argumentError("File must be a CSV or XLSX file");
      }

      let jsonData: Record<string, string>[] = [];

      if (fileExt === "xlsx") {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const csvText = XLSX.utils.sheet_to_csv(sheet);
        const { data, meta } = Papa.parse<Record<string, string>>(csvText, {
          header: true,
        });

        if (!meta.fields || !containsRequiredKeys(meta.fields)) {
          return argumentError("CSV does not contain required keys");
        }

        jsonData = data as Record<string, string>[];
      } else if (fileExt === "csv") {
        const text = await file.text();
        const { data, meta } = Papa.parse<Record<string, string>>(text, {
          header: true,
          skipEmptyLines: true,
        });

        if (!meta.fields || !containsRequiredKeys(meta.fields)) {
          return argumentError("CSV does not contain required keys");
        }

        jsonData = data as Record<string, string>[];
      }

      // Validate each row
      const validationResults = jsonData.map((row, index) => {
        const result = DonorOfferItemSchema.safeParse(row);
        if (!result.success) {
          const errorMessages = result.error.issues
            .map((issue) => {
              const field = issue.path.join(".");
              return `Row ${index + 1}, Field '${field}': ${issue.message}`;
            })
            .join("; ");
          return { valid: false, errors: errorMessages };
        }
        return { valid: true, data: result.data };
      });

      const invalidRows = validationResults.filter((result) => !result.valid);
      if (invalidRows.length > 0) {
        return NextResponse.json(
          { errors: invalidRows.map((row) => row.errors) },
          { status: 400 }
        );
      }

      validDonorOfferItems = validationResults
        .filter(
          (result): result is { valid: true; data: DonorOfferItem } =>
            result.valid
        )
        .map((result) => result.data);
    }
  } catch (error) {
    console.error(error);
    return argumentError("Error processing file");
  }

  if (preview) {
    return NextResponse.json({
      donorOfferItems: validDonorOfferItems.slice(0, 8),
    });
  }

  await db.$transaction(async (tx) => {
    // Update the donor offer
    const donorOffer = await tx.donorOffer.update({
      where: { id: donorOfferId },
      data: donorOfferData,
      include: {
        items: true,
      },
    });

    if (validDonorOfferItems.length > 0) {
      // Add the donor offer ID to each item
      const itemsWithDonorOfferItemId = validDonorOfferItems.map((item) => ({
        ...item,
        donorName: donorOffer.donorName,
        donorOfferItemId: donorOffer.items.find(
          (di) =>
            item.title == di.title &&
            item.type === di.type &&
            (item.expirationDate as Date).getTime() ===
              (di.expirationDate as Date).getTime() &&
            item.unitType === di.unitType &&
            item.quantityPerUnit == di.quantityPerUnit
        )?.id,
      }));

      await tx.item.createMany({ data: itemsWithDonorOfferItemId });
    }

    // Update partner visibility relationships
    if (partnerIds.length > 0) {
      // First, delete existing partner visibilities
      await tx.donorOfferPartnerVisibility.deleteMany({
        where: { donorOfferId },
      });

      // Validate that all partner IDs exist
      const partners = await tx.user.findMany({
        where: {
          id: {
            in: partnerIds,
          },
          type: UserType.PARTNER,
        },
        select: {
          id: true,
        },
      });

      if (partners.length !== partnerIds.length) {
        return argumentError("One or more partner IDs are invalid");
      }

      // Create the new partner visibility relationships
      await tx.donorOfferPartnerVisibility.createMany({
        data: partnerIds.map((partnerId) => ({
          donorOfferId: donorOfferId,
          partnerId: partnerId,
        })),
      });
    }
  });

  return NextResponse.json({
    success: true,
    donorOfferId: donorOfferId,
    createdCount: validDonorOfferItems.length,
  });
}
