"use client";

import NavBarLayout from "@/components/NavBarLayout";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideNav = pathname.startsWith("/create-partner-account");

  return (
    <html lang="en">
      <body>
        {hideNav ? (
          //if the path starts with /create-partner-account, render children ONLY
          children
        ) : (
          //else wrap everything in NavBarLayout
          <NavBarLayout>{children}</NavBarLayout>
        )}
      </body>
    </html>
  );
}
