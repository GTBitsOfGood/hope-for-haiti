import { useState } from "react";
import BulkAddFileUpload from "@/components/FileUpload";
import BulkAddTable from "@/components/BulkAdd/BulkAddTable";
import { WarningCircle, X } from "@phosphor-icons/react";
import BulkAddSuccessModal from "@/components/BulkAdd/BulkAddSuccessModal";
import BulkAddLoadingModal from "@/components/BulkAdd/BulkAddLoadingModal";
import BulkAddErrorModal from "@/components/BulkAdd/BulkAddErrorModal";

type DataItem = {
  title: string;
  donorName: string;
  type: string;
  category: string;
  quantity: string;
  expirationDate: string;
  unitSize: string;
  unitType: string;
  datePosted: string;
  lotNumber: string;
  palletNumber: string;
  boxNumber: string;
  unitPrice: string;
  maxRequestLimit: string;
  ndc: string;
  notes: string;
  visible: boolean;
  allowAllocations: boolean;
  gik: boolean;
};

export default function BulkAddItemsScreen() {
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [fileError, setFileError] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [data, setData] = useState<DataItem[]>([]);
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File>();

  const [isOpen, setIsOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setFileLoading(true);
    setFileName(file.name);
    setFileSize(file.size);
    setFileError(false);
    setErrors([]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Sending file to the server for preview
      const response = await fetch("/api/items/bulk?preview=true", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const { errors } = await response.json();
        setErrors(errors);
        setFileUploaded(false);
        setFileError(true);
        setFileLoading(false);
        return;
      }

      const { items } = await response.json();
      setData(items);
      setPreview(false);
      setFileUploaded(true);
      setFileLoading(false);
    } catch (error) {
      console.error("File processing error:", error);
      setFileError(true);
      setFileLoading(false);
    }
  };

  const showPreview = () => {
    setPreview(true);
  };

  const resetUpload = () => {
    setPreview(false);
    setFileUploaded(false);
    setFileError(false);
    setFileName("");
    setFileLoading(false);
    setIsOpen(false);
    setErrors([]);
  };

  const handleAddItems = async () => {
    console.log(uploadedFile);
    if (!uploadedFile) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      const response = await fetch("/api/items/bulk", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setIsLoading(false);
        setIsOpen(true);
      } else {
        setIsLoading(false);
        setErrorOpen(true);
        return;
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error creating items:", error);
      setErrors(["An error occurred while creating items. Please try again."]);
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
      {isLoading && <BulkAddLoadingModal />}
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
