import { UserType } from "@prisma/client";
import {
  PermissionFlags,
  PermissionName,
} from "@/types/api/user.types";

type PermissionedUser =
  | (Partial<PermissionFlags> & { type?: UserType })
  | null
  | undefined;

export function hasPermission(
  user: PermissionedUser,
  permission: PermissionName
): boolean {
  if (!user) return false;
  return Boolean(user.isSuper || user[permission]);
}

export function hasAnyPermission(
  user: PermissionedUser,
  permissions: PermissionName[]
): boolean {
  return permissions.some((permission) => hasPermission(user, permission));
}

export function isPartner(type?: UserType): boolean {
  return type === UserType.PARTNER;
}

export function isStaff(type?: UserType): boolean {
  return type === UserType.STAFF;
}

export function formatUserType(type: UserType): string {
  return type
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
