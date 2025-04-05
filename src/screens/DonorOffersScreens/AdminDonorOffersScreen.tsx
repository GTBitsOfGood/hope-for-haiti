"use client";

import { useEffect, useState } from "react";
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

interface AdminDonorOffer {
  donorOfferId: number;
  offerName: string;
  donorName: string;
  responseDeadline: string;
  state: DonorOfferState;
  invitedPartners: {
    name: string;
    responded: boolean;
  }[];
}

export default function AdminDonorOffersScreen() {
  const [offers, setOffers] = useState<AdminDonorOffer[]>([]);
  const [activeTab, setActiveTab] = useState<string>(
    StatusFilterKey.UNFINALIZED
  );
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/donorOffers");
        if (!res.ok) {
          throw new Error(`Error: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        setOffers(data);
      } catch (error) {
        toast.error("An error occurred while fetching data");
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredOffers = offers.filter((offer) => {
    if (activeTab === StatusFilterKey.UNFINALIZED) {
      return offer.state === DonorOfferState.UNFINALIZED;
    } else if (activeTab === StatusFilterKey.FINALIZED) {
      return offer.state === DonorOfferState.FINALIZED;
    } else if (activeTab === StatusFilterKey.ARCHIVED) {
      return offer.state === DonorOfferState.ARCHIVED;
    }
    return true;
  });

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
              onClick={() => {}}
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
        <div>
          <table className="mt-4 min-w-full">
            <thead>
              <tr className="opacity-80 text-white border-b-2 bg-blue-primary font-bold">
                <th className="px-4 py-2 rounded-tl-lg text-left">
                  Donor Offer
                </th>
                <th className="px-4 py-2 text-left">Donor Name</th>
                {activeTab === StatusFilterKey.UNFINALIZED && (
                  <th className="px-4 py-2 text-left">Response Deadline</th>
                )}
                {activeTab === StatusFilterKey.UNFINALIZED && (
                  <th className="px-4 py-2 text-left">Partners Responded</th>
                )}
                <th className="px-4 py-2 rounded-tr-lg w-12 text-left">
                  Manage
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOffers.map((offer, index) => (
                <React.Fragment key={index}>
                  <tr
                    data-odd={index % 2 !== 0}
                    onClick={() =>
                      router.push(`/donorOffers/${offer.donorOfferId}`)
                    }
                    className={`bg-white data-[odd=true]:bg-gray-50 border-b cursor-pointer data-[odd=true]:hover:bg-gray-100 hover:bg-gray-100 transition-colors`}
                  >
                    <td className="px-4 py-2">{offer.offerName}</td>
                    <td className="px-4 py-2">{offer.donorName}</td>
                    {activeTab === StatusFilterKey.UNFINALIZED && (
                      <td className="px-4 py-2">
                        {offer.responseDeadline
                          ? new Date(
                              offer.responseDeadline
                            ).toLocaleDateString()
                          : "N/A"}
                      </td>
                    )}
                    {activeTab === StatusFilterKey.UNFINALIZED && (
                      <td className="px-4 py-2">
                        {
                          offer.invitedPartners.filter(
                            (partner) => partner.responded
                          ).length
                        }
                        /{offer.invitedPartners.length}
                      </td>
                    )}
                    <td
                      className="px-4 py-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Menu as="div" className="float-right relative">
                        <MenuButton>
                          <DotsThree weight="bold" className="cursor-pointer" />
                        </MenuButton>
                        <MenuItems className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white ring-1 shadow-lg ring-black/5 w-max">
                          <MenuItem
                            as="button"
                            className="flex w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <PencilSimple
                              className="inline-block mr-2"
                              size={22}
                            />
                            Edit Offer Details
                          </MenuItem>
                          <MenuItem
                            as="button"
                            className="flex w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Upload className="inline-block mr-2" size={22} />
                            Upload Final Offer
                          </MenuItem>
                          <MenuItem
                            as="button"
                            className="flex w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Archive className="inline-block mr-2" size={22} />
                            Archive Offer
                          </MenuItem>
                        </MenuItems>
                      </Menu>
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
