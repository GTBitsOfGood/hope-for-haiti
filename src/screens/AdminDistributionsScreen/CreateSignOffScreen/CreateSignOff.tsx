import { MagnifyingGlass } from "@phosphor-icons/react";
import { Fragment, useState } from "react";
import CreateSignOffTable from "./CreateSignOffTable";

export default function CreateSignOff() {
  const [search, setSearch] = useState("");
  return (
    <Fragment>
      <h1 className="text-2xl font-semibold">Create Sign Off</h1>
      <p>Select the items that you want to sign off on.</p>
      <div className="relative w-1/3">
        <MagnifyingGlass
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          size={18}
        />
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:border-gray-400"
        />
      </div>
      <CreateSignOffTable />
    </Fragment>
  );
}
