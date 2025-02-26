import BulkAddFileUpload from "@/components/BulkAddFileUpload";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

export default function BulkAddItemsScreen() {

  const [fileName, setFileName] = useState<File | null>(null);
  const [csvString, setCsvString] = useState("");
  // const [upload, setUpload] = useState(true);
  // const [fileError, setFileError] = useState(false);
  // const [table, setTable] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file);
      if (file.type !== "text/csv") {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const csvText = XLSX.utils.sheet_to_csv(sheet);
        setCsvString(csvText);
        console.log(csvText);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const csvText = event.target.result as string;
            setCsvString(csvText);
          }
        };
        reader.readAsText(file);
      }
    }
  };

  useEffect(() => {
    if (csvString) {
      console.log(csvString);
    }
  }, [csvString]);

  return (
    <div className="px-10 py-5">
      <h1 className="mb-6 text-xl font-semibold">Add Items in Bulk</h1>
      <h2 className="mb-6 text-gray-800 opacity-70 font-light text-sm">
          Download the template, complete the required details, and upload the file here. Or browse your computer to upload.
          </h2>
      {fileName ?
        <div>Hello</div>
      :<div><button className="bg-red-500 hover:bg-red-700 text-white py-1 px-4 mt-1 mb-6 rounded focus:outline-none focus:shadow-outline text-sm">
          Download Sample Excel Sheet
        </button>
          <BulkAddFileUpload handleFileChange={ handleFileChange } />
        </div>
      }
      <h2 className="mt-6 mb-1 font-light text-sm">Uploaded</h2>
      <div className="appearance-none border border-gray-200 rounded w-full py-2 px-2 text-gray-700">
        <h2 className="text-zinc-500 font-light text-xs">{fileName ? fileName.name : "No file selected"}</h2>
      </div>
    </div>
  );
}
