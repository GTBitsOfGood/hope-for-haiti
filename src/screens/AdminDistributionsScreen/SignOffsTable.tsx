import { SignOff } from "@/app/api/distributions/types";
import { format } from "date-fns";
import React from "react";

export default function SignOffsTable() {
  const test: SignOff[] = [
    {
      partnerName: "test",
      partnerId: 1,
      staffMemberName: "Peyton",
      date: new Date(),
      signatureUrl: "",
    },
    {
      partnerName: "test",
      partnerId: 2,
      staffMemberName: "Liane",
      date: new Date(),
      signatureUrl: "",
    },
    {
      partnerName: "test",
      partnerId: 3,
      staffMemberName: "Kavin",
      date: new Date(),
      signatureUrl: "",
    },
  ];
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
          {test.map((signOff, index) => (
            <React.Fragment key={index}>
              <tr
                data-odd={index % 2 !== 0}
                className={`bg-white data-[odd=true]:bg-gray-50 border-b transition-colors`}
              >
                <td className="px-4 py-2">{signOff.staffMemberName}</td>
                <td className="px-4 py-2">-</td>
                <td className="px-4 py-2">
                  {format(signOff.date, "M/d/yyyy")}
                </td>
                <td className="px-4 py-2">
                  {format(signOff.date, "M/d/yyyy")}
                </td>
                <td className="px-4 py-2">Status</td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
