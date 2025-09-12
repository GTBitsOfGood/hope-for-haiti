"use client";

import { useState, useEffect } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import { useRouter } from "next/navigation";
import BaseTable from "@/components/BaseTable";

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

// Define the PartnerAllocation type
interface PartnerAllocation {
  partnerId: number;
  partnerName: string;
  visibleAllocationsCount: number;
  hiddenAllocationsCount: number;
  pendingSignOffCount: number;
}

export default function AdminDistributionsScreen() {
  const router = useRouter();

  // State for active tab
  const [activeTab, setActiveTab] = useState<string>(
    DistributionTab.IN_PROGRESS
  );
  // State for signoffs data
  const [signoffs, setSignoffs] = useState<SignOff[]>([]);
  // State for partner allocations data
  const [partnerAllocations, setPartnerAllocations] = useState<
    PartnerAllocation[]
  >([]);
  // State for loading
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (activeTab === DistributionTab.COMPLETE) {
          const response = await fetch(
            "/api/distributions/admin?completed=true"
          );
          if (response.ok) {
            const data = await response.json();
            setSignoffs(data.signoffs || []);
          } else {
            console.error("Failed to fetch signoffs:", response.statusText);
          }
        } else {
          // Fetch in-progress data
          const response = await fetch("/api/distributions/admin", {
            cache: "no-store",
          });
          if (response.ok) {
            const data = await response.json();
            setPartnerAllocations(data.data || []);
          } else {
            console.error(
              "Failed to fetch partner allocations:",
              response.statusText
            );
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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
      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center items-center mt-8">
            <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
          </div>
        ) : activeTab === DistributionTab.IN_PROGRESS ? (
          <>
            {partnerAllocations.length === 0 ? (
              <p className="text-gray-500">
                No in-progress distributions to display.
              </p>
            ) : (
              <BaseTable
                headers={[
                  "Partner Name",
                  "Visible Allocations",
                  "Hidden Allocations",
                  "Pending Sign Offs",
                ]}
                rows={partnerAllocations.map((partner) => ({
                  cells: [
                    <span
                      className="hover:underline cursor-pointer"
                      key={1}
                      onClick={() =>
                        router.push(`/distributions/${partner.partnerId}`)
                      }
                    >
                      {partner.partnerName}
                    </span>,
                    partner.visibleAllocationsCount,
                    partner.hiddenAllocationsCount,
                    partner.pendingSignOffCount,
                  ],
                }))}
                headerClassName="bg-blue-primary opacity-80 text-white font-bold"
                pageSize={10}
              />
            )}
          </>
        ) : (
          <>
            {signoffs.length === 0 ? (
              <p className="text-gray-500">
                No completed distributions to display.
              </p>
            ) : (
              <BaseTable
                headers={[
                  "Partner Name",
                  "Staff Member",
                  "Date",
                  "Created At",
                  "Distributions",
                ]}
                rows={signoffs.map((signoff) => ({
                  cells: [
                    signoff.partnerName,
                    signoff.staffMemberName,
                    formatDate(signoff.date),
                    formatDate(signoff.createdAt),
                    signoff._count?.distributions,
                  ],
                }))}
                headerClassName="bg-blue-primary text-white opacity-80"
                pageSize={10}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}
