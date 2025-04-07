import { DistributionItem } from "@/app/api/distributions/types";
import DistributionTable from "./DistributionTable";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { CgSpinner } from "react-icons/cg";

export default function HiddenItems() {
  const { partnerId } = useParams();
  const [distributions, setDistributions] = useState<DistributionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const distributions = await fetch(
          `/api/distributions?partnerId=${encodeURIComponent((partnerId ?? "") as string)}`
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

  if (isLoading) {
    return <CgSpinner className="w-16 h-16 animate-spin opacity-50" />;
  }

  return (
    <DistributionTable
      distributions={distributions}
      setDistributions={setDistributions}
    />
  );
}
