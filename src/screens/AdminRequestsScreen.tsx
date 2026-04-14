"use client";

import { useEffect, useMemo, useState } from "react";
import CurrentRequestsTable from "@/components/CurrentRequestsTable";
import PastRequestsTable from "@/components/PastRequestsTable";
import { useUser } from "@/components/context/UserContext";
import { hasPermission } from "@/lib/userUtils";
import { useRouter } from "next/navigation";

enum RequestsTab {
  CURRENT = "Current Partner Requests",
  PAST = "Past Partner Requests",
}

export default function AdminRequestsScreen() {
  const { user } = useUser();
  const router = useRouter();
  const canViewRequests = hasPermission(user, "requestRead");

  const availableTabs = useMemo(
    () =>
      [
        canViewRequests ? RequestsTab.CURRENT : null,
        canViewRequests ? RequestsTab.PAST : null,
      ].filter(Boolean) as RequestsTab[],
    [canViewRequests]
  );

  const [activeTab, setActiveTab] = useState<string>(availableTabs[0] ?? "");

  useEffect(() => {
    if (availableTabs.length === 0) {
      router.replace("/");
      return;
    }
    if (!availableTabs.includes(activeTab as RequestsTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [activeTab, availableTabs, router]);

  if (availableTabs.length === 0) {
    return null;
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-gray-primary">Requests</h1>

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

      {activeTab === RequestsTab.CURRENT && canViewRequests && (
        <CurrentRequestsTable />
      )}
      {activeTab === RequestsTab.PAST && canViewRequests && (
        <PastRequestsTable />
      )}
    </>
  );
}
