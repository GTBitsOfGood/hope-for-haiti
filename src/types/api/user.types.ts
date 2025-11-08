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
}

export interface UpdateUserData {
  userId: number;
  name?: string;
  email?: string;
  type?: UserType;
  tag?: string;
  enabled?: boolean;
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

export type PermissionFlags = Record<typeof PERMISSION_FIELDS[number], boolean>;