export interface UploadUrlResult {
  sas: string;
  url: string;
  filename: string;
}

export interface RecentFileResult {
  sas: string;
  blobName: string;
  lastModified: string;
}

export interface ReadUrlResult {
  sas: string;
}

export interface ParsedFileData {
  data: Record<string, unknown>[];
  fields: string[];
}
