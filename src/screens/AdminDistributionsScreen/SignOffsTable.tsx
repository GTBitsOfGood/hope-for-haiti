import { format } from "date-fns";
import { useParams } from "next/navigation";
import React from "react";
import toast from "react-hot-toast";
import { useFetch } from "@/hooks/useFetch";
import BaseTable from "@/components/baseTable/BaseTable";

interface SignOff {
  staffName: string;
  numberOfItems: number;
  dateCreated: Date;
  signOffDate: Date;
  status: string;
}

export default function SignOffsTable() {
  const { partnerId } = useParams();

  const { data: signOffs } = useFetch<SignOff[]>(`/api/signOffs/${partnerId}`, {
    onError: (error) => {
      console.log(error);
      toast.error("Failed to get sign offs");
    },
  });

  return (
    <BaseTable
      headers={[
        "HfH Staff Member",
        "Number of Items",
        "Date Created",
        "Sign Off Date",
        "Status",
      ]}
      rows={
        signOffs?.map((signOff) => ({
          cells: [
            signOff.staffName,
            signOff.numberOfItems,
            format(signOff.dateCreated, "M/d/yyyy"),
            format(signOff.signOffDate, "M/d/yyyy"),
            signOff.status,
          ],
        })) || []
      }
    />
  );
}
