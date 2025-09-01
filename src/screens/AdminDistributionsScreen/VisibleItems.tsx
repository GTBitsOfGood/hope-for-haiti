import DistributionTable from "./DistributionTable";
import { useParams } from "next/navigation";
import { CgSpinner } from "react-icons/cg";
import { DistributionRecord } from "@/types";
import { useFetch } from "@/hooks/useFetch";
import toast from "react-hot-toast";

interface DistributionsResponse {
  records: DistributionRecord[];
}

export default function VisibleItems() {
  const { partnerId } = useParams();

  const { data: distributionsData, isLoading, refetch: fetchData } = useFetch<DistributionsResponse>(
    `/api/distributions?partnerId=${encodeURIComponent((partnerId ?? "") as string)}&visible=true`,
    {
      cache: "no-store",
      onError: (error) => {
        console.log(error);
        toast.error("Error fetching visible items", {
          position: "bottom-right",
        });
      },
    }
  );

  if (isLoading) {
    return <CgSpinner className="w-16 h-16 animate-spin opacity-50" />;
  }

  return (
    <DistributionTable
      refetch={fetchData}
      visible={true}
      distributions={distributionsData?.records || []}
    />
  );
}
