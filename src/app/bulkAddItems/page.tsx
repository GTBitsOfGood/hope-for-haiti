"use client";

import { useState } from "react";
import BulkAddFileUpload from "@/components/FileUpload";
import BulkAddTable from "@/components/BulkAdd/BulkAddTable";
import { WarningCircle, X } from "@phosphor-icons/react";
import BulkAddSuccessModal from "@/components/BulkAdd/BulkAddSuccessModal";
import BulkAddLoadingModal from "@/components/BulkAdd/BulkAddLoadingModal";
import BulkAddErrorModal from "@/components/BulkAdd/BulkAddErrorModal";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useApiClient } from "@/hooks/useApiClient";
import { BulkItemFormData } from "@/types/ui/bulkItems.types";

export default function BulkAddItemsPage() {
  const [data, setData] = useState<BulkItemFormData[]>([]);
  const [preview, setPreview] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);

  const {
    fileName,
    fileSize,
    fileError,
    fileUploaded,
    fileLoading,
    errors,
    uploadedFile,
    handleFileChange,
    resetUpload: resetFileUpload,
  } = useFileUpload<{ items: BulkItemFormData[] }>({
    previewEndpoint: "/api/items/bulk?preview=true",
    onSuccess: (result) => {
      setData(result.items as BulkItemFormData[]);
      setPreview(false);
    },
  });

  const { isLoading: isSubmitting, apiClient } = useApiClient();

  const showPreview = () => {
    setPreview(true);
  };

  const resetUpload = () => {
    setPreview(false);
    setIsOpen(false);
    resetFileUpload();
  };

  const handleAddItems = async () => {
    if (!uploadedFile) return;
    
    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
      await apiClient.post("/api/items/bulk", { body: formData });
      setIsOpen(true);
    } catch (error) {
      console.error("Error creating items:", error);
      setErrorOpen(true);
    }
  };

  return (
    <div className="px-10 py-5">
      <h1 className="mb-4 text-xl font-semibold">Add Items in Bulk</h1>
      <p className="mb-6 text-gray-800 opacity-70 font-light text-sm">
        Download the template, complete the required details, and upload the
        file here. Or browse your computer to upload.
      </p>

      {!fileUploaded && (
        <div>
          <button className="bg-red-500 hover:bg-red-700 text-white py-1 px-4 mt-1 mb-6 rounded text-sm">
            Download Sample Excel Sheet
          </button>
          <BulkAddFileUpload
            resetUpload={resetUpload}
            fileLoading={fileLoading}
            handleFileChange={handleFileChange}
          />
        </div>
      )}

      <h2 className="mt-6 mb-1 font-light text-sm">Uploaded</h2>
      <div
        className={`border rounded w-full py-2 px-2 text-gray-700 
  ${fileError ? "border-red-500 bg-red-50" : "border-gray-200"}`}
      >
        {fileName ? (
          <div className="flex justify-between">
            <div>
              <p className="text-black text-xs">{fileName}</p>
              {!fileError && (
                <p className="text-zinc-500 font-light mt-2 text-xs">
                  {fileSize > 1024 * 1024
                    ? (fileSize / (1024 * 1024)).toFixed(2) + " mb"
                    : (fileSize / 1024).toFixed(2) + " kb"}
                </p>
              )}
              {fileError && (
                <p className="text-red-500 font-light text-xs mt-2">
                  <WarningCircle weight="fill" className="inline mr-1" />
                  Error: File doesn&apos;t match the specified sample format.
                </p>
              )}
            </div>
            <X
              onClick={resetUpload}
              size={28}
              className={`my-2 mx-8 cursor-pointer ${fileError ? "text-red-500" : ""}`}
            />
          </div>
        ) : (
          <div>
            <p className="text-zinc-500 font-light text-xs">No File Uploaded</p>
          </div>
        )}
      </div>

      {errors && errors.length > 0 && (
        <div className="mt-4">
          {errors.map((error, index) => (
            <div
              key={index}
              className="bg-red-100 text-red-500 p-3 mb-2 rounded"
            >
              {error}
            </div>
          ))}
        </div>
      )}

      {preview && <BulkAddTable data={data} />}
      <div className="flex justify-end mt-4">
        <button
          onClick={resetUpload}
          className="bg-white hover:bg-gray-100 w-48 text-red-500 border border-red-500 py-1 px-4 mt-1 mb-6 rounded text-sm"
        >
          Cancel File Upload
        </button>
        {preview ? (
          <button
            onClick={handleAddItems}
            className="bg-red-500 hover:bg-red-700 w-52 ml-4 text-white py-1 px-4 mt-1 mb-6 rounded text-sm"
          >
            Add Items
          </button>
        ) : (
          <button
            disabled={!fileUploaded}
            onClick={showPreview}
            className={
              fileUploaded
                ? "bg-red-500 hover:bg-red-700 w-52 ml-4 text-white py-1 px-4 mt-1 mb-6 rounded text-sm"
                : "bg-red-500 opacity-50 w-52 ml-4 text-white py-1 px-4 mt-1 mb-6 rounded text-sm"
            }
          >
            Upload File
          </button>
        )}
      </div>
      {isSubmitting && <BulkAddLoadingModal />}
      {isOpen && (
        <BulkAddSuccessModal setIsOpen={setIsOpen} resetUpload={resetUpload} />
      )}
      {errorOpen && (
        <BulkAddErrorModal
          setErrorOpen={setErrorOpen}
          resetUpload={resetUpload}
        />
      )}
    </div>
  );
}
