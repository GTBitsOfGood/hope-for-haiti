"use client";

import NavBarLayout from "@/components/NavBarLayout";
import { usePathname } from "next/navigation";
import { Open_Sans } from "next/font/google";
const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideNav = pathname.startsWith("/create-partner-account");

  return (
    <html lang="en" className={openSans.className}>
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
