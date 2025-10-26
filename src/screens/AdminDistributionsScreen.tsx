"use client";

import { useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import DistributionTable from "@/components/DistributionTable";
import ShipmentsTable from "@/components/ShipmentsTable";

// Define the tab options
enum DistributionTab {
  DISTRIBUTIONS = "Distributions",
  SHIPMENTS = "Shipments",
}

export default function AdminDistributionsScreen() {
  // State for active tab
  const [activeTab, setActiveTab] = useState<string>(
    DistributionTab.DISTRIBUTIONS
  );

  return (
    <>
      <h1 className="text-2xl font-semibold text-gray-primary">
        Distributions
      </h1>

      {/* Search bar */}
      <div className="flex justify-between items-center w-full py-4 mt-6">
        <div className="relative w-1/3">
          <MagnifyingGlass
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            size={18}
          />
          <input
            type="text"
            placeholder="Search"
            className="pl-10 pr-4 py-2 w-full border border-gray-primary border-opacity-10 rounded bg-zinc-100 text-zinc-500 font-light focus:outline-none focus:border-gray-400"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mt-6 border-b-2 border-gray-primary border-opacity-10">
        {Object.values(DistributionTab).map((tab) => {
          return (
            <button
              key={tab}
              data-active={activeTab === tab}
              className="px-2 py-1 text-md font-medium text-gray-primary text-opacity-70 relative -mb-px transition-colors focus:outline-none data-[active=true]:border-b-2 data-[active=true]:border-gray-primary data-[active=true]:bottom-[-1px] data-[active=true]:text-opacity-100"
              onClick={() => {
                setActiveTab(tab);
              }}
            >
              <div className="hover:bg-gray-100 px-2 py-1 rounded">{tab}</div>
            </button>
          );
        })}
      </div>

      {activeTab === DistributionTab.DISTRIBUTIONS && <DistributionTable />}
      {activeTab === DistributionTab.SHIPMENTS && <ShipmentsTable />}
    </>
  );
}
