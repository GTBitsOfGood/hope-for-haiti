import { auth } from "@/auth";
import { db } from "@/db";
import { authenticationError, authorizationError, ok } from "@/util/responses";
import { RequestPriority, UserType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

interface GeneralItem {
  title: string;
  type: string;
  expirationDate: string;
  unitType: string;
  quantityPerUnit: number;
}

interface ItemRequest {
  generalItem: GeneralItem;

  priority: RequestPriority;
  quantity: string;
  comments: string;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return authenticationError("Session required");
  if (!session?.user) return authenticationError("User not found");
  if (session.user.type !== UserType.PARTNER)
    return authorizationError("User must be a partner");

  const reqBody: ItemRequest[] = await req.json();
  const data = reqBody.map((req) => ({
    partnerId: parseInt(session.user.id),
    title: req.generalItem.title,
    type: req.generalItem.type,
    expirationDate: req.generalItem.expirationDate
      ? new Date(req.generalItem.expirationDate)
      : null,
    quantityPerUnit: req.generalItem.quantityPerUnit,
    unitType: req.generalItem.unitType,

    priority: req.priority,
    quantity: parseInt(req.quantity),
    comments: req.comments,
  }));

  await db.unallocatedItemRequest.createMany({
    data: data,
  });

  return ok();
}

export async function GET() {
  const session = await auth();
  if (!session) return authenticationError("Session required");
  if (!session?.user) return authenticationError("User not found");
  if (session.user.type !== UserType.PARTNER)
    return authorizationError("User must be a partner");

  const requests = (
    await db.unallocatedItemRequest.findMany({
      where: { partnerId: parseInt(session.user.id) },
      select: {
        id: true,
        title: true,
        expirationDate: true,
        unitType: true,
        quantityPerUnit: true,

        priority: true,
        quantity: true,
        createdAt: true,
        comments: true,
      },
    })
  ).map((req) => ({
    ...req,
    expirationDate: req.expirationDate?.toLocaleDateString(),
    createdAt: req.createdAt.toLocaleDateString(),
  }));

  return NextResponse.json(requests, { status: 200 });
}
