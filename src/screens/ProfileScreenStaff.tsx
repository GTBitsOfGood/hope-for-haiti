"use client";

import { useState, useEffect } from "react";
import { User } from "@prisma/client";

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
          {isEditing ? (
            <input
              type="email"
              name="email"
              value={userData.email}
              onChange={handleChange}
              className="border border-[#22070B]/10 bg-[#F9F9F9] p-2 w-full rounded-[4px]"
            />
          ) : (
            <p className="text-[16px] text-[#22070B]">{userData.email}</p>
          )}

          <p className="text-[18px] font-semibold text-[#22070B]">Password</p>
          {isEditing ? (
            <input
              type="password"
              name="password"
              value={userData.password}
              onChange={handleChange}
              className="border border-[#22070B]/10 bg-[#F9F9F9] p-2 w-full rounded-[4px]"
            />
          ) : (
            <p className="text-[16px] text-[#22070B]">{userData.password}</p>
          )}

          {isEditing && (
            <>
              <p className="text-[18px] font-semibold text-[#22070B]">
                Confirm password
              </p>
              <input
                type="password"
                name="confirmPassword"
                value={userData.confirmPassword}
                onChange={handleChange}
                className="border border-[#22070B]/10 bg-[#F9F9F9] p-2 w-full rounded-[4px]"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
