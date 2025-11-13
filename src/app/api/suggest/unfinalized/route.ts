import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { RequestPriority, Prisma } from "@prisma/client";
import {
  errorResponse,
  AuthenticationError,
  ArgumentError,
} from "@/util/errors";
import UserService from "@/services/userService";
import { UnfinalizedSuggestionService } from "@/services/unfinalizedSuggestionService";
import DonorOfferService from "@/services/donorOfferService";

const bodySchema = z.object({
  donorOfferId: z
    .number()
    .int()
    .positive("Donor offer ID must be a positive integer"),
});

type GeneralItemWithRequests = {
  id: number;
  title: string;
  expirationDate: Date | null;
  unitType: string;
  initialQuantity: number;
  donorOfferId: number;
  requestQuantity: number | null;
  description: string | null;
  weight: Prisma.Decimal;
  requests: {
    id: number;
    quantity: number;
    finalQuantity: number;
    partnerId: number;
    generalItemId: number;
    comments: string | null;
    priority: RequestPriority | null;
    createdAt: Date;
    partner: {
      name: string;
    };
  }[];
};

type GeneralItemForLLM = {
  title: string;
  description: string;
  expirationDate: string;
  unitType: string;
  totalQuantity: number;
  requests: {
    partnerId: number;
    quantity: number;
  }[];
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    UserService.checkPermission(session.user, "requestWrite");

    const json = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const { items } =
      await DonorOfferService.getAdminDonorOfferDetails(
        parsed.data.donorOfferId,
        true
      );

    // Type cast because we know requests will be included when we pass true
    const itemsWithRequests = items as GeneralItemWithRequests[];

    const generalItems: GeneralItemForLLM[] = itemsWithRequests.map(
      (item: GeneralItemWithRequests) => ({
        title: item.title,
        description: item.description || item.title,
        expirationDate: item.expirationDate
          ? new Date(item.expirationDate).toISOString()
          : new Date().toISOString(),
        unitType: item.unitType,
        totalQuantity: item.initialQuantity,
        requests: item.requests.map(
          (req: GeneralItemWithRequests["requests"][0]) => ({
            partnerId: req.partnerId,
            quantity: req.quantity,
          })
        ),
      })
    );

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await UnfinalizedSuggestionService.suggestAllocationsStream(
            generalItems,
            (chunk) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
              );
            }
          );

          controller.close();
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
