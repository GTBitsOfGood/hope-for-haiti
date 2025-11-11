import { auth } from "@/auth";
import { getOpenAIClient } from "@/lib/azureOpenAI";
import { isAdmin } from "@/lib/userUtils";
import { WishlistService } from "@/services/wishlistService";
import {
  AuthorizationError,
  AuthenticationError,
  errorResponse,
} from "@/util/errors";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!isAdmin(session.user.type)) {
      throw new AuthorizationError("Admin access required");
    }

    const wishlists = await WishlistService.getUnfulfilledWishlists();

    if (wishlists.length < 10) {
      return NextResponse.json({
        summary: "Not enough wishlists to generate a summary.",
      });
    }

    const { client } = getOpenAIClient();
    if (!client) {
      throw new Error("OpenAI client not configured");
    }

    const systemPrompt = `You are an expert at summarizing lists of items into concise summaries. 
    Given a list of wishlists with their names and priorities, generate a brief summary highlighting 
    key themes, common items, and overall trends. Keep the summary under 100 words.`;

    const userPrompt = `Here is the list of unfulfilled wishlists:\n${wishlists
      .map(
        (w) =>
          `- ${w.name} (Priority: ${w.priority.toLowerCase()}, Quantity: ${w.quantity}, Comments: ${w.comments || "None"})`
      )
      .join("\n")}\n\nPlease provide a concise summary.`;

    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT || "omni-moderate",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const summary = response.choices[0]?.message?.content || "";

    return NextResponse.json({
      summary,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
