import { UserType } from "@prisma/client";
import { PermissionFlags, PermissionName } from "@/types/api/user.types";

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

export function getTagOrder(
  a: string | undefined,
  b: string | undefined
): number {
  const aTag = a || "";
  const bTag = b || "";
  return aTag.localeCompare(bTag);
}

type SelectUser = {
  id: number;
  name: string;
  tag?: string;
};

/**
 * React-select doesn't export this for some reason
 */
type Option<T> = {
  label: string;
  value: T;
};

export function groupUsersByTagForSelect(users: SelectUser[]): {
  label: string;
  options: Option<SelectUser>[];
}[] {
  const grouped: Record<
    string,
    {
      label: string;
      options: Option<SelectUser>[];
    }
  > = {};

  users.forEach((user) => {
    const tag = user.tag || "Untagged";
    if (!grouped[tag]) {
      grouped[tag] = { label: tag, options: [] };
    }
    grouped[tag].options.push({
      label: user.name,
      value: user,
    });
  });

  return Object.values(grouped).sort((a, b) => {
    const aTag = a.label || "";
    const bTag = b.label || "";
    return aTag.localeCompare(bTag);
  });
}
