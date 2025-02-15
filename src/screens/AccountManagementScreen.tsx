"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; 
import InviteUserForm from "@/components/InviteUserForm";
import { UserType } from "@prisma/client";

export default function AccountManagementScreen() {
  const router = useRouter();
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);

  const handleInviteSubmit = (role: UserType) => {
    if (role === "PARTNER") {
      setInviteModalOpen(false);
      router.push("/create-partner-account");
    } else {
      console.log("Sending invite link for", role);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Account Management</h1>
        <button
          className="bg-mainRed text-white px-4 py-2 rounded"
          onClick={() => setInviteModalOpen(true)}
        >
          + Add Account
        </button>
      </div>

      <input
        type="text"
        placeholder="Search"
        className="w-full p-2 border rounded mb-4"
      />
      <div className="flex space-x-4 border-b mb-4">
        <button className="pb-2 font-semibold border-b-2 border-black">All</button>
        <button className="pb-2 font-semibold text-gray-500">Hope for Haiti Staff</button>
        <button className="pb-2 font-semibold text-gray-500">Partners</button>
      </div>

      {isInviteModalOpen && (
        <InviteUserForm
          closeModal={() => setInviteModalOpen(false)}
          onSubmit={handleInviteSubmit}
        />
      )}
    </div>
  );
}
