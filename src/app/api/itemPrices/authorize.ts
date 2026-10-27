import type { User } from "next-auth";
import UserService from "@/services/userService";
import { AuthenticationError } from "@/util/errors";

export function authorizeItemPriceUser(
  user: User | null | undefined
): number {
  if (!user) throw new AuthenticationError("Session required");
  UserService.checkStaff(user);
  UserService.checkPermission(user, "offerWrite");
  const id = Number(user.id);
  if (
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    id > 2_147_483_647
  ) {
    throw new AuthenticationError("Invalid user session");
  }
  return id;
}
