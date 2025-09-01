"use client";

import { useState, useEffect } from "react";
import { MagnifyingGlass, ExclamationMark } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import { isStaff } from "@/lib/userUtils";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useRouter, useParams } from "next/navigation";
import { useFetch } from "@/hooks/useFetch";
import { SignOffDetailsResponse } from "@/types/api/distribution.types";
import TableOfItemsOfDistributions from "@/screens/PartnerDistributionsScreenTables/ViewDistributionsOfSignOffScreen/TableOfItemsOfDistributions";

enum Tab {
  IN_PROGRESS = "In Progress",
  COMPLETE = "Complete",
}

export default function SignOffDetailsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<string>(Tab.COMPLETE);
  const router = useRouter();
  const signOffId = useParams().signOffId;

  if (!session?.user.type) {
    redirect("/signIn");
  }

  if (isStaff(session.user.type)) {
    redirect("/distributions");
  }

  const { data: signOffData, isLoading } = useFetch<SignOffDetailsResponse>(
    `/api/distributions/signOffs/${signOffId}`
  );

  useEffect(() => {
    if (activeTab === Tab.IN_PROGRESS) {
      router.push(`/distributions/`);
      return;
    }
  }, [activeTab, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
      </div>
    );
  }

  if (!signOffData) {
    return <p className="text-center text-red-600">Sign off data not found.</p>;
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-gray-primary">
        Distributions / &quot;{signOffData.signOff.date}&quot;
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
            return <TableOfItemsOfDistributions entries={signOffData.itemDistributions} />;
          default:
            return <></>;
        }
      })()}
    </>
  );
}
