import { WarningCircle, X } from "@phosphor-icons/react";
import Link from "next/link";

interface BulkAddErrorModalProps {
  setErrorOpen: (errorOpen: boolean) => void; // Explicitly typed setErrorOpen
  resetUpload: () => void;
}

export default function BulkAddErrorModal({
  setErrorOpen,
  resetUpload,
}: BulkAddErrorModalProps) {
  const handleExit = () => {
    setErrorOpen(false);
    resetUpload();
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80 relative">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Error!</h2>
          <X
            onClick={handleExit}
            size={24}
            className="cursor-pointer"
            aria-label="Close error modal"
          />
        </div>

        {/* Icon */}
        <div className="flex justify-center mt-4">
          <WarningCircle size={128} weight="fill" color="#EF3340" />
        </div>
        {/* Error Messages */}
        <p className="text-gray-500 text-sm mt-3">
          Internal error has occurred.
        </p>
        <p className="text-gray-500 text-sm mt-3">
          Please upload a valid CSV file.
        </p>
        <p className="text-gray-400 text-sm">Supported Formats: XLSX, CSV</p>
        {/* Button */}
        <Link href="/unallocatedItems">
          <button className="mt-6 w-full bg-red-500 text-white py-2 rounded-md shadow-md hover:bg-red-600 transition">
            Back to Unallocated Items
          </button>
        </Link>
      </div>
    </div>
  );
}
