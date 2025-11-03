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
  ParsedFileData,
} from "@/types/api/file.types";

const unfinalizedRequiredKeys = new Map<string, string>([
  ["Generic Description", "title"],
  ["Quantity", "quantity"],
  ["Expiration Date", "expirationDate"],
  ["Unit UOM", "unitType"],
]);

const finalizedRequiredKeys = new Map<string, string>([
  // not in schema, but used to match to generalItem
  ["Description", "title"],
  ["Exp.", "expirationDate"],
  ["Container Type", "unitType"],
  // end
  ["Donor", "donorName"],
  ["# of Containers", "quantity"],
  ["Lot #", "lotNumber"],
  ["Pallet #", "palletNumber"],
  ["Box #", "boxNumber"],
  ["Cost per Piece", "unitPrice"],
]);

const unfinalizedRequiredKeysList = Array.from(unfinalizedRequiredKeys.keys());
const finalizedRequiredKeysList = Array.from(finalizedRequiredKeys.keys());

const containsRequiredKeys = (type: "unfinalized" | "finalized", fields?: string[]) => {
  if (!fields) return false;
  return type === "finalized" ? 
    finalizedRequiredKeysList.every((key) => fields.includes(key)) : 
    unfinalizedRequiredKeysList.every((key) => fields.includes(key));
}

const hasValue = (value: unknown) => {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") {
    return value.trim() !== "";
  }
  return true;
};

const filterEmptyRows = (type: "unfinalized" | "finalized",rows: Record<string, unknown>[]) =>
  type === "unfinalized" ? 
    rows.filter((row) => hasValue(row["Generic Description"])) : 
    rows.filter((row) => hasValue(row["Donor"]));

const remapRequiredColumns = (
  type: "unfinalized" | "finalized",
  row: Record<string, unknown>
): Record<string, unknown> => {
  const updated: Record<string, unknown> = { ...row };
  const keys = type === "unfinalized" ? unfinalizedRequiredKeys : finalizedRequiredKeys;
  for (const [originalKey, newKey] of keys) {
    if (Object.prototype.hasOwnProperty.call(updated, originalKey)) {
      updated[newKey] = updated[originalKey];
      delete updated[originalKey];
    }
  }
  return updated;
};

const transformDonorOfferRow = (
  row: Record<string, unknown>
): Record<string, unknown> => {
  const remapped = remapRequiredColumns("unfinalized", row);
  const quantity = remapped["quantity"];
  const transformed: Record<string, unknown> = {
    ...remapped,
  };

  if (quantity !== undefined) {
    transformed["initialQuantity"] = quantity;
  }

  delete transformed["quantity"];
  return transformed;
};

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
      throw new ArgumentError(
        `Error opening ${file.name}: must be a valid CSV or XLSX file`
      );
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

        jsonData = data as Record<string, unknown>[];
        fields = meta.fields || [];
      } else if (fileExt === "csv") {
        const text = await file.text();
        const { data, meta } = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
        });

        jsonData = data as Record<string, unknown>[];
        fields = meta.fields || [];
      }
      jsonData = filterEmptyRows("unfinalized", jsonData);

      if (!fields || !containsRequiredKeys("unfinalized", fields)) {
        throw new ArgumentError("File does not contain required keys");
      }

      const transformedData = jsonData.map(transformDonorOfferRow);

      return { data: transformedData, fields };
    } catch (error) {
      if (error instanceof ArgumentError) {
        throw error;
      }
      throw new InternalError("Error processing file");
    }
  }

  static async parseFinalizedFile(file: File): Promise<ParsedFileData> {
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

        jsonData = data as Record<string, unknown>[];
        fields = meta.fields || [];
      } else {
        const text = await file.text();
        const { data, meta } = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
        });

        jsonData = data as Record<string, unknown>[];
        fields = meta.fields || [];
      }

      jsonData = filterEmptyRows("finalized", jsonData).map(row => remapRequiredColumns("finalized", row));

      if (!fields || !containsRequiredKeys("finalized", fields)) {
        throw new ArgumentError("File does not contain required keys");
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
