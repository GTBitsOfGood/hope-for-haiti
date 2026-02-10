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
  ["UOM Weight Lb", "weight"],
]);

const finalizedRequiredKeys = new Map<string, string>([
  ["Description", "title"],
  ["Exp.", "expirationDate"],
  ["Container Type", "unitType"],
  ["Donor", "donorName"],
  ["# of Containers", "quantity"],
  ["Lot #", "lotNumber"],
  ["Pallet #", "palletNumber"],
  ["Box #", "boxNumber"],
  ["Cost per Piece", "unitPrice"],
]);

const finalizedOptionalKeys = new Map<string, string>([
  ["Weight Lb", "weight"],
  ["Donor Shipping #", "donorShippingNumber"],
]);

const normalizeHeader = (key: string): string =>
  key.replace(/\s+/g, " ").trim();

const canonicalizeHeader = (key: string): string => {
  const normalized = normalizeHeader(key).replace(/(?:__|_)\d+$/i, "");
  return normalized.toLowerCase().replace(/[^a-z0-9#]+/g, "");
};

const buildCanonicalMap = (entries: Map<string, string>) => {
  const canonical = new Map<string, string>();
  for (const [label, mappedKey] of entries) {
    canonical.set(canonicalizeHeader(label), mappedKey);
  }
  return canonical;
};

const unfinalizedRequiredCanonicalMap = buildCanonicalMap(
  unfinalizedRequiredKeys
);
const finalizedRequiredCanonicalMap = buildCanonicalMap(
  finalizedRequiredKeys
);
const finalizedOptionalCanonicalMap =
  buildCanonicalMap(finalizedOptionalKeys);

const canonicalRequiredKeys = {
  unfinalized: Array.from(unfinalizedRequiredCanonicalMap.keys()),
  finalized: Array.from(finalizedRequiredCanonicalMap.keys()),
};

const normalizeRowKeys = (row: Record<string, unknown>) => {
  const normalized: Record<string, unknown> = {};
  for (const [rawKey, value] of Object.entries(row)) {
    const canonicalKey = canonicalizeHeader(rawKey);
    if (!canonicalKey) continue;
    normalized[canonicalKey] = value;
  }
  return normalized;
};

const skipEmptyRows = (text: string): string => {
  const lines = text.split("\n");
  const firstNonEmptyIndex = lines.findIndex((line) => {
    const trimmed = line.trim();
    return trimmed.length > 0 && trimmed !== "," && !/^,+$/.test(trimmed);
  });

  return firstNonEmptyIndex > 0
    ? lines.slice(firstNonEmptyIndex).join("\n")
    : text;
};

const containsRequiredKeys = (
  type: "unfinalized" | "finalized",
  fields?: string[]
): { valid: boolean; missingKeys: string[] } => {
  if (!fields) return { valid: false, missingKeys: [] };
  const canonicalFields = new Set(
    fields.map((key) => canonicalizeHeader(key))
  );
  const requiredKeys =
    type === "finalized"
      ? canonicalRequiredKeys.finalized
      : canonicalRequiredKeys.unfinalized;

  const missingKeys = requiredKeys.filter((key) => !canonicalFields.has(key));
  return { valid: missingKeys.length === 0, missingKeys };
};

const hasValue = (value: unknown) => {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") {
    return value.trim() !== "";
  }
  return true;
};

const filterEmptyRows = (
  type: "unfinalized" | "finalized",
  rows: Record<string, unknown>[]
) =>
  type === "unfinalized"
    ? rows.filter((row) =>
        hasValue(row[canonicalizeHeader("Generic Description")])
      )
    : rows.filter((row) => hasValue(row[canonicalizeHeader("Donor")]));

const remapRequiredColumns = (
  type: "unfinalized" | "finalized",
  row: Record<string, unknown>
): Record<string, unknown> => {
  const normalizedRow = normalizeRowKeys(row);
  const requiredMap =
    type === "unfinalized"
      ? unfinalizedRequiredCanonicalMap
      : finalizedRequiredCanonicalMap;
  const optionalMap =
    type === "unfinalized"
      ? new Map<string, string>()
      : finalizedOptionalCanonicalMap;

  const updated: Record<string, unknown> = {};

  const assignFromMap = (map: Map<string, string>) => {
    for (const [canonicalKey, newKey] of map) {
      if (Object.prototype.hasOwnProperty.call(normalizedRow, canonicalKey)) {
        updated[newKey] = normalizedRow[canonicalKey];
      }
    }
  };

  assignFromMap(requiredMap);
  assignFromMap(optionalMap);

  return updated;
};

const transformDonorOfferRow = (
  row: Record<string, unknown>
): Record<string, unknown> => {
  const remapped = remapRequiredColumns("unfinalized", row);
  const quantity = remapped["quantity"];
  const weight = remapped["weight"];
  const transformed: Record<string, unknown> = {
    ...remapped,
  };

  if (quantity !== undefined) {
    transformed["initialQuantity"] = quantity;
  }

  if (weight !== undefined && weight !== null) {
    transformed["weight"] = weight;
  } else {
    throw new Error("Weight is required");
  }

  delete transformed["quantity"];
  return transformed;
};

const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "signatures";
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

let sharedKeyCredential: StorageSharedKeyCredential | null = null;
let blobServiceClient: BlobServiceClient | null = null;
let containerClient: ContainerClient | null = null;
let signaturesContainerClient: ContainerClient | null = null;

if (accountName && accountKey && connectionString) {
  sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
  blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  containerClient = blobServiceClient.getContainerClient(containerName);
  signaturesContainerClient =
    blobServiceClient.getContainerClient("signatures");
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

  static async uploadSignature(
    base64Data: string,
    userId: number
  ): Promise<string> {
    if (!signaturesContainerClient || !sharedKeyCredential) {
      throw new InternalError("Azure Storage not configured");
    }

    const base64Content = base64Data.includes(",")
      ? base64Data.split(",")[1]
      : base64Data;

    const buffer = Buffer.from(base64Content, "base64");

    const timestamp = Date.now();
    const blobName = `signoff-${userId}-${timestamp}.png`;

    const blobClient = signaturesContainerClient.getBlockBlobClient(blobName);
    await blobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: {
        blobContentType: "image/png",
      },
    });

    return blobClient.url;
  }

  static async generateSignatureReadUrl(blobUrl: string): Promise<string> {
    if (!signaturesContainerClient || !sharedKeyCredential) {
      return blobUrl;
    }

    try {
      const url = new URL(blobUrl);
      const pathParts = url.pathname.split("/").filter((p) => p);
      const blobName =
        pathParts.length > 1 ? pathParts[pathParts.length - 1] : pathParts[0];

      const blobClient = signaturesContainerClient.getBlockBlobClient(blobName);

      const sasToken = generateBlobSASQueryParameters(
        {
          containerName: "signatures",
          blobName: blobName,
          permissions: BlobSASPermissions.parse("r"),
          startsOn: new Date(),
          expiresOn: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        sharedKeyCredential
      ).toString();

      return `${blobClient.url}?${sasToken}`;
    } catch (error) {
      console.warn(`Failed to generate signature read URL: ${blobUrl}`, error);
      return blobUrl;
    }
  }

  static async deleteSignature(blobUrl: string): Promise<void> {
    if (!signaturesContainerClient) {
      return;
    }

    try {
      const url = new URL(blobUrl);
      const pathParts = url.pathname.split("/").filter((p) => p);
      const blobName =
        pathParts.length > 1 ? pathParts[pathParts.length - 1] : pathParts[0];

      const blobClient = signaturesContainerClient.getBlockBlobClient(blobName);
      await blobClient.delete();
    } catch (error) {
      console.warn(`Failed to delete signature blob: ${blobUrl}`, error);
    }
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
        const csvText = skipEmptyRows(XLSX.utils.sheet_to_csv(sheet));
        const { data, meta } = Papa.parse(csvText, { header: true });

        jsonData = data as Record<string, unknown>[];
        fields = meta.fields?.map((field) => canonicalizeHeader(field)) || [];
      } else if (fileExt === "csv") {
        const text = skipEmptyRows(await file.text());
        const { data, meta } = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
        });

        jsonData = data as Record<string, unknown>[];
        fields = meta.fields?.map((field) => canonicalizeHeader(field)) || [];
      }
      jsonData = jsonData.map((row) => normalizeRowKeys(row));
      jsonData = filterEmptyRows("unfinalized", jsonData);

      const validationResult = containsRequiredKeys("unfinalized", fields);
      if (!fields || !validationResult.valid) {
        const missingKeysList = validationResult.missingKeys.join(", ");
        throw new ArgumentError(
          `File does not contain required keys. Missing: ${missingKeysList || "unknown"}`
        );
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
        const csvText = skipEmptyRows(XLSX.utils.sheet_to_csv(sheet));
        const { data, meta } = Papa.parse(csvText, { header: true });

        jsonData = data as Record<string, unknown>[];
        fields = meta.fields?.map((field) => canonicalizeHeader(field)) || [];
      } else {
        const text = skipEmptyRows(await file.text());
        const { data, meta } = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
        });

        jsonData = data as Record<string, unknown>[];
        fields = meta.fields?.map((field) => canonicalizeHeader(field)) || [];
      }

      jsonData = jsonData.map((row) => normalizeRowKeys(row));
      jsonData = filterEmptyRows("finalized", jsonData).map((row) =>
        remapRequiredColumns("finalized", row)
      );

      const validationResult = containsRequiredKeys("finalized", fields);
      if (!fields || !validationResult.valid) {
        const missingKeysList = validationResult.missingKeys.join(", ");
        throw new ArgumentError(
          `File does not contain required keys. Missing: ${missingKeysList || "unknown"}`
        );
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
