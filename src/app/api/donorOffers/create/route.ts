import { auth } from "@/auth";
import { db } from "@/db";
import {
  argumentError,
  authenticationError,
  authorizationError,
} from "@/util/responses";
import { DonorOfferState, UserType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as XLSX from "xlsx";
import Papa from "papaparse";

const AUTHORIZED_USER_TYPES = [UserType.ADMIN, UserType.SUPER_ADMIN] as UserType[];

// Required keys for both preview and creation
const requiredKeys = [
  "title",
  "type",
  "quantity",
  "expiration",
  "unitType",
  "quantityPerUnit"
];

const containsRequiredKeys = (fields?: string[]) =>
  fields ? requiredKeys.every((key) => fields.includes(key)) : false;

// Schema for donor offer item validation
const DonorOfferItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string(),
  quantity: z.string()
    .transform((val) => (val.trim() === "" ? undefined : Number(val)))
    .pipe(z.number().int().min(0, "Quantity must be non-negative")),
  expiration: z.union([
    z.coerce.date(),
    z.string().transform((val) => (val.trim() === "" ? undefined : val))
  ]).optional(),
  unitType: z.string().optional(),
  quantityPerUnit: z.string().optional(),
});

// Schema for the donor offer itself
const DonorOfferSchema = z.object({
  offerName: z.string().min(1, "Offer name is required"),
  donorName: z.string().min(1, "Donor name is required"),
  responseDeadline: z.coerce.date(),
  state: z.nativeEnum(DonorOfferState).default(DonorOfferState.UNFINALIZED),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !session?.user) return authenticationError("Session required");
  if (!AUTHORIZED_USER_TYPES.includes(session.user.type)) return authorizationError("Not authorized");

  const url = new URL(request.url);
  const preview = url.searchParams.get("preview") === "true";
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  
  // Get donor offer details from form data
  const offerName = formData.get("offerName") as string;
  const donorName = formData.get("donorName") as string;
  const responseDeadline = formData.get("responseDeadline") as string;
  const state = formData.get("state") as DonorOfferState || DonorOfferState.UNFINALIZED;
  
  // Get partner IDs from form data and convert to numbers
  const partnerIdStrings = formData.getAll("partnerIds") as string[];
  const partnerIds = partnerIdStrings.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

  if (!file) {
    return argumentError("No file provided");
  }

  if (!offerName || !donorName || !responseDeadline) {
    return argumentError("Missing required donor offer information");
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase();
  if (!["csv", "xlsx"].includes(fileExt || "")) {
    return argumentError(`Error opening ${file.name}: must be a valid CSV or XLSX file`);
  }

  let jsonData: unknown[] = [];

  try {
    if (fileExt === "xlsx") {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const csvText = XLSX.utils.sheet_to_csv(sheet);
      const { data, meta } = Papa.parse(csvText, { header: true });

      if (!meta.fields || !containsRequiredKeys(meta.fields)) {
        return argumentError("CSV does not contain required keys");
      }

      jsonData = data;
    } else if (fileExt === "csv") {
      const text = await file.text();
      const { data, meta } = Papa.parse(text, { header: true, skipEmptyLines: true });

      if (!meta.fields || !containsRequiredKeys(meta.fields)) {
        return argumentError("CSV does not contain required keys");
      }

      jsonData = data;
    }

    const errors: string[] = [];
    const validDonorOfferItems: typeof DonorOfferItemSchema._type[] = [];

    jsonData.forEach((row, index) => {
      const parsed = DonorOfferItemSchema.safeParse(row);
      if (!parsed.success) {
        const errorMessages = parsed.error.issues
          .map((issue) => {
            const field = issue.path.join(".");
            return `Column '${field}': ${issue.message}`;
          })
          .join("; ");
        errors.push(`Error validating donor offer item on row ${index + 1}: ${errorMessages}`);
      } else {
        validDonorOfferItems.push(parsed.data);
      }
    });

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Validate donor offer details
    const donorOfferData = {
      offerName,
      donorName,
      responseDeadline: new Date(responseDeadline),
      state,
    };
    
    const donorOfferValidation = DonorOfferSchema.safeParse(donorOfferData);
    if (!donorOfferValidation.success) {
      const errorMessages = donorOfferValidation.error.issues
        .map((issue) => {
          const field = issue.path.join(".");
          return `Field '${field}': ${issue.message}`;
        })
        .join("; ");
      return NextResponse.json({ errors: [`Error validating donor offer: ${errorMessages}`] }, { status: 400 });
    }

    if (preview) {
      return NextResponse.json({ donorOfferItems: validDonorOfferItems.slice(0, 8) });
    }

    // Create the donor offer first
    const donorOffer = await db.donorOffer.create({
      data: donorOfferData,
    });

    // Then create all the items with the donor offer ID
    const itemsWithDonorOfferId = validDonorOfferItems.map(item => ({
      ...item,
      donorOfferId: donorOffer.id,
    }));

    await db.donorOfferItem.createMany({ data: itemsWithDonorOfferId });
    
    // Create partner visibility relationships if partner IDs are provided
    if (partnerIds.length > 0) {
      // Validate that all partner IDs exist
      const partners = await db.user.findMany({
        where: {
          id: {
            in: partnerIds
          },
          type: UserType.PARTNER
        },
        select: {
          id: true
        }
      });
      
      if (partners.length !== partnerIds.length) {
        return argumentError("One or more partner IDs are invalid");
      }
      
      // Create the partner visibility relationships
      await db.donorOfferPartnerVisibility.createMany({
        data: partnerIds.map(partnerId => ({
          donorOfferId: donorOffer.id,
          partnerId: partnerId
        }))
      });
    }

    return NextResponse.json({ 
      success: true, 
      donorOfferId: donorOffer.id,
      createdCount: validDonorOfferItems.length 
    });
  } catch (error) {
    console.error(error);
    return argumentError("Error processing file");
  }
}
