"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import { useRouter } from "next/navigation";
import { useFetch } from "@/hooks/useFetch";
import { DonorOfferDto } from "@/types/ui/donorOffer.types";
import BaseTable from "@/components/BaseTable";
import OptionsTag from "@/components/OptionsTag";

function ResponseStatusTag({ status }: { status: string | null }) {
  const styleMap = new Map([
    ["pending", { text: "Awaiting response", className: "bg-orange-200/70" }],
    ["submitted", { text: "Response submitted", className: "bg-green-200/70" }],
    ["closed", { text: "Offer closed", className: "bg-red-200/70" }],
  ]);

  return <OptionsTag styleMap={styleMap} value={status || ""} />;
}

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
          headers={["Donor Offer", "Donor Name", "Response Deadline", "Status"]}
          rows={donorOffers.map((offer) => ({
            cells: [
              offer.offerName,
              offer.donorName,
              offer.responseDeadline.toLocaleDateString(),
              <div
                className="whitespace-nowrap min-w-[150px]"
                key={offer.donorOfferId}
              >
                <ResponseStatusTag status={offer.state} />
              </div>,
            ],
            onClick: () => router.push(`/donorOffers/${offer.donorOfferId}`),
          }))}
          headerCellStyles="min-w-[150px]"
          pageSize={10}
        />
      )}
    </>
  );
}
