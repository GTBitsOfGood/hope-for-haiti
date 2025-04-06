import { DistributionItem } from "@/app/api/distributions/types";
import DistributionTable from "./DistributionTable";
import { Dispatch, SetStateAction } from "react";

export default function VisibleItems({
  distributions,
  setDistributions,
}: {
  distributions: DistributionItem[];
  setDistributions: Dispatch<SetStateAction<DistributionItem[]>>;
}) {
  return (
    <DistributionTable
      distributions={distributions}
      setDistributions={setDistributions}
    />
  );
}
