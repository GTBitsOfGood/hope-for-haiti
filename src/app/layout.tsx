import type { Metadata } from "next";
import "./globals.css";

import AuthenticationLayout from "@/components/layouts/AuthenticationLayout";
import { Toaster } from "react-hot-toast";

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
      <AuthenticationLayout>
        <body>
          {children}
          <Toaster position="top-right" />
        </body>
      </AuthenticationLayout>
    </html>
  );
}
