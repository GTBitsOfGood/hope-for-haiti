"use client";

import { useState } from "react";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import React from "react";
import HiddenItems from "@/screens/AdminDistributionsScreen/HiddenItems";
import VisibleItems from "@/screens/AdminDistributionsScreen/VisibleItems";
import ShippingStatus from "@/screens/AdminDistributionsScreen/ShippingStatus";
import SignOffs from "@/screens/AdminDistributionsScreen/SignOffs";
import Requests from "@/screens/AdminDistributionsScreen/Requests";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useFetch } from "@/hooks/useFetch";

interface User {
  user: {
    name: string;
  };
}

const tabs = [
  {
    key: "hiddenItems",
    label: "Hidden Items",
  },
  {
    key: "visibleItems",
    label: "Visible Items",
  },
  {
    key: "shippingStatus",
    label: "Shipping Status",
  },
  {
    key: "signOffs",
    label: "Sign Offs",
  },
  {
    key: "requests",
    label: "Requests",
  },
];

export default function DistributionsForPartnerPage() {
  const { partnerId } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("hiddenItems");

  const { data: partnerData } = useFetch<User>(`/api/users/${partnerId}`, {
    cache: "no-store",
    onError: (error) => {
      console.error("Failed to fetch partner details:", error);
    },
  });

  const partnerName = partnerData?.user?.name;

  const handleClick = () => {
    if (activeTab === "signOffs") {
      router.push(`/distributions/${partnerId}/createSignOff`);
    } else if (["hiddenItems", "visibleItems"].includes(activeTab)) {
      router.push(`/distributions/${partnerId}/addItem`);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-semibold">
        <Link href="/distributions" className="hover:underline">
          Distributions
        </Link>{" "}
        / {partnerName}
      </h1>
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
        <div className="relative">
          <button
            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition"
            onClick={handleClick}
          >
            <Plus size={18} />{" "}
            {activeTab === "signOffs" ? "Create Sign Off" : "Add Item"}
          </button>
        </div>
      </div>
      <div className="flex space-x-4 mt-4 border-b-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            data-active={activeTab === tab.key}
            className="px-2 py-1 text-md font-medium relative -mb-px transition-colors focus:outline-none data-[active=true]:border-b-2 data-[active=true]:border-black data-[active=true]:bottom-[-1px] data-[active=false]:text-gray-500"
            onClick={() => setActiveTab(tab.key)}
          >
            <div className="hover:bg-gray-100 px-2 py-1 rounded">
              {tab.label}
            </div>
          </button>
        ))}
      </div>

      {activeTab == "hiddenItems" && <HiddenItems />}
      {activeTab == "visibleItems" && <VisibleItems />}
      {activeTab == "shippingStatus" && <ShippingStatus />}
      {activeTab == "signOffs" && <SignOffs />}
      {activeTab == "requests" && <Requests />}
    </>
  );
}
