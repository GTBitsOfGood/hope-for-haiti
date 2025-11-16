"use client";

import { useState, useEffect } from "react";
import { User } from "@prisma/client";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useApiClient } from "@/hooks/useApiClient";
import toast from "react-hot-toast";

interface ProfileScreenStaffProps {
  user: User;
}

export default function ProfileScreenStaff({ user }: ProfileScreenStaffProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "********",
    confirmPassword: "",
  });

  const { apiClient } = useApiClient();

  useEffect(() => {
    const nameParts = user.name ? user.name.split(" ") : [""];
    setUserData({
      firstName: nameParts[0] || "",
      lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : "",
      email: user.email,
      password: "********",
      confirmPassword: "",
    });
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleCancel = () => {
    setIsEditing(false);
    const nameParts = user.name ? user.name.split(" ") : [""];
    setUserData({
      firstName: nameParts[0] || "",
      lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : "",
      email: user.email,
      password: "********",
      confirmPassword: "",
    });
  };

  const handleSave = () => {
    console.log("Saving data:", userData);

    const promise = apiClient.patch(`/api/users/${user.id}`, {
      body: JSON.stringify({
        name: `${userData.firstName} ${userData.lastName}`.trim(),
      }),
    });

    toast.promise(promise, {
      loading: "Updating profile...",
      success: "Profile updated successfully!",
      error: "Failed to update profile.",
    });

    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 font-[Open_Sans]">
      <h1 className="text-[32px] font-bold leading-[px] text-[#22070B]">
        Profile
      </h1>

      <div className="mt-6">
        <div className="flex justify-between items-center">
          <h2 className="text-[20px] font-bold leading-[28px] text-[#22070B]">
            User
          </h2>
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="border border-mainRed text-mainRed px-4 py-2 rounded-[4px] font-semibold hover:bg-mainRed/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-mainRed text-white px-4 py-2 rounded-[4px] font-semibold hover:bg-red-700"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="border border-mainRed text-mainRed px-4 py-2 rounded-[4px] font-semibold hover:bg-mainRed/10"
            >
              Edit
            </button>
          )}
        </div>
        <hr className="mb-4 mt-1 border-gray-300" />

        <div className="grid grid-cols-2 gap-4 max-w-xl">
          <p className="text-[18px] font-semibold text-[#22070B]">First name</p>
          {isEditing ? (
            <input
              type="text"
              name="firstName"
              value={userData.firstName}
              onChange={handleChange}
              className="border border-[#22070B]/10 bg-[#F9F9F9] p-2 w-full rounded-[4px]"
            />
          ) : (
            <p className="text-[16px] text-[#22070B]">{userData.firstName}</p>
          )}

          <p className="text-[18px] font-semibold text-[#22070B]">Last name</p>
          {isEditing ? (
            <input
              type="text"
              name="lastName"
              value={userData.lastName}
              onChange={handleChange}
              className="border border-[#22070B]/10 bg-[#F9F9F9] p-2 w-full rounded-[4px]"
            />
          ) : (
            <p className="text-[16px] text-[#22070B]">{userData.lastName}</p>
          )}

          <p className="text-[18px] font-semibold text-[#22070B]">Email</p>
          <p className="text-[16px] text-[#22070B]">{userData.email}</p>

          <p className="text-[18px] font-semibold text-[#22070B]">Password</p>
          <p className="text-[16px] text-[#22070B]">{userData.password}</p>
        </div>
      </div>
      <p className="mt-4">
        <Link href="/reset-password">
          <button className="border border-mainRed text-mainRed px-4 py-2 rounded-[4px] font-semibold hover:bg-mainRed/10">
            Reset Password
          </button>
        </Link>
      </p>
      <div className="mt-6">
        <button
          className="border border-mainRed text-mainRed px-4 py-2 rounded-[4px] font-semibold hover:bg-mainRed/10"
          onClick={() => signOut({ callbackUrl: "/signIn" })}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
