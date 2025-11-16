import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import authConfig from "@/auth/auth.config";

const { auth } = NextAuth(authConfig);

const publicPaths = [
  "/signIn",
  "/signup",
  "/register",
  "/deactivated",
  "/pending",
  "/reset-password",
];

const publicApiPaths = ["/api/users"];

function isPublicPath(pathname: string) {
  return publicPaths.some((p) => pathname.startsWith(p));
}

function isPublicApiPath(pathname: string) {
  return publicApiPaths.some((p) => pathname === p);
}

function isApiRoute(pathname: string) {
  return pathname.startsWith("/api");
}

export default auth(async function middleware(req) {
  const pathname = req.nextUrl.pathname;
  const origin = req.nextUrl.origin;

  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    /\.[^/]+$/.test(pathname);
  if (isStaticAsset) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (isPublicApiPath(pathname)) {
    return NextResponse.next();
  }

  const session = req.auth;

  if (!session) {
    if (isApiRoute(pathname)) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const url = new URL("/signIn", origin);
    return NextResponse.redirect(url);
  }

  const isEnabled = session.user.enabled !== false;
  const isPending = session.user.pending === true;

  if (isPending) {
    if (isApiRoute(pathname)) {
      return NextResponse.json(
        { error: "Account pending activation" },
        { status: 403 }
      );
    }
    if (pathname !== "/pending") {
      const url = new URL("/pending", origin);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!isEnabled) {
    if (isApiRoute(pathname)) {
      return NextResponse.json(
        { error: "Account deactivated" },
        { status: 403 }
      );
    }
    if (pathname !== "/deactivated") {
      const url = new URL("/deactivated", origin);
      return NextResponse.redirect(url);
    }
  }

  if (isEnabled && !isPending) {
    if (pathname === "/deactivated" || pathname === "/pending") {
      const url = new URL("/", origin);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
