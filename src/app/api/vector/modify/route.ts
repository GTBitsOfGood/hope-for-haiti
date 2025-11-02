import { NextRequest, NextResponse } from "next/server";
import { MatchingService } from "@/services/matchingService";

type ModifyInput = {
  id: number;
  title?: string;
  donorOfferId?: number;
};

type ModifyRequestBody = {
  item?: ModifyInput;
  items?: ModifyInput[];
};

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const body: ModifyRequestBody = await req.json();
    const payload = body.items ?? (body.item ? [body.item] : []);

    if (payload.length === 0) {
      return NextResponse.json(
        { error: "Provide 'item' or 'items'." },
        { status: 400 }
      );
    }

    if (payload.some((i) => typeof i.id !== "number")) {
      return NextResponse.json(
        { error: "Each item must include a numeric 'id'." },
        { status: 400 }
      );
    }

    await MatchingService.modify(payload);
    return NextResponse.json({ ok: true, count: payload.length });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
