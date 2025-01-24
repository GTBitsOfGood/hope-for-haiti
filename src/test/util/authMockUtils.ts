import { authMock } from "@/test/authMock";

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
   * @param expires Optional, default is ""
   */
  export async function validateSession(user: any = { id: "1234", type: "ADMIN" }, expires: string = "") {
    authMock.mockReturnValueOnce({
      user: {
          id: user.id,
          type: user.type,
      },
      expires: expires,
    });
  }