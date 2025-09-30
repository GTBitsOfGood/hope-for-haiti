import { db } from "@/db";
import { NotFoundError, ArgumentError } from "@/util/errors";
import { v4 as uuidv4 } from "uuid";
import * as argon2 from "argon2";
import { EmailClient } from "@/email";

export interface CreatePasswordResetTokenData {
  email: string;
}

export interface ChangePasswordData {
  token: string;
  password: string;
}

export default class PasswordResetService {
  static async createPasswordResetToken(data: CreatePasswordResetTokenData) {
    if (!data.email || data.email.trim().length === 0) {
      throw new ArgumentError("Email is required");
    }

    const user = await db.user.findUnique({
      where: { email: data.email.trim().toLowerCase() },
    });

    if (!user) {
      throw new NotFoundError("User with this email does not exist");
    }

    await db.passwordResetToken.updateMany({
      where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },
      data: { used: true },
    });

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes

    await db.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt, used: false },
    });

    await EmailClient.sendPasswordReset(user.email, { token });

    return { success: true };
  }

  static async verifyPasswordResetToken(token: string) {
    if (!token || token.trim().length === 0) {
      throw new ArgumentError("Token is required");
    }

    const resetToken = await db.passwordResetToken.findUnique({
      where: { token: token.trim() },
    });

    if (!resetToken) {
      return { verified: false };
    }

    if (resetToken.used || resetToken.expiresAt < new Date()) {
      return { verified: false };
    }

    return { verified: true };
  }

  static async changePassword(data: ChangePasswordData) {
    if (!data.token || data.token.trim().length === 0) {
      throw new ArgumentError("Token is required");
    }

    if (!data.password || data.password.trim().length === 0) {
      throw new ArgumentError("Password is required");
    }

    const resetToken = await db.passwordResetToken.findUnique({
      where: { token: data.token.trim() },
    });

    if (!resetToken) {
      throw new NotFoundError("Invalid reset token");
    }

    if (resetToken.used || resetToken.expiresAt < new Date()) {
      throw new ArgumentError(
        "Reset token has expired or has already been used"
      );
    }

    const passwordHash = await argon2.hash(data.password);

    await db.$transaction([
      db.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return { success: true };
  }
}
