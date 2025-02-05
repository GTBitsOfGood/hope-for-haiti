import { authMock } from "@/test/authMock";
import { UserType } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

// Helper util methods for testing

/**
 * Helper method for invalidating a session
 */
export async function invalidateSession() {
  authMock.mockReturnValueOnce(null);
}

/**
 * Helper method for validating a session
 * @param user Optional, default is { id: "1234", type: "ADMIN" }
 * @param expires Optional, default is a day from now
 * @returns A session object with the user and expires fields
 */
export async function validateSession(
  userType: UserType,
  expires: Date = new Date(Date.now() + 86400000)
) {
  const createdSession = {
    user: {
      id: uuidv4(),
      type: userType,
    },
    expires: expires.toISOString(),
  };
  authMock.mockReturnValueOnce(createdSession);
  return createdSession;
}
