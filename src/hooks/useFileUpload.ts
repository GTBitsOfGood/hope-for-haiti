"use client";

import { useRef, useState } from "react";

interface UseFileUploadOptions<T> {
  previewEndpoint: string;
  previewEndpointMethod: string;
  onSuccess: (data: T) => void;
  validateBeforeUpload?: () => string[] | null; // Return errors or null if valid
  buildFormData?: (file: File, formData: FormData) => FormData; // Custom form data builder
}

interface UseFileUploadResult {
  fileName: string;
  fileSize: number;
  /** Specific error message from validation/API, or null when no error */
  fileErrorMessage: string | null;
  fileUploaded: boolean;
  fileLoading: boolean;
  errors: string[];
  uploadedFile: File | undefined;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  /** Re-runs preview against the already-selected file, without a new file pick. */
  rerunPreview: () => Promise<void>;
  resetUpload: () => void;
}

export function useFileUpload<T>(
  options: UseFileUploadOptions<T>
): UseFileUploadResult {
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [fileErrorMessage, setFileErrorMessage] = useState<string | null>(null);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File>();
  // Guards against two overlapping Preview requests (e.g. rerunPreview()
  // from the price-check stepper closing while a handleFileChange() pick is
  // still in flight, or vice versa) writing their results out of order. Only
  // the response for the most recently started request is applied; an
  // older request that resolves later is ignored instead of clobbering
  // state with stale data.
  const requestIdRef = useRef(0);

  const runPreview = async (file: File) => {
    const requestId = ++requestIdRef.current;
    setFileLoading(true);
    setFileErrorMessage(null);
    setErrors([]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const finalFormData = options.buildFormData
        ? options.buildFormData(file, formData)
        : formData;

      const response = await fetch(options.previewEndpoint, {
        method: options.previewEndpointMethod,
        body: finalFormData,
      });

      if (requestIdRef.current !== requestId) return; // superseded by a newer request

      if (!response.ok) {
        let errorMessages: string[] = [];
        try {
          const body = await response.json();
          if (Array.isArray(body.errors)) {
            errorMessages = body.errors;
          } else if (typeof body.message === "string") {
            errorMessages = [body.message];
          }
        } catch {
          errorMessages = ["An error occurred while processing the file. Please try again."];
        }
        if (errorMessages.length === 0) {
          errorMessages = ["An error occurred while processing the file. Please try again."];
        }
        if (requestIdRef.current !== requestId) return; // superseded while reading the error body
        setErrors(errorMessages);
        setFileErrorMessage(errorMessages[0]);
        setFileUploaded(false);
        setFileLoading(false);
        return;
      }

      const result = await response.json();
      if (requestIdRef.current !== requestId) return; // superseded while reading the response body
      options.onSuccess(result);
      setFileUploaded(true);
      setFileLoading(false);
    } catch (error) {
      if (requestIdRef.current !== requestId) return; // superseded request failed; newer one owns state
      console.error("File processing error:", error);
      const message = "An error occurred while processing the file. Please try again.";
      setFileErrorMessage(message);
      setFileLoading(false);
      setErrors([message]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (options.validateBeforeUpload) {
      const validationErrors = options.validateBeforeUpload();
      if (validationErrors && validationErrors.length > 0) {
        setFileErrorMessage(null);
        setErrors(validationErrors);
        e.target.value = "";
        return;
      }
    }

    setUploadedFile(file);
    setFileName(file.name);
    setFileSize(file.size);
    await runPreview(file);
  };

  const rerunPreview = async () => {
    if (!uploadedFile) return;
    await runPreview(uploadedFile);
  };

  const resetUpload = () => {
    // Invalidate any Preview request still in flight so its eventual
    // response can't repopulate state the user just reset.
    requestIdRef.current++;
    setFileUploaded(false);
    setFileErrorMessage(null);
    setFileName("");
    setFileSize(0);
    setFileLoading(false);
    setErrors([]);
    setUploadedFile(undefined);
  };

  return {
    fileName,
    fileSize,
    fileErrorMessage,
    fileUploaded,
    fileLoading,
    errors,
    uploadedFile,
    handleFileChange,
    rerunPreview,
    resetUpload,
  };
}
