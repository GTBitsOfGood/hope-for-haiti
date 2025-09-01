"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import PartnerProfileScreen from "@/screens/ProfileScreenPartner";
import StaffProfileScreen from "@/screens/ProfileScreenStaff";
import { User } from "@prisma/client";
import { useFetch } from "@/hooks/useFetch";

export default function ProfilePage() {
  const { data: session } = useSession();
  
  if (!session?.user?.id) {
    redirect("/signIn");
  }

  const { data, isLoading, error } = useFetch<{ user: User }>(`/api/users/${session.user.id}`);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-600">Failed to load user data</p>;
  }

  if (!data) {
    return <p className="text-center text-red-600">User data not found.</p>;
  }

  return data.user.type === "PARTNER" ? (
    <PartnerProfileScreen user={data.user} />
  ) : (
    <StaffProfileScreen user={data.user} />
  );
}
