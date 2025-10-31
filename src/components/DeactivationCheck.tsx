"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function DeactivationCheck() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const checkingRef = useRef(false);

  useEffect(() => {
    // Skip if still loading or already checking
    if (status === "loading" || checkingRef.current) return;

    // Skip check for public paths (no auth required)
    const publicPaths = [
      "/signIn",
      "/signup",
      "/register",
    ];
    
    const isResetPasswordPath = pathname?.startsWith("/reset-password");
    const isPublicPath = publicPaths.some((path) => pathname === path);
    
    if (isPublicPath || isResetPasswordPath) return;

    // If user is authenticated, check their enabled status from the database
    if (session?.user) {
      checkingRef.current = true;
      
      // Fetch fresh enabled status from database
      fetch("/api/auth/check-enabled")
        .then((res) => res.json())
        .then((data) => {
          checkingRef.current = false;
          const isEnabled = data.enabled !== false;
          
          // Check if user is deactivated
          if (!isEnabled) {
            if (pathname !== "/deactivated") {
              router.push("/deactivated");
            }
          } else {
            // Prevent enabled users from accessing /deactivated
            if (pathname === "/deactivated") {
              router.push("/");
            }
          }
        })
        .catch(() => {
          checkingRef.current = false;
          // If fetch fails, fall back to session data
          const isEnabled = session.user.enabled !== false;
          
          if (!isEnabled && pathname !== "/deactivated") {
            router.push("/deactivated");
          } else if (isEnabled && pathname === "/deactivated") {
            router.push("/");
          }
        });
    }
  }, [pathname, session, status, router]);

  return null;
}
