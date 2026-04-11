import { auth } from "@/auth";
import { errorResponse } from "@/util/errors";
import DistributionService from "@/services/distributionService";
import UserService from "@/services/userService";
import {
  AuthenticationError,
  ArgumentError,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Papa from "papaparse";

const querySchema = z.object({
  reportType: z.enum(["shipment-partner", "donor-category"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  shipmentId: z.string().optional(),
  donorName: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    UserService.checkPermission(session.user, "shipmentRead");

    // Parse and validate query parameters
    const params = {
      reportType: request.nextUrl.searchParams.get("reportType"),
      startDate: request.nextUrl.searchParams.get("startDate") || undefined,
      endDate: request.nextUrl.searchParams.get("endDate") || undefined,
      shipmentId: request.nextUrl.searchParams.get("shipmentId") || undefined,
      donorName: request.nextUrl.searchParams.get("donorName") || undefined,
    };

    const parsed = querySchema.safeParse(params);
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const { reportType, startDate, endDate, shipmentId, donorName } =
      parsed.data;

    console.log(
      `[Reports API] Generating ${reportType} report with params:`,
      { startDate, endDate, shipmentId, donorName }
    );

    let result;

    if (reportType === "shipment-partner") {
      result = await DistributionService.getShipmentPartnerSummaryReport({
        startDate,
        endDate,
        shipmentId,
      });
    } else {
      result = await DistributionService.getDonorCategorySummaryReport({
        startDate,
        endDate,
        donorName,
      });
    }

    console.log(
      `[Reports API] Generated report with ${result.rows.length} rows`
    );

    // Build CSV content based on report type
    let csv: string;

    if (reportType === "shipment-partner") {
      const columns = [
        "Shipment Number",
        "Recipient",
        "Category",
        "Total Items",
        "Category Value",
        "Shipment Total",
      ];

      const rows = result.rows.map((row) => ({
        "Shipment Number": row.shipmentNumber,
        Recipient: row.recipient,
        Category: row.category,
        "Total Items": row.totalItems,
        "Category Value": `$${row.categoryValue.toFixed(2)}`,
        "Shipment Total": `$${row.shipmentTotal.toFixed(2)}`,
      }));

      csv = `\uFEFF${Papa.unparse(rows, { columns })}`;
    } else {
      const columns = [
        "Donor Name",
        "Category",
        "Total Quantity",
        "Total Value Sent",
      ];

      const rows = result.rows.map((row) => ({
        "Donor Name": row.donorName,
        Category: row.category,
        "Total Quantity": row.totalQuantity,
        "Total Value Sent": `$${row.totalValueSent.toFixed(2)}`,
      }));

      csv = `\uFEFF${Papa.unparse(rows, { columns })}`;
    }

    console.log(
      `[Reports API] CSV generated, first 200 chars:`,
      csv.substring(0, 200)
    );

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[Reports API] Error generating report:", error);
    return errorResponse(error);
  }
}
