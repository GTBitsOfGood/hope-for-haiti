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
