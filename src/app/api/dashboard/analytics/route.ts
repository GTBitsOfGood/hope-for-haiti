import { auth } from "@/auth";
import { isAdmin } from "@/lib/userUtils";
import { LineItemService } from "@/services/lineItemService";
import UserService from "@/services/userService";
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
    .transform((val) => (val ? new Date(val) : undefined)),
  endDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  excludePartnerTags: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(",") : [])),
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

    const importsPromise = LineItemService.getTotalImportsByMonth(
      parsedQuery.data.startDate,
      parsedQuery.data.endDate,
      parsedQuery.data.excludePartnerTags
    );

    const topMedicationsPromise = LineItemService.getTopMedicationImports(
      parsedQuery.data.startDate,
      parsedQuery.data.endDate,
      parsedQuery.data.excludePartnerTags
    );

    const shipmentStatsPromise = LineItemService.getShipmentStats(
      parsedQuery.data.startDate,
      parsedQuery.data.endDate,
      parsedQuery.data.excludePartnerTags
    );

    const partnerCountPromise = UserService.countPartners();

    const importWeightPromise = LineItemService.getTotalImportWeight(
      parsedQuery.data.startDate,
      parsedQuery.data.endDate,
      parsedQuery.data.excludePartnerTags
    );

    const topDonorsPromise = LineItemService.getTopDonors(
      parsedQuery.data.startDate,
      parsedQuery.data.endDate,
      parsedQuery.data.excludePartnerTags
    );

    const [
      imports,
      topMedications,
      shipmentStats,
      partnerCount,
      importWeight,
      topDonors,
    ] = await Promise.all([
      importsPromise,
      topMedicationsPromise,
      shipmentStatsPromise,
      partnerCountPromise,
      importWeightPromise,
      topDonorsPromise,
    ]);

    const result = {
      totalImports: imports.total,
      monthlyImportTotals: imports.monthlyTotals,
      totalShipments: shipmentStats.shipmentCount,
      totalPallets: shipmentStats.palletCount,
      topMedications: topMedications,
      partnerCount: partnerCount,
      importWeight: importWeight,
      topDonors: topDonors,
    };

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
