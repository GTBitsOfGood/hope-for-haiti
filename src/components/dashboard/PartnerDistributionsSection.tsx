"use client";

import { useState } from "react";
import PartnerDistributionTable from "./PartnerDistributionTable";

type TabType = "in-progress" | "completed";

export default function PartnerDistributionsSection() {
  const [activeTab, setActiveTab] = useState<TabType>("in-progress");

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Distributions</h2>
      </div>

      <hr className="mb-4 border-gray-200" />

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("in-progress")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "in-progress"
              ? "text-blue-primary border-b-2 border-blue-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          In Progress
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "completed"
              ? "text-blue-primary border-b-2 border-blue-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Completed
        </button>
      </div>

      {/* Table */}
      <PartnerDistributionTable pending={activeTab === "in-progress"} />
    </div>
  );
}
