import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

import { auth } from "@/auth";
import FileService from "@/services/fileService";
import {
  ArgumentError,
  AuthenticationError,
  errorResponse,
} from "@/util/errors";

const paramSchema = z.object({
  filename: z
    .string()
    .min(1, "Filename is required")
    .trim(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    const params = req.nextUrl.searchParams;
    const parsed = paramSchema.safeParse({
      filename: params.get("filename"),
    });
    
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const blobName = `${uuidv4()}-${parsed.data.filename}`;
    
    const result = await FileService.generateUploadUrl(blobName);

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
