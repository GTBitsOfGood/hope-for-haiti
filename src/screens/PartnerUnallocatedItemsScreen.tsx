"use client";

import { useState } from "react";
import React from "react";
import UnallocatedItems from "./PartnerUnallocatedItemsScreens/UnallocatedItems";
import MyRequests from "./PartnerUnallocatedItemsScreens/MyRequests";

enum UnallocatedItemsTab {
  UNALLOCATED_ITEMS = "Unallocated Items",
  MY_REQUESTS = "My Requests",
}

export default function PartnerUnallocatedItemsScreen() {
  const [activeItemTab, setActiveItemTab] =
    useState<string>("Unallocated Items"); //this is for the upper row of tabs

  return (
    <>
      <h1 className="text-2xl font-semibold text-gray-primary">
        Unallocated Items
      </h1>

      <div className="flex space-x-4 mt-4 border-b-2 border-gray-primary border-opacity-10">
        {Object.values(UnallocatedItemsTab).map((tab) => {
          return (
            <button
              key={tab}
              data-active={activeItemTab === tab}
              className="px-2 py-1 text-md font-medium text-gray-primary text-opacity-70 relative -mb-px transition-colors focus:outline-none data-[active=true]:border-b-2 data-[active=true]:border-gray-primary data-[active=true]:bottom-[-1px] data-[active=true]:text-opacity-100"
              onClick={() => {
                setActiveItemTab(tab);
              }}
            >
              <div className="hover:bg-gray-100 px-2 py-1 rounded">{tab}</div>
            </button>
          );
        })}
      </div>

      {activeItemTab == UnallocatedItemsTab.UNALLOCATED_ITEMS && (
        <UnallocatedItems />
      )}

      {activeItemTab == UnallocatedItemsTab.MY_REQUESTS && <MyRequests />}
    </>
  );
}
