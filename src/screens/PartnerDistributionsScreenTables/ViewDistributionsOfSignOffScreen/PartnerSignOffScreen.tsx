"use client";

import { useEffect, useState } from "react";
import { MagnifyingGlass, ExclamationMark } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import React from "react";
import {
  DistributionItem,
} from "@/types/api/distribution.types";
import { useRouter, useParams } from "next/navigation";
import { useFetch } from "@/hooks/useFetch";
import { toast } from "react-hot-toast";
import TableOfItemsOfDistributions from "./TableOfItemsOfDistributions";

enum Tab {
  IN_PROGRESS = "In Progress",
  COMPLETE = "Complete",
}

interface SignOffData {
  itemDistributions: DistributionItem[];
  signOff: {
    date: string;
  };
}

export default function PartnerSignOffScreen() {
  const [activeTab, setActiveTab] = useState<string>(Tab.COMPLETE); //this is for the row of tabs
  const router = useRouter();
  const signOffId = useParams().signOffId;

  const { data, isLoading, error } = useFetch<SignOffData>(
    `/api/distributions/signOffs/${signOffId}`,
    {
      conditionalFetch: !!signOffId,
      onError: (error) => {
        toast.error(`Failed to fetch sign off data: ${error}`);
      },
    }
  );

  useEffect(() => {
    if (activeTab === Tab.IN_PROGRESS) {
      router.push(`/distributions/`);
      return;
    }
  }, [activeTab, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center mt-8">
        <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center mt-8">
        <p className="text-red-500">Error loading sign off data: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center mt-8">
        <p className="text-gray-500">No sign off data available</p>
      </div>
    );
  }

  const { itemDistributions: items, signOff } = data;
  const signOffDate = signOff.date;

  return (
    <>
      <h1 className="text-2xl font-semibold text-gray-primary">
        Distributions / &quot;{signOffDate}&quot;
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
                if (key === Tab.COMPLETE) {
                  router.push("/distributions?table=complete");
                } else if (key === Tab.IN_PROGRESS) {
                  router.push("/distributions");
                }
                setActiveTab(key);
              }}
            >
              <div className="hover:bg-gray-100 px-2 py-1 rounded">{tab}</div>
            </button>
          );
        })}
      </div>

      {(() => {
        switch (activeTab) {
          case Tab.IN_PROGRESS:
            return <></>;
          case Tab.COMPLETE:
            return <TableOfItemsOfDistributions entries={items} />;
          default:
            return <></>;
        }
      })()}
    </>
  );
}
