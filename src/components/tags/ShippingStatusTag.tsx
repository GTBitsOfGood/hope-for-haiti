import { shippingStatusToText } from "@/util/util";
import { $Enums } from "@prisma/client";

export default function ShippingStatusTag({
  status,
}: {
  status: $Enums.ShipmentStatus;
}) {
  const text = shippingStatusToText[status];
  let className = "bg-blue-primary/20 text-blue-primary";

  switch (status) {
    case $Enums.ShipmentStatus.WAITING_ARRIVAL_FROM_DONOR:
      className = "bg-yellow-primary text-orange-primary";
      break;
    case $Enums.ShipmentStatus.READY_FOR_DISTRIBUTION:
      className = "bg-green-primary text-green-dark";
      break;
  }

  return (
    <span className={`rounded px-3 py-1 text-sm font-semibold ${className}`}>
      {text}
    </span>
  );
}
