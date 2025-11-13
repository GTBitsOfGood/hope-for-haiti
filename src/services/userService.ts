import { db } from "@/db";
import { Prisma, UserType } from "@prisma/client";
import {
  ArgumentError,
  NotFoundError,
  ConflictError,
  AuthorizationError,
} from "@/util/errors";
import * as argon2 from "argon2";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { v4 as uuidv4 } from "uuid";
import { EmailClient } from "@/email";
import {
  CreateUserFromInviteData,
  CreateUserInviteData,
  EDITABLE_PERMISSION_FIELDS,
  PERMISSION_SELECT,
  PermissionName,
  PermissionFlags,
  UpdateUserData,
  EditablePermissionField,
} from "@/types/api/user.types";
import { validatePassword } from "@/util/util";
import { Filters } from "@/types/api/filter.types";
import { buildQueryWithPagination, buildWhereFromFilters } from "@/util/table";
import StreamIoService from "./streamIoService";
import { User } from "next-auth";
import { STAFF_PERMISSION_DEPENDENCIES } from "@/constants/staffPermissions";

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

function sanitizePermissionUpdate(
  permissions?: Partial<PermissionFlags>
): Partial<PermissionFlags> {
  if (!permissions) return {};

  return EDITABLE_PERMISSION_FIELDS.reduce((acc, field) => {
    const value = permissions[field];
    if (typeof value === "boolean") {
      acc[field] = value;
    }
    return acc;
  }, {} as Partial<PermissionFlags>);
}

export default class UserService {
  static async getUsers(filters?: Filters, page?: number, pageSize?: number) {
    const where = buildWhereFromFilters<Prisma.UserWhereInput>(
      Object.keys(Prisma.UserScalarFieldEnum),
      filters
    );

    const query: Prisma.UserFindManyArgs = {
      where,
      select: {
        id: true,
        email: true,
        type: true,
        name: true,
        tag: true,
        enabled: true,
        pending: true,
        partnerDetails: true,
        streamUserId: true,
        streamUserToken: true,
        invite: {
          select: {
            token: true,
            expiration: true,
          },
        },
      },
    };

    buildQueryWithPagination(query, page, pageSize);

    const [users, total] = await Promise.all([
      db.user.findMany(query),
      db.user.count({ where }),
    ]);

    return { users, total };
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
        streamUserId: true,
        streamUserToken: true,
        ...PERMISSION_SELECT,
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

  static async getUserInvites() {
    return db.userInvite.findMany({
      select: {
        token: true,
        expiration: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            type: true,
            enabled: true,
            pending: true,
          },
        },
      },
    });
  }

  static async createUserInvite(data: CreateUserInviteData) {
    const partnerDetails = parsePartnerDetails(data.partnerDetails);
    const expiration = inviteExpirationDate();
    const token = uuidv4();
    const permissionUpdate =
      data.userType === UserType.STAFF
        ? sanitizePermissionUpdate(data.permissions)
        : {};

    await db.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email: data.email },
        include: {
          invite: true,
        },
      });

      const sendInviteEmail = async (email: string, inviteToken: string) =>
        EmailClient.sendUserInvite(email, {
          token: inviteToken,
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
            pending: true,
            enabled: false,
            ...permissionUpdate,
          },
        });

        if (existingUser.invite) {
          await tx.userInvite.update({
            where: { userId: existingUser.id },
            data: {
              token,
              expiration,
            },
          });
        } else {
          await tx.userInvite.create({
            data: {
              userId: existingUser.id,
              token,
              expiration,
            },
          });
        }

        await sendInviteEmail(existingUser.email, token);
        return;
      }

      const placeholderPassword = await argon2.hash(uuidv4());

      const createdUser = await tx.user.create({
        data: {
          email: data.email,
          name: data.name,
          type: data.userType,
          tag: null,
          enabled: false,
          pending: true,
          passwordHash: placeholderPassword,
          partnerDetails: partnerDetails ?? undefined,
          ...permissionUpdate,
        },
      });

      await tx.userInvite.create({
        data: {
          userId: createdUser.id,
          token,
          expiration,
        },
      });

      await sendInviteEmail(createdUser.email, token);
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

    if (!validatePassword(data.password)) {
      throw new ArgumentError("Password does not match required format");
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
      const streamUser = await StreamIoService.createUser(invite.user);

      await tx.user.update({
        where: { id: invite.userId },
        data: {
          passwordHash,
          pending: false,
          enabled: true,
          streamUserId: streamUser.userId,
          streamUserToken: streamUser.userToken,
        },
      });

      await tx.userInvite.delete({ where: { token: invite.token } });
    });
  }

  static async sendInviteReminder(id: number) {
    const user = await db.user.findUnique({
      where: { id },
      include: {
        invite: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User does not exist");
    }
    if (!user.pending) {
      throw new ConflictError("User does not have a pending invite");
    }

    const expiration = inviteExpirationDate();
    const token = uuidv4();

    await db.userInvite.update({
      where: { userId: user.id },
      data: {
        token,
        expiration,
      },
    });

    await EmailClient.sendUserInviteReminder(user.email, {
      userRole: user.type,
      token: token,
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

    if (data.enabled === false && (existingUser.userWrite || existingUser.isSuper)) {
      throw new AuthorizationError("Cannot deactivate users with userWrite or isSuper permissions");
    }

    if (data.permissions) {
      const finalPermissions = {
          ...existingUser,
          ...data.permissions
      }

      for (const [field, value] of Object.entries(finalPermissions)) {
        if (value && STAFF_PERMISSION_DEPENDENCIES[field as EditablePermissionField]) {
          const deps = STAFF_PERMISSION_DEPENDENCIES[field as EditablePermissionField];
          const missingDeps = deps.filter(dep => !finalPermissions[dep]);
          if (missingDeps.length > 0) {
            throw new ArgumentError(`Cannot enable ${field} without enabling dependencies: ${missingDeps.join(', ')}`);
          }
        }
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.tag !== undefined) updateData.tag = data.tag;
    if (data.enabled !== undefined) updateData.enabled = data.enabled;
    if (data.permissions) {
      if (existingUser.type !== UserType.STAFF) {
        throw new ArgumentError("Cannot update permissions for non-staff user");
      }

      const permissionUpdate = sanitizePermissionUpdate(data.permissions);
      Object.assign(updateData, permissionUpdate);
    }

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

  static async getPartnerLocations() {
    const partners = await db.user.findMany({
      where: {
        type: UserType.PARTNER,
        AND: [
          {
            partnerDetails: {
              path: ["latitude"],
              not: Prisma.DbNull,
            },
          },
          {
            partnerDetails: {
              path: ["longitude"],
              not: Prisma.DbNull,
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        partnerDetails: true,
      },
    });

    return partners.map((partner) => ({
      id: partner.id,
      name: partner.name,
      latitude: (partner.partnerDetails as Prisma.JsonObject).latitude,
      longitude: (partner.partnerDetails as Prisma.JsonObject).longitude,
    }));
  }

  static async countPartners(excludePartnerTags?: string[]) {
    const whereClause: Prisma.UserWhereInput = { type: UserType.PARTNER };

    if (excludePartnerTags && excludePartnerTags.length > 0) {
      whereClause.tag = { notIn: excludePartnerTags };
    }

    return db.user.count({
      where: whereClause,
    });
  }

  static isStaff(user: User) {
    return user.type === UserType.STAFF;
  }
  
  static checkStaff(user: User) {
    if (!UserService.isStaff(user)) {
      throw new AuthorizationError("Must be STAFF to access this route");
    }
  }

  static isPartner(user: User) {
    return user.type === UserType.PARTNER;
  }

  static hasPermission(user: User, permission: PermissionName) {
    if (!user) return false;
    return user.isSuper || user[permission];
  }

  static checkAnyPermission(user: User, permissions: PermissionName[]) {
    return permissions.some(permission => UserService.hasPermission(user, permission));
  }

  static checkPermission(user: User, permission: PermissionName) {
    if (!UserService.hasPermission(user, permission)) {
      throw new AuthorizationError(
        `Must have ${permission} permission to access this route`
      );
    }
  }
}
