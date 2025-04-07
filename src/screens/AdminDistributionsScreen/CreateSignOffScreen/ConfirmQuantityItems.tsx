import { X } from "@phosphor-icons/react";

export default function ConfirmQuantityItems() {
  const test = [
    {
      itemName: "Item Name",
      quantityAllocated: 1,
      unitType: "Bottles",
    },
  ];
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-semibold">Items</h2>
      {test.map((item, index) => {
        return (
          <div
            key={index}
            className="flex bg-blue-50 py-3 px-4 gap-2 border-blue-500 border-[1px] rounded-md items-center justify-between"
          >
            <div className="flex flex-col">
              <p>{item.itemName}</p>
              <div className="flex gap-4">
                <div>
                  <label className="block text-[#22070B] mb-1">
                    Quantity Allocated *
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border bg-[#F9F9F9] text-[#22070B] rounded-[4px]"
                    placeholder="Insert"
                  />
                </div>
                <div>
                  <label className="block text-[#22070B] mb-1">Unit Type</label>
                  <input
                    type="text"
                    className="w-full p-2 border bg-[#F9F9F9] text-[#22070B] rounded-[4px]"
                    placeholder="Insert"
                  />
                </div>
              </div>
            </div>
            <X className="text-red-500 cursor-pointer" size={24} />
          </div>
        );
      })}
    </div>
  );
}
