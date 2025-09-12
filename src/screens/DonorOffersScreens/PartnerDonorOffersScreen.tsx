"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import { useRouter } from "next/navigation";
import { useFetch } from "@/hooks/useFetch";
import { DonorOfferDto } from "@/types/ui/donorOffer.types";
import BaseTable, { extendTableHeader } from "@/components/BaseTable";

export default function PartnerDonorOffersScreen() {
  const router = useRouter();

  const { data: rawDonorOffers, isLoading } = useFetch<DonorOfferDto[]>(
    "/api/donorOffers",
    {
      method: "GET",
      cache: "no-store",
    }
  );

  // Format the data to ensure responseDeadline is a Date object
  const donorOffers = (rawDonorOffers || []).map((offer) => ({
    ...offer,
    responseDeadline: new Date(offer.responseDeadline),
  }));

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
        <BaseTable
          headers={[
            extendTableHeader("Donor Offer", "min-w-[150px]"),
            extendTableHeader("Donor Name", "min-w-[150px]"),
            extendTableHeader("Response Deadline", "min-w-[150px]"),
            extendTableHeader("Status", "min-w-[150px]"),
          ]}
          rows={donorOffers.map((offer) => ({
            cells: [
              offer.offerName,
              offer.donorName,
              offer.responseDeadline.toLocaleDateString(),
              <div
                className="whitespace-nowrap min-w-[150px]"
                key={offer.donorOfferId}
              >
                {offer.state === "pending" && (
                  <div className="inline-block bg-orange-200/70 py-1 px-2 rounded-md">
                    Awaiting response
                  </div>
                )}
                {offer.state === "submitted" && (
                  <div className="inline-block bg-green-200/70 py-1 px-2 rounded-md">
                    Response submitted
                  </div>
                )}
                {offer.state === "closed" && (
                  <div className="inline-block bg-red-200/70 py-1 px-2 rounded-md">
                    Offer closed
                  </div>
                )}
              </div>,
            ],
            onClick: () => router.push(`/donorOffers/${offer.donorOfferId}`),
          }))}
          headerClassName="bg-blue-primary bg-opacity-80 text-white text-opacity-100"
          pageSize={10}
        />
      )}
    </>
  );
}
