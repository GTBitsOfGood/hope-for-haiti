import { NextRequest, NextResponse } from "next/server";
import { MatchingService } from "@/services/matchingService";

type RemoveRequestBody = {
  ids?: number[];
  donorOfferId?: number;
};

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const body: RemoveRequestBody = await req.json();

    if ((!body.ids || body.ids.length === 0) && body.donorOfferId == null) {
      return NextResponse.json(
        { error: "At least one of 'ids' or 'donorOfferId' must be provided." },
        { status: 400 }
      );
    }

    await MatchingService.remove({
      ids: body.ids,
      donorOfferId: body.donorOfferId,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
