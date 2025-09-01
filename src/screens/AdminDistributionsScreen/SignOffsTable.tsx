import { format } from "date-fns";
import { useParams } from "next/navigation";
import React from "react";
import toast from "react-hot-toast";
import { useFetch } from "@/hooks/useFetch";

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
    <div className="overflow-x-scroll pb-32">
      <table className="mt-4 rounded-t-lg min-w-full">
        <thead>
          <tr className="bg-blue-primary opacity-80 text-white border-b-2">
            <th className="px-4 py-2 text-left font-bold">HfH Staff Member</th>
            <th className="px-4 py-2 text-left font-bold">Number of Items</th>
            <th className="px-4 py-2 text-left font-bold">Date Created</th>
            <th className="px-4 py-2 text-left font-bold">Sign Off Date</th>
            <th className="px-4 py-2 text-left font-bold">Status</th>
          </tr>
        </thead>
        <tbody>
          {signOffs?.map((signOff, index) => (
            <React.Fragment key={index}>
              <tr
                data-odd={index % 2 !== 0}
                className={`bg-white data-[odd=true]:bg-gray-50 border-b transition-colors`}
              >
                <td className="px-4 py-2">{signOff.staffName}</td>
                <td className="px-4 py-2">{signOff.numberOfItems}</td>
                <td className="px-4 py-2">
                  {format(signOff.dateCreated, "M/d/yyyy")}
                </td>
                <td className="px-4 py-2">
                  {format(signOff.signOffDate, "M/d/yyyy")}
                </td>
                <td className="px-4 py-2">{signOff.status}</td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
