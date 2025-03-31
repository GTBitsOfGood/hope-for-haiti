import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const blobName = `${uuidv4()}-${req.nextUrl.searchParams.get("filename")}`; // Generate unique filename
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME as string;
  const connectionString = process.env
    .AZURE_STORAGE_CONNECTION_STRING as string;
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME as string;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY as string;
  console.log();
  const sharedKeyCredential = new StorageSharedKeyCredential(
    accountName,
    accountKey
  );
  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlockBlobClient(blobName);

  const sasOptions = {
    containerName,
    blobName,
    permissions: BlobSASPermissions.parse("w"), // Only allow writing
    startsOn: new Date(),
    expiresOn: new Date(Date.now() + 10 * 60 * 1000), // Expires in 10 minutes
  };

  // Generate SAS Token
  const sasToken = generateBlobSASQueryParameters(
    sasOptions,
    sharedKeyCredential
  ).toString();

  const uploadUrl = `${blobClient.url}?${sasToken}`;

  return NextResponse.json({ uploadUrl, filename: blobName });
}
