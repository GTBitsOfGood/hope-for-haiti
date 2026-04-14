import type { Metadata } from "next";
import "./globals.css";
import "react-tooltip/dist/react-tooltip.css";

import AuthenticationProvider from "@/components/AuthenticationProvider";
import NotificationHandler from "@/components/NotificationHandler";
import FloatingNotification from "@/components/dashboard/FloatingNotification";
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
            <Toaster
              position="top-right"
              containerClassName="general-toaster"
              containerStyle={{
                top: 20,
                right: 80,
              }}
              toastOptions={{
                duration: 10000,
                className: "border font-medium",
                success: {
                  className: "!bg-green-50 !border-green-500 !text-green-700",
                  iconTheme: {
                    primary: "#10b981",
                    secondary: "#ecfdf5",
                  },
                },
                error: {
                  className: "!bg-red-light !border-red-dark !text-red-primary",
                  iconTheme: {
                    primary: "#F7949A",
                    secondary: "#FEF5F5",
                  },
                },
              }}
            />
            <FloatingNotification />
          </NotificationHandler>
        </AuthenticationProvider>
      </body>
    </html>
  );
}
