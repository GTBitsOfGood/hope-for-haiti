import { db } from "@/db";
import { UserType } from "@prisma/client";
import {
  ArgumentError,
  NotFoundError,
  ConflictError,
} from "@/util/errors";
import * as argon2 from "argon2";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { v4 as uuidv4 } from "uuid";
import { EmailClient } from "@/email";
import {
  CreateUserFromInviteData,
  CreateUserInviteData,
  UpdateUserData,
} from "@/types/api/user.types";

function parsePartnerDetails(raw?: string) {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    throw new ArgumentError("Invalid partner details payload");
  }
}

function inviteExpirationDate() {
  const expiration = new Date();
  expiration.setDate(expiration.getDate() + 1);
  return expiration;
}

export default class UserService {
  static async getUsers() {
    return db.user.findMany({
      select: {
        id: true,
        email: true,
        type: true,
        name: true,
        tag: true,
        enabled: true,
        pending: true,
        partnerDetails: true,
        invite: {
          select: {
            token: true,
            expiration: true,
          },
        },
      },
    });
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
        pending: true,
        partnerDetails: true,
        invite: {
          select: {
            token: true,
            expiration: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }

    return user;
  }

  static async getUserByEmail(email: string) {
    return db.user.findUnique({
      where: { email },
      include: {
        invite: true,
      },
    });
  }

  static async getUserInviteByToken(token: string) {
    const invite = await db.userInvite.findUnique({
      where: { token },
      include: {
        user: true,
      },
    });

    if (!invite || invite.expiration < new Date() || !invite.user.pending) {
      throw new ArgumentError("Invalid invite token");
    }

    return {
      email: invite.user.email,
      name: invite.user.name,
      expiration: invite.expiration,
      userId: invite.userId,
    };
  }

  static async createUserInvite(data: CreateUserInviteData) {
    const partnerDetails = parsePartnerDetails(data.partnerDetails);
    const expiration = inviteExpirationDate();
    const newToken = uuidv4();

    await db.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email: data.email },
        include: {
          invite: true,
        },
      });

      const sendInviteEmail = async (email: string, token: string) =>
        EmailClient.sendUserInvite(email, {
          token,
          userRole: data.userType,
        });

      if (existingUser) {
        if (!existingUser.pending) {
          throw new ConflictError("Email already registered");
        }

        await tx.user.update({
          where: { id: existingUser.id },
          data: {
            name: data.name,
            type: data.userType,
            partnerDetails: partnerDetails ?? undefined,
          },
        });

        if (existingUser.invite) {
          await tx.userInvite.update({
            where: { userId: existingUser.id },
            data: {
              token: newToken,
              expiration,
            },
          });
        } else {
          await tx.userInvite.create({
            data: {
              userId: existingUser.id,
              token: newToken,
              expiration,
            },
          });
        }

        await sendInviteEmail(existingUser.email, newToken);
        return;
      }

      const placeholderPassword = await argon2.hash(uuidv4());

      const createdUser = await tx.user.create({
        data: {
          email: data.email,
          name: data.name,
          type: data.userType,
          tag: null,
          enabled: true,
          pending: true,
          passwordHash: placeholderPassword,
          partnerDetails: partnerDetails ?? undefined,
        },
      });

      await tx.userInvite.create({
        data: {
          userId: createdUser.id,
          token: newToken,
          expiration,
        },
      });

      await sendInviteEmail(createdUser.email, newToken);
    });
  }

  static async deleteUserInvite(token: string) {
    const invite = await db.userInvite.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!invite) {
      throw new NotFoundError("Invite not found");
    }

    await db.$transaction(async (tx) => {
      await tx.userInvite.delete({ where: { token } });

      if (invite.user.pending) {
        await tx.user.delete({ where: { id: invite.userId } });
      }
    });
  }

  static async createUserFromInvite(data: CreateUserFromInviteData) {
    if (!data.inviteToken || data.inviteToken.trim().length === 0) {
      throw new ArgumentError("Invite token is required");
    }

    if (!data.password || data.password.trim().length === 0) {
      throw new ArgumentError("Password is required");
    }

    const invite = await db.userInvite.findUnique({
      where: { token: data.inviteToken },
      include: { user: true },
    });

    if (!invite) {
      throw new NotFoundError("Invite does not exist");
    }

    if (invite.expiration < new Date()) {
      throw new ArgumentError("Invite has expired");
    }

    if (!invite.user.pending) {
      throw new ConflictError("Invite already used");
    }

    const passwordHash = await argon2.hash(data.password);

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: invite.userId },
        data: {
          passwordHash,
          pending: false,
          enabled: true,
        },
      });

      await tx.userInvite.delete({ where: { token: invite.token } });
    });
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

  static getPendingUsers() {
    return db.user.findMany({
      where: { pending: true },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        invite: {
          select: {
            token: true,
            expiration: true,
          },
        },
      },
    });
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
