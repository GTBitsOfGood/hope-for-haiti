import { auth } from "@/auth";
import { db } from "@/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      // Not authenticated - return enabled: false to force them to sign in
      return NextResponse.json({ enabled: false });
    }

    // Convert string id to number for database query
    const userId = parseInt(session.user.id);
    
    if (isNaN(userId)) {
      console.error("Invalid user ID:", session.user.id);
      // Invalid ID - treat as deactivated for security
      return NextResponse.json({ enabled: false }, { status: 400 });
    }

    // Fetch fresh enabled status from database
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { enabled: true },
    });

    if (!user) {
      // User not found - treat as deactivated for security
      console.error("User not found:", userId);
      return NextResponse.json({ enabled: false }, { status: 404 });
    }

    return NextResponse.json({ 
      enabled: user.enabled ?? false // Default to false for safety
    });
  } catch (error) {
    console.error("Error checking enabled status:", error);
    // On error, be STRICT - return false to prevent unauthorized access
    return NextResponse.json({ enabled: false }, { status: 500 });
  }
}
