import type { Metadata } from "next";
import "./globals.css";
import "react-tooltip/dist/react-tooltip.css";

import AuthenticationProvider from "@/components/AuthenticationProvider";
import { Toaster } from "react-hot-toast";
import NavbarLayout from "@/components/NavBarLayout";
import DeactivationCheck from "@/components/DeactivationCheck";

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
    <html lang="en">
      <body>
        <AuthenticationProvider>
          <DeactivationCheck />
          <NavbarLayout>{children}</NavbarLayout>
          <Toaster position="top-right" />
        </AuthenticationProvider>
      </body>
    </html>
  );
}
