"use client";

import { useEffect, useState } from "react";
import { MagnifyingGlass, ExclamationMark } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import React from "react";
import {
  AllocatedItem,
  PartnerDistributionsResponse,
  SignedDistributions,
} from "@/app/api/distributions/types";
import InProgressTable from "./PartnerDistributionsScreenTables/InProgressTable";
import CompleteTable from "./PartnerDistributionsScreenTables/CompleteTable";
import { useSearchParams } from "next/navigation";

enum Tab {
  IN_PROGRESS = "In Progress",
  COMPLETE = "Complete",
}

export default function PartnerUnallocatedItemsScreen() {
  const [items, setItems] = useState<AllocatedItem[]>([]);
  const [signedDistributions, setSignedDistributions] = useState<
    SignedDistributions[]
  >([]);
  const defaultTab = useSearchParams().get("table")
    ? Tab.COMPLETE
    : Tab.IN_PROGRESS;
  const [activeTab, setActiveTab] = useState<string>(defaultTab); //this is for the row of tabs
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(async () => {
      const response = await fetch("/api/distributions", {
        method: "GET",
        cache: "no-store",
      });
      const data: PartnerDistributionsResponse =
        (await response.json()) as PartnerDistributionsResponse;
      setItems(data.items);
      setSignedDistributions(data.signedDistributions);
      setIsLoading(false);
    }, 1000);
  }, []);

  return (
    <>
      <h1 className="text-2xl font-semibold text-gray-primary">
        Distributions
      </h1>

      <div className="flex justify-between items-center w-full py-4 mt-1">
        <div className="relative w-3/5 p-2">
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
        <div className="relative w-1/3 p-5 inline-flex items-center bg-blue-50 bg-opacity-60 border border-gray-primary border-opacity-10 rounded-md">
          <ExclamationMark weight="fill" size="48" />
          <div className="ml-5">
            For any questions, comments, concerns about your distribution please
            contact yvette@hopeforhaiti.com.
          </div>
        </div>
      </div>
      <div className="flex space-x-4 mt-4 border-b-2 border-gray-primary border-opacity-10">
        {Object.values(Tab).map((tab) => {
          const key = tab as Tab;
          return (
            <button
              key={tab}
              data-active={activeTab === key}
              className="px-2 py-1 text-md font-medium text-gray-primary text-opacity-70 relative -mb-px transition-colors focus:outline-none data-[active=true]:border-b-2 data-[active=true]:border-gray-primary data-[active=true]:bottom-[-1px] data-[active=true]:text-opacity-100"
              onClick={() => {
                setActiveTab(key);
              }}
            >
              <div className="hover:bg-gray-100 px-2 py-1 rounded">{tab}</div>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center mt-8">
          <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
        </div>
      ) : (
        (() => {
          switch (activeTab) {
            case Tab.IN_PROGRESS:
              return <InProgressTable items={items} />;
            case Tab.COMPLETE:
              return <CompleteTable entries={signedDistributions} />;
            default:
              return <></>;
          }
        })()
      )}
    </>
  );
}
