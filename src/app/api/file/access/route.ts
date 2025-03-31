import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const blobName = req.nextUrl.searchParams.get("filename") as string;
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
  const blobClient = containerClient.getBlockBlobClient(blobName);

  const sasOptions = {
    containerName,
    blobName,
    permissions: BlobSASPermissions.parse("r"), // Only allow writing
    startsOn: new Date(),
    expiresOn: new Date(Date.now() + 10 * 60 * 1000), // Expires in 10 minutes
  };

  // Generate SAS Token
  const sasToken = generateBlobSASQueryParameters(
    sasOptions,
    sharedKeyCredential
  ).toString();

  const accessUrl = `${blobClient.url}?${sasToken}`;

  return NextResponse.json({ accessUrl });
}
