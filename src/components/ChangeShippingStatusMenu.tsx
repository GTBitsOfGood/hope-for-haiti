import { useApiClient } from "@/hooks/useApiClient";
import { Shipment } from "@/types/api/shippingStatus.types";
import { shippingStatusToText } from "@/util/util";
import { ArrowLeft } from "@phosphor-icons/react";
import { $Enums } from "@prisma/client";
import toast from "react-hot-toast";
import ConfiguredSelect from "./ConfiguredSelect";

export default function ChangeShippingStatusMenu({
  shipment,
  fetchTableData,
  back,
}: {
  shipment: Shipment;
  fetchTableData: () => void;
  back: () => void;
}) {
  const { apiClient } = useApiClient();

  async function onChangeStatus(newStatus: $Enums.ShipmentStatus | undefined) {
    if (!newStatus || newStatus === shipment.value) return;

    const url = new URLSearchParams({
      id: shipment.id.toString(),
    });

    const promise = apiClient.patch(`/api/shipments?${url}`, {
      body: JSON.stringify({ status: newStatus }),
    });

    toast.promise(promise, {
      loading: "Updating status...",
      success: "Status updated",
      error: "Error updating status",
    });

    await promise;
    fetchTableData();
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            back();
          }}
          className="p-1 rounded hover:bg-gray-100"
        >
          <ArrowLeft size={16} />
        </button>
        <p className="font-bold">Change Status</p>
      </div>
      <ConfiguredSelect
        value={{
          value: shipment.value,
          label: shippingStatusToText[shipment.value],
        }}
        onChange={(newVal) => onChangeStatus(newVal?.value)}
        options={Object.values($Enums.ShipmentStatus).map((status) => ({
          value: status,
          label: shippingStatusToText[status],
        }))}
        placeholder="Select status"
      />
    </>
  );
}
