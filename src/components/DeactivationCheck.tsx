"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function DeactivationCheck() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const checkingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Skip if still loading or already checking
    if (status === "loading" || checkingRef.current) return;

    // Skip check for public paths (no auth required)
    const publicPaths = [
      "/signIn",
      "/signup",
      "/register",
      "/deactivated",
    ];
    
    const isResetPasswordPath = pathname?.startsWith("/reset-password");
    const isPublicPath = publicPaths.some((path) => pathname === path);
    
    if (isPublicPath || isResetPasswordPath) return;

    // If user is authenticated, check their enabled status from the database
    if (session?.user) {
      checkingRef.current = true;
      
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      const currentPathname = pathname; // Capture pathname for closure
      
      // Fetch fresh enabled status from database
      fetch("/api/auth/check-enabled", {
        signal: abortControllerRef.current.signal,
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          checkingRef.current = false;
          const isEnabled = data.enabled !== false;
          
          // Check if user is deactivated - use captured pathname to avoid race condition
          if (!isEnabled) {
            if (currentPathname !== "/deactivated") {
              router.push("/deactivated");
            }
          } else {
            // Prevent enabled users from accessing /deactivated
            if (currentPathname === "/deactivated") {
              router.push("/");
            }
          }
        })
        .catch((error) => {
          // Don't reset checkingRef if request was aborted (new one started)
          if (error.name !== 'AbortError') {
            checkingRef.current = false;
            
            // On error, be STRICT - redirect to deactivated page for safety
            // This prevents deactivated users from accessing routes when DB fails
            console.error("Failed to check enabled status, redirecting to deactivated for safety:", error);
            if (currentPathname !== "/deactivated") {
              router.push("/deactivated");
            }
          }
        });
    }

    // Cleanup function to abort in-flight requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [pathname, session, status, router]);

  return null;
}
