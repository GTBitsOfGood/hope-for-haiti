import { auth } from "@/auth";
import { db } from "@/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ enabled: true }); // Not authenticated, allow access
    }

    // Convert string id to number for database query
    const userId = parseInt(session.user.id);
    
    if (isNaN(userId)) {
      console.error("Invalid user ID:", session.user.id);
      return NextResponse.json({ enabled: true }, { status: 400 });
    }

    // Fetch fresh enabled status from database
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { enabled: true },
    });

    return NextResponse.json({ 
      enabled: user?.enabled ?? true 
    });
  } catch (error) {
    console.error("Error checking enabled status:", error);
    return NextResponse.json({ enabled: true }, { status: 500 });
  }
}
