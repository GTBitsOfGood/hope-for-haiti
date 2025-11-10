import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPaths = [
  "/signIn",
  "/signup",
  "/register",
  "/deactivated",
  "/reset-password",
];

const publicApiPaths = [
  "/api/users",
];

function isPublicPath(pathname: string) {
  return publicPaths.some((p) => pathname.startsWith(p));
}

function isPublicApiPath(pathname: string) {
  return publicApiPaths.some((p) => pathname === p);
}

function isApiRoute(pathname: string) {
  return pathname.startsWith("/api");
}

export default async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

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

  const forwardedProto = req.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ?? req.nextUrl.protocol;
  const isSecureCookie = protocol === "https"; // Netlify terminates TLS before middleware, so sniff proto manually

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: isSecureCookie,
  });

  if (!token) {
    if (isApiRoute(pathname)) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const url = new URL("/signIn", origin);
    return NextResponse.redirect(url);
  }

  const isEnabled = token?.enabled !== false;

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

  if (isEnabled && pathname === "/deactivated") {
    const url = new URL("/", origin);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
