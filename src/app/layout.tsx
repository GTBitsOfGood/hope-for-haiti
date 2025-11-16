import type { Metadata } from "next";
import "./globals.css";
import "react-tooltip/dist/react-tooltip.css";

import AuthenticationProvider from "@/components/AuthenticationProvider";
import NotificationHandler from "@/components/NotificationHandler";
import { Toaster } from "react-hot-toast";
import NavbarLayout from "@/components/NavBarLayout";

export const metadata: Metadata = {
  title: "Hope for Haiti",
  description: "TODO",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthenticationProvider>
          <NotificationHandler>
            <NavbarLayout>{children}</NavbarLayout>
            <Toaster position="top-right" />
          </NotificationHandler>
        </AuthenticationProvider>
      </body>
    </html>
  );
}
