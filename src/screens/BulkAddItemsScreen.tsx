import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import BulkAddFileUpload from "@/components/BulkAddFileUpload";
import BulkAddTable from "@/components/BulkAddTable";
import { WarningCircle, X } from "@phosphor-icons/react";
import BulkAddSuccessModal from "@/components/BulkAddSuccessModal";

type DataItem = {
  title: string;
  donor_name: string;
  category: string;
  type: string;
  quantity: string;
  expiration: string;
  unit_size: string;
  quantity_per_unit: string;
  lot_number: string;
  pallet_number: string;
  box_number: string;
  unit_price: string;
  visible: string;
  allocatable: string;
  comments: string;
  max_limit_requestable: string;
};

export default function BulkAddItemsScreen() {
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [data, setData] = useState<DataItem[]>([]);
  const [fileError, setFileError] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [preview, setPreview] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const requiredKeys = [
    "title",
    "donor_name",
    "category",
    "type",
    "quantity",
    "expiration",
    "unit_size",
    "quantity_per_unit",
    "lot_number",
    "pallet_number",
    "box_number",
    "unit_price",
    "visible",
    "allocatable",
    "comments",
    "max_limit_requestable",
  ];

  const containsRequiredKeys = (fields?: string[]) =>
    fields ? requiredKeys.every((key) => fields.includes(key)) : false;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileLoading(true);
    setFileName(file.name);
    setFileSize(file.size);
    setFileError(false);

    try {
      if (file.type !== "text/csv") {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const csvText = XLSX.utils.sheet_to_csv(sheet);
        parseCSV(csvText);
      } else {
        const reader = new FileReader();
        reader.onload = (event) =>
          event.target?.result && parseCSV(event.target.result as string);
        reader.onerror = () => {
          console.error("Error reading file");
          setFileError(true);
          setFileLoading(false);
        };
        reader.readAsText(file);
      }
    } catch (error) {
      console.error("File processing error:", error);
      setFileError(true);
      setFileLoading(false);
    }
  };

  const parseCSV = (csvText: string) => {
    const { data, meta } = Papa.parse(csvText, { header: true });
    if (!meta.fields || !Array.isArray(meta.fields)) {
      setFileError(true);
      setFileLoading(false);
      return;
    }

    if (containsRequiredKeys(meta.fields)) {
      setFileUploaded(true);
      setData(data as DataItem[]);
    } else {
      setFileError(true);
      setFileUploaded(false);
      setPreview(false);
    }
    setFileLoading(false);
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
            onClick={() => setIsOpen(true)}
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
      {isOpen && <BulkAddSuccessModal setIsOpen={setIsOpen} />}
    </div>
  );
}
