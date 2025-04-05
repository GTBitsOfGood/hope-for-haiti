"use client";

import { useState, useEffect } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";

// Define the tab options
enum DistributionTab {
  IN_PROGRESS = "In Progress",
  COMPLETE = "Complete",
}

// Define the SignOff type
interface SignOff {
  partnerName: string;
  staffMemberName: string;
  date: string;
  createdAt: string;
  _count: {
    distributions: number;
  };
}

export default function AdminDistributionsScreen() {
  // State for active tab
  const [activeTab, setActiveTab] = useState<string>(DistributionTab.IN_PROGRESS);
  // State for signoffs data
  const [signoffs, setSignoffs] = useState<SignOff[]>([]);
  // State for loading
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch signoffs data when the Complete tab is active
  useEffect(() => {
    const fetchSignoffs = async () => {
      if (activeTab === DistributionTab.COMPLETE) {
        setIsLoading(true);
        try {
          const response = await fetch("/api/distributions?completed=true");
          if (response.ok) {
            const data = await response.json();
            setSignoffs(data.signoffs || []);
          } else {
            console.error("Failed to fetch signoffs:", response.statusText);
          }
        } catch (error) {
          console.error("Error fetching signoffs:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchSignoffs();
  }, [activeTab]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

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

      {/* Content area */}
      <div className="mt-2">
        {activeTab === DistributionTab.IN_PROGRESS ? (
          <p className="text-gray-500">No distributions to display.</p>
        ) : (
          <>
            {isLoading ? (
              <div className="flex justify-center items-center mt-8">
                <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
              </div>
            ) : signoffs.length === 0 ? (
              <p className="text-gray-500">No completed distributions to display.</p>
            ) : (
              <div className="overflow-x-scroll">
                <table className="mt-2 min-w-full">
                  <thead>
                    <tr className="bg-blue-primary opacity-80 text-white font-light text-sm border-b-2">
                      <th className="px-4 py-3 rounded-tl text-left">Partner Name</th>
                      <th className="px-4 py-3 text-left">HfH Staff Member</th>
                      <th className="px-4 py-3 text-left">Number of Items</th>
                      <th className="px-4 py-3 text-left">Date Created</th>
                      <th className="px-4 py-3 rounded-tr text-left">Sign Off Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signoffs.map((signoff, index) => (
                      <tr
                        key={index}
                        data-odd={index % 2 !== 0}
                        className="bg-white data-[odd=true]:bg-gray-50 border text-black font-light text-sm transition-colors"
                      >
                        <td className="px-4 py-3">{signoff.partnerName}</td>
                        <td className="px-4 py-3">{signoff.staffMemberName}</td>
                        <td className="px-4 py-3">{signoff._count.distributions}</td>
                        <td className="px-4 py-3">{formatDate(signoff.createdAt)}</td>
                        <td className="px-4 py-3">{formatDate(signoff.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
