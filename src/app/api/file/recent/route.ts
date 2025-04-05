import { auth } from "@/auth";
import { authenticationError, authorizationError } from "@/util/responses";
import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return authenticationError("Session required");
  if (session.user.type === "PARTNER") {
    return authorizationError("You are not allowed to view this");
  }

  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME as string;
  const connectionString = process.env
    .AZURE_STORAGE_CONNECTION_STRING as string;
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME as string;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY as string;

  const sharedKeyCredential = new StorageSharedKeyCredential(
    accountName,
    accountKey
  );
  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // Step 1: List all blobs and find the most recently modified one
  let latestBlobName: string | null = null;
  let latestModifiedTime = new Date(0); // Very old date to start

  for await (const blob of containerClient.listBlobsFlat()) {
    if (
      blob.properties.lastModified &&
      blob.properties.lastModified > latestModifiedTime
    ) {
      latestModifiedTime = blob.properties.lastModified;
      latestBlobName = blob.name;
    }
  }

  if (!latestBlobName) {
    return NextResponse.json(
      { error: "No blobs found in container" },
      { status: 404 }
    );
  }

  const blobClient = containerClient.getBlockBlobClient(latestBlobName);

  // Step 2: Generate SAS
  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName: latestBlobName,
      permissions: BlobSASPermissions.parse("r"),
      startsOn: new Date(),
      expiresOn: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
    sharedKeyCredential
  ).toString();

  const accessUrl = `${blobClient.url}?${sasToken}`;

  return NextResponse.json({
    sas: accessUrl,
    blobName: latestBlobName,
    lastModified: latestModifiedTime.toISOString(),
  });
}
