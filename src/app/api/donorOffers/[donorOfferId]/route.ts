import { auth } from "@/auth";
import { db } from "@/db";
import {
  authenticationError,
  authorizationError,
  notFoundError,
  ok,
} from "@/util/responses";
import { UserType } from "@prisma/client";
import { format } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import {
  DonorOfferItemsRequestsDTO,
  DonorOfferItemsRequestsResponse,
} from "./types";

async function handlePartnerRequest(
  partnerId: string,
  donorOfferId: number
): Promise<NextResponse> {
  const donorOffer = await db.donorOffer.findUnique({
    where: { id: donorOfferId },
  });
  if (!donorOffer) return notFoundError("Donor offer not found");

  const donorOfferItemsRequests = (
    await db.donorOfferItem.findMany({
      where: { donorOfferId },
      include: {
        requests: { where: { partnerId: parseInt(partnerId as string) } },
      },
    })
  ).map(
    (item) =>
      ({
        donorOfferItemId: item.id,
        title: item.title,
        type: item.type,
        expiration:
          item.expirationDate === null
            ? null
            : format(item.expirationDate, "MM/dd/yyyy"),
        quantity: item.quantity,
        unitSize: item.quantityPerUnit,
        ...(item.requests[0]
          ? {
              requestId: item.requests[0].id,
              quantityRequested: item.requests[0].quantity,
              comments: item.requests[0].comments,
              priority: item.requests[0].priority,
            }
          : {
              requestId: null,
              quantityRequested: 0,
              comments: null,
              priority: null,
            }),
      }) as DonorOfferItemsRequestsDTO
  );

  return NextResponse.json({
    donorOfferName: donorOffer.offerName,
    donorOfferItemsRequests,
  } as DonorOfferItemsRequestsResponse);
}

async function handleAdminRequest(donorOfferId: number): Promise<NextResponse> {
  const donorOffer = await db.donorOffer.findUnique({
    where: { id: donorOfferId },
  });

  if (!donorOffer) return notFoundError("Donor offer not found");

  const itemsWithRequests = await db.donorOfferItem.findMany({
    where: { donorOfferId },
    include: { requests: { include: { partner: { select: { name: true } } } } },
  });
  return NextResponse.json({
    donorOffer,
    itemsWithRequests,
  });
}

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ donorOfferId: string }> }
) {
  const session = await auth();
  if (!session?.user) return authenticationError("Session required");

  const donorOfferId = parseInt((await params).donorOfferId, 10);

  if (session.user.type === UserType.PARTNER) {
    return handlePartnerRequest(session.user.id, donorOfferId);
  } else if (
    session.user.type === UserType.ADMIN ||
    session.user.type === UserType.SUPER_ADMIN ||
    session.user.type === UserType.STAFF
  ) {
    return handleAdminRequest(donorOfferId);
  } else {
    return authorizationError("Unauthorized user type");
  }
}
interface PostBody {
  requests: DonorOfferItemsRequestsDTO[];
}

function isValidBody(body: unknown): body is PostBody {
  if (typeof body !== "object" || body === null) return false;
  const potentialBody = body as { requests?: unknown };
  return Array.isArray(potentialBody.requests);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) return authenticationError("Session required");
  if (session.user.type !== UserType.PARTNER)
    return authorizationError("Wrong user type");
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!isValidBody(rawBody)) {
    return NextResponse.json(
      { error: "POST body must be { requests: [...] }" },
      { status: 400 }
    );
  }
  const { requests } = rawBody;

  await db.$transaction(async (tx) => {
    await Promise.all(
      requests.map((item) => {
        const priority =
          (item.priority as string) === "" ? null : item.priority;

        return tx.donorOfferItemRequest.upsert({
          where: {
            donorOfferItemId_partnerId: {
              donorOfferItemId: item.donorOfferItemId,
              partnerId: parseInt(session.user.id),
            },
          },
          update: {
            quantity: item.quantityRequested,
            comments: item.comments,
            priority: priority,
          },
          create: {
            donorOfferItemId: item.donorOfferItemId,
            partnerId: parseInt(session.user.id),
            quantity: item.quantityRequested,
            comments: item.comments,
            priority: priority,
          },
        });
      })
    );
  });

  return ok();
}
