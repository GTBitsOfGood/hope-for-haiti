import { $Enums } from "@prisma/client";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Takes a date string, validates it, and parses it into a Date object.
 * @params dateString: the date string to parse
 * @returns undefined if the date string is undefined/null
 * @returns null if the date string is defined but invalid
 * @returns a Date object if the date string is valid
 */
export function parseDateIfDefined(
  dateString: string | null
): Date | null | undefined {
  // see https://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript
  if (!dateString) {
    return undefined;
  }
  const date = new Date(dateString);
  if (
    Object.prototype.toString.call(date) === "[object Date]" &&
    !isNaN(date.getTime())
  ) {
    return new Date(dateString);
  }
  return null;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function validatePassword(pw: string) {
  const regex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
  return regex.test(pw);
}

export const shippingStatusToText = {
  [$Enums.ShipmentStatus.WAITING_ARRIVAL_FROM_DONOR]:
    "Awaiting Arrival from Donor",
  [$Enums.ShipmentStatus.READY_FOR_DISTRIBUTION]: "Ready for Distribution",
  [$Enums.ShipmentStatus.ARRIVED_AT_DEPO]: "Arrived at Depot",
  [$Enums.ShipmentStatus.ARRIVED_IN_HAITI]: "Arrived in Haiti",
  [$Enums.ShipmentStatus.CLEARED_CUSTOMS]: "Cleared Customs",
  [$Enums.ShipmentStatus.INVENTORIES]: "Inventories",
  [$Enums.ShipmentStatus.LOAD_ON_SHIP_AIR]: "Load on Ship/Air",
};

export function titleCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
