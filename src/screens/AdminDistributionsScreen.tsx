"use client";

import { useState } from "react";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import React from "react";
import HiddenItems from "./AdminDistributionsScreenTabs/HiddenItems";
import VisibleItems from "./AdminDistributionsScreenTabs/VisibleItems";
import ShippingStatus from "./AdminDistributionsScreenTabs/ShippingStatus";
import SignOffs from "./AdminDistributionsScreenTabs/SignOffs";
import Requests from "./AdminDistributionsScreenTabs/Requests";

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

export default function AdminDistributionsScreen() {
  const [activeTab, setActiveTab] = useState<string>("hiddenItems");

  return (
    <>
      <h1 className="text-2xl font-semibold">Distributions</h1>
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
          <button className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition">
            <Plus size={18} /> Add Item
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
