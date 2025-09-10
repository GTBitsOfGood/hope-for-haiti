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

export interface UserInviteData {
  email: string;
  name: string;
  expiration: Date;
}

export interface UpdateUserData {
  userId: number;
  name?: string;
  email?: string;
  type?: UserType;
  tag?: string;
  enabled?: boolean;
}
