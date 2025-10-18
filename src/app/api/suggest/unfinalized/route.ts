import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { RequestPriority } from "@prisma/client";
import {
  errorResponse,
  AuthenticationError,
  AuthorizationError,
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
  type: string;
  expirationDate: Date | null;
  unitType: string;
  quantityPerUnit: number;
  initialQuantity: number;
  donorOfferId: number;
  requestQuantity: number | null;
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
  type: string;
  description: string;
  expirationDate: string;
  unitType: string;
  quantityPerUnit: number;
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

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN or SUPER_ADMIN");
    }

    const json = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const { itemsWithRequests } =
      await DonorOfferService.getAdminDonorOfferDetails(
        parsed.data.donorOfferId
      );

    const generalItems: GeneralItemForLLM[] = itemsWithRequests.map(
      (item: GeneralItemWithRequests) => ({
        title: item.title,
        type: item.type,
        description: `${item.title} - ${item.type}`,
        expirationDate: item.expirationDate
          ? new Date(item.expirationDate).toISOString()
          : new Date().toISOString(),
        unitType: item.unitType,
        quantityPerUnit: item.quantityPerUnit,
        totalQuantity: item.initialQuantity,
        requests: item.requests.map(
          (req: GeneralItemWithRequests["requests"][0]) => ({
            partnerId: req.partnerId,
            quantity: req.quantity,
          })
        ),
      })
    );

    console.log("API: Sending to LLM:", JSON.stringify(generalItems, null, 2));

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result =
            await UnfinalizedSuggestionService.suggestAllocationsStream(
              generalItems,
              (chunk) => {
                console.log("API: Sending chunk to frontend:", chunk);
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
                );
              }
            );

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, result })}\n\n`
            )
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
