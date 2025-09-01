import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { ArgumentError, AuthenticationError, AuthorizationError } from "@/util/errors";
import { errorResponse } from "@/util/errors";
import UserService from "@/services/userService";
import AllocationService from "@/services/allocationService";
import { NextResponse } from "next/server";
import { z } from "zod";

const paramSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string().min(1, "Type is required"),
  expirationDate: z
    .string()
    .transform((val) => new Date(val))
    .pipe(z.date().refine((date) => !isNaN(date.getTime()), "Invalid date")),
  unitType: z.string().min(1, "Unit type is required"),
  quantityPerUnit: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().int().positive("Quantity per unit must be a positive integer")),
  donorName: z.string().optional(),
  lotNumber: z.string().optional(),
  palletNumber: z.string().optional(),
  boxNumber: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    const url = new URL(request.url);
    const params = {
      title: url.searchParams.get("title"),
      type: url.searchParams.get("type"),
      expirationDate: url.searchParams.get("expirationDate"),
      unitType: url.searchParams.get("unitType"),
      quantityPerUnit: url.searchParams.get("quantityPerUnit"),
      donorName: url.searchParams.get("donorName"),
      lotNumber: url.searchParams.get("lotNumber"),
      palletNumber: url.searchParams.get("palletNumber"),
      boxNumber: url.searchParams.get("boxNumber"),
    };

    const parsed = paramSchema.safeParse(params);
    
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const result = await AllocationService.searchItems(parsed.data);
    
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
