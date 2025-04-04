import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { authenticationError, argumentError } from "@/util/responses";

/**
 * Generates a SAS token for uploading files to Azure Blob Storage.
 * The token is valid for 10 minutes and allows write access to the specified blob.
 * Parameters are passed as query parameters.
 * @params filename: Base name of the file to be uploaded.
 * @returns 401 if the request is not authenticated
 * @returns 200 and the contents of the created item
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return authenticationError("Session required");

  if (
    !req.nextUrl.searchParams.has("filename") ||
    req.nextUrl.searchParams.get("filename") === ""
  ) {
    return argumentError("Filename is required");
  }

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

  for await (const blob of containerClient.listBlobsFlat()) {
    console.log(`Blob: ${blob.name}`);
  }

  return NextResponse.json({
    sas: uploadUrl,
    url: blobClient.url,
    filename: blobName,
  });
}
