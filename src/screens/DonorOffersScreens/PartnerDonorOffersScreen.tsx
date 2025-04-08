"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import { DonorOfferState } from "@prisma/client";
import React, { useEffect, useState } from "react";
import { CgSpinner } from "react-icons/cg";
import { formatTableValue } from "@/utils/format";

/**
 * Search bar covers the menu bar when looking at mobile view.
 *  - It's because of the z-layer of the search bar is too high.
 */
import { useRouter } from "next/navigation";

interface DonorOfferDTO {
  donorOfferId: number;
  offerName: string;
  donorName: string;
  responseDeadline: Date;
  state: DonorOfferState;
}

export default function PartnerDonorOffersScreen() {
  const [isLoading, setIsLoading] = useState(true); // Manage table loading state
  const [donorOffers, setDonorOffers] = useState<DonorOfferDTO[]>([]); // Hold donor offers
  const router = useRouter();

  useEffect(() => {
    setTimeout(async () => {
      const response = await fetch("/api/donorOffers", {
        method: "GET",
        cache: "no-store",
      });
      const data = await response.json();
      const formattedData = data.map((offer: DonorOfferDTO) => ({
        ...offer,
        responseDeadline: new Date(offer.responseDeadline),
      }));
      setDonorOffers(formattedData);
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    console.log(
      "Donor Offer Keys:",
      donorOffers.map((offer) => offer.donorOfferId)
    );
  }, [donorOffers]);

  return (
    <>
      <h1 className="text-2xl font-semibold">Donor Offers</h1>

      {/* search bar */}
      <div className="flex items-center w-full py-4 mt-3 relative">
        <div className="relative w-2/3">
          <MagnifyingGlass
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            size={18}
          />
          <input
            type="text"
            placeholder="Search"
            className="pl-10 pr-4 py-2 w-full border border-gray-primary border-opacity-10 rounded-lg bg-gray-100 text-gray-primary focus:outline-none focus:border-gray-400"
          />
        </div>
      </div>

      {/* table */}
      {isLoading ? (
        <div className="flex justify-center items-center mt-8">
          <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
        </div>
      ) : (
        <div className="overflow-x-scroll">
          <table className="mt-4 rounded-t-lg overflow-hidden table-auto w-full">
            <thead>
              <tr className="bg-blue-primary bg-opacity-80 text-white text-opacity-100 border-b-2 break-words">
                <th className="px-4 py-2 text-left font-bold whitespace-nowrap min-w-[150px]">
                  Donor Offer
                </th>
                <th className="px-4 py-2 text-left font-semibold whitespace-nowrap min-w-[150px]">
                  Donor Name
                </th>
                <th className="px-4 py-2 text-left font-medium whitespace-nowrap min-w-[150px]">
                  Response Deadline
                </th>
                <th className="pl-4 py-2 text-left font-normal whitespace-nowrap min-w-[150px]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Render donor offers */}
              {donorOffers.map((offer, index) => (
                <tr
                  key={`${offer.donorOfferId}-${index}`}
                  onClick={() =>
                    router.push(`/donorOffers/${offer.donorOfferId}`)
                  }
                  className="cursor-pointer bg-white hover:bg-gray-100 break-words"
                >
                  <td className="px-4 py-2">
                    {formatTableValue(offer.offerName)}
                  </td>
                  <td className="px-4 py-2">
                    {formatTableValue(offer.donorName)}
                  </td>
                  <td className="px-4 py-2">
                    {formatTableValue(
                      offer.responseDeadline.toLocaleDateString()
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap min-w-[150px]">
                    {offer.state === DonorOfferState.UNFINALIZED && (
                      <div className="inline-block bg-orange-200 p-1 rounded-md">
                        Awaiting response
                      </div>
                    )}
                    {offer.state === DonorOfferState.FINALIZED && (
                      <div className="inline-block bg-green-200 p-1 rounded-md">
                        Response submitted
                      </div>
                    )}
                    {offer.state === DonorOfferState.ARCHIVED && (
                      <div className="inline-block bg-red-200 p-1 rounded-md">
                        Offer closed
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
