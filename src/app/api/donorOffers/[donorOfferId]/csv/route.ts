import { auth } from "@/auth";
import DonorOfferService from "@/services/donorOfferService";
import UserService from "@/services/userService";
import {
  ArgumentError,
  AuthenticationError,
  errorResponse,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const paramSchema = z.object({
  donorOfferId: z.string().transform((val) => {
    const parsed = parseInt(val, 10);
    if (Number.isNaN(parsed)) {
      throw new Error("donorOfferId must be a valid number");
    }
    return parsed;
  }),
});

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ donorOfferId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    UserService.checkPermission(session.user, "offerWrite");

    const resolvedParams = await params;
    const parsed = paramSchema.safeParse(resolvedParams);
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const { csv, fileName } =
      await DonorOfferService.getUnfinalizedDonorOfferCsv(
        parsed.data.donorOfferId
      );

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
