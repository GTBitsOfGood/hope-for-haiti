import { shippingStatusToText } from "@/util/util";
import { $Enums } from "@prisma/client";
import OptionsTag from "./OptionsTag";

export default function ShippingStatusTag({
  status,
}: {
  status: $Enums.ShipmentStatus;
}) {
  const defaultClassName = "bg-blue-primary/20 text-blue-primary";

  const styleMap = new Map([
    ...Object.keys(shippingStatusToText).map(
      (key) =>
        [
          key,
          {
            text: shippingStatusToText[key as $Enums.ShipmentStatus],
            className: defaultClassName,
          },
        ] as [string, { text: string; className: string }]
    ),
    [
      $Enums.ShipmentStatus.WAITING_ARRIVAL_FROM_DONOR,
      {
        text: shippingStatusToText[
          $Enums.ShipmentStatus.WAITING_ARRIVAL_FROM_DONOR
        ],
        className: "bg-yellow-primary text-orange-primary",
      },
    ],
    [
      $Enums.ShipmentStatus.READY_FOR_DISTRIBUTION,
      {
        text: shippingStatusToText[
          $Enums.ShipmentStatus.READY_FOR_DISTRIBUTION
        ],
        className: "bg-green-primary text-green-dark",
      },
    ],
  ]);

  return <OptionsTag value={status} styleMap={styleMap} />;
}
