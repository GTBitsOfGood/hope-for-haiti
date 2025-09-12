"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import PartnerProfileScreen from "@/screens/ProfileScreenPartner";
import StaffProfileScreen from "@/screens/ProfileScreenStaff";
import { User, UserType } from "@prisma/client";

interface FetchedUser {
  id: number;
  email: string;
  name: string;
  type: string;
  tag?: string;
}

export default function ProfileScreen() {
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!session || !session.user) return;

    if (session.user.type === "PARTNER") {
      const partnerUser: User = {
        id:
          typeof session.user.id === "string"
            ? parseInt(session.user.id)
            : session.user.id,
        email: session.user.email ?? "",
        name: session.user.name ?? "",
        passwordHash: "",
        type: session.user.type,
        tag: session.user.tag ?? "",
        enabled: true,
        partnerDetails: null,
      };
      setUser(partnerUser);
      return;
    }

    const fetchUser = async () => {
      const response = await fetch("/api/users", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch users. Status: ${response.status}`);
      }

      const data = (await response.json()) as FetchedUser[];
      if (!data || !Array.isArray(data)) {
        throw new Error("Invalid data received from API");
      }

      let currentUser: FetchedUser | undefined;

      if (session.user.email) {
        currentUser = data.find(
          (u: FetchedUser) => u.email === session.user.email
        );
      }
      if (!currentUser && session.user.name) {
        currentUser = data.find(
          (u: FetchedUser) => u.name === session.user.name
        );
      }
      if (!currentUser && session.user.type) {
        const matchingUsers = data.filter(
          (u: FetchedUser) => u.type === session.user.type
        );
        if (matchingUsers.length >= 1) {
          currentUser = matchingUsers[0];
        }
      }

      if (currentUser) {
        setUser({
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          passwordHash: "",
          type: currentUser.type as UserType,
          tag: currentUser.tag ?? "",
          enabled: true,
          partnerDetails: null,
        });
      }
    };

    fetchUser().catch((err) => {
      console.error("Failed to fetch user:", err);
    });
  }, [session]);

  if (!user) {
    return <p className="text-center text-red-600">User data not found.</p>;
  }

  return user.type === "PARTNER" ? (
    <PartnerProfileScreen user={user} />
  ) : (
    <StaffProfileScreen user={user} />
  );
}
