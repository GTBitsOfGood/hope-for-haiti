import { NextResponse } from "next/server";
import { ChromaClient } from "chromadb";

const CHROMA_HOST = process.env.CHROMA_HOST ?? "http://localhost";
const CHROMA_PORT = process.env.CHROMA_PORT ?? "8000";
const COLLECTION_NAME = "general-items";

export async function DELETE() {
  try {
    const client = new ChromaClient({
      host: CHROMA_HOST,
      port: Number(CHROMA_PORT),
    });

    // Check if collection exists
    const collections = await client.listCollections();
    const exists = collections.some((c) => c.name === COLLECTION_NAME);

    if (!exists) {
      return NextResponse.json({
        message: `Collection "${COLLECTION_NAME}" does not exist.`,
        dropped: false,
      });
    }

    // Drop the collection
    await client.deleteCollection({ name: COLLECTION_NAME });

    return NextResponse.json({
      message: `Collection "${COLLECTION_NAME}" successfully dropped.`,
      dropped: true,
    });
  } catch (err) {
    if (!(err instanceof Error)) {
      return NextResponse.json(
        { error: "Unknown error occurred" },
        { status: 500 }
      );
    }
    console.error("Failed to drop Chroma collection:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
