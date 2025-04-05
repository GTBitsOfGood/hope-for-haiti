"use client";

import { DistributionItem } from "@/app/api/distributions/types";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import HiddenItems from "./HiddenItems";
import Requests from "./Requests";
import ShippingStatus from "./ShippingStatus";
import SignOffs from "./SignOffs";
import VisibleItems from "./VisibleItems";
import { CgSpinner } from "react-icons/cg";
import { useParams } from "next/navigation";

const tabs = [
  {
    key: "hiddenItems",
    label: "Hidden Items",
  },
  {
    key: "visibleItems",
    label: "Visible Items",
  },
  {
    key: "shippingStatus",
    label: "Shipping Status",
  },
  {
    key: "signOffs",
    label: "Sign Offs",
  },
  {
    key: "requests",
    label: "Requests",
  },
];

export default function AdminDistributionsScreen() {
  const { partnerId } = useParams();

  const [partnerName, setPartnerName] = useState("");

  const [distributions, setDistributions] = useState<DistributionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<string>("hiddenItems");

  const makeAllVisible = async () => {
    try {
      const res = await fetch(`/api/distributions/toggleVisibility`, {
        method: "PUT",
        body: JSON.stringify({
          visible: true,
          ids: distributions
            .filter((distribution) => !distribution.visible)
            .map((distribution) => distribution.id),
        }),
      });

      if (!res.ok) {
        throw new Error();
      }

      setDistributions((oldDistributions: DistributionItem[]) =>
        oldDistributions.map((distribution) => ({
          ...distribution,
          visible: true,
        })),
      );
    } catch (e) {
      toast.error("Error changing visibility", {
        position: "bottom-right",
      });
      console.log(e);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const partner = await fetch(`/api/users/${partnerId}`);
        if (!partner.ok) {
          throw new Error();
        }
        const partnerData = await partner.json();
        setPartnerName(partnerData.user.name);

        const distributions = await fetch(
          `/api/distributions?partnerId=${encodeURIComponent((partnerId ?? "") as string)}`,
        );

        if (!distributions.ok) {
          throw new Error();
        }

        const data = await distributions.json();
        setDistributions(data.items);
      } catch (e) {
        toast.error("Error fetching distributions", {
          position: "bottom-right",
        });
        console.log(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [partnerId]);

  return (
    <>
      <div className="flex items-center justify-between gap-1 mb-4">
        <div className="flex row">
          <Link
            href="/unallocatedItems"
            className="font-medium hover:bg-gray-100 transition-colors rounded cursor-pointer flex items-center justify-center p-1"
          >
            Distributions
          </Link>
          <span className="text-gray-500 text-sm flex items-center pl-2 pr-2">
            /{" "}
          </span>
          <span className="font-medium bg-gray-100 transition-colors rounded flex items-center justify-center p-1">
            {partnerName}
          </span>
        </div>
        {activeTab === "hiddenItems" ? (
          <button
            className="flex items-center border border-red-500 gap-2 text-center text-red-500 border-red-500 bg-white text-red-500 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition"
            onClick={() => makeAllVisible()}
          >
            Make All Items Visible
          </button>
        ) : null}
      </div>
      <h1 className="text-2xl font-semibold">
        {partnerName}: Distribution Details
      </h1>

      <div className="flex justify-between items-center w-full py-4">
        <div className="relative w-1/3">
          <MagnifyingGlass
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            size={18}
          />
          <input
            type="text"
            placeholder="Search"
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:border-gray-400"
          />
        </div>
        <div className="relative">
          <button className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition">
            <Plus size={18} /> Add Item
          </button>
        </div>
      </div>
      <div className="flex space-x-4 mt-4 border-b-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            data-active={activeTab === tab.key}
            className="px-2 py-1 text-md font-medium relative -mb-px transition-colors focus:outline-none data-[active=true]:border-b-2 data-[active=true]:border-black data-[active=true]:bottom-[-1px] data-[active=false]:text-gray-500"
            onClick={() => setActiveTab(tab.key)}
          >
            <div className="hover:bg-gray-100 px-2 py-1 rounded">
              {tab.label}
            </div>
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center mt-8">
          <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
        </div>
      ) : (
        <>
          {activeTab == "hiddenItems" && (
            <HiddenItems
              distributions={distributions.filter(
                (distribution) => !distribution.visible,
              )}
              setDistributions={setDistributions}
            />
          )}
          {activeTab == "visibleItems" && (
            <VisibleItems
              distributions={distributions.filter(
                (distribution) => distribution.visible,
              )}
              setDistributions={setDistributions}
            />
          )}
          {activeTab == "shippingStatus" && <ShippingStatus />}
          {activeTab == "signOffs" && <SignOffs />}
          {activeTab == "requests" && <Requests />}
        </>
      )}
    </>
  );
}
