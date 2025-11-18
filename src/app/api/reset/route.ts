import { auth } from "@/auth";
import {
  AuthenticationError,
  errorResponse,
} from "@/util/errors";
import { NextResponse } from "next/server";

import { db } from "@/db";
import StreamIoService from "@/services/streamIoService";
import FileService from "@/services/fileService";

async function resetDatabase() {
  // Clear all Stream Chat channels
  await StreamIoService.deleteAllChannels();
  
  // Get all signoffs with signature URLs before deleting
  const signOffs = await db.signOff.findMany({
    select: {
      signatureUrl: true,
    },
  });

  // Delete signatures from Azure Storage
  for (const signOff of signOffs) {
    if (signOff.signatureUrl) {
      try {
        await FileService.deleteSignature(signOff.signatureUrl);
      } catch (error) {
        console.warn(
          `Failed to delete signature: ${signOff.signatureUrl}`,
          error
        );
      }
    }
  }

  // Delete all user data but NOT the users themselves
  // Delete in order to respect foreign key constraints
  await db.allocation.deleteMany();
  await db.generalItemRequest.deleteMany();
  await db.lineItem.deleteMany();
  await db.generalItem.deleteMany();
  await db.donorOffer.deleteMany();
  await db.distribution.deleteMany();
  await db.signOff.deleteMany();
  await db.wishlist.deleteMany();
  await db.shippingStatus.deleteMany();
  await db.userInvite.deleteMany();
  await db.notification.deleteMany();
  await db.passwordResetToken.deleteMany();
  
  // Note: We intentionally do NOT delete users or create new users
  // The existing users (1 super admin staff, 1 regular staff, 2 partners) remain unchanged
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }
    if (!session.user.isSuper) {
      throw new AuthenticationError("Super admin access required");
    }

    await resetDatabase();

    return NextResponse.json(
      {
        message: "Database reset successfully. All user data has been cleared, but users remain unchanged.",
      },
      { status: 200 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

