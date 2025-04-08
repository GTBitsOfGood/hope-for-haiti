import { Fragment, useEffect } from "react";
import {
  DistributionRecord,
  DistributionRecordWithActualQuantity,
} from "@/types";
import { X } from "@phosphor-icons/react";
import toast from "react-hot-toast";

export default function ConfirmQuantity({
  selectedDistributions,
  removeFromSelectedDistributions,
  setActualQuantity,
}: {
  selectedDistributions: DistributionRecordWithActualQuantity[];
  removeFromSelectedDistributions: (allocId: DistributionRecord) => void;
  setActualQuantity: (i: number, value: number) => void;
}) {
  useEffect(() => {
    if (selectedDistributions.length === 0) {
      toast.error("Please return to item selection");
    }
  }, [selectedDistributions]);

  return (
    <Fragment>
      <h1 className="text-2xl font-semibold">Confirm Quantity</h1>
      <p>
        Ensure that the quantity that needs to be allocated for each select item
        is correct. It is prefilled with the original allocated quantity, but if
        changes need to be made, ensure you make those changes. Be careful not
        to exceed the quantity available.
      </p>

      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Items</h2>
        {selectedDistributions.map((distribution, index) => {
          return (
            <div
              key={index}
              className="flex bg-blue-50 py-3 px-4 gap-2 border-blue-500 border-[1px] rounded-md items-center justify-between"
            >
              <div className="flex flex-col">
                <p>{distribution.title}</p>
                <div className="flex gap-4">
                  <div>
                    <label className="block text-[#22070B] mb-1">
                      Quantity Allocated *
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border bg-[#F9F9F9] text-[#22070B] rounded-[4px]"
                      value={
                        distribution.actualQuantity !== undefined
                          ? distribution.actualQuantity
                          : distribution.quantityAllocated
                      }
                      onChange={(e) =>
                        setActualQuantity(
                          index,
                          parseInt(e.currentTarget.value),
                        )
                      }
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-[#22070B] mb-1">
                      Unit Type
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border bg-transparent text-[#22070B] rounded-[4px]"
                      placeholder="Insert"
                      disabled
                      value={distribution.unitType}
                    />
                  </div>
                </div>
              </div>
              <X
                className="text-red-500 cursor-pointer"
                size={24}
                onClick={() => removeFromSelectedDistributions(distribution)}
              />
            </div>
          );
        })}
      </div>
    </Fragment>
  );
}
