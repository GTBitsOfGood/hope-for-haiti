import { db } from "@/db";
import { UserType } from "@prisma/client";
import { ArgumentError, NotFoundError, ConflictError } from "@/util/errors";
import * as argon2 from "argon2";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { v4 as uuidv4 } from "uuid";
import { EmailClient } from "@/email";
import {
  CreateUserFromInviteData,
  CreateUserInviteData,
  UpdateUserData,
} from "@/types/api/user.types";

export default class UserService {
  static async getUsers() {
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        type: true,
        name: true,
        tag: true,
        enabled: true,
      },
    });
    return users;
  }

  static async getPendingInvites() {
    const invites = await db.userInvite.findMany({
      select: {
        id: true,
        token: true,
        email: true,
        name: true,
        userType: true,
        expiration: true,
      },
      orderBy: {
        expiration: "desc",
      },
    });
    return invites;
  }

  static async getUserById(userId: number) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        type: true,
        name: true,
        tag: true,
        enabled: true,
      },
    });

    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }

    return user;
  }

  static async getUserByEmail(email: string) {
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        type: true,
        name: true,
        tag: true,
        enabled: true,
      },
    });

    return user;
  }

  static async getUserInviteByToken(token: string) {
    const invite = await db.userInvite.findUnique({
      where: { token },
      select: { email: true, name: true, expiration: true },
    });

    if (!invite || invite.expiration < new Date()) {
      throw new ArgumentError("Invalid invite token");
    }

    return invite;
  }

  static async getUserInvites() {
    const invites = await db.userInvite.findMany({
      select: {
        id: true,
        token: true,
        email: true,
        userType: true,
        name: true,
        expiration: true,
      },
    });
    return invites;
  }

  static async createUserInvite(data: CreateUserInviteData) {
    const token = uuidv4();
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 1);

    await db.$transaction(async (tx) => {
      await tx.userInvite.create({
        data: {
          email: data.email,
          name: data.name,
          token,
          expiration,
          userType: data.userType,
          partnerDetails: JSON.parse(data.partnerDetails || "{}"),
        },
      });

      const inviteUrl = `${data.origin}/register?token=${token}`;
      await EmailClient.sendUserInvite(data.email, { inviteUrl });
    });
  }

  static async deleteUserInvite(token: string) {
    try {
      await db.userInvite.delete({ where: { token } });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundError("Item not found");
        }
      }
      throw error;
    }
  }

  static async createUserFromInvite(data: CreateUserFromInviteData) {
    if (!data.inviteToken || data.inviteToken.trim().length === 0) {
      throw new ArgumentError("Invite token is required");
    }

    if (!data.password || data.password.trim().length === 0) {
      throw new ArgumentError("Password is required");
    }

    const userInvite = await db.userInvite.findUnique({
      where: { token: data.inviteToken },
    });

    if (!userInvite) {
      throw new NotFoundError("Invite does not exist");
    }

    if (userInvite.expiration < new Date()) {
      throw new ArgumentError("Invite has expired");
    }

    const passwordHash = await argon2.hash(data.password);

    try {
      await db.user.create({
        data: {
          name: userInvite.name,
          email: userInvite.email,
          passwordHash,
          type: userInvite.userType,
          enabled: true,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ConflictError("User already exists");
        }
      }
      throw error;
    }
  }

  static async updateUser(data: UpdateUserData) {
    if (!data.userId || data.userId <= 0) {
      throw new ArgumentError("Valid user ID is required");
    }

    const existingUser = await db.user.findUnique({
      where: { id: data.userId },
    });

    if (!existingUser) {
      throw new NotFoundError(`User with ID ${data.userId} not found`);
    }

    if (data.email && data.email.trim().length === 0) {
      throw new ArgumentError("Email cannot be empty");
    }

    if (data.name && data.name.trim().length === 0) {
      throw new ArgumentError("Name cannot be empty");
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.tag !== undefined) updateData.tag = data.tag;
    if (data.enabled !== undefined) updateData.enabled = data.enabled;

    try {
      await db.user.update({
        where: { id: data.userId },
        data: updateData,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ConflictError("Email already exists");
        }
        if (error.code === "P2025") {
          throw new NotFoundError(`User with ID ${data.userId} not found`);
        }
      }
      throw error;
    }
  }

  static async getDistinctUserTags(): Promise<string[]> {
    const results = await db.user.findMany({
      where: { tag: { not: null } },
      select: { tag: true },
      distinct: ["tag"],
    });

    return results.map((r) => r.tag as string);
  }

  static isAdmin(userType: UserType): boolean {
    return userType === UserType.ADMIN || userType === UserType.SUPER_ADMIN;
  }

  static isStaff(userType: UserType): boolean {
    return (
      userType === UserType.STAFF ||
      userType === UserType.ADMIN ||
      userType === UserType.SUPER_ADMIN
    );
  }

  static isSuperAdmin(userType: UserType): boolean {
    return userType === UserType.SUPER_ADMIN;
  }

  /**
   * @returns false if user is undefined or not a partner, true if user is a partner
   */
  static isPartner(user: { type: UserType } | undefined) {
    return user && user.type === UserType.PARTNER;
  }
}
