import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
  ContainerClient,
} from "@azure/storage-blob";
import { NotFoundError, ArgumentError, InternalError } from "@/util/errors";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import {
  UploadUrlResult,
  RecentFileResult,
  ReadUrlResult,
  ParsedFileData
} from "@/types/api/file.types";

const requiredKeys = [
  "title",
  "type",
  "quantity",
  "expirationDate",
  "unitType",
  "quantityPerUnit",
];

const containsRequiredKeys = (fields?: string[]) =>
  fields ? requiredKeys.every((key) => fields.includes(key)) : false;

const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

// Only initialize Azure clients if environment variables are available
let sharedKeyCredential: StorageSharedKeyCredential | null = null;
let blobServiceClient: BlobServiceClient | null = null;
let containerClient: ContainerClient | null = null;

if (accountName && accountKey && connectionString && containerName) {
  sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
  blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  containerClient = blobServiceClient.getContainerClient(containerName);
}

export default class FileService {
  static async generateUploadUrl(blobName: string): Promise<UploadUrlResult> {
    if (!containerClient || !sharedKeyCredential) {
      throw new InternalError("Azure Storage not configured");
    }

    const blobClient = containerClient.getBlockBlobClient(blobName);

    const sasOptions = {
      containerName: containerName!,
      blobName,
      permissions: BlobSASPermissions.parse("w"),
      startsOn: new Date(),
      expiresOn: new Date(Date.now() + 10 * 60 * 1000),
    };

    const sasToken = generateBlobSASQueryParameters(
      sasOptions,
      sharedKeyCredential
    ).toString();

    const uploadUrl = `${blobClient.url}?${sasToken}`;

    return {
      sas: uploadUrl,
      url: blobClient.url,
      filename: blobName,
    };
  }

  static async getMostRecentFile(): Promise<RecentFileResult> {
    if (!containerClient || !sharedKeyCredential) {
      throw new InternalError("Azure Storage not configured");
    }

    let latestBlobName: string | null = null;
    let latestModifiedTime = new Date(0);

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
      throw new NotFoundError("No files found in container");
    }

    const blobClient = containerClient.getBlockBlobClient(latestBlobName);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: containerName!,
        blobName: latestBlobName,
        permissions: BlobSASPermissions.parse("r"),
        startsOn: new Date(),
        expiresOn: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      sharedKeyCredential
    ).toString();

    const accessUrl = `${blobClient.url}?${sasToken}`;

    return {
      sas: accessUrl,
      blobName: latestBlobName,
      lastModified: latestModifiedTime.toISOString(),
    };
  }

  static async generateReadUrl(filename: string): Promise<ReadUrlResult> {
    if (!containerClient || !sharedKeyCredential) {
      throw new InternalError("Azure Storage not configured");
    }

    const blobClient = containerClient.getBlockBlobClient(filename);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: containerName!,
        blobName: filename,
        permissions: BlobSASPermissions.parse("r"),
        startsOn: new Date(),
        expiresOn: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      sharedKeyCredential
    ).toString();

    const accessUrl = `${blobClient.url}?${sasToken}`;

    return {
      sas: accessUrl,
    };
  }

  static async parseDonorOfferFile(file: File): Promise<ParsedFileData> {
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx"].includes(fileExt || "")) {
      throw new ArgumentError(`Error opening ${file.name}: must be a valid CSV or XLSX file`);
    }

    try {
      let jsonData: Record<string, unknown>[] = [];
      let fields: string[] = [];

      if (fileExt === "xlsx") {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const csvText = XLSX.utils.sheet_to_csv(sheet);
        const { data, meta } = Papa.parse(csvText, { header: true });

        if (!meta.fields || !containsRequiredKeys(meta.fields)) {
          throw new ArgumentError("CSV does not contain required keys");
        }

        jsonData = data as Record<string, unknown>[];
        fields = meta.fields;
      } else if (fileExt === "csv") {
        const text = await file.text();
        const { data, meta } = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
        });

        if (!meta.fields || !containsRequiredKeys(meta.fields)) {
          throw new ArgumentError("CSV does not contain required keys");
        }

        jsonData = data as Record<string, unknown>[];
        fields = meta.fields;
      }

      return { data: jsonData, fields };
    } catch (error) {
      if (error instanceof ArgumentError) {
        throw error;
      }
      throw new InternalError("Error processing file");
    }
  }

  static async parseFinalizeFile(file: File): Promise<ParsedFileData> {
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx"].includes(fileExt || "")) {
      throw new ArgumentError("File must be a CSV or XLSX file");
    }

    try {
      let jsonData: Record<string, unknown>[] = [];
      let fields: string[] = [];

      if (fileExt === "xlsx") {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const csvText = XLSX.utils.sheet_to_csv(sheet);
        const { data, meta } = Papa.parse(csvText, { header: true });

        if (!meta.fields || !containsRequiredKeys(meta.fields)) {
          throw new ArgumentError("CSV does not contain required keys");
        }

        jsonData = data as Record<string, unknown>[];
        fields = meta.fields;
      } else {
        const text = await file.text();
        const { data, meta } = Papa.parse(text, { header: true, skipEmptyLines: true });

        if (!meta.fields || !containsRequiredKeys(meta.fields)) {
          throw new ArgumentError("CSV does not contain required keys");
        }

        jsonData = data as Record<string, unknown>[];
        fields = meta.fields;
      }

      return { data: jsonData, fields };
    } catch (error) {
      if (error instanceof ArgumentError) {
        throw error;
      }
      throw new InternalError("Error processing file");
    }
  }
}
