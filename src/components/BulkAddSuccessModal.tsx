import { CheckCircle, X } from "@phosphor-icons/react";
import Link from "next/link";

interface BulkAddSuccessModalProps {
  setIsOpen: (isOpen: boolean) => void; // Explicitly typing setIsOpen
}

export default function BulkAddSuccessModal({
  setIsOpen,
}: BulkAddSuccessModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-84 relative">
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold">Add Items</h2>
          <X
            onClick={() => setIsOpen(false)}
            size={24}
            className="cursor-pointer"
          />
        </div>
        <p className="text-gray-500 text-sm mt-3">
          Items have successfully been added.
        </p>
        <p className="text-gray-500 text-sm mt-3">
          You can view the items in the unallocated items table.
        </p>

        <div className="flex justify-center mt-4">
          <CheckCircle size={128} color="#2774AE" weight="fill" />
        </div>
        <Link href={"/unallocated_items"}>
          <button className="mt-6 w-full bg-red-500 text-white py-2 rounded-md shadow-md hover:bg-red-600 transition">
            Back to unallocated items
          </button>
        </Link>
      </div>
    </div>
  );
}
