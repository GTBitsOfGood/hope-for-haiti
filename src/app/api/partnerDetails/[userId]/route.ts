import { auth } from "@/auth";
import { errorResponse } from "@/util/errors";
import { PartnerDetailsService } from "@/services/partnerDetailsService";
import { PartnerService } from "@/services/partnerService";
import { AuthenticationError, AuthorizationError, ArgumentError } from "@/util/errors";
import { NextResponse, NextRequest } from "next/server";
import { zfd } from "zod-form-data";
import { partnerDetailsSchema } from "@/schema/partnerDetails";
import { z } from "zod";

const paramSchema = z.object({
  userId: z.string().transform((val) => {
    const parsed = parseInt(val);
    if (isNaN(parsed)) {
      throw new Error("userId must be a valid number");
    }
    return parsed;
  }),
});

const partnerDetailsFormSchema = zfd.formData({
  partnerDetails: zfd.json(partnerDetailsSchema),
});

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    const resolvedParams = await params;
    const parsed = paramSchema.safeParse(resolvedParams);
    
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    if (!PartnerService.canAccessPartnerDetails(session.user.type, session.user.id, parsed.data.userId.toString())) {
      throw new AuthorizationError("You are not allowed to view this");
    }

    const partnerDetails = await PartnerDetailsService.getPartnerDetails(parsed.data.userId);

    return NextResponse.json(partnerDetails, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    const resolvedParams = await params;
    const parsed = paramSchema.safeParse(resolvedParams);
    
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    if (!PartnerService.canAccessPartnerDetails(session.user.type, session.user.id, parsed.data.userId.toString())) {
      throw new AuthorizationError("You are not allowed to modify this record");
    }

    const formData = await req.formData();
    const parsedData = partnerDetailsFormSchema.safeParse(formData);
    
    if (!parsedData.success) {
      throw new ArgumentError(parsedData.error.message);
    }

    const updatedPartnerDetails = await PartnerDetailsService.updatePartnerDetails({
      userId: parsed.data.userId,
      partnerDetails: parsedData.data.partnerDetails,
    });

    return NextResponse.json(updatedPartnerDetails, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
