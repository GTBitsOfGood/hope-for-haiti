import { DistributionRecord } from "@/types";
import DistributionTable from "./DistributionTable";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { CgSpinner } from "react-icons/cg";

export default function HiddenItems() {
  const { partnerId } = useParams();
  const [distributions, setDistributions] = useState<DistributionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchData = useCallback(() => {
    (async () => {
      const distributions = await fetch(
        `/api/distributions?partnerId=${encodeURIComponent((partnerId ?? "") as string)}&visible=false`,
        { cache: "no-store" },
      );

      if (!distributions.ok) {
        throw new Error();
      }

      const data = await distributions.json();
      setDistributions(data.records);

      setIsLoading(false);
    })();
  }, [partnerId]);

  useEffect(fetchData, [fetchData]);

  const makeAllVisible = async () => {
    try {
      const res = await fetch(
        `/api/distributions/toggleVisibility?partnerId=${partnerId}&visible=true`,
        {
          method: "PUT",
        },
      );

      if (!res.ok) {
        throw new Error();
      }

      toast.success("Made all items visible");
      fetchData();
    } catch (e) {
      toast.error("Error changing visibility", {
        position: "bottom-right",
      });
      console.log(e);
    }
  };

  if (isLoading) {
    return <CgSpinner className="w-16 h-16 animate-spin opacity-50" />;
  }

  return (
    <div className="mt-4">
      <button
        className="flex items-center border border-red-500 gap-2 text-center bg-white text-red-500 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition"
        onClick={() => makeAllVisible()}
      >
        Make All Items Visible
      </button>
      <DistributionTable
        refetch={fetchData}
        visible={false}
        distributions={distributions}
      />
    </div>
  );
}
