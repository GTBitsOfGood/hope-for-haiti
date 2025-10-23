import { auth } from "@/auth";
import { isAdmin } from "@/lib/userUtils";
import { LineItemService } from "@/services/lineItemService";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  errorResponse,
} from "@/util/errors";
import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  startDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val!) : undefined)),
  endDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val!) : undefined)),
  excludePartnerTags: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new AuthenticationError("User not authenticated");
    }

    if (!isAdmin(session.user.type)) {
      throw new AuthorizationError("User must be an admin");
    }

    const url = new URL(request.url);
    const parsedQuery = querySchema.safeParse(
      Object.fromEntries(url.searchParams.entries())
    );

    if (!parsedQuery.success) {
      throw new ArgumentError(parsedQuery.error.message);
    }

    const imports = LineItemService.getTotalImportsByMonth(
      parsedQuery.data.startDate,
      parsedQuery.data.endDate,
      parsedQuery.data.excludePartnerTags
    );

    const topMedications = LineItemService.getTopMedicationImports(
      parsedQuery.data.startDate,
      parsedQuery.data.endDate,
      parsedQuery.data.excludePartnerTags
    );

    const shipmentStats = LineItemService.getShipmentStats(
      parsedQuery.data.startDate,
      parsedQuery.data.endDate,
      parsedQuery.data.excludePartnerTags
    );

    const result = {
      totalImports: (await imports).total,
      monthlyImportTotals: (await imports).monthlyTotals,
      totalShipments: (await shipmentStats).shipmentCount,
      totalPallets: (await shipmentStats).palletCount,
      topMedications: await topMedications,
    };

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
