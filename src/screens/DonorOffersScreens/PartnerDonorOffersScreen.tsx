"use client";

import { DonorOfferDTO } from "@/app/api/donorOffers/types";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { DonorOfferState } from "@prisma/client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { CgSpinner } from "react-icons/cg";

/**
 * Search bar covers the menu bar when looking at mobile view.
 *  - It's because of the z-layer of the search bar is too high.
 */

export default function PartnerDonorOffersScreen() {
  const [isLoading, setIsLoading] = useState(true); // Manage table loading state
  const [donorOffers, setDonorOffers] = useState<DonorOfferDTO[]>([]); // Hold donor offers

  // Get donor offers react hook (I think that's the right term)
  useEffect(() => {
    setTimeout(async () => {
      const response = await fetch("/api/donorOffers", {
        method: "GET",
      });
      const data = await response.json();
      const formattedData = data.map((offer: DonorOfferDTO) => {
        return {
          donorOfferId: offer.donorOfferId,
          state: offer.state,
          offerName: offer.offerName,
          donorName: offer.donorName,
          responseDeadline: offer.responseDeadline,
        } as DonorOfferDTO;
      });
      setDonorOffers(formattedData);
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    console.log("Donor Offers");
    console.log(donorOffers);
  }, [donorOffers]);

  return (
    <>
      <h1 className="text-2xl font-semibold">Donor Offers (Partner View)</h1>

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
                <React.Fragment key={index}>
                  <tr
                    data-odd={index % 2 !== 1}
                    className={`bg-white data-[odd=true]:bg-gray-100 break-words`}
                  >
                    <td className="px-4 py-2 whitespace-nowrap min-w-[150px]">
                      <Link href={`/donorOffers/${offer.donorOfferId}`}>
                        {offer.offerName}
                      </Link>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap min-w-[150px]">
                      {offer.donorName}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap min-w-[150px]">
                      {offer.responseDeadline}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap min-w-[150px]">
                      {offer.state === DonorOfferState.UNFINALIZED && (
                        <div className="inline-block bg-clip-padding p-1 bg-orange-200 rounded-md">
                          Awaiting response
                        </div>
                      )}
                      {offer.state === DonorOfferState.FINALIZED && (
                        <div className="inline-block bg-clip-padding p-1 bg-green-200 rounded-md">
                          Response submitted
                        </div>
                      )}
                      {offer.state === DonorOfferState.ARCHIVED && (
                        <div className="inline-block bg-clip-padding p-1 bg-red-200 rounded-md">
                          Offer closed
                        </div>
                      )}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
