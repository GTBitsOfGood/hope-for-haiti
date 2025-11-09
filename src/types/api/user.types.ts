import { UserType } from "@prisma/client";

export interface CreateUserFromInviteData {
  inviteToken: string;
  password: string;
}

export interface CreateUserInviteData {
  email: string;
  name: string;
  userType: UserType;
  partnerDetails?: string;
  origin: string;
  permissions?: Partial<PermissionFlags>;
}

export interface UpdateUserData {
  userId: number;
  name?: string;
  email?: string;
  type?: UserType;
  tag?: string;
  enabled?: boolean;
  permissions?: Partial<PermissionFlags>;
}

export const PERMISSION_FIELDS = [
  "isSuper",
  "userRead",
  "userWrite",
  "itemNotify",
  "offerWrite",
  "requestRead",
  "requestWrite",
  "allocationRead",
  "allocationWrite",
  "archivedRead",
  "distributionRead",
  "distributionWrite",
  "shipmentRead",
  "shipmentWrite",
  "signoffWrite",
  "wishlistRead",
  "supportRead",
  "supportWrite",
  "supportNotify",
] as const;

export type PermissionName = typeof PERMISSION_FIELDS[number];
export type PermissionFlags = Record<PermissionName, boolean>;
export type EditablePermissionField = Exclude<PermissionName, "isSuper">;
export const EDITABLE_PERMISSION_FIELDS: EditablePermissionField[] =
  PERMISSION_FIELDS.filter(
    (field): field is EditablePermissionField => field !== "isSuper"
  );
export type StaffPermissionFlags = Pick<PermissionFlags, EditablePermissionField>;
export const PERMISSION_SELECT: Record<PermissionName, true> =
  PERMISSION_FIELDS.reduce(
    (acc, field) => {
      acc[field] = true;
      return acc;
    },
    {} as Record<PermissionName, true>
  );
