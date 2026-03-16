"use client";

import { useState } from "react";

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (options.validateBeforeUpload) {
      const validationErrors = options.validateBeforeUpload();
      if (validationErrors && validationErrors.length > 0) {
        setErrors(validationErrors);
        e.target.value = "";
        return;
      }
    }
    
    setUploadedFile(file);
    setFileLoading(true);
    setFileName(file.name);
    setFileSize(file.size);
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
        setErrors(errorMessages);
        setFileErrorMessage(errorMessages[0]);
        setFileUploaded(false);
        setFileLoading(false);
        return;
      }

      const result = await response.json();
      options.onSuccess(result);
      setFileUploaded(true);
      setFileLoading(false);
    } catch (error) {
      console.error("File processing error:", error);
      const message = "An error occurred while processing the file. Please try again.";
      setFileErrorMessage(message);
      setFileLoading(false);
      setErrors([message]);
    }
  };

  const resetUpload = () => {
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
    resetUpload,
  };
}
