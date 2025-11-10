"use client";

import { useUser } from "@/components/context/UserContext";
import { isAdmin } from "@/lib/userUtils";
import AdminDashboardScreen from "@/screens/dashboard/AdminDashboardScreen";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { user, loading } = useUser();
  const searchParams = useSearchParams();

  useEffect(() => {
    const encodedToken = searchParams.get("token");
    if (encodedToken) {
      try {
        const decodedString = atob(encodedToken);
        const decodedToken = JSON.parse(decodedString);
        console.log("Decoded token:", decodedToken);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // Show admin dashboard for admin users
  if (user && isAdmin(user.type)) {
    return <AdminDashboardScreen />;
  }

  // Default home page for non-admin users
  return (
    <>
      <h1 className="text-2xl font-semibold">Home</h1>
      <p className="mb-4">User Type: {user?.type}</p>
      <p className="text-gray-600">Welcome to Hope for Haiti</p>
    </>
  );
}
