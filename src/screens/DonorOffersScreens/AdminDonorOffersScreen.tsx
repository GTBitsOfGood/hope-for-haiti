"use client";

import { useState } from "react";
import {
  DotsThree,
  MagnifyingGlass,
  Plus,
  PencilSimple,
  Upload,
  Archive,
} from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import { DonorOfferState } from "@prisma/client";
import React from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useFetch } from "@/hooks/useFetch";
import { AdminDonorOffer } from "@/types/api/donorOffer.types";
import BaseTable, {
  extendTableHeader,
  tableConditional,
} from "@/components/BaseTable";

enum StatusFilterKey {
  UNFINALIZED = "Unfinalized",
  FINALIZED = "Finalized",
  ARCHIVED = "Archived",
}

const statusFilterTabs = [
  StatusFilterKey.UNFINALIZED,
  StatusFilterKey.FINALIZED,
  StatusFilterKey.ARCHIVED,
] as const;

export default function AdminDonorOffersScreen() {
  const [activeTab, setActiveTab] = useState<string>(
    StatusFilterKey.UNFINALIZED
  );
  const router = useRouter();

  const {
    data: offers,
    isLoading,
    refetch: refetchOffers,
  } = useFetch<AdminDonorOffer[]>("/api/donorOffers", {
    cache: "no-store",
    onError: (error) => {
      toast.error("An error occurred while fetching data");
      console.error("Fetch error:", error);
    },
  });

  const filteredOffers = (offers || []).filter((offer) => {
    if (activeTab === StatusFilterKey.UNFINALIZED) {
      return offer.state === DonorOfferState.UNFINALIZED;
    } else if (activeTab === StatusFilterKey.FINALIZED) {
      return offer.state === DonorOfferState.FINALIZED;
    } else if (activeTab === StatusFilterKey.ARCHIVED) {
      return offer.state === DonorOfferState.ARCHIVED;
    }
    return true;
  });

  const handleArchive = (donorOfferId: number) => {
    (async () => {
      try {
        const resp = await fetch(`/api/donorOffers/${donorOfferId}/archive`, {
          method: "POST",
        });
        if (!resp.ok) {
          toast.error("Error archiving donor offer");
          return;
        }
        toast.success("Donor offer archived");
        refetchOffers();
      } catch (error) {
        toast.error("Error archiving donor offer");
        console.error("Archive error:", error);
      }
    })();
  };

  return (
    <>
      <h1 className="text-2xl font-semibold">Donor Offers</h1>
      <div className="flex justify-between items-center w-full py-4">
        <div className="relative w-1/3">
          <MagnifyingGlass
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            size={18}
          />
          <input
            type="text"
            placeholder="Search"
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:border-gray-400"
          />
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 border border-red-500 text-red-500 bg-white px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition">
            <Plus size={18} /> Filter
          </button>
          <div className="relative">
            <button
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition"
              onClick={() => {
                router.push("/donorOffers/create");
              }}
            >
              <Plus size={18} /> Create Donor Offer
            </button>
          </div>
        </div>
      </div>
      <div className="flex space-x-4 mt-4 border-b-2">
        {statusFilterTabs.map((tab) => (
          <button
            key={tab}
            data-active={activeTab === tab}
            className="px-2 py-1 text-md font-medium relative -mb-px transition-colors focus:outline-none data-[active=true]:border-b-2 data-[active=true]:border-black data-[active=true]:bottom-[-1px] data-[active=false]:text-gray-500"
            onClick={() => setActiveTab(tab)}
          >
            <div className="hover:bg-gray-100 px-2 py-1 rounded">{tab}</div>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center mt-8">
          <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
        </div>
      ) : (
        <BaseTable
          headers={[
            "Donor Offer",
            "Donor Name",
            tableConditional(activeTab === StatusFilterKey.UNFINALIZED, [
              "Response Deadline",
              "Partners Responded",
            ]),
            extendTableHeader("Manage", "w-12"),
          ]}
          rows={filteredOffers.map((offer) => ({
            cells: [
              offer.offerName,
              offer.donorName,
              tableConditional(activeTab === StatusFilterKey.UNFINALIZED, [
                offer.responseDeadline
                  ? new Date(offer.responseDeadline).toLocaleDateString()
                  : "N/A",
                `${
                  offer.invitedPartners.filter((partner) => partner.responded)
                    .length
                }/${offer.invitedPartners.length}`,
              ]),
              <div onClick={(e) => e.stopPropagation()} key={1}>
                <Menu as="div" className="float-right relative">
                  <MenuButton>
                    <DotsThree weight="bold" />
                  </MenuButton>
                  <MenuItems className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white ring-1 shadow-lg ring-black/5 w-max">
                    <MenuItem
                      as="button"
                      className="flex w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() =>
                        router.push(`/donorOffers/${offer.donorOfferId}/edit`)
                      }
                    >
                      <PencilSimple className="inline-block mr-2" size={22} />
                      Edit Offer Details
                    </MenuItem>
                    <MenuItem
                      as="button"
                      className="flex w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() =>
                        router.push(
                          `/donorOffers/${offer.donorOfferId}/finalize`
                        )
                      }
                    >
                      <Upload className="inline-block mr-2" size={22} />
                      Upload Final Offer
                    </MenuItem>
                    <MenuItem
                      as="button"
                      className="flex w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => handleArchive(offer.donorOfferId)}
                    >
                      <Archive className="inline-block mr-2" size={22} />
                      Archive Offer
                    </MenuItem>
                  </MenuItems>
                </Menu>
              </div>,
            ],
            onClick: () => router.push(`/donorOffers/${offer.donorOfferId}`),
          }))}
          
        />
      )}
    </>
  );
}
