import { authMock } from "@/test/authMock";
import { UserType } from "@prisma/client";

// Helper util methods for testing

/**
 * Helper method for invalidating a session
 */
export async function invalidateSession() {
  authMock.mockReturnValueOnce(null);
}

/**
 * Helper method for validating a session
 * @param user Optional, default is { id: randomId, type: "ADMIN" }
 * @param expires Optional, default is a day from now
 * @returns A session object with the user and expires fields
 */
export async function validateSession(
  userType: UserType,
  expires: Date = new Date(Date.now() + 86400000),
) {
  const createdSession = {
    user: {
      id: "" + Math.floor(Math.random() * 10000),
      type: userType,
    },
    expires: expires.toISOString(),
  };
  authMock.mockReturnValueOnce(createdSession);
  return createdSession;
}
