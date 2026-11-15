import { CheckCircle } from "@phosphor-icons/react";
import Link from "next/link";

interface DonorOfferSuccessModalProps {
  mode: "create" | "finalize";
}

export default function DonorOfferSuccessModal({
  mode,
}: DonorOfferSuccessModalProps) {
  const heading =
    mode === "create"
      ? "Success! Donor Offer Created"
      : "Success! Donor Offer Finalized";
  const body =
    mode === "create"
      ? "This Donor Offer has successfully been created. You will be able to view it in the Donor Offer table under the unfinalized tab."
      : "This Donor Offer has successfully been finalized. You will be able to view it in the Donor Offer table under the finalized tab.";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80 relative">
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold">{heading}</h2>
        </div>

        <div className="flex justify-center mt-4">
          <CheckCircle size={128} color="#2774AE" weight="fill" />
        </div>

        <p className="text-gray-500 text-sm mt-3">{body}</p>

        <Link href={"/donorOffers"}>
          <button className="mt-6 w-full bg-red-500 text-white py-2 rounded-md shadow-md hover:bg-red-600 transition">
            Back to Donor Offers page
          </button>
        </Link>
      </div>
    </div>
  );
}
