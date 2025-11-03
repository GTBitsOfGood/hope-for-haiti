"use client";

import { useState } from "react";
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
