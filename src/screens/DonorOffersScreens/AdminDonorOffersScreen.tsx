"use client";

import { useState, useCallback, useRef } from "react";
import {
  DotsThree,
  Plus,
  PencilSimple,
  Upload,
  Archive,
} from "@phosphor-icons/react";
import { DonorOfferState } from "@prisma/client";
import React from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { AdminDonorOffersResponse, AdminDonorOffer } from "@/types/api/donorOffer.types";
import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  FilterList,
  ColumnDefinition,
} from "@/components/baseTable/AdvancedBaseTable";
import { useUser } from "@/components/context/UserContext";
import { hasPermission } from "@/lib/userUtils";
import { useApiClient } from "@/hooks/useApiClient";

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
  const { user } = useUser();
  const {apiClient} = useApiClient();
  const canManageOffers = hasPermission(user, "offerWrite");

  const tableRef = useRef<AdvancedBaseTableHandle<AdminDonorOffer>>(null);

  const fetchFn = useCallback(
    async(pageSize: number, page: number, filters: FilterList<AdminDonorOffer>) => {
      const combinedFilters = {
        ...filters, 
        state: {type: "enum" as const, values: [activeTab]},
      };

      const params = new URLSearchParams({
        pageSize: pageSize.toString(),
        page: page.toString(), 
        filters: JSON.stringify(combinedFilters),
      });

      const data = await apiClient.get<AdminDonorOffersResponse>(
        `/api/donorOffers?${params}`
      );

      return {
        data: data.donorOffers,
        total: data.total,
      };
    },
    [apiClient, activeTab]
  );

  const handleArchive = (donorOfferId: number) => {
    (async () => {
      try {
        const resp = await fetch(`/api/donorOffers/${donorOfferId}/submit`, {
          method: "POST",
        });
        if (!resp.ok) {
          toast.error("Error archiving donor offer");
          return;
        }
        toast.success("Donor offer archived");
        tableRef.current?.reload();
      } catch (error) {
        toast.error("Error archiving donor offer");
        console.error("Archive error:", error);
      }
    })();
  };

  const columns: ColumnDefinition<AdminDonorOffer>[] = [
    {
      id: "offerName",
      header: "Donor Offer", 
      filterType: "string", 
      cell: (offer) => offer.offerName,
    },
    {
      id: "donorName",
      header: "Donor Name",
      filterType: "string",
      cell: (offer) => offer.donorName, 
    },
    {
      id: "partnerInvolved",
      header: "Partner Involved", 
      filterType: "string",
      cell: (offer) => 
        offer.invitedPartners.map((p) => p.name).join(", "),
    },
    ...(activeTab === StatusFilterKey.UNFINALIZED
      ? [
          {
            id: "responseDeadline",
            header: "Response Deadline",
            filterType: "date" as const, 
            cell: (offer: AdminDonorOffer) => 
              offer.responseDeadline
                ? new Date(offer.responseDeadline).toLocaleDateString()
                : "N/A",
          },
          {
            id: "partnersResponded",
            header: "Partners Responded", 
            cell: (offer: AdminDonorOffer) => 
              `${offer.invitedPartners.filter((p) => p.responded).length}/${offer.invitedPartners.length}`, 
          },
          {
            id: "donorResponseDeadline",
            header: "Donor Repsonse Deadline", 
            filterType: "date" as const, 
            cell: (offer: AdminDonorOffer) => 
              offer.donorResponseDeadline 
                ? new Date(offer.donorResponseDeadline).toLocaleDateString() 
                : "N/A"
          },
          {
            id: "allPartnersResponded",
            header: "All Partners Responded", 
            filterType: "enum" as const, 
            filterOptions: ["Yes", "No"],
            cell: (offer: AdminDonorOffer) => 
              offer.invitedPartners.length > 0 && 
              offer.invitedPartners.every((p) => p.responded)
                ? "Yes"
                : "No",
          },
      ]
      : [])
  ];

  if (canManageOffers) {
    columns.push({
      id: "manage",
      header: "Manage",
      filterable: false,
      cell: (offer) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Menu as="div" className="float-right relative">
            <MenuButton>
              <DotsThree weight="bold" />
            </MenuButton>
            <MenuItems className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white ring-1 shadow-lg ring-black/5 w-max">
              {offer.state !== DonorOfferState.ARCHIVED && (
                <MenuItem
                  as="button"
                  className="flex w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => router.push(`/donorOffers/${offer.donorOfferId}/edit`)}
                >
                  <PencilSimple className="inline-block mr-2" size={22} />
                  Edit Offer Details
                </MenuItem>
              )}
              {offer.state === DonorOfferState.UNFINALIZED && (
                <MenuItem
                  as="button"
                  className="flex w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => router.push(`/donorOffers/${offer.donorOfferId}/finalize`)}
                >
                  <Upload className="inline-block mr-2" size={22} />
                  Upload Final Offer
                </MenuItem>
              )}
              {offer.state === DonorOfferState.FINALIZED && (
                <MenuItem
                  as="button"
                  className="flex w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => handleArchive(offer.donorOfferId)}
                >
                  <Archive className="inline-block mr-2" size={22} />
                  Archive Offer
                </MenuItem>
              )}
              {offer.state === DonorOfferState.ARCHIVED && (
                <MenuItem
                  as="div"
                  className="flex w-full px-3 py-2 text-sm text-gray-500 italic cursor-default"
                >
                  Archived (Read-Only)
                </MenuItem>
              )}
            </MenuItems>
          </Menu>
        </div>
      ),
    });
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">Donor Offers</h1>
      <div className="flex space-x-4 mt-4 border-b-2">
        <div className="flex-1">
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
      </div>

      <AdvancedBaseTable
        ref={tableRef}
        columns={columns}
        fetchFn={fetchFn}
        rowId="donorOfferId"
        toolBar={
            canManageOffers && (
              <button
                // className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition" 
                className="order-1 ml-4 flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition"
                onClick={() => router.push("/donorOffers/create")}
              >
                <Plus size={18} /> Create Donor Offer
              </button>
          )}
      />
    </>
  );
}
