import { DistributionRecord } from "@/types";
import DistributionTable from "./DistributionTable";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { CgSpinner } from "react-icons/cg";
import { useFetch } from "@/hooks/useFetch";
import { useApiClient } from "@/hooks/useApiClient";

interface DistributionsResponse {
  records: DistributionRecord[];
}

export default function HiddenItems() {
  const { partnerId } = useParams();

  const { data: distributionsData, isLoading, refetch: fetchData } = useFetch<DistributionsResponse>(
    `/api/distributions?partnerId=${encodeURIComponent((partnerId ?? "") as string)}&visible=false`,
    {
      cache: "no-store",
      onError: (error) => {
        console.log(error);
        toast.error("Error fetching hidden items", {
          position: "bottom-right",
        });
      },
    }
  );

  const { apiClient } = useApiClient();

  const makeAllVisible = async () => {
    try {
      await apiClient.put(`/api/distributions/toggleVisibility?partnerId=${partnerId}&visible=true`);
      toast.success("Made all items visible");
      fetchData();
    } catch (error) {
      console.log(error);
      toast.error("Error changing visibility", {
        position: "bottom-right",
      });
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
        distributions={distributionsData?.records || []}
      />
    </div>
  );
}
