import DistributionTable from "./DistributionTable";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CgSpinner } from "react-icons/cg";

interface DistributionRecord {
  quantityAllocated: number;
  quantityAvailable: number;
  quantityTotal: number;

  title: string;
  donorName: string;
  lotNumber: string;
  palletNumber: string;
  boxNumber: string;
  unitPrice: number;

  donorShippingNumber: string | null;
  hfhShippingNumber: string | null;
}

export default function VisibleItems() {
  const { partnerId } = useParams();
  const [distributions, setDistributions] = useState<DistributionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchData = useCallback(() => {
    (async () => {
      const distributions = await fetch(
        `/api/distributions?partnerId=${encodeURIComponent((partnerId ?? "") as string)}&visible=true`,
        { cache: "no-store" }
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

  if (isLoading) {
    return <CgSpinner className="w-16 h-16 animate-spin opacity-50" />;
  }

  return (
    <DistributionTable
      refetch={fetchData}
      visible={true}
      distributions={distributions}
      setDistributions={setDistributions}
    />
  );
}
