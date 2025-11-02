import { NextRequest, NextResponse } from "next/server";
import { MatchingService } from "@/services/matchingService";

type ItemInput = {
  id: number;
  title: string;
  donorOfferId: number;
};

type AddRequestBody = {
  item?: ItemInput;
  items?: ItemInput[];
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: AddRequestBody = await req.json();
    const payload = body.items ?? (body.item ? [body.item] : []);

    if (payload.length === 0) {
      return NextResponse.json(
        { error: "Provide 'item' or 'items'." },
        { status: 400 }
      );
    }

    await MatchingService.add(payload);
    return NextResponse.json({ ok: true, count: payload.length });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
