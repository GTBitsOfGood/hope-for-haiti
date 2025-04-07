import { Fragment } from "react";
import FinalSignOffTable from "./FinalSignOffTable";

export default function FinalSignOff() {
  return (
    <Fragment>
      <h1 className="text-2xl font-semibold">Final Sign Off</h1>
      <p>
        Filling in the below information signififes that this item is ready to
        be sign offed on.
      </p>
      <div className="flex flex-col">
        <label className="block text-[#22070B] mb-1">Staff Member Name *</label>
        <input
          type="text"
          className="w-1/2 p-2 border bg-[#F9F9F9] text-[#22070B] rounded-[4px] mb-4"
          placeholder="Insert"
        />
        <label className="block text-[#22070B] mb-1">Parter Name *</label>
        <input
          type="text"
          className="w-1/2 p-2 border bg-[#F9F9F9] text-[#22070B] rounded-[4px] mb-4"
          placeholder="Insert"
        />
        <label className="block text-[#22070B] mb-1">Date *</label>
        <input
          type="text"
          className="w-1/2 p-2 border bg-[#F9F9F9] text-[#22070B] rounded-[4px] mb-4"
          placeholder="Insert"
        />
        <label className="block text-[#22070B] mb-1">Signature *</label>
        <input
          type="text"
          className="w-1/2 p-2 border bg-[#F9F9F9] text-[#22070B] rounded-[4px] mb-4"
          placeholder="Insert"
        />
      </div>
      <FinalSignOffTable />
    </Fragment>
  );
}
