"use client";

import { useEffect, useMemo, useState } from "react";
import DistributionTable from "@/components/DistributionTable";
import ShipmentsTable from "@/components/ShipmentsTable";
import SignOffsTable from "@/components/SignOffsTable";
import { useUser } from "@/components/context/UserContext";
import { hasPermission } from "@/lib/userUtils";
import { useRouter } from "next/navigation";
// Define the tab options
enum DistributionTab {
  DISTRIBUTIONS = "Distributions",
  SHIPMENTS = "Shipments",
  SIGNOFFS = "Sign-offs"
}

export default function AdminDistributionsScreen() {
  const { user } = useUser();
  const router = useRouter();
  const canViewDistributions = hasPermission(user, "distributionRead");
  const canViewShipments = hasPermission(user, "shipmentRead");
  const canViewSignOffs = hasPermission(user, "shipmentRead");

  const availableTabs = useMemo(
    () =>
      [
        canViewDistributions ? DistributionTab.DISTRIBUTIONS : null,
        canViewShipments ? DistributionTab.SHIPMENTS : null,
        canViewSignOffs ? DistributionTab.SIGNOFFS : null,
      ].filter(Boolean) as DistributionTab[],
    [canViewDistributions, canViewShipments, canViewSignOffs]
  );

  const [activeTab, setActiveTab] = useState<string>(
    availableTabs[0] ?? ""
  );

  useEffect(() => {
    if (availableTabs.length === 0) {
      router.replace("/");
      return;
    }
    if (!availableTabs.includes(activeTab as DistributionTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [activeTab, availableTabs, router]);

  if (availableTabs.length === 0) {
    return null;
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-gray-primary">
        Distributions
      </h1>

      <div className="flex space-x-4 mt-6 border-b-2 border-gray-primary border-opacity-10">
        {availableTabs.map((tab) => (
          <button
            key={tab}
            data-active={activeTab === tab}
            className="px-2 py-1 text-md font-medium text-gray-primary text-opacity-70 relative -mb-px transition-colors focus:outline-none data-[active=true]:border-b-2 data-[active=true]:border-gray-primary data-[active=true]:bottom-[-1px] data-[active=true]:text-opacity-100"
            onClick={() => setActiveTab(tab)}
          >
            <div className="hover:bg-gray-100 px-2 py-1 rounded">{tab}</div>
          </button>
        ))}
      </div>

      {activeTab === DistributionTab.DISTRIBUTIONS && canViewDistributions && (
        <DistributionTable />
      )}
      {activeTab === DistributionTab.SHIPMENTS && canViewShipments && (
        <ShipmentsTable />
      )}
      {activeTab === DistributionTab.SIGNOFFS && canViewSignOffs && (
        <SignOffsTable />
      )}
    </>
  );
}
