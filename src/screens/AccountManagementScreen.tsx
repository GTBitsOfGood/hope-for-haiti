"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; 
import InviteUserForm from "@/components/InviteUserForm";
import { UserType } from "@prisma/client";
import { Open_Sans } from "next/font/google";

const openSans = Open_Sans({ subsets: ["latin"], weight: ["400", "600", "700"] });
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
    <div className={`p-6 ${openSans.className}`}>
      <h1 className="text-2xl font-semibold text-[#22070B] mb-4">
        Account Management
      </h1>

      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          placeholder="Search"
          className="w-full max-w-[80%] p-2 border border-[#22070B]/10 
                     bg-[#F9F9F9] text-[#22070B] text-[16px] rounded-[4px] 
                     placeholder:text-[#22070B]/50 mr-4"
        />
        <button
          className="bg-mainRed text-white px-4 py-2 rounded-[4px] 
                     font-semibold"
          onClick={() => setInviteModalOpen(true)}
        >
          + Add account
        </button>
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
