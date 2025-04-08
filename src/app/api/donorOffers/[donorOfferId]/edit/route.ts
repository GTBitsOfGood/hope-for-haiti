import { db } from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { DonorOfferState } from "@prisma/client";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ donorOfferId: string }> }
) {
  const { donorOfferId } = await params;
  const donorOffer = await db.donorOffer.findUnique({
    where: { id: parseInt(donorOfferId) },
    include: {
      items: true,
      partnerVisibilities: {
        select: {
          partner: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });
  return NextResponse.json(donorOffer);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ donorOfferId: string }> }
) {
  try {
    const { donorOfferId } = await params;
    const formData = await req.formData();

    const offerName = formData.get("offerName") as string;
    const donorName = formData.get("donorName") as string;
    const partnerRequestDeadline = formData.get(
      "partnerRequestDeadline"
    ) as string;
    const donorRequestDeadline = formData.get("donorRequestDeadline") as string;
    const partnerIds = formData.getAll("partnerIds") as string[];
    const items = formData
      .getAll("items")
      .map((item) => JSON.parse(item as string));

    // Start a transaction to ensure all operations succeed or fail together
    const result = await db.$transaction(async (tx) => {
      // Update the donor offer
      const updatedDonorOffer = await tx.donorOffer.update({
        where: { id: parseInt(donorOfferId) },
        data: {
          offerName,
          donorName,
          partnerResponseDeadline: new Date(partnerRequestDeadline),
          donorResponseDeadline: new Date(donorRequestDeadline),
          state: DonorOfferState.UNFINALIZED,
        },
      });

      // Delete all existing partner visibilities
      await tx.donorOfferPartnerVisibility.deleteMany({
        where: { donorOfferId: parseInt(donorOfferId) },
      });

      // Create new partner visibilities
      await tx.donorOfferPartnerVisibility.createMany({
        data: partnerIds.map((partnerId) => ({
          donorOfferId: parseInt(donorOfferId),
          partnerId: parseInt(partnerId),
        })),
      });

      // Process items
      for (const item of items) {
        if (item.id) {
          // Update existing item
          await tx.donorOfferItem.update({
            where: { id: item.id },
            data: {
              title: item.title,
              type: item.type,
              quantity: item.quantity,
              expirationDate: item.expirationDate
                ? new Date(item.expirationDate)
                : null,
              unitType: item.unitType,
              quantityPerUnit: item.quantityPerUnit,
            },
          });
        } else {
          // Create new item
          await tx.donorOfferItem.create({
            data: {
              donorOfferId: parseInt(donorOfferId),
              title: item.title,
              type: item.type,
              quantity: item.quantity,
              expirationDate: item.expirationDate
                ? new Date(item.expirationDate)
                : null,
              unitType: item.unitType,
              quantityPerUnit: item.quantityPerUnit,
            },
          });
        }
      }

      return updatedDonorOffer;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating donor offer:", error);
    return NextResponse.json(
      { error: "Failed to update donor offer" },
      { status: 500 }
    );
  }
}
