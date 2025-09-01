import { UserType } from "@prisma/client";

export function isStaff(userType: UserType): boolean {
  return (
    userType === UserType.STAFF ||
    userType === UserType.ADMIN ||
    userType === UserType.SUPER_ADMIN
  );
}

export function isAdmin(userType: UserType): boolean {
  return (
    userType === UserType.ADMIN ||
    userType === UserType.SUPER_ADMIN
  );
}

export function isSuperAdmin(userType: UserType): boolean {
  return userType === UserType.SUPER_ADMIN;
}

export function isPartner(userType: UserType): boolean {
  return userType === UserType.PARTNER;
}

export function formatUserType(type: UserType): string {
  return type
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
