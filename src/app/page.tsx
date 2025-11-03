"use client";

import { useUser } from "@/components/context/UserContext";
import { isAdmin } from "@/lib/userUtils";
import AdminDashboardScreen from "@/screens/dashboard/AdminDashboardScreen";

export default function HomePage() {
  const { user, loading } = useUser();

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
