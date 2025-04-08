import { CheckCircle } from "@phosphor-icons/react";
import Link from "next/link";

export default function DonorOfferSuccessModal() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80 relative">
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold">
            Success! Donor Offer Created
          </h2>
        </div>

        <div className="flex justify-center mt-4">
          <CheckCircle size={128} color="#2774AE" weight="fill" />
        </div>

        <p className="text-gray-500 text-sm mt-3">
          This Donor Offer has been successfully been created. You will be able
          to view in the Donor offer table under the unfinalized tab.
        </p>

        <Link href={"/donorOffers"}>
          <button className="mt-6 w-full bg-red-500 text-white py-2 rounded-md shadow-md hover:bg-red-600 transition">
            Back to Donor Offers page
          </button>
        </Link>
      </div>
    </div>
  );
}
