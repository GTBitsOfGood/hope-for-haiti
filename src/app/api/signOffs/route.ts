import { auth } from "@/auth";
import { db } from "@/db";
import { SignedOffDistribution } from "@/types";
import { authenticationError, authorizationError, ok } from "@/util/responses";
import { UserType } from "@prisma/client";
import { NextRequest } from "next/server";

interface RequestBody {
  partnerId: string | number;
  staffName: string;
  partnerName: string;
  date: string;
  signatureBlob: string;
  distributions: SignedOffDistribution[];
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return authenticationError("Session required");
  }
  if (
    session.user.type !== UserType.STAFF &&
    session.user.type !== UserType.ADMIN &&
    session.user.type !== UserType.SUPER_ADMIN
  ) {
    return authorizationError("Unauthorized");
  }

  const data: RequestBody = await req.json();
  data.partnerId = parseInt(data.partnerId as string);

  await db.signOff.create({
    data: {
      staffMemberName: data.staffName,
      partnerName: data.partnerName,
      date: new Date(data.date),
      partnerId: data.partnerId,
      distributions: {
        createMany: {
          data: data.distributions.map((dist) => ({
            partnerId: data.partnerId as number,
            ...(dist.allocationType === "unallocated"
              ? {
                  unallocatedItemRequestAllocationId: dist.allocationId,
                }
              : {
                  donorOfferItemRequestAllocationId: dist.allocationId,
                }),
            actualQuantity: dist.actualQuantity,
          })),
        },
      },
    },
  });

  return ok();
}
