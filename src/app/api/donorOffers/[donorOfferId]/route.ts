import { auth } from "@/auth";
import { db } from "@/db";
import {
  authenticationError,
  authorizationError,
  notFoundError,
} from "@/util/responses";
import { RequestPriority, UserType } from "@prisma/client";
import { format } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import {
  DonorOfferItemDTO,
  DonorOfferItemsRequestsDTO,
  DonorOfferItemsRequestsResponse,
} from "./types";

async function handlePartnerRequest(
  donorOfferId: number
): Promise<NextResponse> {
  const donorOffer = await db.donorOffer.findUnique({
    where: { id: donorOfferId },
  });
  if (!donorOffer) {
    return notFoundError("Donor offer not found");
  }
  const donorOfferItems = (
    await db.donorOfferItem.findMany({ where: { donorOfferId } })
  ).map(
    (item) =>
      ({
        id: item.id,
        title: item.title,
        type: item.type,
        expiration:
          item.expirationDate === null
            ? null
            : format(item.expirationDate, "MM/dd/yyyy"),
        quantity: item.quantity,
        unitSize: item.quantityPerUnit,
      }) as DonorOfferItemDTO
  );

  const donorOfferItemsRequests: DonorOfferItemsRequestsDTO[] = [];
  for (const item of donorOfferItems) {
    const requests = await db.donorOfferItemRequest.findMany({
      where: { donorOfferItemId: item.id },
    });

    donorOfferItemsRequests.push(
      ...requests.map((request) => ({
        requestId: request.id,
        donorOfferItemId: item.id,
        title: item.title,
        type: item.type,
        expiration: item.expiration,
        quantity: item.quantity,
        unitSize: item.unitSize,
        quantityRequested: request.quantity,
        comments: request.comments,
        priority: request.priority,
      }))
    );
  }

  return NextResponse.json({
    donorOfferName: donorOffer.offerName,
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
    return handlePartnerRequest(donorOfferId);
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
  const partnerId =
    typeof session.user.id === "string"
      ? parseInt(session.user.id, 10)
      : session.user.id;
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
  const processedRequests = await Promise.all(
    requests.map(async (req) => {
      const safePriority =
        req.priority == null ? RequestPriority.LOW : req.priority;
      const existing = await db.donorOfferItemRequest.findFirst({
        where: { donorOfferItemId: req.donorOfferItemId, partnerId },
      });
      if (existing) {
        return db.donorOfferItemRequest.update({
          where: { id: existing.id },
          data: {
            quantity: req.quantityRequested,
            comments: req.comments ?? "",
            priority: safePriority,
          },
        });
      } else {
        // Create a new record
        return db.donorOfferItemRequest.create({
          data: {
            donorOfferItemId: req.donorOfferItemId,
            partnerId,
            quantity: req.quantityRequested,
            comments: req.comments ?? "",
            priority: safePriority,
          },
        });
      }
    })
  );
  return NextResponse.json({ success: true, processedRequests });
}
