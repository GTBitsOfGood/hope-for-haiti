"use client";

import { ShipmentStatus } from "@prisma/client";
import React from "react";

interface ShipmentStatusLabelProps {
  shipmentStatus: ShipmentStatus;
}

const statusClasses = {
  [ShipmentStatus.ARRIVED_AT_DEPO]: "bg-[#c7ead8] bg-opacity-50",
  [ShipmentStatus.ARRIVED_IN_HAITI]: "bg-[#ecb70b] bg-opacity-20",
  [ShipmentStatus.CLEARED_CUSTOMS]: "bg-[#829d20] bg-opacity-20",
  [ShipmentStatus.INVENTORIES]: "bg-[#2774ae] bg-opacity-20",
  [ShipmentStatus.LOAD_ON_SHIP_AIR]: "bg-[#ec520b] bg-opacity-20",
  [ShipmentStatus.READY_FOR_DISTRIBUTION]:
    "bg-[#0a7b40] bg-opacity-80 text-white",
  [ShipmentStatus.WAITING_ARRIVAL_FROM_DONOR]: "bg-[#cd1ec7] bg-opacity-20",
};

const statusText = {
  [ShipmentStatus.ARRIVED_AT_DEPO]: "Arrived at Depo",
  [ShipmentStatus.ARRIVED_IN_HAITI]: "Arrived in Haiti",
  [ShipmentStatus.CLEARED_CUSTOMS]: "Cleared customs",
  [ShipmentStatus.INVENTORIES]: "Inventories",
  [ShipmentStatus.LOAD_ON_SHIP_AIR]: "Load on ship/air",
  [ShipmentStatus.READY_FOR_DISTRIBUTION]: "Ready for Distribution",
  [ShipmentStatus.WAITING_ARRIVAL_FROM_DONOR]: "Waiting arrival from donor",
};

export default function ShipmentStatusLabel({
  shipmentStatus,
}: ShipmentStatusLabelProps) {
  return (
    <span
      className={`inline-block rounded-md text-xs px-2 py-1 whitespace-nowrap ${statusClasses[shipmentStatus]}`}
    >
      {statusText[shipmentStatus]}
    </span>
  );
}
